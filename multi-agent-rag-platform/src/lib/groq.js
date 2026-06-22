import Groq from 'groq-sdk'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Model mapping — maps your Ollama model names to Groq equivalents
export const GROQ_MODEL_MAP = {
  'llama3:latest':   'llama-3.1-8b-instant',
  'mistral:latest':  'llama-3.3-70b-versatile',
  'phi3:latest':     'llama-3.1-8b-instant',
  'qwen:7b':         'llama-3.1-8b-instant',
  'tinyllama:latest':'llama-3.1-8b-instant',
  'gemma2':          'gemma2-9b-it',
  // Fallback
  'default':         'llama-3.1-8b-instant',
}

/**
 * Send a chat message via Groq API
 * Drop-in replacement for ollamaChat
 */
export async function groqChat(model, messages, options = {}) {
  const groqModel = GROQ_MODEL_MAP[model] ?? GROQ_MODEL_MAP['default']

  try {
    const completion = await client.chat.completions.create({
      model: groqModel,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.num_predict ?? options.max_tokens ?? 1024,
    })

    return completion.choices[0]?.message?.content ?? ''
  } catch (error) {
    console.error(`Groq error (${groqModel}):`, error.message)
    throw new Error(`Groq API error: ${error.message}`)
  }
}

/**
 * Check if Groq is configured
 */
export function isGroqAvailable() {
  return !!process.env.GROQ_API_KEY
}