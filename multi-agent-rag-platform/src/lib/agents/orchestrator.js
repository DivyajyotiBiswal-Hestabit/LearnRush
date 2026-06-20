import { ollamaChat } from '@/lib/ollama'
import { retrieveRelevantChunks, formatChunksAsContext } from '@/lib/rag/retriever'
import { getTeamMemories, formatMemoriesAsContext } from '@/lib/agents/memory'
import { applyRoutingRules } from '@/lib/agents/router'

function buildAgentPrompt(agent, question, context, memoryContext, previousOutputs = []) {
  let prompt = `${agent.system_prompt}\n\n`

  if (memoryContext) {
    prompt += `${memoryContext}\n\n`
  }

  // Enhanced context header that explains multi-modal sources
  prompt += `## Knowledge Base Context
The following sources have been retrieved. Sources may include:
- Regular text passages
- Extracted table data [marked with "Table:"]
- Image descriptions [marked with "Visual Description"]  
- OCR-extracted text from scanned documents [marked with "Scanned Page"]
- Chart/diagram analysis [marked with "Visual Content"]

Use ALL source types to answer the question thoroughly.

${context}\n\n`

  if (previousOutputs.length > 0) {
    prompt += `## Previous Agent Outputs\n`
    previousOutputs.forEach(output => {
      prompt += `### ${output.agentName} (${output.role}):\n${output.output}\n\n`
    })
  }

  prompt += `## User Question\n${question}\n\n`
  prompt += `## Your Response\nBased on ALL context types above (text, tables, images, charts), provide your analysis as ${agent.role}:`

  return prompt
}

function buildSynthesisPrompt(question, agentOutputs, context, memoryContext) {
  let prompt = `You are the final synthesizer. Combine insights from multiple specialized agents into one clear, well-structured answer.\n\n`

  if (memoryContext) {
    prompt += `${memoryContext}\n\n`
  }

  prompt += `## Original Question\n${question}\n\n`
  prompt += `## Knowledge Base Context\n${context}\n\n`
  prompt += `## Agent Analyses\n`

  agentOutputs.forEach(output => {
    prompt += `### ${output.agentName} (${output.role}) using ${output.modelId}:\n${output.output}\n\n`
  })

  prompt += `## Final Synthesized Answer\nCombine the above analyses into a comprehensive, well-structured answer. Include citations to sources where relevant:`

  return prompt
}

async function scoreAnswer(question, answer, context, modelId) {
  const prompt = `You are a quality evaluator. Score this research answer.

Question: ${question}
Answer: ${answer}
Context available: ${context.slice(0, 300)}...

Respond ONLY with JSON (no markdown):
{"quality": 8, "citation_accuracy": 7, "insight_depth": 8}

Scores 1-10.`

  try {
    const response = await ollamaChat(modelId, [
      { role: 'user', content: prompt }
    ], { temperature: 0.1 })

    const cleaned = response.replace(/```json|```/g, '').trim()
    const scores = JSON.parse(cleaned)
    return {
      quality: Math.min(10, Math.max(1, scores.quality ?? 7)),
      citation_accuracy: Math.min(10, Math.max(1, scores.citation_accuracy ?? 7)),
      insight_depth: Math.min(10, Math.max(1, scores.insight_depth ?? 7)),
    }
  } catch {
    return { quality: 7, citation_accuracy: 7, insight_depth: 7 }
  }
}

async function runAgentWithRouting(agent, prompt, question) {
  // Apply routing rules if configured
  const routingRules = agent.routing_rules ?? []
  const routing = applyRoutingRules(routingRules, question, agent.model_id)

  const modelToUse = routing.modelId
  const temperature = routing.temperature ?? agent.temperature ?? 0.7
  const maxTokens = routing.maxTokens ?? agent.max_tokens ?? 2048

  const output = await ollamaChat(modelToUse, [
    { role: 'user', content: prompt }
  ], { temperature, num_ctx: maxTokens })

  return { output, modelUsed: modelToUse, routingInfo: routing }
}

async function runSequential(agents, question, context, memoryContext, onTraceUpdate) {
  const traces = []
  const previousOutputs = []

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i]
    const startTime = Date.now()

    onTraceUpdate({
      agentName: agent.name,
      role: agent.role,
      modelId: agent.model_id,
      status: 'running',
      stepIndex: i,
    })

    const prompt = buildAgentPrompt(agent, question, context, memoryContext, previousOutputs)

    try {
      const { output, modelUsed, routingInfo } = await runAgentWithRouting(agent, prompt, question)

      const trace = {
        agentName: agent.name,
        agentId: agent.id,
        role: agent.role,
        modelId: modelUsed,
        originalModelId: agent.model_id,
        routingInfo,
        output,
        processingTime: Date.now() - startTime,
        stepIndex: i,
        status: 'completed',
      }

      traces.push(trace)
      previousOutputs.push(trace)
      onTraceUpdate({ ...trace })
    } catch (error) {
      const trace = {
        agentName: agent.name,
        agentId: agent.id,
        role: agent.role,
        modelId: agent.model_id,
        output: `Error: ${error.message}`,
        processingTime: Date.now() - startTime,
        stepIndex: i,
        status: 'failed',
      }
      traces.push(trace)
      onTraceUpdate({ ...trace })
    }
  }

  return traces
}

