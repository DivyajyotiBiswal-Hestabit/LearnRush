export async function GET() {
  try {
    const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return Response.json(
        { error: 'Ollama is not reachable', available: false },
        { status: 503 }
      )
    }

    const data = await response.json()
    const models = data.models?.map((m) => ({
      id: m.name,
      size: m.size,
      modified: m.modified_at,
    })) || []

    return Response.json({ available: true, models })
  } catch (error) {
    return Response.json(
      { error: 'Failed to connect to Ollama', available: false, details: error.message },
      { status: 503 }
    )
  }
}