import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseDocument } from '@/lib/parser'
import { chunkByParagraph } from '@/lib/chunker'
import { generateEmbedding } from '@/lib/embeddings'
import { extractTablesFromText, tableToSearchableText } from '@/lib/rag/imageUnderstanding'

export const maxDuration = 300

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { documentId, knowledgeBaseId } = body

    if (!documentId || !knowledgeBaseId) {
      return Response.json({ error: 'documentId and knowledgeBaseId required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Fetch document record
    const { data: doc, error: docError } = await admin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      return Response.json({ error: 'Document not found' }, { status: 404 })
    }

    // 2. Mark as processing
    await admin
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId)

    // 3. Download file from storage
    const { data: fileData, error: downloadError } = await admin
      .storage
      .from('documents')
      .download(doc.storage_path)

    if (downloadError) {
      await admin.from('documents').update({
        status: 'failed',
        error_message: `Download failed: ${downloadError.message}`,
      }).eq('id', documentId)
      return Response.json({ error: 'Failed to download file' }, { status: 500 })
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 4. Parse document
    let parsed
    try {
      parsed = await parseDocument(buffer, doc.file_type)
    } catch (parseError) {
      await admin.from('documents').update({
        status: 'failed',
        error_message: `Parse failed: ${parseError.message}`,
      }).eq('id', documentId)
      return Response.json({ error: 'Failed to parse document' }, { status: 500 })
    }

    // 5. Extract tables from text
    const tables = extractTablesFromText(parsed.text)
    const hasTables = tables.length > 0

    // Build chunks array — include table chunks separately
    const allChunkData = []

    // Regular text chunks
    const textChunks = chunkByParagraph(parsed.text, 1200)
    textChunks.forEach(chunk => {
      allChunkData.push({ content: chunk, type: 'text' })
    })

    // Table chunks — convert each table to searchable text
    tables.forEach(table => {
      const tableText = tableToSearchableText(table)
      if (tableText.length > 30) {
        allChunkData.push({ content: tableText, type: 'table' })
      }
    })

    if (allChunkData.length === 0) {
      await admin.from('documents').update({
        status: 'failed',
        error_message: 'No content found in document',
      }).eq('id', documentId)
      return Response.json({ error: 'No content found' }, { status: 400 })
    }

    // 6. Generate embeddings and store chunks
    let successCount = 0

    for (let i = 0; i < allChunkData.length; i++) {
      const { content, type } = allChunkData[i]

      try {
        const embedding = await generateEmbedding(content)

        await admin.from('document_chunks').insert({
          document_id: documentId,
          knowledge_base_id: knowledgeBaseId,
          user_id: user.id,
          content,
          chunk_index: i,
          chunk_type: type,
          embedding: JSON.stringify(embedding),
          metadata: {
            file_name: doc.file_name,
            page_count: parsed.pageCount,
            chunk_total: allChunkData.length,
            is_table: type === 'table',
          },
        })

        successCount++
      } catch (embeddingError) {
        console.error(`Chunk ${i} embedding failed:`, embeddingError)
      }
    }

    // 7. Mark document ready
    await admin.from('documents').update({
      status: 'ready',
      chunk_count: successCount,
      has_tables: hasTables,
      extraction_method: 'enhanced',
      table_descriptions: tables.map(t => ({
        type: t.type,
        headers: t.headers,
        rowCount: t.rows?.length ?? 0,
        description: t.description,
      })),
    }).eq('id', documentId)

    // 8. Update KB counts
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
      totalChunks: allChunkData.length,
      tablesFound: tables.length,
      extractionMethod: 'enhanced',
    })
  } catch (error) {
    console.error('Process document error:', error)
    return Response.json({ error: 'Processing failed', details: error.message }, { status: 500 })
  }
}