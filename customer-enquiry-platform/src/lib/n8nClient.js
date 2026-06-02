import axios from 'axios'

const n8n = axios.create({
  baseURL: process.env.N8N_BASE_URL,
  headers: {
    'X-N8N-API-KEY': process.env.N8N_API_KEY,
    'Content-Type': 'application/json'
  }
})

export const n8nClient = {
  // Get all workflows
  getWorkflows: async () => {
    const res = await n8n.get('/api/v1/workflows')
    return res.data
  },

  // Create workflow in n8n
  createWorkflow: async (workflowData) => {
    const res = await n8n.post('/api/v1/workflows', workflowData)
    return res.data
  },

  // Delete workflow from n8n
  deleteWorkflow: async (n8nWorkflowId) => {
    const res = await n8n.delete(`/api/v1/workflows/${n8nWorkflowId}`)
    return res.data
  },

  // Trigger workflow via webhook
  triggerWorkflow: async (webhookUrl, payload) => {
    const res = await axios.post(webhookUrl, payload)
    return res.data
  },

  // Get execution details
  getExecution: async (executionId) => {
    const res = await n8n.get(`/api/v1/executions/${executionId}`)
    return res.data
  }
}