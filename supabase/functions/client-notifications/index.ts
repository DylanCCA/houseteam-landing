// Client Notification System - SMS & Email Alerts for New Listings
// For The House Team - Century 21 Advantage Realty
// Integrates with Twilio for SMS (sends from agent's number)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Twilio Configuration - SMS from agent's number
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || ''
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || ''
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || '' // The House Team's number
const TWILIO_WEBHOOK_URL = Deno.env.get('TWILIO_WEBHOOK_URL') || '' // For inbound SMS

// Resend for email
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const FROM_EMAIL = 'alerts@houseteamrealtors.com'

// Team contact for forwarding
const AGENT_EMAIL = 'thouse@century21advantage.com'
const AGENT_PHONE = '606-224-3261'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =============================================================================
// INTERFACES
// =============================================================================

interface NotificationQueueItem {
  id: string
  client_id: string
  listing_id: string
  listing_address: string
  listing_price: number
  status: string
  client?: {
    first_name: string
    last_name: string
    phone: string
    email: string
    notify_sms: boolean
    notify_email: boolean
  }
}

interface ClientCriteria {
  id: string
  client_id: string
  name: string
  counties: string[]
  cities: string[]
  min_price: number
  max_price: number
  min_beds: number
  property_types: string[]
}

// =============================================================================
// TWILIO SMS FUNCTIONS
// =============================================================================

async function sendSMS(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log('Twilio not configured, skipping SMS')
    return { success: false, error: 'Twilio not configured' }
  }

  try {
    // Format phone number
    const formattedTo = formatPhoneNumber(to)
    if (!formattedTo) {
      return { success: false, error: 'Invalid phone number' }
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formattedTo,
        From: TWILIO_PHONE_NUMBER,
        Body: message,
        // StatusCallback for delivery tracking
        ...(TWILIO_WEBHOOK_URL && { StatusCallback: `${TWILIO_WEBHOOK_URL}/status` })
      }).toString()
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Twilio error:', error)
      return { success: false, error }
    }

    const data = await response.json()
    return { success: true, sid: data.sid }

  } catch (error) {
    console.error('SMS send error:', error)
    return { success: false, error: String(error) }
  }
}

function formatPhoneNumber(phone: string): string | null {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')

  // US number handling
  if (digits.length === 10) {
    return `+1${digits}`
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }

  return null
}

// =============================================================================
// EMAIL FUNCTIONS
// =============================================================================

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log('Resend not configured, skipping email')
    return { success: false, error: 'Email not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: to,
        subject: subject,
        html: html
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Email error:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: String(error) }
  }
}

// =============================================================================
// NOTIFICATION TEMPLATES
// =============================================================================

function buildNewListingSMS(clientName: string, listings: Array<{ address: string; price: number; beds?: number }>): string {
  const count = listings.length
  const firstName = clientName.split(' ')[0]

  if (count === 1) {
    const l = listings[0]
    return `Hi ${firstName}! 🏠 New listing matching your search:\n\n${l.address}\n$${l.price.toLocaleString()}${l.beds ? ` • ${l.beds}BR` : ''}\n\nInterested in a showing? Reply YES or call ${AGENT_PHONE}\n\n- The House Team`
  }

  return `Hi ${firstName}! 🏠 ${count} new listings match your search:\n\n${listings.slice(0, 3).map(l =>
    `• ${l.address.split(',')[0]} - $${l.price.toLocaleString()}`
  ).join('\n')}${count > 3 ? `\n+${count - 3} more` : ''}\n\nReply YES for details or call ${AGENT_PHONE}\n\n- The House Team`
}

