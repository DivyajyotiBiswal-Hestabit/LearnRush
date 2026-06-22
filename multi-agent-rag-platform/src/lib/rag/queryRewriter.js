import { groqChat } from '@/lib/groq'
import { isGroqAvailable } from '@/lib/groq'
import { ollamaChat } from '@/lib/ollama'

/**
 * Rewrite a query multiple ways to improve retrieval chances
 */
export async function rewriteQuery(originalQuery, context = '') {
  const prompt = `You are a search query optimizer. Rewrite the following query in 3 different ways to improve document retrieval.

Original query: "${originalQuery}"
${context ? `Context: ${context}` : ''}

Rules:
- Make each rewrite shorter and more keyword-focused
- Use different synonyms and phrasings
- Focus on the core concept
- Remove filler words

Respond ONLY with a JSON array of 3 rewritten queries, no explanation:
["rewrite 1", "rewrite 2", "rewrite 3"]`

  try {
    let response
    if (isGroqAvailable()) {
      response = await groqChat('llama3:latest', [
        { role: 'user', content: prompt }
      ], { temperature: 0.3, max_tokens: 200 })
    } else {
      response = await ollamaChat('llama3:latest', [
        { role: 'user', content: prompt }
      ], { temperature: 0.3, num_predict: 200 })
    }

    const cleaned = response.replace(/```json|```/g, '').trim()
    const rewrites = JSON.parse(cleaned)

    if (!Array.isArray(rewrites) || rewrites.length === 0) {
      return generateFallbackRewrites(originalQuery)
    }

    return rewrites.filter(r => typeof r === 'string' && r.trim().length > 0)
  } catch (err) {
    console.warn('Query rewriting failed, using fallback:', err.message)
    return generateFallbackRewrites(originalQuery)
  }
}

/**
 * Simple rule-based fallback rewrites when LLM rewriting fails
 */
function generateFallbackRewrites(query) {
  const words = query.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)

  const rewrites = []

  // Rewrite 1: Just the keywords
  if (words.length > 0) {
    rewrites.push(words.join(' '))
  }

  // Rewrite 2: First half of the query
  if (words.length > 2) {
    rewrites.push(words.slice(0, Math.ceil(words.length / 2)).join(' '))
  }

  // Rewrite 3: Last meaningful part
  if (words.length > 2) {
    rewrites.push(words.slice(-Math.ceil(words.length / 2)).join(' '))
  }

  // Always ensure at least one rewrite
  if (rewrites.length === 0) {
    rewrites.push(query.slice(0, 50))
  }

  return rewrites
}

/**
 * Extract the most important keywords from a query
 * Used as last resort for keyword matching
 */
export function extractKeywords(query) {
  const stopWords = new Set([
    'what', 'where', 'when', 'who', 'why', 'how', 'is', 'are', 'was',
    'were', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
    'to', 'for', 'of', 'with', 'by', 'from', 'about', 'can', 'does',
    'do', 'did', 'will', 'would', 'could', 'should', 'tell', 'me',
    'give', 'show', 'explain', 'describe', 'list', 'find', 'get',
  ])

  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .slice(0, 8) // max 8 keywords
}