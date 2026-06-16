/**
 * Export query data as JSON file (runs in browser)
 */
export function exportAsJSON(query) {
  const exportData = {
    exportedAt: new Date().toISOString(),
    query: {
      id: query.id,
      question: query.question,
      finalAnswer: query.final_answer,
      createdAt: query.created_at,
      completedAt: query.completed_at,
      processingTimeMs: query.processing_time_ms,
      chunksRetrieved: query.chunks_retrieved,
      scores: {
        quality: query.quality_score,
        citationAccuracy: query.citation_accuracy,
        insightDepth: query.insight_depth,
      },
      team: query.teams?.name,
      collaborationMode: query.teams?.collaboration_mode,
    },
    agentTraces: query.agent_traces?.map(t => ({
      agentName: t.agent_name,
      role: t.agent_role,
      model: t.model_id,
      output: t.output,
      processingTimeMs: t.processing_time_ms,
      status: t.status,
    })),
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `research-${query.id.slice(0, 8)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Export query data as PDF (runs in browser)
 */
export async function exportAsPDF(query) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Research Report', 20, y)
  y += 10

  // Date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y)
  y += 12

  // Question
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0)
  doc.text('Research Question', 20, y)
  y += 7

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const questionLines = doc.splitTextToSize(query.question, pageWidth - 40)
  doc.text(questionLines, 20, y)
  y += questionLines.length * 6 + 8

  // Scores
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Quality Scorecard', 20, y)
  y += 7

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Score']],
    body: [
      ['Overall Quality', `${query.quality_score ?? '-'} / 10`],
      ['Citation Accuracy', `${query.citation_accuracy ?? '-'} / 10`],
      ['Insight Depth', `${query.insight_depth ?? '-'} / 10`],
      ['Processing Time', query.processing_time_ms
        ? `${(query.processing_time_ms / 1000).toFixed(1)}s`
        : '-'
      ],
      ['Chunks Retrieved', query.chunks_retrieved ?? '-'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    margin: { left: 20, right: 20 },
  })

  y = doc.lastAutoTable.finalY + 12

  // Final Answer
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Final Answer', 20, y)
  y += 7

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const answerLines = doc.splitTextToSize(query.final_answer ?? '', pageWidth - 40)

  // Check if we need a new page
  if (y + answerLines.length * 5 > 270) {
    doc.addPage()
    y = 20
  }

  doc.text(answerLines, 20, y)
  y += answerLines.length * 5 + 12

  // Agent Traces
  if (query.agent_traces?.length) {
    if (y > 230) { doc.addPage(); y = 20 }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Agent Collaboration Trace', 20, y)
    y += 7

    autoTable(doc, {
      startY: y,
      head: [['Agent', 'Role', 'Model', 'Status', 'Time']],
      body: query.agent_traces.map(t => [
        t.agent_name,
        t.agent_role,
        t.model_id?.replace(':latest', ''),
        t.status,
        t.processing_time_ms ? `${(t.processing_time_ms / 1000).toFixed(1)}s` : '-',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 20, right: 20 },
    })

    y = doc.lastAutoTable.finalY + 12

    // Individual agent outputs
    for (const trace of query.agent_traces) {
      if (!trace.output || trace.status === 'failed') continue

      if (y > 240) { doc.addPage(); y = 20 }

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`${trace.agent_name} (${trace.agent_role})`, 20, y)
      y += 6

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80)
      const outputLines = doc.splitTextToSize(trace.output, pageWidth - 40)

      if (y + outputLines.length * 4.5 > 270) {
        doc.addPage()
        y = 20
      }

      doc.text(outputLines, 20, y)
      doc.setTextColor(0)
      y += outputLines.length * 4.5 + 8
    }
  }

  doc.save(`research-${query.id.slice(0, 8)}.pdf`)
}