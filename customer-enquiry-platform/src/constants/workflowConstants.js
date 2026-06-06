export const BRANCH_CONDITIONS = [
  { value: 'high_value_lead', label: 'High Value Lead', description: 'Qualifier marks lead as high value' },
  { value: 'needs_escalation', label: 'Needs Escalation', description: 'Qualifier flags for human review' },
  { value: 'complaint', label: 'Is Complaint', description: 'Classifier identifies as complaint' },
  { value: 'order_inquiry', label: 'Is Order Inquiry', description: 'Classifier identifies as order inquiry' },
  { value: 'low_confidence', label: 'Low Confidence', description: 'Any agent confidence below 0.7' },
]

export const BRANCH_ACTIONS = [
  { value: 'notify_slack', label: 'Send Slack Notification', description: 'Notify team on Slack' },
  { value: 'notify_email', label: 'Send Email Alert', description: 'Email the workflow owner' },
  { value: 'update_crm', label: 'Update CRM Sheet', description: 'Mark in Google Sheets' },
  { value: 'escalate_human', label: 'Escalate to Human', description: 'Flag for human review' },
  { value: 'skip_response', label: 'Skip Auto Response', description: 'Do not send automated reply' },
]

export const RETRY_POLICIES = [
  { value: 1, label: '1 retry' },
  { value: 2, label: '2 retries' },
  { value: 3, label: '3 retries (recommended)' },
  { value: 5, label: '5 retries' },
]