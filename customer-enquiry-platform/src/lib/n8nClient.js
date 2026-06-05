import axios from 'axios'

const n8n = axios.create({
  baseURL: process.env.N8N_BASE_URL,
  headers: {
    'X-N8N-API-KEY': process.env.N8N_API_KEY,
    'Content-Type': 'application/json'
  }
})

export const n8nClient = {
  getWorkflows: async () => {
    const res = await n8n.get('/api/v1/workflows')
    return res.data
  },

  getWorkflow: async (id) => {
    const res = await n8n.get(`/api/v1/workflows/${id}`)
    return res.data
  },

  createWorkflow: async (workflowData) => {
    const res = await n8n.post('/api/v1/workflows', workflowData)
    return res.data
  },

  activateWorkflow: async (id) => {
    const res = await n8n.patch(`/api/v1/workflows/${id}`, { active: true })
    return res.data
  },

  deleteWorkflow: async (id) => {
    const res = await n8n.delete(`/api/v1/workflows/${id}`)
    return res.data
  },


  triggerWorkflow: async (webhookPath, payload) => {
    const res = await axios.post(
      `${process.env.N8N_BASE_URL}/${process.env.N8N_WEBHOOK_PREFIX}/${webhookPath}`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    )
    return res.data 
  },

  getExecution: async (executionId) => {
    const res = await n8n.get(`/api/v1/executions/${executionId}`)
    return res.data
  },

  getExecutions: async (workflowId) => {
    const res = await n8n.get(`/api/v1/executions?workflowId=${workflowId}`)
    return res.data
  }
}