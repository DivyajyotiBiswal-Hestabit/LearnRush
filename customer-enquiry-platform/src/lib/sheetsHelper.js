import { google } from 'googleapis'
import { supabaseAdmin } from './supabaseServer'

export async function updateSheetsCRM(userId, data) {
  try {
    console.log('Updating Sheets CRM for execution:', data.execution_id)

    // Get Google Sheets integration credentials
    const { data: integration } = await supabaseAdmin
      .from('integrations')
      .select('credentials')
      .eq('user_id', userId)
      .eq('type', 'google_sheets')
      .eq('status', 'connected')
      .single()

    if (!integration?.credentials) {
      console.log('No Google Sheets integration found for user:', userId)
      return false
    }

    // Get workflow to find sheets_id
    const { data: workflow } = await supabaseAdmin
      .from('workflows')
      .select('sheets_id, name')
      .eq('id', data.workflow_id)
      .single()

    if (!workflow?.sheets_id) {
      console.log('No sheets_id configured for workflow:', data.workflow_id)
      return false
    }

    console.log('Found sheet ID:', workflow.sheets_id)

    // Set up OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/integrations/google-sheets/callback'
    )

    oauth2Client.setCredentials({
      access_token: integration.credentials.access_token,
      refresh_token: integration.credentials.refresh_token
    })

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

    // Format date nicely
    const date = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Truncate long text for sheet readability
    const truncate = (text, max = 500) => {
      if (!text) return ''
      return text.length > max ? text.substring(0, max) + '...' : text
    }
     
    // Check if sheet has headers, if not add them
    try {
      const headerCheck = await sheets.spreadsheets.values.get({
        spreadsheetId: workflow.sheets_id,
        range: 'Sheet1!A1:G1'
      })

      const hasHeaders = headerCheck.data.values && 
        headerCheck.data.values[0]?.length > 0

      if (!hasHeaders) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: workflow.sheets_id,
          range: 'Sheet1!A1:G1',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[
              'Execution ID',
              'Date & Time',
              'Channel',
              'Customer Message',
              'Final Reply',
              'Status',
              'Score'
            ]]
          }
        })
        console.log('Headers added to sheet')
      }
    } catch (e) {
       console.log('Could not check/add headers:', e.message)
    }
    // Append row to sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: workflow.sheets_id,
      range: 'Sheet1!A:G',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [[
          data.execution_id,
          date,
          data.channel || 'email',
          truncate(data.original_message, 300),
          truncate(data.final_reply, 500),
          data.status || 'completed',
          data.overall_score || ''
        ]]
      }
    })

    console.log('✅ Google Sheets updated successfully:', response.data.updates?.updatedRange)
    return true

  } catch (error) {
    console.error('❌ Sheets CRM error:', error.message)
    return false
  }
}