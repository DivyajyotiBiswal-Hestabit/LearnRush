const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

/**
 * Send a prompt to an Ollama model and get a full response
 */
export async function ollamaChat(model, messages, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 600000) // 10 min

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        num_ctx: options.num_ctx ?? 2048,
        ...options,
      },
    }),
  })

  clearTimeout(timeout)
}

/**
 * Stream a response from Ollama — yields text chunks
 */
export async function* ollamaChatStream(model, messages, options = {}) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      options: {
        temperature: options.temperature ?? 0.7,
        num_ctx: options.num_ctx ?? 4096,
        ...options,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama stream error (${model}): ${response.statusText}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(Boolean)

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line)
        if (parsed.message?.content) {
          yield parsed.message.content
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}

/**
 * Check if a model is available in Ollama
 */
export async function isModelAvailable(modelId) {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
    const data = await res.json()
    return data.models?.some(m => m.name === modelId) ?? false
  } catch {
    return false
  }
}

/**
 * Warm up a model by sending a tiny prompt
 * Call this when the app starts to pre-load models into memory
 */
export async function warmUpModel(modelId) {
  try {
    await ollamaChat(modelId, [{ role: 'user', content: 'hi' }], { num_ctx: 512 })
    console.log(`Model warmed up: ${modelId}`)
  } catch (err) {
    console.warn(`Warm up failed for ${modelId}:`, err.message)
  }
}