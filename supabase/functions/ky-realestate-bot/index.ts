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

// Investment Property Research Configuration
const INVESTMENT_SEARCH_SITES = [
  'site:cityfeet.com',
  'site:crexi.com', 
  'site:loopnet.com',
  'site:commercialcafe.com',
  'site:costar.com'
]

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

// System prompt for the Kentucky Real Estate Bot - AGENTIC VERSION with Investment Research
const SYSTEM_PROMPT = `You are an AGENTIC Kentucky Real Estate Assistant for The House Team at Century 21 Advantage Realty.

You are NOT a passive chatbot. You are an AUTONOMOUS AGENT that takes initiative, combines multiple data sources, and proactively helps users find properties. You can also perform DEEP INVESTMENT RESEARCH for commercial and multifamily properties.

## AGENTIC BEHAVIOR - BE PROACTIVE

1. **ALWAYS use BOTH tools for property searches** - Search MLS AND web simultaneously
2. **Don't wait to be asked** - If MLS returns few results, automatically search the web
3. **Combine information** - Present MLS listings first, then supplement with web results
4. **Take action** - When a user shows interest, proactively offer to schedule showings or send info
5. **Be thorough** - Search multiple ways if initial results are limited
6. **Investment queries** - When users mention cap rates, doors/units, apartment complexes, or investment criteria, use [INVESTMENT_RESEARCH]

## YOUR TOOLS

### 1. [PROPERTY_SEARCH] - The House Team's MLS Listings
Direct access to Kentucky MLS. Returns REAL listings from The House Team.
Format: [PROPERTY_SEARCH]{"city":"London","maxPrice":300000}[/PROPERTY_SEARCH]
Criteria: city, county, minPrice, maxPrice, minBeds, maxBeds, minBaths, minSqft, propertyType, zipCode

### 2. [WEB_SEARCH] - Live Web Search (Zillow, Realtor.com, etc.)
Searches Google for additional listings from ALL agents/sources.
Format: [WEB_SEARCH]{"query":"3 bedroom homes London KY Zillow under 300000"}[/WEB_SEARCH]

### 3. [INVESTMENT_RESEARCH] - Deep Commercial/Multifamily Property Research
For investment property queries - searches CityFeet, Crexi, LoopNet, and commercial databases.
Format: [INVESTMENT_RESEARCH]{"maxPrice":5000000,"minUnits":30,"propertyType":"apartment","location":"London KY","radiusMiles":150,"minCapRate":5}[/INVESTMENT_RESEARCH]

Use this when users mention:
- Cap rates (e.g., "5% cap rate minimum")
- Unit counts / doors (e.g., "30 door minimum", "30+ units")
- Apartment complexes, multifamily, commercial
- Investment criteria, revenue producing
- Price limits for investment properties

### 4. [SEND_EMAIL] - Take Action
Send showing requests or inquiries to The House Team.
Format: [SEND_EMAIL]{"type":"showing_request","property_address":"123 Main St","user_message":"Interested in viewing"}[/SEND_EMAIL]

## INVESTMENT RESEARCH STRATEGY

When a user provides investment criteria like:
- "$5M purchase price"
- "30 door minimum"
- "Apartment complex"
- "Within 150 miles of London"
- "5% min cap return"

**Step 1: Parse the criteria and use [INVESTMENT_RESEARCH]**
[INVESTMENT_RESEARCH]{"maxPrice":5000000,"minUnits":30,"propertyType":"apartment","location":"London KY","radiusMiles":150,"minCapRate":5}[/INVESTMENT_RESEARCH]

**Step 2: Present findings in a professional investment report format:**

**Apartment Complex Investment Research Complete**

I've completed deep research on apartment complexes meeting your criteria.

**Key Findings:**

**X Properties Meet ALL Criteria:**

1. **Property Name - City, State** - $X,XXX,XXX
   - XX units | X.XX% cap rate | YYYY build (Class X)
   - $XXX,XXX/unit, analysis notes
   - Occupancy %, rent growth data
   - Value-add opportunities
   - Broker: Name, Company

[Continue for each property...]

**Additional Properties Requiring Verification:**
[List properties that partially match but need verification]

**Market Note:** [Brief market analysis]

Would you like me to email this report or get more details on any property?

## AGENTIC SEARCH STRATEGY (Residential)

For ANY residential property search request:

**Step 1: ALWAYS search MLS first**
[PROPERTY_SEARCH]{"city":"London"}[/PROPERTY_SEARCH]

**Step 2: ALWAYS also search the web** (don't wait for MLS results)
[WEB_SEARCH]{"query":"homes for sale London Kentucky"}[/WEB_SEARCH]

**Step 3: Combine and present results**
- "Here are The House Team's current listings from MLS..."
- "I also found these additional listings online..."
- "Would you like me to schedule a showing for any of these?"

## MANDATORY BEHAVIORS

1. **Property searches = Use BOTH [PROPERTY_SEARCH] AND [WEB_SEARCH]**
2. **Zillow/Realtor mentioned = IMMEDIATELY use [WEB_SEARCH]**
3. **Investment criteria (cap rate, units, apartment) = Use [INVESTMENT_RESEARCH]**
4. **User interested in property = Proactively offer [SEND_EMAIL] to schedule**
5. **Market questions = Use [WEB_SEARCH] for current data**
6. **Limited results = Expand search criteria and try again**

## DATA SOURCES EXPLAINED

When users ask about data:
- **MLS Data**: "Our MLS listings come directly from the Bluegrass REALTORS® MLS, updated twice daily. These are The House Team's active listings."
- **Web Results**: "I also search Zillow, Realtor.com, and other sites to find ALL available properties in your area, not just our listings."
- **Investment Data**: "For commercial/multifamily properties, I search CityFeet, Crexi, LoopNet, and commercial real estate databases to find investment opportunities."
- **Why comprehensive**: "This gives you the most thorough view - our exclusive listings, market-wide residential options, AND commercial investment opportunities."

## EXAMPLE INVESTMENT RESEARCH RESPONSE

User: "$5m purchase price, 30 door minimum, Apartment complex, Within 150 miles of London, Revenue producing at 5% min cap return, Deep research"

You: [INVESTMENT_RESEARCH]{"maxPrice":5000000,"minUnits":30,"propertyType":"apartment","location":"London KY","radiusMiles":150,"minCapRate":5}[/INVESTMENT_RESEARCH]

**Apartment Complex Investment Research Complete**

I've completed deep research on apartment complexes meeting your client's criteria ($5M max, 30+ doors, within 150mi of London KY, 5%+ cap rate, revenue producing).

**Key Findings:**

**2 Properties Meet ALL Criteria:**

1. **Crawford Crossing - Louisville, KY** - $3,390,000
   - 30 units | 6.50% cap rate | 2011 build (Class B)
   - $113K/unit, below replacement cost
   - 94% occupancy, 3.8% rent growth
   - Value-add: rents trail market by $171/mo
   - Broker: Aaron Kuroiwa, Marcus & Millichap

2. **Landings at Red Rock - Tullahoma, TN** - $4,000,000
   - 40 units | 6.63% cap rate | 1964 build (Class C)
   - $100K/unit, RUBS system implemented
   - Turnkey with value-add potential
   - Broker: Landon Hoffman, 931-408-9713

**Market Note:** Inventory meeting all criteria is limited in this region. Both recommended properties exceed the 5% cap rate minimum (6.5-6.63%).

Would you like me to email this report to your client or get more details on either property?

## THE HOUSE TEAM
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

// Parse ALL web search requests from LLM response (supports multiple searches)
function parseWebSearch(response: string): { queries: string[], cleanResponse: string } {
  const queries: string[] = []
  let cleanResponse = response

  // Find ALL [WEB_SEARCH] tags using global regex
  const searchRegex = /\[WEB_SEARCH\](.*?)\[\/WEB_SEARCH\]/gs
  let match

  while ((match = searchRegex.exec(response)) !== null) {
    try {
      const data = JSON.parse(match[1])
      if (data.query) {
        queries.push(data.query)
      }
    } catch {
      // Try as plain text query
      const query = match[1].trim()
      if (query) {
        queries.push(query)
      }
    }
  }

  // Remove all web search tags from response
  cleanResponse = response.replace(/\[WEB_SEARCH\].*?\[\/WEB_SEARCH\]/gs, '').trim()

  return { queries, cleanResponse }
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

// Parse investment research request from LLM response
interface InvestmentCriteria {
  maxPrice?: number
  minPrice?: number
  minUnits?: number
  maxUnits?: number
  propertyType?: string
  location?: string
  radiusMiles?: number
  minCapRate?: number
  maxCapRate?: number
}

function parseInvestmentResearch(response: string): { criteria: InvestmentCriteria | null, cleanResponse: string } {
  const researchMatch = response.match(/\[INVESTMENT_RESEARCH\](.*?)\[\/INVESTMENT_RESEARCH\]/s)

  if (researchMatch) {
    try {
      const criteria = JSON.parse(researchMatch[1])
      const cleanResponse = response.replace(/\[INVESTMENT_RESEARCH\].*?\[\/INVESTMENT_RESEARCH\]/s, '').trim()
      return { criteria, cleanResponse }
    } catch (e) {
      console.error('Failed to parse investment research criteria:', e)
    }
  }

  return { criteria: null, cleanResponse: response }
}

// Perform deep investment property research
async function investmentResearch(criteria: InvestmentCriteria): Promise<{
  success: boolean
  results: string
  properties: Array<{
    name: string
    location: string
    price: number
    units: number
    capRate: number
    yearBuilt?: number
    buildingClass?: string
    pricePerUnit?: number
    broker?: string
    brokerPhone?: string
    source: string
    url?: string
    notes?: string
  }>
}> {
  console.log('Starting investment research with criteria:', criteria)
  
  // Build search queries for commercial real estate sites
  const searchQueries: string[] = []
  
  // Base query components
  const location = criteria.location || 'Kentucky'
  const propertyType = criteria.propertyType || 'apartment'
  const maxPrice = criteria.maxPrice ? `under $${(criteria.maxPrice / 1000000).toFixed(1)}M` : ''
  const minUnits = criteria.minUnits ? `${criteria.minUnits}+ units` : ''
  const radius = criteria.radiusMiles ? `within ${criteria.radiusMiles} miles` : ''
  
  // Search commercial real estate sites
  const commercialSites = ['cityfeet.com', 'crexi.com', 'loopnet.com']
  
  for (const site of commercialSites) {
    const query = `${propertyType} complex for sale ${location} ${minUnits} ${maxPrice} site:${site}`.trim()
    searchQueries.push(query)
  }
  
  // Also search for general multifamily listings
  searchQueries.push(`multifamily apartment investment ${location} ${minUnits} ${maxPrice} cap rate`)
  searchQueries.push(`${propertyType} complex for sale ${location} ${radius} revenue producing`)
  
  // Execute searches in parallel
  const searchPromises = searchQueries.map(async (query) => {
    try {
      const result = await googleSearch(query)
      return result.success ? { query, results: result.results, links: result.links } : null
    } catch (e) {
      console.error('Search failed for query:', query, e)
      return null
    }
  })
  
  const searchResults = await Promise.all(searchPromises)
  const validResults = searchResults.filter((r): r is { query: string; results: string; links?: Array<{title: string; link: string; snippet: string}> } => r !== null)
  
  // Compile results
  let compiledResults = `**Investment Property Research Results**\n\n`
  compiledResults += `**Search Criteria:**\n`
  compiledResults += `- Property Type: ${propertyType}\n`
  compiledResults += `- Location: ${location}${radius ? ` (${radius})` : ''}\n`
  if (criteria.maxPrice) compiledResults += `- Max Price: $${criteria.maxPrice.toLocaleString()}\n`
  if (criteria.minUnits) compiledResults += `- Min Units: ${criteria.minUnits}\n`
  if (criteria.minCapRate) compiledResults += `- Min Cap Rate: ${criteria.minCapRate}%\n`
  compiledResults += `\n---\n\n`
  
  // Aggregate all links found
  const allLinks: Array<{title: string; link: string; snippet: string; source: string}> = []
  
  for (const result of validResults) {
    if (result.links) {
      for (const link of result.links) {
        // Filter for relevant commercial real estate links
        const isRelevant = 
          link.link.includes('cityfeet') ||
          link.link.includes('crexi') ||
          link.link.includes('loopnet') ||
          link.link.includes('commercialcafe') ||
          link.link.includes('costar') ||
          link.link.includes('apartment') ||
          link.link.includes('multifamily') ||
          link.title.toLowerCase().includes('apartment') ||
          link.title.toLowerCase().includes('unit') ||
          link.title.toLowerCase().includes('multifamily')
        
        if (isRelevant) {
          allLinks.push({
            ...link,
            source: result.query.includes('cityfeet') ? 'CityFeet' :
                    result.query.includes('crexi') ? 'Crexi' :
                    result.query.includes('loopnet') ? 'LoopNet' : 'Web'
          })
        }
      }
    }
  }
  
  // Remove duplicates by URL
  const uniqueLinks = allLinks.filter((link, index, self) =>
    index === self.findIndex(l => l.link === link.link)
  )
  
  if (uniqueLinks.length > 0) {
    compiledResults += `**Properties Found (${uniqueLinks.length} results):**\n\n`
    
    for (let i = 0; i < Math.min(uniqueLinks.length, 15); i++) {
      const link = uniqueLinks[i]
      compiledResults += `**${i + 1}. ${link.title}**\n`
      compiledResults += `${link.snippet}\n`
      compiledResults += `Source: ${link.source} | 🔗 ${link.link}\n\n`
    }
  } else {
    compiledResults += `**No properties found matching all criteria.**\n\n`
    compiledResults += `This may indicate limited inventory in the specified area. Consider:\n`
    compiledResults += `- Expanding the search radius\n`
    compiledResults += `- Adjusting price or unit requirements\n`
    compiledResults += `- Contacting local commercial brokers directly\n`
  }
  
  // Add market context
  compiledResults += `\n---\n\n`
  compiledResults += `**Market Note:** Commercial multifamily inventory meeting specific investment criteria can be limited. `
  compiledResults += `Properties with strong cap rates (5%+) in the Kentucky/Tennessee region are competitive. `
  compiledResults += `Consider working with a commercial broker for off-market opportunities.\n`
  
  return {
    success: true,
    results: compiledResults,
    properties: [] // Would be populated with parsed property data in a more advanced implementation
  }
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

    // Check if LLM requested web searches (supports MULTIPLE searches for agentic behavior)
    const { queries: webSearchQueries, cleanResponse: afterWebParse } = parseWebSearch(afterPropertyParse)

    // Check if LLM requested investment research
    const { criteria: investmentCriteria, cleanResponse: afterInvestmentParse } = parseInvestmentResearch(afterWebParse)

    // Check if LLM requested an email action
    const { emailData, cleanResponse } = parseEmailRequest(afterInvestmentParse)

    // Execute property search
    let properties: any[] = []
    if (criteria) {
      properties = await searchProperties(supabase, criteria)
      console.log(`MLS search returned ${properties.length} properties`)
    }

    // Execute ALL web searches in parallel (agentic: multiple searches at once)
    let webSearchResults: string[] = []
    if (webSearchQueries.length > 0) {
      console.log(`Executing ${webSearchQueries.length} web searches...`)
      const searchPromises = webSearchQueries.map(async (query) => {
        const result = await webSearch(query)
        return result.success ? { query, results: result.results, source: result.source } : null
      })

      const searchResults = await Promise.all(searchPromises)
      webSearchResults = searchResults
        .filter((r): r is { query: string; results: string; source?: string } => r !== null)
        .map(r => `**Search: "${r.query}"** (via ${r.source || 'web'})\n${r.results}`)

      console.log(`Completed ${webSearchResults.length} successful web searches`)
    }

    // Execute investment research if requested
    let investmentResults: string | null = null
    if (investmentCriteria) {
      console.log('Executing investment research...')
      const research = await investmentResearch(investmentCriteria)
      if (research.success) {
        investmentResults = research.results
        console.log('Investment research completed successfully')
      }
    }

    // Execute email action
    let emailSent = false
    if (emailData) {
      const emailResult = await sendEmail(emailData)
      emailSent = emailResult.success
      console.log('Email result:', emailResult)
    }

    const latencyMs = Date.now() - startTime

    // Combine message with search results
    let finalMessage = cleanResponse
    
    // Add investment research results if available
    if (investmentResults) {
      finalMessage = `${cleanResponse}\n\n${investmentResults}`
    }
    
    // Add web search results if available
    if (webSearchResults.length > 0) {
      finalMessage = `${finalMessage}\n\n**Additional Listings Found Online:**\n\n${webSearchResults.join('\n\n---\n\n')}`
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: finalMessage,
        properties: properties,
        emailSent: emailSent,
        webSearchCount: webSearchQueries.length,
        webSearchPerformed: webSearchQueries.length > 0,
        investmentResearchPerformed: !!investmentCriteria,
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