async function runDebate(agents, question, context, memoryContext, debateConfig, onTraceUpdate) {
  const traces = []
  const protocol = debateConfig?.protocol ?? 'standard'
  const rounds = debateConfig?.rounds ?? 2

  for (let round = 1; round <= rounds; round++) {
    const roundOutputs = await Promise.all(
      agents.map(async (agent, i) => {
        const startTime = Date.now()
        const prevRoundOutputs = round > 1
          ? traces.filter(t => t.round === round - 1 && t.agentName !== agent.name)
          : []

        onTraceUpdate({
          agentName: agent.name,
          role: agent.role,
          modelId: agent.model_id,
          status: 'running',
          stepIndex: (round - 1) * agents.length + i,
          round,
        })

        let roundPrompt = buildAgentPrompt(agent, question, context, memoryContext, prevRoundOutputs)

        if (round > 1 && protocol === 'socratic') {
          roundPrompt += `\n\nIn this round, respond to the other agents' points with probing questions that deepen the analysis.`
        }

        try {
          const { output, modelUsed } = await runAgentWithRouting(agent, roundPrompt, question)

          const trace = {
            agentName: agent.name,
            agentId: agent.id,
            role: agent.role,
            modelId: modelUsed,
            output,
            processingTime: Date.now() - startTime,
            stepIndex: (round - 1) * agents.length + i,
            status: 'completed',
            round,
          }

          onTraceUpdate({ ...trace })
          return trace
        } catch (error) {
          return {
            agentName: agent.name,
            agentId: agent.id,
            role: agent.role,
            modelId: agent.model_id,
            output: `Error: ${error.message}`,
            processingTime: Date.now() - startTime,
            stepIndex: (round - 1) * agents.length + i,
            status: 'failed',
            round,
          }
        }
      })
    )

    traces.push(...roundOutputs)
  }

  return traces
}

async function runParallel(agents, question, context, memoryContext, onTraceUpdate) {
  // All agents run at the same time instead of one after another
  const results = await Promise.all(
    agents.map(async (agent, i) => {
      const startTime = Date.now()

      onTraceUpdate({
        agentName: agent.name,
        role: agent.role,
        modelId: agent.model_id,
        status: 'running',
        stepIndex: i,
      })

      const prompt = buildAgentPrompt(agent, question, context, memoryContext, [])

      try {
        const { output, modelUsed } = await runAgentWithRouting(agent, prompt, question)
        const trace = {
          agentName: agent.name,
          agentId: agent.id,
          role: agent.role,
          modelId: modelUsed,
          output,
          processingTime: Date.now() - startTime,
          stepIndex: i,
          status: 'completed',
        }
        onTraceUpdate({ ...trace })
        return trace
      } catch (error) {
        const trace = {
          agentName: agent.name,
          agentId: agent.id,
          role: agent.role,
          modelId: agent.model_id,
          output: `Error: ${error.message}`,
          processingTime: Date.now() - startTime,
          stepIndex: i,
          status: 'failed',
        }
        onTraceUpdate({ ...trace })
        return trace
      }
    })
  )

  return results
}

