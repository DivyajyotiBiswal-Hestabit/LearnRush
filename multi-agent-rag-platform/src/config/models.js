export const AVAILABLE_MODELS = [
  {
    id: 'llama3:latest',
    name: 'Llama 3.1 8B',
    description: 'Fast reasoning via Groq / local Ollama fallback',
    strengths: ['reasoning', 'research', 'synthesis'],
    contextWindow: 128000,
    groqModel: 'llama-3.1-8b-instant',
  },
  {
    id: 'mistral:latest',
    name: 'Mistral Saba 24B',
    description: 'Great for analysis and critique via Groq',
    strengths: ['analysis', 'structured', 'critique'],
    contextWindow: 32768,
    groqModel: 'mistral-saba-24b',
  },
  {
    id: 'phi3:latest',
    name: 'Phi-3 / Llama 3.1 8B',
    description: 'Fast responses, good for synthesis',
    strengths: ['speed', 'summarization', 'qa'],
    contextWindow: 128000,
    groqModel: 'llama-3.1-8b-instant',
  },
  {
    id: 'qwen:7b',
    name: 'Qwen / Llama 3.1',
    description: 'Balanced multilingual performance',
    strengths: ['general', 'multilingual', 'chat'],
    contextWindow: 32768,
    groqModel: 'llama-3.1-8b-instant',
  },
  {
    id: 'gemma2',
    name: 'Gemma 2 9B',
    description: 'Google model, good for structured tasks',
    strengths: ['structured', 'analysis'],
    contextWindow: 8192,
    groqModel: 'gemma2-9b-it',
  },
]

export const DEFAULT_MODEL = 'llama3:latest'

export const AGENT_ROLE_DEFAULTS = {
  researcher:  'llama3:latest',
  critic:      'mistral:latest',
  synthesizer: 'phi3:latest',
  analyst:     'mistral:latest',
  general:     'llama3:latest',
}
export const COLLABORATION_MODES = [
  {
    id: 'sequential',
    name: 'Sequential',
    description: 'Agents process one after another — best quality',
  },
  {
    id: 'parallel',
    name: 'Parallel ⚡',
    description: 'All agents run simultaneously — fastest',
  },
  {
    id: 'debate',
    name: 'Debate',
    description: 'Agents argue positions and reach consensus — slowest',
  },
  {
    id: 'hierarchical',
    name: 'Hierarchical',
    description: 'Lead agent delegates to specialists',
  },
]
