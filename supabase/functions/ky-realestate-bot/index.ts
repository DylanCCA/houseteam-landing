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
const OPENAI_MODEL = 'o1'

// Resend Email Configuration
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const TEAM_EMAIL = 'thouse@century21advantage.com'
const FROM_EMAIL = 'bot@houseteamrealtors.com'

// H200 Browser Automation (Web Search) Configuration
const H200_BROWSER_URL = Deno.env.get('H200_BROWSER_URL') || 'https://8080-o5l2m2dve.brevlab.com'
const H200_BROWSER_API_KEY = Deno.env.get('H200_BROWSER_API_KEY') || 'mselwQXUzYI05D2eVTQ5FTUGLEry74IkJEsauLbVn+s='

// Google Custom Search API Configuration (uses existing GOOGLE_API_KEY)
// Requires a Custom Search Engine ID - create at: https://programmablesearchengine.google.com/
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || ''
const GOOGLE_CSE_ID = Deno.env.get('GOOGLE_CSE_ID') || '017576662512468239146:omuauf_lfve' // Default: Google's web search CSE
const GOOGLE_SEARCH_ENABLED = !!GOOGLE_API_KEY

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
const SYSTEM_PROMPT = `You are the Kentucky Real Estate Assistant for The House Team at Century 21 Advantage Realty. You are a professional, knowledgeable AI assistant with REAL capabilities.

## YOUR CAPABILITIES - USE THEM
You have THREE powerful tools. USE THEM - don't say you can't do something when you CAN:

### 1. [PROPERTY_SEARCH] - REAL MLS Database
You have DIRECT ACCESS to the Kentucky MLS database with REAL, LIVE listings updated twice daily.
- This is NOT mock data - these are REAL properties for sale RIGHT NOW
- Data comes from the official Kentucky MLS system
- Includes all of Tabitha House's and The House Team's listings

Format: [PROPERTY_SEARCH]{"city":"London","maxPrice":300000}[/PROPERTY_SEARCH]
Criteria: city, county, minPrice, maxPrice, minBeds, maxBeds, minBaths, minSqft, propertyType, zipCode

### 2. [WEB_SEARCH] - Google Search
You CAN search the web. When users ask about Zillow, Realtor.com, market data, or anything online - USE THIS.
NEVER say "I can't search websites" - you CAN and MUST use web search.

Format: [WEB_SEARCH]{"query":"homes for sale Laurel County Kentucky Zillow"}[/WEB_SEARCH]

MANDATORY web search triggers:
- User mentions "Zillow", "Realtor.com", "Trulia", or any website → IMMEDIATELY use [WEB_SEARCH]
- User asks for "more listings" or "other agents" → Use [WEB_SEARCH]
- User asks about current mortgage rates, market trends, school ratings → Use [WEB_SEARCH]
- User asks "search for" or "look up" anything → Use [WEB_SEARCH]

### 3. [SEND_EMAIL] - Contact The Team
Format: [SEND_EMAIL]{"type":"showing_request","property_address":"123 Main St","user_message":"..."}[/SEND_EMAIL]

## CRITICAL RULES

1. **NEVER say "I can't access external websites"** - You CAN via [WEB_SEARCH]
2. **NEVER say "this is mock data"** - The MLS data is REAL
3. **NEVER say "I don't have access to Zillow"** - Use [WEB_SEARCH] to search Zillow
4. **When asked about data source**: Say "This data comes directly from the Kentucky MLS system, updated twice daily"
5. **Be confident and professional** - You are a capable AI assistant with real tools

## RESPONSE EXAMPLES

User: "Search Zillow for homes in London KY"
You: [WEB_SEARCH]{"query":"homes for sale London KY Zillow"}[/WEB_SEARCH]
Here's what I found on Zillow for London, KY...

User: "What properties does Tabitha have?"
You: [PROPERTY_SEARCH]{}[/PROPERTY_SEARCH]
Here are Tabitha House's current MLS listings...

User: "Is this real data?"
You: "Yes! This data comes directly from the Kentucky MLS system. These are real, active listings updated twice daily at 7:00 AM and 3:00 PM EST. The House Team's listings are pulled live from the MLS database."

## THE HOUSE TEAM INFO
${KY_KNOWLEDGE}

Contact: Tabitha House (606) 224-3261 | Dustin House (606) 231-8571
Office: 911 N Main St, London, KY 40741`

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
// Note: o1 models use max_completion_tokens and don't support temperature
async function callOpenAI(messages: ChatMessage[], maxTokens: number, temperature: number) {
  const isO1Model = OPENAI_MODEL.startsWith('o1')

  // Build request body based on model type
  const requestBody: Record<string, unknown> = {
    model: OPENAI_MODEL,
    messages: messages,
  }

  if (isO1Model) {
    // o1 models use max_completion_tokens and don't support temperature
    requestBody.max_completion_tokens = maxTokens
  } else {
    // Standard models use max_tokens and temperature
    requestBody.max_tokens = maxTokens
    requestBody.temperature = temperature
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
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
  const normalizedData = (data || []).map((listing: any) => {
    // Generate listing URL - use MLS number for direct lookup
    const mlsUrl = listing.mls_number
      ? `https://www.century21.com/property/${listing.mls_number}`
      : null
    const zillowSearchUrl = `https://www.zillow.com/homes/${encodeURIComponent(listing.address + ' ' + listing.city + ' KY')}_rb/`

    return {
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
      image_urls: [],
      listing_url: mlsUrl,
      zillow_url: zillowSearchUrl
    }
  })

  return normalizedData
}

// Google Custom Search API (Enterprise-grade, uses existing GOOGLE_API_KEY)
async function googleSearch(query: string): Promise<{ success: boolean; results: string; source: string; links?: Array<{title: string; link: string; snippet: string}> }> {
  console.log('Starting Google Custom Search for:', query)

  try {
    // Google Custom Search JSON API
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(query + ' Kentucky real estate')}&num=10`

    const response = await fetch(searchUrl)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google CSE error:', response.status, errorText)
      throw new Error(`Google CSE error: ${response.status}`)
    }

    const data = await response.json()
    const items = data.items || []
    const links: Array<{title: string; link: string; snippet: string}> = []

    let searchResults = ''

    // Process search results
    if (items.length > 0) {
      searchResults = items.slice(0, 8).map((r: any, i: number) => {
        links.push({ title: r.title, link: r.link, snippet: r.snippet || '' })
        return `**${i + 1}. ${r.title}**\n${r.snippet || ''}\n🔗 ${r.link}`
      }).join('\n\n')
    }

    // Add search information if available
    if (data.searchInformation?.formattedTotalResults) {
      searchResults = `**Found approximately ${data.searchInformation.formattedTotalResults} results**\n\n${searchResults}`
    }

    return {
      success: true,
      results: searchResults || 'No results found for this query.',
      source: 'Google',
      links
    }

  } catch (error) {
    console.error('Google search error:', error)
    return {
      success: false,
      results: '',
      source: 'Google'
    }
  }
}

// Web Search via H200 Browser Automation (Fallback)
// Uses Puppeteer-based headless browser on H200 Brev instance
async function browserSearch(query: string): Promise<{ success: boolean; results: string; source?: string }> {
  console.log('Starting browser search for:', query)

  try {
    // Create a new browser session
    const createResponse = await fetch(`${H200_BROWSER_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${H200_BROWSER_API_KEY}`
      },
      body: JSON.stringify({})
    })

    if (!createResponse.ok) {
      console.warn('H200 Browser service unavailable')
      return { success: false, results: 'Web search service temporarily unavailable.' }
    }

    const session = await createResponse.json()
    const sessionId = session.sessionId

    try {
      // Navigate to Google
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`

      await fetch(`${H200_BROWSER_URL}/sessions/${sessionId}/navigate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${H200_BROWSER_API_KEY}`
        },
        body: JSON.stringify({ url: searchUrl })
      })

      // Wait for page load
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Extract search results using JavaScript execution
      const extractResponse = await fetch(`${H200_BROWSER_URL}/sessions/${sessionId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${H200_BROWSER_API_KEY}`
        },
        body: JSON.stringify({
          script: `
            const results = [];
            const items = document.querySelectorAll('.g, [data-sokoban-container]');
            items.forEach((item, i) => {
              if (i < 8) {
                const titleEl = item.querySelector('h3');
                const snippetEl = item.querySelector('.VwiC3b, [data-sncf]');
                const linkEl = item.querySelector('a[href^="http"]');
                const title = titleEl?.textContent?.trim() || '';
                const snippet = snippetEl?.textContent?.trim() || '';
                const link = linkEl?.href || '';
                if (title && snippet) {
                  results.push({ title, snippet, link });
                }
              }
            });
            return JSON.stringify(results);
          `
        })
      })

      let searchResults = 'No results found.'

      if (extractResponse.ok) {
        const extractData = await extractResponse.json()
        try {
          const parsed = JSON.parse(extractData.result || '[]')
          if (parsed.length > 0) {
            searchResults = parsed.map((r: {title: string; snippet: string; link: string}, i: number) =>
              `**${i + 1}. ${r.title}**\n${r.snippet}${r.link ? `\n🔗 ${r.link}` : ''}`
            ).join('\n\n')
          }
        } catch (e) {
          console.error('Failed to parse search results:', e)
        }
      }

      return {
        success: true,
        results: searchResults,
        source: 'Google (Browser)'
      }

    } finally {
      // Always clean up the session
      await fetch(`${H200_BROWSER_URL}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${H200_BROWSER_API_KEY}`
        }
      }).catch(() => {})
    }

  } catch (error) {
    console.error('Browser search error:', error)
    return {
      success: false,
      results: 'Unable to perform web search at this time. Please contact The House Team directly for current market information.'
    }
  }
}

