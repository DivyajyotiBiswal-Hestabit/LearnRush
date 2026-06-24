/**
 * RAG Evaluation Metrics
 *
 * 4 metrics based on RAGAS framework:
 *
 * 1. Faithfulness      — Is the answer grounded in the retrieved context?
 *                        (detects hallucination)
 * 2. Answer Relevance  — Does the answer actually address the question?
 * 3. Context Recall    — Did we retrieve all the info needed to answer?
 * 4. Context Precision — Are the retrieved chunks actually useful?
 */

import { isGroqAvailable, groqChat } from '@/lib/groq'
import { ollamaChat } from '@/lib/ollama'

// ── LLM helper ────────────────────────────────────────────────────────────

async function evalLLM(prompt) {
  if (isGroqAvailable()) {
    return groqChat('llama-3.1-8b-instant', [
      { role: 'user', content: prompt }
    ], { temperature: 0, max_tokens: 200 })
  }
  return ollamaChat('phi3:latest', [
    { role: 'user', content: prompt }
  ], { temperature: 0, num_predict: 200 })
}

function extractJSON(response) {
  // Try direct parse
  try {
    return JSON.parse(response.trim())
  } catch {}

  // Try extracting JSON object from response
  const match = response.match(/\{[\s\S]*?\}/)
  if (match) {
    try { return JSON.parse(match[0]) } catch {}
  }

  // Try extracting just a number
  const numMatch = response.match(/\b(0\.\d+|1\.0|[0-9])\b/)
  if (numMatch) return { score: parseFloat(numMatch[0]) }

  return null
}

// ── Metric 1: Faithfulness ────────────────────────────────────────────────

/**
 * Faithfulness: Are the claims in the answer supported by the context?
 *
 * Method:
 * 1. Extract claims from the answer
 * 2. Check each claim against the context
 * 3. Score = supported claims / total claims
 */
export async function evaluateFaithfulness(question, answer, context) {
  if (!answer || !context || context.includes('No relevant documents')) {
    return {
      score: null,
      label: 'N/A',
      reason: 'No context available to evaluate faithfulness',
      claims: [],
    }
  }

  const prompt = `You are evaluating if an AI answer is faithful to the source context.

Question: ${question}

Context (source documents):
${context.slice(0, 1500)}

Answer to evaluate:
${answer.slice(0, 800)}

Task:
1. Extract the main factual claims from the answer (max 5 claims)
2. Check if each claim is supported by the context
3. Calculate faithfulness score = supported_claims / total_claims

Respond with ONLY this JSON:
{
  "claims": [
    {"claim": "claim text", "supported": true/false}
  ],
  "supported_count": number,
  "total_count": number,
  "score": number between 0 and 1,
  "reason": "brief explanation"
}`

  try {
    const response = await evalLLM(prompt)
    const parsed = extractJSON(response)

    if (!parsed || parsed.score === undefined) {
      throw new Error('Could not parse faithfulness response')
    }

    const score = Math.min(1, Math.max(0, parsed.score))

    return {
      score,
      label: scoreToLabel(score),
      reason: parsed.reason ?? '',
      claims: parsed.claims ?? [],
      supported: parsed.supported_count ?? 0,
      total: parsed.total_count ?? 0,
    }
  } catch (err) {
    console.error('[Eval] Faithfulness error:', err.message)
    return { score: null, label: 'Error', reason: err.message, claims: [] }
  }
}

// ── Metric 2: Answer Relevance ────────────────────────────────────────────

/**
 * Answer Relevance: Does the answer address what was actually asked?
 *
 * Method:
 * Generate 3 questions from the answer, check how similar they are
 * to the original question. If the answer is relevant, generated
 * questions should resemble the original.
 */
export async function evaluateAnswerRelevance(question, answer) {
  if (!answer || answer.trim().length < 20) {
    return {
      score: null,
      label: 'N/A',
      reason: 'Answer too short to evaluate',
      generatedQuestions: [],
    }
  }

  const prompt = `You are evaluating if an AI answer is relevant to the question asked.

Original question: "${question}"

Answer given:
${answer.slice(0, 800)}

Task:
1. Generate 3 questions that this answer could be responding to
2. Compare them to the original question
3. Score relevance: 1.0 = perfectly answers the question, 0.0 = completely off-topic

Respond with ONLY this JSON:
{
  "generated_questions": ["q1", "q2", "q3"],
  "score": number between 0 and 1,
  "reason": "brief explanation",
  "addresses_question": true/false
}`

  try {
    const response = await evalLLM(prompt)
    const parsed = extractJSON(response)

    if (!parsed || parsed.score === undefined) {
      throw new Error('Could not parse relevance response')
    }

    const score = Math.min(1, Math.max(0, parsed.score))

    return {
      score,
      label: scoreToLabel(score),
      reason: parsed.reason ?? '',
      generatedQuestions: parsed.generated_questions ?? [],
      addressesQuestion: parsed.addresses_question ?? true,
    }
  } catch (err) {
    console.error('[Eval] Answer relevance error:', err.message)
    return { score: null, label: 'Error', reason: err.message, generatedQuestions: [] }
  }
}

// ── Metric 3: Context Recall ──────────────────────────────────────────────