function buildNewListingEmail(clientName: string, listings: Array<{ address: string; price: number; beds?: number; city?: string; listing_url?: string }>): string {
  const count = listings.length
  const firstName = clientName.split(' ')[0]

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .listing { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #e2e8f0; }
        .price { font-size: 20px; color: #1e40af; font-weight: bold; }
        .address { font-size: 16px; margin: 5px 0; }
        .details { color: #64748b; font-size: 14px; }
        .cta { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;">🏠 ${count} New Listing${count > 1 ? 's' : ''} For You!</h1>
        </div>
        <div class="content">
          <p>Hi ${firstName},</p>
          <p>Great news! We found ${count} new listing${count > 1 ? 's' : ''} matching your search criteria:</p>

          ${listings.map(l => `
            <div class="listing">
              <div class="price">$${l.price.toLocaleString()}</div>
              <div class="address">${l.address}</div>
              <div class="details">${l.beds ? `${l.beds} Bedrooms • ` : ''}${l.city || ''}</div>
              ${l.listing_url ? `<a href="${l.listing_url}" style="color: #1e40af; font-size: 14px;">View Details →</a>` : ''}
            </div>
          `).join('')}

          <p style="text-align: center;">
            <a href="tel:${AGENT_PHONE}" class="cta">📞 Schedule a Showing</a>
          </p>

          <p>Reply to this email or call us at <strong>${AGENT_PHONE}</strong> to learn more!</p>
        </div>
        <div class="footer">
          <p>The House Team - Century 21 Advantage Realty<br>
          911 N Main St, London, KY 40741<br>
          <a href="mailto:${AGENT_EMAIL}">${AGENT_EMAIL}</a></p>
          <p><a href="#">Unsubscribe</a> from listing alerts</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

// Get pending notifications grouped by client
async function getPendingNotifications(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('notification_queue')
    .select(`
      id,
      client_id,
      listing_id,
      listing_address,
      listing_price,
      status,
      client_profiles!inner (
        first_name,
        last_name,
        phone,
        email,
        notify_sms,
        notify_email
      )
    `)
    .eq('status', 'approved')
    .order('client_id')

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  // Group by client
  const grouped = new Map<string, any[]>()
  for (const item of data || []) {
    const clientId = item.client_id
    if (!grouped.has(clientId)) {
      grouped.set(clientId, [])
    }
    grouped.get(clientId)!.push(item)
  }

  return grouped
}

// Send notifications for approved items
async function sendApprovedNotifications(supabase: ReturnType<typeof createClient>) {
  const pendingByClient = await getPendingNotifications(supabase)
  const results = { sms_sent: 0, emails_sent: 0, errors: 0 }

  for (const [clientId, notifications] of pendingByClient) {
    const client = (notifications[0] as any).client_profiles
    const clientName = `${client.first_name} ${client.last_name}`

    const listings = notifications.map((n: any) => ({
      id: n.id,
      address: n.listing_address,
      price: n.listing_price
    }))

    // Send SMS if enabled
    if (client.notify_sms && client.phone) {
      const message = buildNewListingSMS(clientName, listings)
      const smsResult = await sendSMS(client.phone, message)

      if (smsResult.success) {
        results.sms_sent++

        // Log SMS
        await supabase.from('sms_messages').insert({
          direction: 'outbound',
          from_number: TWILIO_PHONE_NUMBER,
          to_number: client.phone,
          client_id: clientId,
          message_body: message,
          twilio_sid: smsResult.sid,
          twilio_status: 'sent'
        })
      } else {
        results.errors++
      }
    }

    // Send email if enabled
    if (client.notify_email && client.email) {
      const subject = `🏠 ${listings.length} New Listing${listings.length > 1 ? 's' : ''} Match Your Search!`
      const html = buildNewListingEmail(clientName, listings)
      const emailResult = await sendEmail(client.email, subject, html)

      if (emailResult.success) {
        results.emails_sent++
      } else {
        results.errors++
      }
    }

    // Mark notifications as sent
    const notificationIds = notifications.map((n: any) => n.id)
    await supabase
      .from('notification_queue')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .in('id', notificationIds)
  }

  return results
}

// Get summary for admin dashboard
async function getNotificationSummary(supabase: ReturnType<typeof createClient>) {
  // Get pending notification counts per client
  const { data: summary, error } = await supabase.rpc('get_notification_summary')

  if (error) {
    console.error('Error getting summary:', error)
    return []
  }

  return summary
}

// Approve notifications for a client or batch
async function approveNotifications(
  supabase: ReturnType<typeof createClient>,
  params: { clientId?: string; batchId?: string; notificationIds?: string[]; agentId?: string }
) {
  const updates: any = {
    status: 'approved',
    approved_at: new Date().toISOString(),
    approved_by: params.agentId
  }

  let query = supabase.from('notification_queue').update(updates)

  if (params.notificationIds?.length) {
    query = query.in('id', params.notificationIds)
  } else if (params.clientId) {
    query = query.eq('client_id', params.clientId).eq('status', 'pending')
  } else if (params.batchId) {
    // Approve all pending from today
    query = query.eq('status', 'pending')
  }

  const { data, error } = await query.select('id')

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, approved: data?.length || 0 }
}

// Handle inbound SMS (client responses)
async function handleInboundSMS(
  supabase: ReturnType<typeof createClient>,
  from: string,
  body: string,
  twilioSid: string
) {
  // Find client by phone
  const { data: client } = await supabase
    .from('client_profiles')
    .select('id, first_name, last_name, email')
    .eq('phone', from)
    .single()

  // Log inbound message
  await supabase.from('sms_messages').insert({
    direction: 'inbound',
    from_number: from,
    to_number: TWILIO_PHONE_NUMBER,
    client_id: client?.id,
    message_body: body,
    twilio_sid: twilioSid,
    twilio_status: 'received'
  })

  // If they said YES or showed interest, update notifications and alert agent
  const isInterested = /\b(yes|interested|showing|schedule|call|info)\b/i.test(body)

  if (isInterested && client) {
    // Update recent notifications as interested
    await supabase
      .from('notification_queue')
      .update({ client_responded: true, client_interested: true, response_at: new Date().toISOString() })
      .eq('client_id', client.id)
      .eq('status', 'sent')
      .is('client_responded', false)

    // Forward to agent via email
    await sendEmail(
      AGENT_EMAIL,
      `🔔 ${client.first_name} ${client.last_name} Responded - INTERESTED!`,
      `
        <h2>Client Response Alert</h2>
        <p><strong>${client.first_name} ${client.last_name}</strong> replied to a listing alert:</p>
        <blockquote style="background: #f1f5f9; padding: 15px; border-left: 4px solid #1e40af;">
          "${body}"
        </blockquote>
        <p><strong>Phone:</strong> <a href="tel:${from}">${from}</a></p>
        <p><strong>Email:</strong> ${client.email}</p>
        <p style="color: #16a34a; font-weight: bold;">They appear INTERESTED - call them back!</p>
      `
    )
  }

  return { received: true, clientId: client?.id, interested: isInterested }
}

// =============================================================================
// HTTP HANDLER
// =============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'summary'

    // Handle Twilio webhook for inbound SMS
    if (url.pathname.includes('/webhook') || action === 'webhook') {
      const formData = await req.formData()
      const from = formData.get('From') as string
      const body = formData.get('Body') as string
      const sid = formData.get('MessageSid') as string

      const result = await handleInboundSMS(supabase, from, body, sid)

      // Twilio expects TwiML response
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } }
      )
    }

    // Parse JSON body for other actions
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // No body is fine for GET-like actions
    }

    switch (action) {
      case 'summary':
        // Get admin dashboard summary
        const summary = await getNotificationSummary(supabase)
        return new Response(JSON.stringify({ success: true, data: summary }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'approve':
        // Approve notifications
        const approveResult = await approveNotifications(supabase, body)
        return new Response(JSON.stringify(approveResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'send':
        // Send all approved notifications
        const sendResult = await sendApprovedNotifications(supabase)
        return new Response(JSON.stringify({ success: true, ...sendResult }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'approve-and-send':
        // One-click: approve all pending and send immediately
        await approveNotifications(supabase, { batchId: 'all', agentId: body.agentId })
        const results = await sendApprovedNotifications(supabase)
        return new Response(JSON.stringify({ success: true, ...results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

  } catch (error) {
    console.error('Notification error:', error)
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
