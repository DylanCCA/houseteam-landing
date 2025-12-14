// Kentucky Real Estate Bot - AI-Powered Property Search & Knowledge Assistant
// Uses H200 self-hosted LLM (gpt-oss-120b) with OpenAI GPT-4o fallback
// For The House Team - Century 21 Advantage Realty

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// H200 Self-Hosted Configuration (NVIDIA Brev)
// Uses existing project secrets: H200_LLM_URL, H200_MODEL, FALLBACK_TO_OPENAI
const H200_API_URL = Deno.env.get('H200_LLM_URL') || Deno.env.get('H200_API_URL') || 'https://llm-api-o5l2m2dve.brevlab.com/v1/chat/completions'
const H200_MODEL = Deno.env.get('H200_MODEL') || 'gpt-oss-120b'
const H200_ENABLED = Deno.env.get('FALLBACK_TO_OPENAI') !== 'true' // If FALLBACK_TO_OPENAI is true, skip H200

// OpenAI Fallback Configuration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = 'gpt-4o'

// Resend Email Configuration
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const TEAM_EMAIL = 'thouse@century21advantage.com'
const FROM_EMAIL = 'bot@houseteamrealtors.com'

// Supabase Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Kentucky Real Estate Knowledge Base
const KY_KNOWLEDGE = `
## Kentucky Real Estate Laws & Regulations
- Kentucky sellers must complete a Seller's Disclosure of Property Condition form (KRS 324.360)
- Kentucky recognizes seller agency, buyer agency, dual agency (with written consent), and designated agency
- Real estate agents in Kentucky must complete 96 hours of pre-licensing education and pass the state exam
- Kentucky is an attorney state for closings - an attorney must be present at closing
- Property taxes in Kentucky are due by December 31st each year
- Kentucky has no state-mandated home inspection requirement, but inspections are strongly recommended

## Kentucky Real Estate Contracts
- A valid Kentucky real estate contract must include: identification of parties, property description, purchase price, earnest money terms, financing contingencies, inspection period (typically 10-14 days), closing date, and signatures
- Earnest money in Kentucky is typically 1-3% of purchase price and must be deposited within 3 business days
- The standard inspection period in Kentucky is 10-14 days from contract acceptance
- Kentucky uses the Greater Louisville Association of REALTORS® or Kentucky Association of REALTORS® standard forms

## Negotiation & Offers
- In Kentucky's market, effective negotiation includes understanding local comps, timing offers strategically, and being flexible on closing dates
- When facing multiple offers, consider escalation clauses, appraisal gap coverage, and flexible closing timelines
- Requesting seller concessions for repairs is common in Kentucky real estate transactions
- Average days on market in London, KY area is typically 30-60 days

## Home Buying Process in Kentucky
1. Get pre-approved for a mortgage
2. Find a licensed REALTOR® (like The House Team)
3. Search for homes in your price range
4. Make an offer with earnest money
5. Complete home inspection (10-14 days)
6. Appraisal ordered by lender
7. Final walkthrough
8. Closing with attorney present

## The House Team - Century 21 Advantage Realty
- Agents: Tabitha House (Senior Partner) and Dustin House (REALTOR)
- Office: 911 N Main St, London, KY 40741
- Phone: Tabitha (606) 224-3261, Dustin (606) 231-8571
- Tabitha is a Top Producing Agent with 41+ sales in 2025
- Centurion Award Winner, Masters Diamond Award recipient
- Service Areas: London, Corbin, East Bernstadt, Laurel County, Knox County
- Specialties: Residential and Commercial properties
`

