// Debate protocol templates
export const DEBATE_PROTOCOLS = [
  {
    id: 'standard',
    name: 'Standard Debate',
    description: 'Agents argue positions, then reach consensus in a final round',
    rounds: 2,
    consensusRequired: true,
    allowInterruption: false,
  },
  {
    id: 'oxford',
    name: 'Oxford Style',
    description: 'Proposition vs Opposition with a neutral moderator synthesizing',
    rounds: 3,
    consensusRequired: false,
    allowInterruption: false,
    roles: ['proposition', 'opposition', 'moderator'],
  },
  {
    id: 'socratic',
    name: 'Socratic Method',
    description: 'Agents challenge each other with questions to deepen understanding',
    rounds: 2,
    consensusRequired: true,
    allowInterruption: true,
    questionBased: true,
  },
  {
    id: 'rapid',
    name: 'Rapid Fire',
    description: 'Single round, all agents respond simultaneously with brief responses',
    rounds: 1,
    consensusRequired: false,
    allowInterruption: false,
    concise: true,
  },
]

// Model routing rule conditions
export const ROUTING_CONDITIONS = [
  { id: 'query_length_gt', label: 'Query length greater than', type: 'number', unit: 'words' },
  { id: 'query_length_lt', label: 'Query length less than', type: 'number', unit: 'words' },
  { id: 'contains_keyword', label: 'Query contains keyword', type: 'text' },
  { id: 'topic_is', label: 'Topic matches', type: 'select', options: ['technical', 'legal', 'financial', 'scientific', 'general'] },
  { id: 'time_of_day', label: 'Time of day is', type: 'select', options: ['morning', 'afternoon', 'evening', 'night'] },
]

// Model routing actions
export const ROUTING_ACTIONS = [
  { id: 'use_model', label: 'Use model', type: 'model_select' },
  { id: 'set_temperature', label: 'Set temperature', type: 'number_0_1' },
  { id: 'set_max_tokens', label: 'Set max tokens', type: 'number' },
]

// Memory types
export const MEMORY_TYPES = [
  { id: 'fact', label: 'Fact', color: 'blue', description: 'A specific fact or data point' },
  { id: 'preference', label: 'Preference', color: 'purple', description: 'User preference or style' },
  { id: 'context', label: 'Context', color: 'green', description: 'Ongoing context or project info' },
  { id: 'summary', label: 'Summary', color: 'orange', description: 'Summary of past sessions' },
]

// System prompt templates per role
export const PROMPT_TEMPLATES = {
  researcher: {
    name: 'Standard Researcher',
    prompt: `You are a thorough researcher. Your job is to:
1. Find and present the most relevant information from the provided context
2. Be factual and cite specific sources
3. Do not speculate beyond what the documents say
4. Organize findings clearly with headings if needed`,
  },
  critic: {
    name: 'Standard Critic',
    prompt: `You are a critical analyst. Your job is to:
1. Review the researcher's findings and identify gaps
2. Challenge assumptions and weak evidence
3. Highlight what is missing or unclear
4. Be constructive — your goal is to improve understanding`,
  },
  synthesizer: {
    name: 'Standard Synthesizer',
    prompt: `You are a skilled synthesizer. Your job is to:
1. Combine all agent outputs into a coherent response
2. Ensure all claims are backed by source material
3. Structure the answer clearly with sections
4. Highlight areas of consensus and disagreement`,
  },
  analyst: {
    name: 'Standard Analyst',
    prompt: `You are a data analyst. Your job is to:
1. Extract patterns, insights and key metrics
2. Present data in structured, quantitative terms
3. Compare and contrast different data points
4. Draw evidence-based conclusions`,
  },
  general: {
    name: 'General Assistant',
    prompt: `You are a helpful AI assistant. Your job is to:
1. Answer the query as accurately as possible
2. Use the provided context as your primary source
3. Be clear and concise in your response
4. Ask for clarification if the query is ambiguous`,
  },
}