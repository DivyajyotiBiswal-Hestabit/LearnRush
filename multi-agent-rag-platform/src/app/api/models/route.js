import { isGroqAvailable, GROQ_MODEL_MAP } from '@/lib/groq'

export async function GET() {
  const groqAvailable = isGroqAvailable()

  // If Groq is configured, return Groq models
  if (groqAvailable) {
    const groqModels = [
      { id: 'llama3:latest',  name: 'Llama 3.1 8B',      groq: 'llama-3.1-8b-instant',    provider: 'groq' },
      { id: 'mistral:latest', name: 'Llama 3.3 70B',     groq: 'llama-3.3-70b-versatile', provider: 'groq' },
      { id: 'phi3:latest',    name: 'Llama 3.1 8B Fast', groq: 'llama-3.1-8b-instant',    provider: 'groq' },
      { id: 'gemma2',         name: 'Gemma 2 9B',        groq: 'gemma2-9b-it',            provider: 'groq' },
    ]

    return Response.json({
      available: true,
      provider: 'groq',
      models: groqModels,
    })
  }

  // Fallback — check Ollama
  try {
    const response = await fetch(
      `${process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'}/api/tags`
    )

    if (!response.ok) {
      return Response.json({ error: 'Ollama not reachable', available: false }, { status: 503 })
    }

    const data = await response.json()
    const models = data.models?.map(m => ({
      id: m.name,
      size: m.size,
      modified: m.modified_at,
      provider: 'ollama',
    })) ?? []

    return Response.json({ available: true, provider: 'ollama', models })
  } catch (error) {
    return Response.json(
      { error: 'Failed to connect to Ollama', available: false },
      { status: 503 }
    )
  }
}