// System prompt for the Kentucky Real Estate Bot
const SYSTEM_PROMPT = `You are a helpful Kentucky Real Estate Assistant for The House Team at Century 21 Advantage Realty.

Your role is to:
1. Help users search for properties in Kentucky (especially London, Corbin, Laurel County area)
2. Answer questions about Kentucky real estate laws, contracts, and the buying/selling process
3. Provide guidance on negotiations and making offers
4. Connect users with The House Team agents when they're ready to buy or sell

${KY_KNOWLEDGE}

## Response Guidelines
- Be friendly, professional, and helpful
- Use markdown formatting for readability
- When users ask about properties, extract search criteria and query the database
- Always mention The House Team contact info when appropriate: (606) 224-3261
- If you don't know something specific, recommend contacting The House Team directly
- Keep responses concise but informative

## Property Search
IMPORTANT: When users ask about properties, listings, homes, or real estate - ALWAYS trigger a property search. Don't ask for clarification - just search with whatever criteria they provide. If they don't specify criteria, search all active listings.

Extract these criteria from their message (all are optional):
- City (London, Manchester, McKee, Oneida - these are the main areas we serve)
- Price range (min/max)
- Bedrooms
- Square footage
- Property type (SF=Single Family, FA=Farm, UL=Land, BU=Business, OF=Office)

Current active listings include properties in: London, Manchester, McKee, Oneida (Jackson, Clay, and Knox Counties)

ALWAYS format property search requests as JSON in your response using this format:
[PROPERTY_SEARCH]{"city":"London","maxPrice":300000,"minBeds":3}[/PROPERTY_SEARCH]

To search ALL listings: [PROPERTY_SEARCH]{}[/PROPERTY_SEARCH]
Available criteria: city, minPrice, maxPrice, minBeds, minSqft, propertyType

After the search tag, provide a natural language response about what you found.

## Email Actions
When users want to schedule a showing, request more information, or contact the team, use this format:
[SEND_EMAIL]{"type":"showing_request","property_address":"123 Main St","user_message":"I'd like to schedule a showing"}[/SEND_EMAIL]

Email types: showing_request, property_inquiry, general_contact`

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface RequestBody {
  messages: ChatMessage[]
  sessionId?: string
}

// Call H200 self-hosted server
async function callH200(messages: ChatMessage[], maxTokens: number, temperature: number) {
  const response = await fetch(H200_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: H200_MODEL,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`H200 API error: ${response.status} - ${error}`)
  }

  return response.json()
}

// Call OpenAI as fallback
async function callOpenAI(messages: ChatMessage[], maxTokens: number, temperature: number) {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  return response.json()
}

// Property type mapping for display
const PROPERTY_TYPE_MAP: Record<string, string> = {
  'SF': 'Single Family',
  'MF': 'Multi-Family',
  'CO': 'Condo',
  'TH': 'Townhouse',
  'UL': 'Land',
  'FA': 'Farm',
  'BU': 'Business',
  'OF': 'Office',
  'RE': 'Retail',
  'IN': 'Industrial'
}

// Search properties in Supabase - uses real MLS data from mls_listings table
async function searchProperties(supabase: ReturnType<typeof createClient>, criteria: {
  city?: string
  minPrice?: number
  maxPrice?: number
  minBeds?: number
  minSqft?: number
  propertyType?: string
}) {
  // Query real MLS listings table
  let query = supabase
    .from('mls_listings')
    .select('*')
    .eq('status', 'Active')

  if (criteria.city) {
    query = query.ilike('city', `%${criteria.city}%`)
  }
  if (criteria.maxPrice) {
    query = query.lte('price', criteria.maxPrice)
  }
  if (criteria.minPrice) {
    query = query.gte('price', criteria.minPrice)
  }
  if (criteria.minBeds) {
    query = query.gte('beds', criteria.minBeds)
  }
  if (criteria.minSqft) {
    query = query.gte('living_area', criteria.minSqft)
  }
  if (criteria.propertyType) {
    query = query.eq('property_type', criteria.propertyType)
  }

  const { data, error } = await query.order('price', { ascending: false }).limit(10)

  if (error) {
    console.error('MLS property search error:', error)
    return []
  }

  // Normalize MLS data to match frontend Property interface
  const normalizedData = (data || []).map((listing: any) => ({
    id: listing.id,
    mls_number: listing.mls_number,
    address: listing.address,
    city: listing.city,
    state: listing.state || 'KY',
    zip: listing.zip,
    county: listing.county,
    price: listing.price,
    beds: listing.beds,
    baths_total: listing.baths_total,
    sqft: listing.living_area,
    lot_size_acres: listing.lot_size_acres,
    year_built: listing.year_built,
    property_type: PROPERTY_TYPE_MAP[listing.property_type] || listing.property_type,
    status: listing.status,
    status_note: listing.status_note,
    description: `${listing.beds ? listing.beds + ' bedroom' : ''} ${PROPERTY_TYPE_MAP[listing.property_type] || listing.property_type} in ${listing.city}, ${listing.county}. ${listing.lot_size_acres ? listing.lot_size_acres + ' acres.' : ''} Listed by ${listing.agent_name}${listing.co_listing_agent ? ' & ' + listing.co_listing_agent : ''} at ${listing.office}.`,
    listing_agent: listing.agent_name,
    co_listing_agent: listing.co_listing_agent,
    listing_office: listing.office,
    days_on_market: listing.dom,
    image_urls: []
  }))

  return normalizedData
}

