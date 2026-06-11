export const COLLABORATION_MODES = [
  {
    id: 'sequential',
    name: 'Sequential',
    description: 'Agents process one after another in order',
  },
  {
    id: 'debate',
    name: 'Debate',
    description: 'Agents argue positions and reach consensus',
  },
  {
    id: 'hierarchical',
    name: 'Hierarchical',
    description: 'Lead agent delegates to specialist agents',
  },
]

export const DEFAULT_AGENT_ROLES = [
  {
    name: 'Researcher',
    description: 'Retrieves and synthesizes relevant information from the knowledge base',
    defaultModel: 'llama3.1',
    systemPrompt: 'You are a thorough researcher. Your job is to find and present the most relevant information from the provided context to answer the user\'s query. Be factual, cite sources, and do not speculate beyond what the documents say.',
  },
  {
    name: 'Critic',
    description: 'Evaluates the researcher\'s findings and identifies gaps or errors',
    defaultModel: 'gemma2',
    systemPrompt: 'You are a critical analyst. Review the researcher\'s findings and identify any gaps, inconsistencies, or areas that need further investigation. Be constructive and specific.',
  },
  {
    name: 'Synthesizer',
    description: 'Combines all agent outputs into a final coherent answer',
    defaultModel: 'phi3',
    systemPrompt: 'You are a skilled synthesizer. Take the research findings and critical analysis and produce a clear, well-structured final answer. Ensure all claims are backed by the source material.',
  },
]