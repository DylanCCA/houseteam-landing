-- Enterprise MLS Schema for 48-State White-Label Real Estate AI
-- Version: 1.0.0
-- Supports: Bridge Interactive, Zillow, Realtor.com, Trestle/CoreLogic

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Main MLS Listings Table (Partitioned by State for Scale)
CREATE TABLE IF NOT EXISTS mls_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identifiers
  mls_number VARCHAR(50) NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'manual', -- bridge, zillow, realtor, trestle, manual

  -- Location
  address VARCHAR(255) NOT NULL,
  unit_number VARCHAR(20),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip VARCHAR(10),
  county VARCHAR(100),
  neighborhood VARCHAR(100),
  subdivision VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Pricing
  price DECIMAL(15, 2) NOT NULL,
  original_price DECIMAL(15, 2),
  price_per_sqft DECIMAL(10, 2),
  hoa_fee DECIMAL(10, 2),
  tax_amount DECIMAL(10, 2),
  tax_year INTEGER,

  -- Property Details
  beds INTEGER,
  baths_total DECIMAL(4, 2),
  baths_full INTEGER,
  baths_half INTEGER,
  living_area INTEGER, -- sqft
  lot_size_acres DECIMAL(10, 4),
  lot_size_sqft INTEGER,
  year_built INTEGER,
  stories INTEGER,
  garage_spaces INTEGER,
  parking_spaces INTEGER,

  -- Property Classification
  property_type VARCHAR(10) NOT NULL, -- SF, MF, CO, TH, UL, FA, BU, OF, RE, IN
  property_subtype VARCHAR(50),
  style VARCHAR(50), -- Ranch, Colonial, Contemporary, etc.
  construction_type VARCHAR(50),
  roof_type VARCHAR(50),
  foundation_type VARCHAR(50),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'Active', -- Active, Pending, Sold, Expired, Withdrawn, Inactive
  status_note VARCHAR(100),
  list_date DATE,
  pending_date DATE,
  sold_date DATE,
  sold_price DECIMAL(15, 2),
  dom INTEGER, -- Days on Market
  cdom INTEGER, -- Cumulative Days on Market

  -- Agent/Office Info
  agent_name VARCHAR(100),
  agent_phone VARCHAR(20),
  agent_email VARCHAR(100),
  agent_license VARCHAR(50),
  co_listing_agent VARCHAR(100),
  co_listing_agent_phone VARCHAR(20),
  office VARCHAR(150),
  office_phone VARCHAR(20),
  office_address VARCHAR(255),

  -- Buyer Agent (for sold)
  buyer_agent_name VARCHAR(100),
  buyer_office VARCHAR(150),

  -- Description & Features
  description TEXT,
  features TEXT[], -- Array of feature strings
  appliances TEXT[],
  interior_features TEXT[],
  exterior_features TEXT[],
  community_features TEXT[],
  utilities TEXT[],

  -- Media
  image_urls TEXT[],
  primary_image_url VARCHAR(500),
  virtual_tour_url VARCHAR(500),
  video_url VARCHAR(500),
  floor_plan_url VARCHAR(500),

  -- Additional Data
  school_district VARCHAR(100),
  elementary_school VARCHAR(100),
  middle_school VARCHAR(100),
  high_school VARCHAR(100),
  zoning VARCHAR(50),
  legal_description TEXT,
  parcel_number VARCHAR(50),

  -- Raw data from source (for debugging/reprocessing)
  raw_data JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per source
  CONSTRAINT unique_listing_per_source UNIQUE (mls_number, source)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mls_state ON mls_listings(state);