// Unified web search function - tries Google API first, falls back to browser
async function webSearch(query: string): Promise<{ success: boolean; results: string; source?: string }> {
  // Try SerpAPI (Google) first if configured
  if (GOOGLE_SEARCH_ENABLED) {
    const googleResult = await googleSearch(query)
    if (googleResult.success) {
      return googleResult
    }
    console.warn('Google search failed, falling back to browser search')
  }

  // Fallback to browser-based search
  return browserSearch(query)
}

// Parse web search request from LLM response
function parseWebSearch(response: string): { query: string | null, cleanResponse: string } {
  const searchMatch = response.match(/\[WEB_SEARCH\](.*?)\[\/WEB_SEARCH\]/s)

  if (searchMatch) {
    try {
      const data = JSON.parse(searchMatch[1])
      const cleanResponse = response.replace(/\[WEB_SEARCH\].*?\[\/WEB_SEARCH\]/s, '').trim()
      return { query: data.query, cleanResponse }
    } catch (e) {
      // Try as plain text query
      const query = searchMatch[1].trim()
      const cleanResponse = response.replace(/\[WEB_SEARCH\].*?\[\/WEB_SEARCH\]/s, '').trim()
      return { query, cleanResponse }
    }
  }

  return { query: null, cleanResponse: response }
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

    // Check if LLM requested a web search
    const { query: webSearchQuery, cleanResponse: afterWebParse } = parseWebSearch(afterPropertyParse)

    // Check if LLM requested an email action
    const { emailData, cleanResponse } = parseEmailRequest(afterWebParse)

    let properties: any[] = []
    if (criteria) {
      properties = await searchProperties(supabase, criteria)
    }

    let webSearchResults: string | undefined
    if (webSearchQuery) {
      const searchResult = await webSearch(webSearchQuery)
      if (searchResult.success) {
        webSearchResults = searchResult.results
        console.log('Web search completed:', searchResult.source)
      }
    }

    let emailSent = false
    if (emailData) {
      const emailResult = await sendEmail(emailData)
      emailSent = emailResult.success
      console.log('Email result:', emailResult)
    }

    const latencyMs = Date.now() - startTime

    // Combine message with web search results if available
    let finalMessage = cleanResponse
    if (webSearchResults) {
      finalMessage = `${cleanResponse}\n\n**Web Search Results:**\n${webSearchResults}`
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: finalMessage,
        properties: properties,
        emailSent: emailSent,
        webSearchPerformed: !!webSearchQuery,
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