// Send email via Resend API
async function sendEmail(emailData: {
  type: string
  property_address?: string
  user_message?: string
  user_email?: string
  user_name?: string
}): Promise<{ success: boolean; message: string }> {
  if (!RESEND_API_KEY) {
    console.log('Resend API key not configured, skipping email')
    return { success: false, message: 'Email service not configured' }
  }

  const subjectMap: Record<string, string> = {
    'showing_request': `Showing Request: ${emailData.property_address || 'Property Inquiry'}`,
    'property_inquiry': `Property Inquiry: ${emailData.property_address || 'General'}`,
    'general_contact': 'New Contact from Kentucky Real Estate Bot'
  }

  const subject = subjectMap[emailData.type] || 'New Message from Kentucky Real Estate Bot'

  const htmlBody = `
    <h2>New ${emailData.type.replace('_', ' ')} from Kentucky Real Estate Bot</h2>
    ${emailData.property_address ? `<p><strong>Property:</strong> ${emailData.property_address}</p>` : ''}
    ${emailData.user_name ? `<p><strong>Name:</strong> ${emailData.user_name}</p>` : ''}
    ${emailData.user_email ? `<p><strong>Email:</strong> ${emailData.user_email}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p>${emailData.user_message || 'No message provided'}</p>
    <hr>
    <p><em>Sent via The House Team AI Assistant</em></p>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TEAM_EMAIL,
        subject: subject,
        html: htmlBody
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      return { success: false, message: 'Failed to send email' }
    }

    return { success: true, message: 'Email sent successfully' }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, message: 'Email service error' }
  }
}

// Parse property search criteria from LLM response
function parsePropertySearch(response: string): { criteria: any | null, cleanResponse: string } {
  const searchMatch = response.match(/\[PROPERTY_SEARCH\](.*?)\[\/PROPERTY_SEARCH\]/s)

  if (searchMatch) {
    try {
      const criteria = JSON.parse(searchMatch[1])
      const cleanResponse = response.replace(/\[PROPERTY_SEARCH\].*?\[\/PROPERTY_SEARCH\]/s, '').trim()
      return { criteria, cleanResponse }
    } catch (e) {
      console.error('Failed to parse property search criteria:', e)
    }
  }

  return { criteria: null, cleanResponse: response }
}

// Parse email request from LLM response
function parseEmailRequest(response: string): { emailData: any | null, cleanResponse: string } {
  const emailMatch = response.match(/\[SEND_EMAIL\](.*?)\[\/SEND_EMAIL\]/s)

  if (emailMatch) {
    try {
      const emailData = JSON.parse(emailMatch[1])
      const cleanResponse = response.replace(/\[SEND_EMAIL\].*?\[\/SEND_EMAIL\]/s, '').trim()
      return { emailData, cleanResponse }
    } catch (e) {
      console.error('Failed to parse email request:', e)
    }
  }

  return { emailData: null, cleanResponse: response }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const { messages, sessionId }: RequestBody = await req.json()

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Prepare messages with system prompt
    const fullMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ]

    let data: { choices?: Array<{ message?: { content?: string } }>, usage?: any }
    let usedModel: string
    let usedH200 = false

    // Try H200 first, fallback to OpenAI
    if (H200_ENABLED) {
      try {
        console.log('Attempting H200 inference...')
        data = await callH200(fullMessages, 1000, 0.7)
        usedModel = H200_MODEL
        usedH200 = true
        console.log('H200 inference successful')
      } catch (h200Error) {
        console.warn('H200 unavailable, falling back to OpenAI:', h200Error.message)
        data = await callOpenAI(fullMessages, 1000, 0.7)
        usedModel = OPENAI_MODEL
      }
    } else {
      data = await callOpenAI(fullMessages, 1000, 0.7)
      usedModel = OPENAI_MODEL
    }

    const rawResponse = data.choices?.[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again or call The House Team at (606) 224-3261.'

    // Check if LLM requested a property search
    const { criteria, cleanResponse: afterPropertyParse } = parsePropertySearch(rawResponse)

    // Check if LLM requested an email action
    const { emailData, cleanResponse } = parseEmailRequest(afterPropertyParse)

    let properties: any[] = []
    if (criteria) {
      properties = await searchProperties(supabase, criteria)
    }

    let emailSent = false
    if (emailData) {
      const emailResult = await sendEmail(emailData)
      emailSent = emailResult.success
      console.log('Email result:', emailResult)
    }

    const latencyMs = Date.now() - startTime

    return new Response(
      JSON.stringify({
        success: true,
        message: cleanResponse,
        properties: properties,
        emailSent: emailSent,
        usage: data.usage,
        model: usedModel,
        usedH200: usedH200,
        latencyMs: latencyMs
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('KY Real Estate Bot error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred processing your request',
        message: 'I apologize, but I encountered an error. Please try again or contact The House Team directly at (606) 224-3261.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
