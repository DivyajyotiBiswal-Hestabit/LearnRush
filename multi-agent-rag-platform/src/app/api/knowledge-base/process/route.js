import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding } from '@/lib/embeddings'
import { processDocumentMultiModal } from '@/lib/rag/multiModalProcessor'

export const maxDuration = 300

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { documentId, knowledgeBaseId } = await request.json()
    if (!documentId || !knowledgeBaseId) {
      return Response.json({ error: 'documentId and knowledgeBaseId required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Fetch document
    const { data: doc } = await admin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (!doc) return Response.json({ error: 'Document not found' }, { status: 404 })

    // 2. Mark processing
    await admin.from('documents').update({ status: 'processing' }).eq('id', documentId)

    // 3. Download file
    const { data: fileData, error: downloadError } = await admin
      .storage.from('documents').download(doc.storage_path)

    if (downloadError) {
      await admin.from('documents').update({
        status: 'failed',
        error_message: `Download failed: ${downloadError.message}`,
      }).eq('id', documentId)
      return Response.json({ error: 'Failed to download file' }, { status: 500 })
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 4. Run multi-modal processing pipeline
    let processingResult
    try {
      processingResult = await processDocumentMultiModal(buffer, doc.file_type, doc.file_name)
    } catch (processError) {
      await admin.from('documents').update({
        status: 'failed',
        error_message: `Processing failed: ${processError.message}`,
      }).eq('id', documentId)
      return Response.json({ error: 'Processing failed', details: processError.message }, { status: 500 })
    }

    const { chunks, pageCount, contentTypes, tablesFound, imagesProcessed, ocrUsed, visionUsed, visionModel } = processingResult

    if (chunks.length === 0) {
      await admin.from('documents').update({
        status: 'failed',
        error_message: 'No content could be extracted',
      }).eq('id', documentId)
      return Response.json({ error: 'No content extracted' }, { status: 400 })
    }

    // 5. Generate embeddings and insert chunks
    let successCount = 0

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]

      try {
        const embedding = await generateEmbedding(chunk.content)

        await admin.from('document_chunks').insert({
          document_id: documentId,
          knowledge_base_id: knowledgeBaseId,
          user_id: user.id,
          content: chunk.content,
          chunk_index: i,
          chunk_type: chunk.type ?? 'text',
          source_type: chunk.sourceType ?? 'text',
          page_number: chunk.pageNumber ?? null,
          visual_description: chunk.visualDescription ?? null,
          ocr_confidence: chunk.metadata?.ocr_confidence ?? null,
          embedding: JSON.stringify(embedding),
          metadata: {
            ...chunk.metadata,
            chunk_total: chunks.length,
            content_types: contentTypes,
          },
        })

        successCount++
      } catch (embeddingError) {
        console.error(`Chunk ${i} embedding failed:`, embeddingError)
      }
    }

    // 6. Update document record
    await admin.from('documents').update({
      status: 'ready',
      chunk_count: successCount,
      page_count: pageCount,
      has_tables: tablesFound > 0,
      has_images: imagesProcessed > 0,
      content_types: contentTypes,
      ocr_used: ocrUsed,
      vision_model_used: visionUsed ? visionModel : null,
      extraction_method: 'multimodal',
      processing_metadata: {
        tables_found: tablesFound,
        images_processed: imagesProcessed,
        ocr_used: ocrUsed,
        vision_used: visionUsed,
        vision_model: visionModel,
        total_chunks: chunks.length,
        successful_chunks: successCount,
      },
      table_descriptions: [],
    }).eq('id', documentId)

    // 7. Update KB counts
    const { data: kbDocs } = await admin
      .from('documents')
      .select('chunk_count')
      .eq('knowledge_base_id', knowledgeBaseId)
      .eq('status', 'ready')

    const totalChunks = kbDocs?.reduce((sum, d) => sum + (d.chunk_count ?? 0), 0) ?? 0

    await admin.from('knowledge_bases').update({
      document_count: kbDocs?.length ?? 0,
      total_chunks: totalChunks,
    }).eq('id', knowledgeBaseId)

    return Response.json({
      success: true,
      chunksCreated: successCount,
      totalChunks: chunks.length,
      tablesFound,
      imagesProcessed,
      ocrUsed,
      visionUsed,
      contentTypes,
    })
  } catch (error) {
    console.error('Process document error:', error)
    return Response.json({ error: 'Processing failed', details: error.message }, { status: 500 })
  }
}