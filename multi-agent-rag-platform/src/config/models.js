export const AVAILABLE_MODELS = [
  {
    id: 'llama3:latest',
    name: 'Llama 3 8B',
    description: 'Best for research and complex reasoning',
    strengths: ['reasoning', 'research', 'synthesis'],
    contextWindow: 8192,
  },
  {
    id: 'mistral:latest',
    name: 'Mistral 7B',
    description: 'Great for analysis and structured output',
    strengths: ['analysis', 'structured', 'critique'],
    contextWindow: 32768,
  },
  {
    id: 'phi3:latest',
    name: 'Phi-3 Mini',
    description: 'Fast and efficient for quick tasks',
    strengths: ['speed', 'summarization', 'qa'],
    contextWindow: 128000,
  },
  {
    id: 'qwen:7b',
    name: 'Qwen 7B',
    description: 'Balanced multilingual performance',
    strengths: ['general', 'multilingual', 'chat'],
    contextWindow: 32768,
  },
]

export const DEFAULT_MODEL = 'llama3:latest'

export const AGENT_ROLE_DEFAULTS = {
  researcher: 'llama3:latest',
  critic: 'mistral:latest',
  synthesizer: 'phi3:latest',
  analyst: 'mistral:latest',
  general: 'qwen:7b',
}