/**
 * Context Recall: Did the retrieved context contain all info needed to answer?
 *
 * Method:
 * Break the answer into statements, check if each statement
 * can be attributed to the retrieved context.
 * Score = statements_in_context / total_statements
 */
export async function evaluateContextRecall(question, answer, context) {
  if (!context || context.includes('No relevant documents')) {
    return {
      score: 0,
      label: 'Poor',
      reason: 'No context was retrieved',
      statements: [],
    }
  }

  if (!answer || answer.trim().length < 20) {
    return {
      score: null,
      label: 'N/A',
      reason: 'Answer too short to evaluate',
      statements: [],
    }
  }

  const prompt = `You are evaluating if the retrieved context contained enough information to generate the answer.

Question: ${question}

Retrieved Context:
${context.slice(0, 1500)}

Answer generated:
${answer.slice(0, 800)}

Task:
1. Break the answer into individual statements (max 5)
2. For each statement, check if it could be derived from the context
3. Score = statements_attributable_to_context / total_statements

Respond with ONLY this JSON:
{
  "statements": [
    {"statement": "text", "in_context": true/false}
  ],
  "attributable_count": number,
  "total_count": number,
  "score": number between 0 and 1,
  "reason": "brief explanation"
}`

  try {
    const response = await evalLLM(prompt)
    const parsed = extractJSON(response)

    if (!parsed || parsed.score === undefined) {
      throw new Error('Could not parse context recall response')
    }

    const score = Math.min(1, Math.max(0, parsed.score))

    return {
      score,
      label: scoreToLabel(score),
      reason: parsed.reason ?? '',
      statements: parsed.statements ?? [],
      attributable: parsed.attributable_count ?? 0,
      total: parsed.total_count ?? 0,
    }
  } catch (err) {
    console.error('[Eval] Context recall error:', err.message)
    return { score: null, label: 'Error', reason: err.message, statements: [] }
  }
}

// ── Metric 4: Context Precision ───────────────────────────────────────────

/**
 * Context Precision: Were the retrieved chunks actually useful?
 *
 * Method:
 * For each retrieved chunk, check if it contributed to the answer.
 * Score = useful_chunks / total_chunks
 * Penalizes retrieving irrelevant chunks (noisy retrieval).
 */
export async function evaluateContextPrecision(question, answer, chunks) {
  if (!chunks || chunks.length === 0) {
    return {
      score: 0,
      label: 'Poor',
      reason: 'No chunks were retrieved',
      chunkEvals: [],
    }
  }

  const chunkSummaries = chunks
    .slice(0, 5)
    .map((c, i) => `Chunk ${i + 1}: ${c.content?.slice(0, 200) ?? ''}`)
    .join('\n\n')

  const prompt = `You are evaluating if the retrieved document chunks were useful for answering the question.

Question: ${question}

Answer generated:
${answer?.slice(0, 500) ?? 'No answer'}

Retrieved Chunks:
${chunkSummaries}

Task:
For each chunk, determine if it was useful/relevant for generating the answer.
Score = useful_chunks / total_chunks

Respond with ONLY this JSON:
{
  "chunk_evals": [
    {"chunk_num": 1, "useful": true/false, "reason": "why"}
  ],
  "useful_count": number,
  "total_count": number,
  "score": number between 0 and 1,
  "reason": "overall explanation"
}`

  try {
    const response = await evalLLM(prompt)
    const parsed = extractJSON(response)

    if (!parsed || parsed.score === undefined) {
      throw new Error('Could not parse context precision response')
    }

    const score = Math.min(1, Math.max(0, parsed.score))

    return {
      score,
      label: scoreToLabel(score),
      reason: parsed.reason ?? '',
      chunkEvals: parsed.chunk_evals ?? [],
      useful: parsed.useful_count ?? 0,
      total: parsed.total_count ?? chunks.length,
    }
  } catch (err) {
    console.error('[Eval] Context precision error:', err.message)
    return { score: null, label: 'Error', reason: err.message, chunkEvals: [] }
  }
}

// ── Run all 4 metrics ─────────────────────────────────────────────────────

/**
 * Run all 4 evaluation metrics in parallel
 */
export async function evaluateRAG({ question, answer, context, chunks }) {
  console.log('[Eval] Running RAG evaluation metrics...')

  const [faithfulness, answerRelevance, contextRecall, contextPrecision] =
    await Promise.all([
      evaluateFaithfulness(question, answer, context),
      evaluateAnswerRelevance(question, answer),
      evaluateContextRecall(question, answer, context),
      evaluateContextPrecision(question, answer, chunks),
    ])

  const scores = [
    faithfulness.score,
    answerRelevance.score,
    contextRecall.score,
    contextPrecision.score,
  ].filter(s => s !== null && s !== undefined)

  const overallScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null

  console.log(`[Eval] ✓ Done — overall: ${overallScore?.toFixed(2) ?? 'N/A'}`)

  return {
    faithfulness,
    answerRelevance,
    contextRecall,
    contextPrecision,
    overallScore,
    overallLabel: overallScore !== null ? scoreToLabel(overallScore) : 'N/A',
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function scoreToLabel(score) {
  if (score === null || score === undefined) return 'N/A'
  if (score >= 0.7) return 'Excellent'
  if (score >= 0.6) return 'Good'
  if (score >= 0.4) return 'Fair'
  return 'Poor'
}

export { scoreToLabel }