CREATE INDEX IF NOT EXISTS idx_mls_city ON mls_listings(city);
CREATE INDEX IF NOT EXISTS idx_mls_county ON mls_listings(county);
CREATE INDEX IF NOT EXISTS idx_mls_status ON mls_listings(status);
CREATE INDEX IF NOT EXISTS idx_mls_price ON mls_listings(price);
CREATE INDEX IF NOT EXISTS idx_mls_beds ON mls_listings(beds);
CREATE INDEX IF NOT EXISTS idx_mls_property_type ON mls_listings(property_type);
CREATE INDEX IF NOT EXISTS idx_mls_source ON mls_listings(source);
CREATE INDEX IF NOT EXISTS idx_mls_updated ON mls_listings(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mls_location ON mls_listings USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_mls_fts ON mls_listings USING GIN (
  to_tsvector('english',
    COALESCE(address, '') || ' ' ||
    COALESCE(city, '') || ' ' ||
    COALESCE(county, '') || ' ' ||
    COALESCE(description, '')
  )
);

-- =============================================================================
-- SYNC TRACKING
-- =============================================================================

-- Track sync runs for monitoring and debugging
CREATE TABLE IF NOT EXISTS mls_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state VARCHAR(2) NOT NULL,
  results JSONB NOT NULL, -- Array of SyncResult objects
  total_listings INTEGER NOT NULL DEFAULT 0,
  total_errors INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_state ON mls_sync_logs(state);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON mls_sync_logs(created_at DESC);

-- =============================================================================
-- WHITE-LABEL CONFIGURATION
-- =============================================================================

-- Store configuration for each white-label deployment
CREATE TABLE IF NOT EXISTS whitelabel_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- State/Region
  state_code VARCHAR(2) NOT NULL UNIQUE,
  state_name VARCHAR(50) NOT NULL,

  -- Branding
  company_name VARCHAR(100) NOT NULL,
  company_logo_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
  secondary_color VARCHAR(7) DEFAULT '#F59E0B',

  -- Contact
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  office_address TEXT,

  -- API Keys (encrypted in production)
  bridge_api_key TEXT,
  zillow_api_key TEXT,
  realtor_api_key TEXT,
  trestle_api_key TEXT,
  serp_api_key TEXT,
  openai_api_key TEXT,

  -- Feature Flags
  features JSONB DEFAULT '{"web_search": true, "email_notifications": true, "chat_history": true}'::jsonb,

  -- Sync Schedule
  sync_enabled BOOLEAN DEFAULT TRUE,
  sync_schedule VARCHAR(50) DEFAULT '0 7,15 * * *', -- Cron expression: 7 AM and 3 PM

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- AGENT/BROKERAGE MANAGEMENT
-- =============================================================================

-- Track agents for lead routing
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identity
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  license_number VARCHAR(50),
  license_state VARCHAR(2),

  -- Affiliation
  brokerage_id UUID,
  office_id UUID,

  -- Profile
  photo_url VARCHAR(500),
  bio TEXT,
  specialties TEXT[],
  service_areas TEXT[], -- Array of city/county names
  languages TEXT[],

  -- Performance
  total_sales INTEGER DEFAULT 0,
  sales_volume DECIMAL(15, 2) DEFAULT 0,
  avg_sale_price DECIMAL(15, 2),
  avg_days_on_market INTEGER,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- White-label association
  whitelabel_state VARCHAR(2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_state ON agents(whitelabel_state);
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);
CREATE INDEX IF NOT EXISTS idx_agents_service_areas ON agents USING GIN(service_areas);

-- =============================================================================
-- LEAD/INQUIRY TRACKING
-- =============================================================================

-- Track all leads generated through the bot
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Lead Info
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),

  -- Source
  session_id UUID,
  source VARCHAR(50) DEFAULT 'bot', -- bot, web, phone, referral

  -- Interest
  property_id UUID REFERENCES mls_listings(id),
  property_address VARCHAR(255),
  inquiry_type VARCHAR(50), -- showing_request, price_inquiry, general
  message TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'new', -- new, contacted, qualified, converted, lost
  assigned_agent_id UUID REFERENCES agents(id),

  -- Follow-up
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  notes TEXT,

  -- White-label
  whitelabel_state VARCHAR(2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_agent ON leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_state ON leads(whitelabel_state);

-- =============================================================================
-- CHAT SESSIONS & HISTORY
-- =============================================================================

-- Track chat sessions for analytics
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Session Info
  session_id VARCHAR(100) NOT NULL UNIQUE,
  user_ip VARCHAR(45),
  user_agent TEXT,

  -- Engagement
  messages_count INTEGER DEFAULT 0,
  searches_count INTEGER DEFAULT 0,
  properties_viewed INTEGER DEFAULT 0,

  -- Conversion
  lead_id UUID REFERENCES leads(id),
  converted BOOLEAN DEFAULT FALSE,

  -- White-label
  whitelabel_state VARCHAR(2),

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_state ON chat_sessions(whitelabel_state);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_started ON chat_sessions(started_at DESC);

-- Store chat messages for context and training
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  session_id VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,

  -- Metadata
  model_used VARCHAR(50),
  tokens_used INTEGER,
  latency_ms INTEGER,

  -- Actions taken
  properties_returned INTEGER DEFAULT 0,
  web_search_performed BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- =============================================================================
-- ANALYTICS
-- =============================================================================

-- Daily metrics aggregation
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  date DATE NOT NULL,
  whitelabel_state VARCHAR(2) NOT NULL,

  -- Volume
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_searches INTEGER DEFAULT 0,

  -- Engagement
  avg_session_duration_sec INTEGER,
  avg_messages_per_session DECIMAL(5, 2),

  -- Conversion
  leads_generated INTEGER DEFAULT 0,
  showing_requests INTEGER DEFAULT 0,

  -- Performance
  avg_response_time_ms INTEGER,
  error_count INTEGER DEFAULT 0,

  -- Listings
  active_listings INTEGER DEFAULT 0,
  new_listings INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_daily_metrics UNIQUE (date, whitelabel_state)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_state ON daily_metrics(whitelabel_state);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_mls_listings_updated_at
  BEFORE UPDATE ON mls_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_whitelabel_configs_updated_at
  BEFORE UPDATE ON whitelabel_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate price per sqft on insert/update
CREATE OR REPLACE FUNCTION calculate_price_per_sqft()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.living_area IS NOT NULL AND NEW.living_area > 0 THEN
    NEW.price_per_sqft = NEW.price / NEW.living_area;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calc_price_per_sqft
  BEFORE INSERT OR UPDATE ON mls_listings
  FOR EACH ROW EXECUTE FUNCTION calculate_price_per_sqft();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE mls_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Public read access to listings
CREATE POLICY "Public can read active listings" ON mls_listings
  FOR SELECT USING (status = 'Active');

-- Service role has full access
CREATE POLICY "Service role has full access to listings" ON mls_listings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to sessions" ON chat_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to messages" ON chat_messages
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to leads" ON leads
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- SEED DATA: Kentucky White-Label Config
-- =============================================================================

INSERT INTO whitelabel_configs (
  state_code,
  state_name,
  company_name,
  contact_phone,
  contact_email,
  office_address,
  primary_color,
  secondary_color
) VALUES (
  'KY',
  'Kentucky',
  'The House Team - Century 21 Advantage Realty',
  '(606) 224-3261',
  'thouse@century21advantage.com',
  '911 N Main St, London, KY 40741',
  '#1E40AF',
  '#F59E0B'
) ON CONFLICT (state_code) DO NOTHING;

-- =============================================================================
-- CRON JOBS (pg_cron extension required)
-- =============================================================================

-- Note: These must be run by a superuser after enabling pg_cron extension

-- Schedule MLS sync at 7 AM and 3 PM EST (12:00 and 20:00 UTC)
-- SELECT cron.schedule('mls-sync-morning', '0 12 * * *', $$
--   SELECT net.http_post(
--     url := 'https://blfieqovcvzgiucuymen.supabase.co/functions/v1/mls-data-sync',
--     headers := '{"Content-Type": "application/json", "X-Cron-Secret": "your-cron-secret"}'::jsonb,
--     body := '{"state": "KY"}'::jsonb
--   );
-- $$);

-- SELECT cron.schedule('mls-sync-afternoon', '0 20 * * *', $$
--   SELECT net.http_post(
--     url := 'https://blfieqovcvzgiucuymen.supabase.co/functions/v1/mls-data-sync',
--     headers := '{"Content-Type": "application/json", "X-Cron-Secret": "your-cron-secret"}'::jsonb,
--     body := '{"state": "KY"}'::jsonb
--   );
-- $$);