async function runHierarchical(agents, question, context, memoryContext, onTraceUpdate) {
  if (agents.length < 2) return runSequential(agents, question, context, memoryContext, onTraceUpdate)

  const [lead, ...subordinates] = agents
  const traces = []

  const planStartTime = Date.now()
  onTraceUpdate({
    agentName: lead.name,
    role: lead.role,
    modelId: lead.model_id,
    status: 'running',
    stepIndex: 0,
  })

  const planPrompt = `${lead.system_prompt}\n\n${memoryContext ?? ''}\n\nYou are the lead agent. Break this question into ${subordinates.length} subtask(s).\n\nQuestion: ${question}\n\nContext:\n${context}\n\nCreate a brief plan with ${subordinates.length} numbered subtasks:`

  const plan = await ollamaChat(lead.model_id, [{ role: 'user', content: planPrompt }])

  const planTrace = {
    agentName: lead.name,
    agentId: lead.id,
    role: lead.role,
    modelId: lead.model_id,
    output: plan,
    processingTime: Date.now() - planStartTime,
    stepIndex: 0,
    status: 'completed',
  }
  traces.push(planTrace)
  onTraceUpdate({ ...planTrace })

  const subOutputs = await Promise.all(
    subordinates.map(async (agent, i) => {
      const startTime = Date.now()
      onTraceUpdate({
        agentName: agent.name,
        role: agent.role,
        modelId: agent.model_id,
        status: 'running',
        stepIndex: i + 1,
      })

      const subPrompt = `${agent.system_prompt}\n\n${memoryContext ?? ''}\n\nLead agent plan:\n${plan}\n\nContext:\n${context}\n\nQuestion: ${question}\n\nExecute your part as ${agent.role}:`

      try {
        const { output, modelUsed } = await runAgentWithRouting(agent, subPrompt, question)
        const trace = {
          agentName: agent.name,
          agentId: agent.id,
          role: agent.role,
          modelId: modelUsed,
          output,
          processingTime: Date.now() - startTime,
          stepIndex: i + 1,
          status: 'completed',
        }
        onTraceUpdate({ ...trace })
        return trace
      } catch (error) {
        return {
          agentName: agent.name,
          agentId: agent.id,
          role: agent.role,
          modelId: agent.model_id,
          output: `Error: ${error.message}`,
          processingTime: Date.now() - startTime,
          stepIndex: i + 1,
          status: 'failed',
        }
      }
    })
  )

  traces.push(...subOutputs)
  return traces
}

export async function runMultiAgentPipeline({
  question,
  agents,
  knowledgeBaseId,
  teamId,
  userId,
  collaborationMode = 'sequential',
  debateConfig = {},
  memoryEnabled = false,
  ragOptions = {},
  onTraceUpdate = () => {},
}) {
  const startTime = Date.now()

  // 1. Retrieve RAG chunks
  let chunks = []
  let context = 'No knowledge base connected.'

  if (knowledgeBaseId) {
    try {
      chunks = await retrieveRelevantChunks(
        question, 
        knowledgeBaseId, 
        ragOptions.topK  ?? 6, 
        ragOptions.threshold ?? 0.3,
        {
          useLLMRerank: ragOptions.useLLMRerank ?? false,
          vectorWeight: ragOptions.vectorWeight ?? 0.7,
          keywordWeight: ragOptions.keywordWeight ?? 0.3,
        }
      )
      context = formatChunksAsContext(chunks)
    } catch (error) {
      console.error('RAG retrieval error:', error)
      context = 'Knowledge base retrieval failed.'
    }
  }

  // 2. Load shared memory if enabled
  let memoryContext = null
  if (memoryEnabled && teamId && userId) {
    const memories = await getTeamMemories(teamId, userId, 8)
    memoryContext = formatMemoriesAsContext(memories)
  }

  // 3. Sort agents
  const sortedAgents = [...agents].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  // 4. Run agents
  let agentTraces = []

  // In the collaboration mode routing section:
  if (collaborationMode === 'debate') {
    agentTraces = await runDebate(sortedAgents, question, context, memoryContext, debateConfig, onTraceUpdate)
  } else if (collaborationMode === 'hierarchical') {
    agentTraces = await runHierarchical(sortedAgents, question, context, memoryContext, onTraceUpdate)
  } else if (collaborationMode === 'parallel') {
    agentTraces = await runParallel(sortedAgents, question, context, memoryContext, onTraceUpdate)
  } else {
    agentTraces = await runSequential(sortedAgents, question, context, memoryContext, onTraceUpdate)
  }

  // 5. Synthesize
  const completedTraces = agentTraces.filter(t => t.status === 'completed')
  let finalAnswer = ''

  if (completedTraces.length === 0) {
    finalAnswer = 'All agents failed to process the query.'
  } else if (completedTraces.length === 1) {
    finalAnswer = completedTraces[0].output
  } else {
    onTraceUpdate({
      agentName: 'Synthesizer',
      role: 'synthesizer',
      modelId: sortedAgents[sortedAgents.length - 1].model_id,
      status: 'running',
      stepIndex: agentTraces.length,
      isSynthesis: true,
    })

    const synthesisPrompt = buildSynthesisPrompt(question, completedTraces, context, memoryContext)
    const lastModel = sortedAgents[sortedAgents.length - 1].model_id

    finalAnswer = await ollamaChat(lastModel, [
      { role: 'user', content: synthesisPrompt }
    ])

    onTraceUpdate({
      agentName: 'Synthesizer',
      role: 'synthesizer',
      modelId: lastModel,
      status: 'completed',
      stepIndex: agentTraces.length,
      output: finalAnswer,
      isSynthesis: true,
    })
  }

  // 6. Score
  const firstModel = sortedAgents[0]?.model_id ?? 'llama3:latest'
  const scores = await scoreAnswer(question, finalAnswer, context, firstModel)

  return {
    finalAnswer,
    agentTraces,
    chunks,
    scores,
    processingTime: Date.now() - startTime,
    memoryUsed: !!memoryContext,
  }
}