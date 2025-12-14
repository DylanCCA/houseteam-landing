// Enterprise MLS Data Sync - Statewide Property Ingestion Service
// Supports 48-state white-label deployment
// Data Sources: Bridge Interactive (MLS), Zillow API, Realtor.com API
// Schedule: Runs twice daily at 0700 EST and 1500 EST

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// CONFIGURATION
// =============================================================================

// Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// MLS Data Sources - Bridge Interactive (Primary)
// Bridge provides nationwide MLS access through a single API
const BRIDGE_API_KEY = Deno.env.get('BRIDGE_API_KEY') || ''
const BRIDGE_API_URL = 'https://api.bridgedataoutput.com/api/v2'

// Zillow API (via RapidAPI or Zillow Partner API)
const ZILLOW_API_KEY = Deno.env.get('ZILLOW_API_KEY') || ''
const ZILLOW_API_URL = 'https://zillow-com1.p.rapidapi.com'

// Realtor.com API (via RapidAPI)
const REALTOR_API_KEY = Deno.env.get('REALTOR_API_KEY') || ''
const REALTOR_API_URL = 'https://realtor.p.rapidapi.com'

// Trestle/CoreLogic MLS API (Alternative)
const TRESTLE_API_KEY = Deno.env.get('TRESTLE_API_KEY') || ''
const TRESTLE_API_URL = 'https://api-prod.corelogic.com/trestle'

// State configuration - for white-label deployment
const ACTIVE_STATE = Deno.env.get('ACTIVE_STATE') || 'KY'
const ACTIVE_STATE_NAME = Deno.env.get('ACTIVE_STATE_NAME') || 'Kentucky'

// Sync configuration
const BATCH_SIZE = 500
const MAX_LISTINGS_PER_SYNC = 50000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface MLSListing {
  mls_number: string
  source: 'bridge' | 'zillow' | 'realtor' | 'trestle' | 'manual'
  address: string
  city: string
  state: string
  zip: string
  county?: string
  price: number
  beds?: number
  baths_total?: number
  baths_full?: number
  baths_half?: number
  living_area?: number
  lot_size_acres?: number
  lot_size_sqft?: number
  year_built?: number
  property_type: string
  property_subtype?: string
  status: string
  status_note?: string
  list_date?: string
  dom?: number
  agent_name?: string
  agent_phone?: string
  agent_email?: string
  co_listing_agent?: string
  office?: string
  office_phone?: string
  latitude?: number
  longitude?: number
  description?: string
  features?: string[]
  image_urls?: string[]
  virtual_tour_url?: string
  raw_data?: Record<string, any>
}

interface SyncResult {
  source: string
  success: boolean
  total_fetched: number
  inserted: number
  updated: number
  errors: number
  error_messages?: string[]
  duration_ms: number
}

// =============================================================================
// MLS DATA SOURCE ADAPTERS
// =============================================================================

