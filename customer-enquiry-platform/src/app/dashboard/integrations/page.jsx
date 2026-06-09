'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useIntegrations } from '@/hooks/useIntegrations'
import {
  Mail, HardDrive, Table, MessageCircle,
  CheckCircle, XCircle, Loader, ExternalLink,
  AlertCircle, X, Bell, Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

// WhatsApp Modal
function WhatsAppModal({ onClose, onSave }) {
  const [apiToken, setApiToken] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!apiToken || !phoneNumberId) {
      toast.error('Please fill in both fields')
      return
    }
    setSaving(true)
    const result = await onSave(apiToken, phoneNumberId)
    setSaving(false)
    if (result.success) {
      toast.success('WhatsApp connected!')
      onClose()
    } else {
      toast.error('Failed to connect WhatsApp')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-[#1a1a2e] border border-[#2e2e4e] rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">Connect WhatsApp</h3>
          <button onClick={onClose} className="text-[#a0a0b8] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">WhatsApp API Token</label>
            <input
              type="text"
              value={apiToken}
              onChange={e => setApiToken(e.target.value)}
              placeholder="EAAxxxxxxxxxxxxxxx"
              className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-2.5 text-white placeholder-[#4e4e6e] focus:outline-none focus:border-accent text-sm"
            />
            <p className="text-[#4e4e6e] text-xs mt-1">Found in Meta Developer Console → WhatsApp → API Setup</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Phone Number ID</label>
            <input
              type="text"
              value={phoneNumberId}
              onChange={e => setPhoneNumberId(e.target.value)}
              placeholder="123456789012345"
              className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-2.5 text-white placeholder-[#4e4e6e] focus:outline-none focus:border-accent text-sm"
            />
          </div>
          <div className="bg-[#0f0f17] rounded-lg p-3 flex gap-2">
            <AlertCircle size={15} className="text-warning flex-shrink-0 mt-0.5" />
            <p className="text-[#a0a0b8] text-xs">The temporary token from Meta expires every 24 hours.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-[#2e2e4e] text-[#a0a0b8] hover:text-white py-2.5 rounded-lg text-sm font-medium transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
            {saving ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Slack Modal
function SlackModal({ onClose, onSave }) {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [channelName, setChannelName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!webhookUrl) { toast.error('Please enter webhook URL'); return }
    setSaving(true)
    const result = await onSave(webhookUrl, channelName)
    setSaving(false)
    if (result.success) { toast.success('Slack connected!'); onClose() }
    else toast.error(result.error || 'Failed to connect')
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-[#1a1a2e] border border-[#2e2e4e] rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">Connect Slack</h3>
          <button onClick={onClose} className="text-[#a0a0b8] hover:text-white"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Webhook URL</label>
            <input
              type="text"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-2.5 text-white placeholder-[#4e4e6e] focus:outline-none focus:border-accent text-sm"
            />
            <p className="text-[#4e4e6e] text-xs mt-1">Slack → Apps → Incoming Webhooks → Add New Webhook</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Channel Name (optional)</label>
            <input
              type="text"
              value={channelName}
              onChange={e => setChannelName(e.target.value)}
              placeholder="#flowagent-alerts"
              className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-2.5 text-white placeholder-[#4e4e6e] focus:outline-none focus:border-accent text-sm"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-[#2e2e4e] text-[#a0a0b8] py-2.5 rounded-lg text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium">
            {saving ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Discord Modal
function DiscordModal({ onClose, onSave }) {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!webhookUrl) { toast.error('Please enter webhook URL'); return }
    setSaving(true)
    const result = await onSave(webhookUrl)
    setSaving(false)
    if (result.success) { toast.success('Discord connected!'); onClose() }
    else toast.error(result.error || 'Failed to connect')
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-[#1a1a2e] border border-[#2e2e4e] rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold text-lg">Connect Discord</h3>
          <button onClick={onClose} className="text-[#a0a0b8] hover:text-white"><X size={20} /></button>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Webhook URL</label>
          <input
            type="text"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full bg-[#0f0f17] border border-[#2e2e4e] rounded-lg px-4 py-2.5 text-white placeholder-[#4e4e6e] focus:outline-none focus:border-accent text-sm"
          />
          <p className="text-[#4e4e6e] text-xs mt-1">Discord → Channel Settings → Integrations → Webhooks</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-[#2e2e4e] text-[#a0a0b8] py-2.5 rounded-lg text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium">
            {saving ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Integration Card
function IntegrationCard({ icon: Icon, name, description, status, email, onConnect, onDisconnect, color, connecting }) {
  const isConnected = status === 'connected'
  return (
    <div className="bg-[#F0FFF0] border border-[#2e2e4e] rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-accent font-semibold text-m">{name}</h3>
            <p className="text-accent text-xs mt-0.5">{description}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          isConnected ? 'bg-success/10 text-success' : 'bg-[#0f0f17] text-[#a0a0b8]'
        }`}>
          {isConnected ? <CheckCircle size={11} /> : <XCircle size={11} />}
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      {isConnected && email && (
        <div className="bg-[#0f0f17] rounded-lg px-3 py-2 mb-4">
          <p className="text-[#a0a0b8] text-xs">Connected as <span className="text-white">{email}</span></p>
        </div>
      )}
      {isConnected ? (
        <button onClick={onDisconnect} className="w-full border border-error/30 text-error hover:bg-error/10 py-2 rounded-lg text-sm font-medium transition-colors">
          Disconnect
        </button>
      ) : (
        <button onClick={onConnect} disabled={connecting} className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
          {connecting ? <Loader size={14} className="animate-spin" /> : <ExternalLink size={14} />}
          {connecting ? 'Connecting...' : 'Connect'}
        </button>
      )}
    </div>
  )
}

export default function IntegrationsPage() {
  const { user } = useAuth()
  const {
    loading,
    connectGmail,
    connectDrive,
    connectSheets,
    connectWhatsApp,
    connectSlack,
    connectDiscord,
    connectCalendar,
    disconnect,
    getStatus,
    getEmail,
    refetch
  } = useIntegrations()

  const [whatsappModal, setWhatsappModal] = useState(false)
  const [slackModal, setSlackModal] = useState(false)
  const [discordModal, setDiscordModal] = useState(false)
  const [connecting, setConnecting] = useState(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    if (success === 'gmail') toast.success('Gmail connected successfully!')
    if (success === 'google_drive') toast.success('Google Drive connected!')
    if (success === 'google_sheets') toast.success('Google Sheets connected!')
    if (success === 'google_calendar') toast.success('Google Calendar connected!')
    if (error) toast.error(`Connection failed: ${error}`)
    if (success || error) {
      refetch()
      window.history.replaceState({}, '', '/dashboard/integrations')
    }
  }, [searchParams])

  const handleConnect = async (type) => {
    if (!user) return
    setConnecting(type)
    try {
      if (type === 'gmail') await connectGmail(user.id)
      else if (type === 'google_drive') await connectDrive(user.id)
      else if (type === 'google_sheets') await connectSheets(user.id)
      else if (type === 'google_calendar') await connectCalendar(user.id)
      else if (type === 'whatsapp') setWhatsappModal(true)
      else if (type === 'slack') setSlackModal(true)
      else if (type === 'discord') setDiscordModal(true)
    } catch (error) {
      toast.error('Connection failed')
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (type) => {
    try {
      await disconnect(type)
      toast.success('Disconnected successfully')
    } catch (error) {
      toast.error('Failed to disconnect')
    }
  }

  const integrationsList = [
    { type: 'gmail', icon: Mail, name: 'Gmail', description: 'Receive and send emails automatically', color: 'bg-red-500', category: 'Communication' },
    { type: 'whatsapp', icon: MessageCircle, name: 'WhatsApp Business', description: 'Receive and reply to WhatsApp messages', color: 'bg-green-500', category: 'Communication' },
    { type: 'google_drive', icon: HardDrive, name: 'Google Drive', description: 'Search your knowledge base documents', color: 'bg-yellow-500', category: 'Data' },
    { type: 'google_sheets', icon: Table, name: 'Google Sheets', description: 'Update your CRM and log responses', color: 'bg-green-600', category: 'Data' },
    { type: 'google_calendar', icon: Calendar, name: 'Google Calendar', description: 'Create calendar events from inquiries', color: 'bg-blue-500', category: 'Productivity' },
    { type: 'slack', icon: Bell, name: 'Slack', description: 'Get notified for high-priority inquiries', color: 'bg-purple-500', category: 'Notifications' },
    { type: 'discord', icon: Bell, name: 'Discord', description: 'Receive alerts in your Discord server', color: 'bg-indigo-500', category: 'Notifications' },
  ]

  const categories = [...new Set(integrationsList.map(i => i.category))]

  return (
    <div className="max-w-4xl mx-auto">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Integrations</h1>
        <p className="text-accent text-m mt-1">Connect your accounts to start automating customer inquiries</p>
      </div>

      <div className="bg-surface border border-[#2e2e4e] rounded-xl p-4 mb-6 flex items-center gap-3">
        <AlertCircle size={16} className="text-success flex-shrink-0" />
        <p className="text-black text-sm">
          Connect at least <span className="text-white font-medium">Gmail or WhatsApp</span> and{' '}
          <span className="text-white font-medium">Google Drive</span> before creating a workflow.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-surface border border-[#2e2e4e] rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#2e2e4e] rounded-xl" />
                <div><div className="w-24 h-4 bg-[#2e2e4e] rounded mb-2" /><div className="w-40 h-3 bg-[#2e2e4e] rounded" /></div>
              </div>
              <div className="w-full h-9 bg-[#2e2e4e] rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(category => (
            <div key={category}>
              <h2 className="text-[#a0a0b8] text-xs font-medium uppercase tracking-wider mb-3">
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrationsList
                  .filter(i => i.category === category)
                  .map(integration => (
                    <IntegrationCard
                      key={integration.type}
                      icon={integration.icon}
                      name={integration.name}
                      description={integration.description}
                      color={integration.color}
                      status={getStatus(integration.type)}
                      email={getEmail(integration.type)}
                      connecting={connecting === integration.type}
                      onConnect={() => handleConnect(integration.type)}
                      onDisconnect={() => handleDisconnect(integration.type)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {whatsappModal && (
        <WhatsAppModal
          onClose={() => setWhatsappModal(false)}
          onSave={connectWhatsApp}
        />
      )}
      {slackModal && (
        <SlackModal
          onClose={() => setSlackModal(false)}
          onSave={connectSlack}
        />
      )}
      {discordModal && (
        <DiscordModal
          onClose={() => setDiscordModal(false)}
          onSave={connectDiscord}
        />
      )}

    </div>
  )
}