// Bridge Interactive MLS API Adapter
async function fetchBridgeListings(state: string, offset = 0): Promise<{ listings: MLSListing[], total: number, hasMore: boolean }> {
  if (!BRIDGE_API_KEY) {
    console.log('Bridge API key not configured')
    return { listings: [], total: 0, hasMore: false }
  }

  try {
    // Bridge Interactive uses RESO Web API standard
    const response = await fetch(
      `${BRIDGE_API_URL}/OData/Property?$filter=StateOrProvince eq '${state}' and StandardStatus eq 'Active'&$top=${BATCH_SIZE}&$skip=${offset}&$orderby=ModificationTimestamp desc`,
      {
        headers: {
          'Authorization': `Bearer ${BRIDGE_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Bridge API error: ${response.status}`)
    }

    const data = await response.json()
    const listings: MLSListing[] = (data.value || []).map((item: any) => ({
      mls_number: item.ListingId || item.ListingKey,
      source: 'bridge' as const,
      address: item.UnparsedAddress || `${item.StreetNumber || ''} ${item.StreetName || ''} ${item.StreetSuffix || ''}`.trim(),
      city: item.City,
      state: item.StateOrProvince,
      zip: item.PostalCode,
      county: item.CountyOrParish,
      price: item.ListPrice,
      beds: item.BedroomsTotal,
      baths_total: item.BathroomsTotalInteger,
      baths_full: item.BathroomsFull,
      baths_half: item.BathroomsHalf,
      living_area: item.LivingArea,
      lot_size_acres: item.LotSizeAcres,
      lot_size_sqft: item.LotSizeSquareFeet,
      year_built: item.YearBuilt,
      property_type: mapPropertyType(item.PropertyType),
      property_subtype: item.PropertySubType,
      status: item.StandardStatus,
      status_note: item.MlsStatus,
      list_date: item.ListingContractDate,
      dom: item.DaysOnMarket,
      agent_name: item.ListAgentFullName,
      agent_phone: item.ListAgentDirectPhone,
      agent_email: item.ListAgentEmail,
      co_listing_agent: item.CoListAgentFullName,
      office: item.ListOfficeName,
      office_phone: item.ListOfficePhone,
      latitude: item.Latitude,
      longitude: item.Longitude,
      description: item.PublicRemarks,
      features: item.InteriorFeatures || [],
      image_urls: item.Media?.map((m: any) => m.MediaURL) || [],
      virtual_tour_url: item.VirtualTourURLUnbranded,
      raw_data: item
    }))

    return {
      listings,
      total: data['@odata.count'] || listings.length,
      hasMore: listings.length === BATCH_SIZE
    }

  } catch (error) {
    console.error('Bridge API fetch error:', error)
    return { listings: [], total: 0, hasMore: false }
  }
}

// Zillow API Adapter (via RapidAPI)
async function fetchZillowListings(state: string, offset = 0): Promise<{ listings: MLSListing[], total: number, hasMore: boolean }> {
  if (!ZILLOW_API_KEY) {
    console.log('Zillow API key not configured')
    return { listings: [], total: 0, hasMore: false }
  }

  try {
    // Zillow search by state
    const page = Math.floor(offset / 40) + 1 // Zillow uses 40 per page

    const response = await fetch(
      `${ZILLOW_API_URL}/propertyExtendedSearch?location=${state}&status_type=ForSale&page=${page}`,
      {
        headers: {
          'X-RapidAPI-Key': ZILLOW_API_KEY,
          'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Zillow API error: ${response.status}`)
    }

    const data = await response.json()
    const props = data.props || []

    const listings: MLSListing[] = props.map((item: any) => ({
      mls_number: `ZLW-${item.zpid}`,
      source: 'zillow' as const,
      address: item.address,
      city: item.city || '',
      state: item.state || state,
      zip: item.zipcode || '',
      county: item.county,
      price: item.price,
      beds: item.bedrooms,
      baths_total: item.bathrooms,
      living_area: item.livingArea,
      lot_size_sqft: item.lotAreaValue,
      year_built: item.yearBuilt,
      property_type: mapZillowPropertyType(item.propertyType),
      status: 'Active',
      dom: item.daysOnZillow,
      latitude: item.latitude,
      longitude: item.longitude,
      description: item.description,
      image_urls: item.imgSrc ? [item.imgSrc] : [],
      raw_data: item
    }))

    return {
      listings,
      total: data.totalResultCount || listings.length,
      hasMore: props.length === 40
    }

  } catch (error) {
    console.error('Zillow API fetch error:', error)
    return { listings: [], total: 0, hasMore: false }
  }
}

// Realtor.com API Adapter (via RapidAPI)
async function fetchRealtorListings(state: string, offset = 0): Promise<{ listings: MLSListing[], total: number, hasMore: boolean }> {
  if (!REALTOR_API_KEY) {
    console.log('Realtor API key not configured')
    return { listings: [], total: 0, hasMore: false }
  }

  try {
    const response = await fetch(
      `${REALTOR_API_URL}/properties/v3/list?state_code=${state}&status=for_sale&offset=${offset}&limit=${BATCH_SIZE}`,
      {
        headers: {
          'X-RapidAPI-Key': REALTOR_API_KEY,
          'X-RapidAPI-Host': 'realtor.p.rapidapi.com'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Realtor API error: ${response.status}`)
    }

    const data = await response.json()
    const props = data.data?.home_search?.results || []

    const listings: MLSListing[] = props.map((item: any) => ({
      mls_number: `RDC-${item.property_id}`,
      source: 'realtor' as const,
      address: item.location?.address?.line || '',
      city: item.location?.address?.city || '',
      state: item.location?.address?.state_code || state,
      zip: item.location?.address?.postal_code || '',
      county: item.location?.county?.name,
      price: item.list_price,
      beds: item.description?.beds,
      baths_total: item.description?.baths,
      baths_full: item.description?.baths_full,
      baths_half: item.description?.baths_half,
      living_area: item.description?.sqft,
      lot_size_sqft: item.description?.lot_sqft,
      year_built: item.description?.year_built,
      property_type: mapRealtorPropertyType(item.description?.type),
      status: 'Active',
      dom: item.list_date ? daysSince(item.list_date) : undefined,
      agent_name: item.advertisers?.[0]?.name,
      agent_phone: item.advertisers?.[0]?.phone,
      office: item.advertisers?.[0]?.office?.name,
      latitude: item.location?.address?.coordinate?.lat,
      longitude: item.location?.address?.coordinate?.lon,
      description: item.description?.text,
      image_urls: item.photos?.map((p: any) => p.href) || [],
      virtual_tour_url: item.virtual_tours?.[0]?.href,
      raw_data: item
    }))

    return {
      listings,
      total: data.data?.home_search?.total || listings.length,
      hasMore: props.length === BATCH_SIZE
    }

  } catch (error) {
    console.error('Realtor API fetch error:', error)
    return { listings: [], total: 0, hasMore: false }
  }
}

// Trestle/CoreLogic MLS API Adapter
async function fetchTrestleListings(state: string, offset = 0): Promise<{ listings: MLSListing[], total: number, hasMore: boolean }> {
  if (!TRESTLE_API_KEY) {
    console.log('Trestle API key not configured')
    return { listings: [], total: 0, hasMore: false }
  }

  try {
    const response = await fetch(
      `${TRESTLE_API_URL}/odata/Property?$filter=StateOrProvince eq '${state}' and MlsStatus eq 'Active'&$top=${BATCH_SIZE}&$skip=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${TRESTLE_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Trestle API error: ${response.status}`)
    }

    const data = await response.json()

    // Trestle uses same RESO format as Bridge
    const listings: MLSListing[] = (data.value || []).map((item: any) => ({
      mls_number: item.ListingId,
      source: 'trestle' as const,
      address: item.UnparsedAddress,
      city: item.City,
      state: item.StateOrProvince,
      zip: item.PostalCode,
      county: item.CountyOrParish,
      price: item.ListPrice,
      beds: item.BedroomsTotal,
      baths_total: item.BathroomsTotalInteger,
      living_area: item.LivingArea,
      lot_size_acres: item.LotSizeAcres,
      year_built: item.YearBuilt,
      property_type: mapPropertyType(item.PropertyType),
      status: item.StandardStatus,
      agent_name: item.ListAgentFullName,
      office: item.ListOfficeName,
      latitude: item.Latitude,
      longitude: item.Longitude,
      description: item.PublicRemarks,
      image_urls: item.Media?.map((m: any) => m.MediaURL) || [],
      raw_data: item
    }))

    return {
      listings,
      total: data['@odata.count'] || listings.length,
      hasMore: listings.length === BATCH_SIZE
    }

  } catch (error) {
    console.error('Trestle API fetch error:', error)
    return { listings: [], total: 0, hasMore: false }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapPropertyType(resoType: string): string {
  const mapping: Record<string, string> = {
    'Residential': 'SF',
    'ResidentialIncome': 'MF',
    'Land': 'UL',
    'Farm': 'FA',
    'Commercial': 'BU',
    'CommercialLease': 'BU',
    'BusinessOpportunity': 'BU'
  }
  return mapping[resoType] || resoType
}

function mapZillowPropertyType(zillowType: string): string {
  const mapping: Record<string, string> = {
    'SINGLE_FAMILY': 'SF',
    'MULTI_FAMILY': 'MF',
    'CONDO': 'CO',
    'TOWNHOUSE': 'TH',
    'LOT': 'UL',
    'LAND': 'UL',
    'MANUFACTURED': 'SF',
    'APARTMENT': 'MF'
  }
  return mapping[zillowType] || 'SF'
}

function mapRealtorPropertyType(realtorType: string): string {
  const mapping: Record<string, string> = {
    'single_family': 'SF',
    'multi_family': 'MF',
    'condos': 'CO',
    'townhomes': 'TH',
    'land': 'UL',
    'farms': 'FA',
    'mobile': 'SF'
  }
  return mapping[realtorType] || 'SF'
}

function daysSince(dateStr: string): number {
  const date = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

async function upsertListings(
  supabase: ReturnType<typeof createClient>,
  listings: MLSListing[]
): Promise<{ inserted: number, updated: number, errors: number }> {
  let inserted = 0
  let updated = 0
  let errors = 0

  // Process in smaller batches for reliability
  const chunkSize = 100
  for (let i = 0; i < listings.length; i += chunkSize) {
    const chunk = listings.slice(i, i + chunkSize)

    const { data, error } = await supabase
      .from('mls_listings')
      .upsert(
        chunk.map(listing => ({
          mls_number: listing.mls_number,
          source: listing.source,
          address: listing.address,
          city: listing.city,
          state: listing.state,
          zip: listing.zip,
          county: listing.county,
          price: listing.price,
          beds: listing.beds,
          baths_total: listing.baths_total,
          baths_full: listing.baths_full,
          baths_half: listing.baths_half,
          living_area: listing.living_area,
          lot_size_acres: listing.lot_size_acres,
          lot_size_sqft: listing.lot_size_sqft,
          year_built: listing.year_built,
          property_type: listing.property_type,
          property_subtype: listing.property_subtype,
          status: listing.status,
          status_note: listing.status_note,
          list_date: listing.list_date,
          dom: listing.dom,
          agent_name: listing.agent_name,
          agent_phone: listing.agent_phone,
          agent_email: listing.agent_email,
          co_listing_agent: listing.co_listing_agent,
          office: listing.office,
          office_phone: listing.office_phone,
          latitude: listing.latitude,
          longitude: listing.longitude,
          description: listing.description,
          features: listing.features,
          image_urls: listing.image_urls,
          virtual_tour_url: listing.virtual_tour_url,
          raw_data: listing.raw_data,
          updated_at: new Date().toISOString()
        })),
        {
          onConflict: 'mls_number,source',
          ignoreDuplicates: false
        }
      )

    if (error) {
      console.error('Upsert error:', error)
      errors += chunk.length
    } else {
      // Supabase doesn't distinguish insert vs update in upsert response
      // For metrics, we'll count all as "updated" since it's an upsert
      updated += chunk.length
    }
  }

  return { inserted, updated, errors }
}

async function markInactiveListings(
  supabase: ReturnType<typeof createClient>,
  state: string,
  source: string,
  activeMlsNumbers: string[]
): Promise<number> {
  if (activeMlsNumbers.length === 0) return 0

  // Mark listings not in the active list as inactive
  const { data, error } = await supabase
    .from('mls_listings')
    .update({ status: 'Inactive', updated_at: new Date().toISOString() })
    .eq('state', state)
    .eq('source', source)
    .eq('status', 'Active')
    .not('mls_number', 'in', `(${activeMlsNumbers.map(n => `'${n}'`).join(',')})`)
    .select('id')

  if (error) {
    console.error('Error marking inactive listings:', error)
    return 0
  }

  return data?.length || 0
}

async function logSyncRun(
  supabase: ReturnType<typeof createClient>,
  results: SyncResult[]
): Promise<void> {
  await supabase
    .from('mls_sync_logs')
    .insert({
      state: ACTIVE_STATE,
      results: results,
      total_listings: results.reduce((sum, r) => sum + r.total_fetched, 0),
      total_errors: results.reduce((sum, r) => sum + r.errors, 0),
      duration_ms: results.reduce((sum, r) => sum + r.duration_ms, 0),
      created_at: new Date().toISOString()
    })
}

// =============================================================================
// MAIN SYNC ORCHESTRATOR
// =============================================================================

async function runFullSync(supabase: ReturnType<typeof createClient>): Promise<SyncResult[]> {
  const results: SyncResult[] = []

  // Sync from each configured data source
  const sources = [
    { name: 'bridge', fetcher: fetchBridgeListings, enabled: !!BRIDGE_API_KEY },
    { name: 'zillow', fetcher: fetchZillowListings, enabled: !!ZILLOW_API_KEY },
    { name: 'realtor', fetcher: fetchRealtorListings, enabled: !!REALTOR_API_KEY },
    { name: 'trestle', fetcher: fetchTrestleListings, enabled: !!TRESTLE_API_KEY }
  ]

  for (const source of sources) {
    if (!source.enabled) {
      console.log(`Skipping ${source.name} - not configured`)
      continue
    }

    console.log(`Starting sync from ${source.name}...`)
    const startTime = Date.now()
    const allListings: MLSListing[] = []
    const errorMessages: string[] = []
    let offset = 0
    let hasMore = true

    // Paginate through all listings
    while (hasMore && allListings.length < MAX_LISTINGS_PER_SYNC) {
      try {
        const { listings, hasMore: more } = await source.fetcher(ACTIVE_STATE, offset)
        allListings.push(...listings)
        hasMore = more
        offset += BATCH_SIZE

        // Rate limiting - be nice to APIs
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        errorMessages.push(`Pagination error at offset ${offset}: ${error}`)
        hasMore = false
      }
    }

    // Upsert to database
    const { inserted, updated, errors } = await upsertListings(supabase, allListings)

    // Mark old listings as inactive
    const activeMlsNumbers = allListings.map(l => l.mls_number)
    const inactiveCount = await markInactiveListings(supabase, ACTIVE_STATE, source.name, activeMlsNumbers)

    results.push({
      source: source.name,
      success: errors === 0,
      total_fetched: allListings.length,
      inserted,
      updated,
      errors,
      error_messages: errorMessages.length > 0 ? errorMessages : undefined,
      duration_ms: Date.now() - startTime
    })

    console.log(`${source.name} sync complete: ${allListings.length} listings, ${inactiveCount} marked inactive`)
  }

  // Log the sync run
  await logSyncRun(supabase, results)

  return results
}

// =============================================================================
// HTTP HANDLER
// =============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Verify authorization (should be called by cron or admin only)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.includes(SUPABASE_SERVICE_KEY.slice(0, 20))) {
      // Allow cron webhook calls with special header
      const cronSecret = req.headers.get('X-Cron-Secret')
      if (cronSecret !== Deno.env.get('CRON_SECRET')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Parse request body for optional parameters
    let body: { state?: string, source?: string, forceRefresh?: boolean } = {}
    try {
      body = await req.json()
    } catch {
      // Empty body is fine for cron calls
    }

    // Override state if provided
    const targetState = body.state || ACTIVE_STATE

    console.log(`Starting MLS sync for ${targetState}...`)

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Run the sync
    const results = await runFullSync(supabase)

    const totalListings = results.reduce((sum, r) => sum + r.total_fetched, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)

    return new Response(
      JSON.stringify({
        success: totalErrors === 0,
        state: targetState,
        results,
        summary: {
          total_listings: totalListings,
          total_errors: totalErrors,
          sources_synced: results.filter(r => r.total_fetched > 0).length,
          duration_ms: Date.now() - startTime
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('MLS Sync error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Sync failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
