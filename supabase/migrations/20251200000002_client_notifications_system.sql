-- Client Notification & Lead Management System
-- For The House Team - Automated listing alerts, showing scheduler, admin dashboard
-- Version: 1.0.0

-- =============================================================================
-- CLIENT PROFILES & PREFERENCES
-- =============================================================================

-- Clients looking for properties (leads that signed up for alerts)
CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Contact Info
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20) NOT NULL, -- Required for SMS
  phone_verified BOOLEAN DEFAULT FALSE,

  -- Communication Preferences
  notify_sms BOOLEAN DEFAULT TRUE,
  notify_email BOOLEAN DEFAULT TRUE,
  notification_frequency VARCHAR(20) DEFAULT 'instant', -- instant, daily, weekly
  quiet_hours_start TIME DEFAULT '21:00', -- Don't send after 9pm
  quiet_hours_end TIME DEFAULT '08:00', -- Don't send before 8am

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, paused, closed, unsubscribed
  assigned_agent_id UUID REFERENCES agents(id),

  -- Source
  source VARCHAR(50) DEFAULT 'bot', -- bot, website, referral, manual
  session_id VARCHAR(100), -- Link to chat session if from bot

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_notified_at TIMESTAMPTZ,

  -- Ensure unique phone per active client
  CONSTRAINT unique_active_phone UNIQUE (phone, status)
);

CREATE INDEX IF NOT EXISTS idx_client_profiles_phone ON client_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_client_profiles_status ON client_profiles(status);
CREATE INDEX IF NOT EXISTS idx_client_profiles_agent ON client_profiles(assigned_agent_id);

-- Client search criteria (what they're looking for)
CREATE TABLE IF NOT EXISTS client_criteria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,

  -- Name for this search (clients can have multiple)
  name VARCHAR(100) DEFAULT 'Primary Search',
  is_active BOOLEAN DEFAULT TRUE,

  -- Location Criteria
  counties TEXT[], -- Array: ['Laurel', 'Knox', 'Clay']
  cities TEXT[], -- Array: ['London', 'Corbin']
  zip_codes TEXT[], -- Array: ['40741', '40701']

  -- Location Type
  location_type VARCHAR(20), -- city, suburbs, rural, any

  -- Price Range
  min_price DECIMAL(15, 2),
  max_price DECIMAL(15, 2),

  -- Property Details
  min_beds INTEGER,
  max_beds INTEGER,
  min_baths INTEGER,
  min_sqft INTEGER,
  max_sqft INTEGER,

  -- Land/Acreage (grouped for easier filtering)
  acreage_range VARCHAR(20), -- 0-1, 1-5, 5-10, 10-50, 50+, any
  min_acres DECIMAL(10, 4),
  max_acres DECIMAL(10, 4),

  -- Property Types (multiple allowed)
  property_types TEXT[], -- Array: ['SF', 'FA', 'UL', 'MF']

  -- Construction/Building
  include_new_construction BOOLEAN DEFAULT TRUE,
  min_year_built INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_criteria_client ON client_criteria(client_id);
CREATE INDEX IF NOT EXISTS idx_client_criteria_active ON client_criteria(is_active) WHERE is_active = TRUE;

-- =============================================================================
-- NOTIFICATION TRACKING
-- =============================================================================

-- Track which listings have been sent to which clients
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Who gets the notification
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  criteria_id UUID REFERENCES client_criteria(id) ON DELETE SET NULL,

  -- What listing
  listing_id UUID REFERENCES mls_listings(id) ON DELETE CASCADE,
  listing_mls_number VARCHAR(50), -- Backup if listing deleted
  listing_address VARCHAR(255),
  listing_price DECIMAL(15, 2),

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, sent, failed, skipped

  -- Admin Approval (for batch approval workflow)
  approved_by UUID REFERENCES agents(id),
  approved_at TIMESTAMPTZ,

  -- Delivery
  delivery_method VARCHAR(20), -- sms, email, both
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,

  -- Response Tracking
  client_responded BOOLEAN DEFAULT FALSE,
  client_interested BOOLEAN,
  response_at TIMESTAMPTZ,
  response_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_client ON notification_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_pending ON notification_queue(status, created_at) WHERE status = 'pending';

-- Daily notification batches (for admin approval dashboard)
CREATE TABLE IF NOT EXISTS notification_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Batch Info
  batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  state_code VARCHAR(2) DEFAULT 'KY',

  -- Stats
  total_clients INTEGER DEFAULT 0,
  total_new_listings INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, partially_approved, sent

  -- Admin Actions
  approved_by UUID REFERENCES agents(id),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_batch_per_day UNIQUE (batch_date, state_code)
);

CREATE INDEX IF NOT EXISTS idx_notification_batches_status ON notification_batches(status);
CREATE INDEX IF NOT EXISTS idx_notification_batches_date ON notification_batches(batch_date DESC);

-- =============================================================================
-- SHOWING SCHEDULER
-- =============================================================================

-- Agent availability/blocked times
CREATE TABLE IF NOT EXISTS agent_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Time Block
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Type
  type VARCHAR(20) NOT NULL, -- available, busy, showing, travel

  -- Location (for travel optimization)
  area VARCHAR(100), -- 'Laurel County', 'London', etc.
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_availability_agent_date ON agent_availability(agent_id, date);

-- Scheduled showings
CREATE TABLE IF NOT EXISTS scheduled_showings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Who
  client_id UUID NOT NULL REFERENCES client_profiles(id),
  agent_id UUID REFERENCES agents(id),

  -- What property
  listing_id UUID REFERENCES mls_listings(id),
  listing_address VARCHAR(255) NOT NULL,
  listing_city VARCHAR(100),

  -- When
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, completed, cancelled, no_show

  -- Confirmation
  client_confirmed BOOLEAN DEFAULT FALSE,
  client_confirmed_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,

  -- Outcome
  feedback TEXT,
  client_interested BOOLEAN,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_showings_client ON scheduled_showings(client_id);
CREATE INDEX IF NOT EXISTS idx_showings_agent_date ON scheduled_showings(agent_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_showings_status ON scheduled_showings(status);

-- =============================================================================
-- SMS/COMMUNICATION LOG
-- =============================================================================

-- Track all SMS messages (inbound and outbound)
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Direction
  direction VARCHAR(10) NOT NULL, -- inbound, outbound

  -- Parties
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  client_id UUID REFERENCES client_profiles(id),

  -- Content
  message_body TEXT NOT NULL,
  media_urls TEXT[],

  -- Twilio Info
  twilio_sid VARCHAR(50),
  twilio_status VARCHAR(20), -- queued, sent, delivered, failed, received

  -- Related Records
  notification_id UUID REFERENCES notification_queue(id),
  showing_id UUID REFERENCES scheduled_showings(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_client ON sms_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_sms_direction ON sms_messages(direction, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_twilio_sid ON sms_messages(twilio_sid);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to match new listings against client criteria
CREATE OR REPLACE FUNCTION match_listing_to_clients(listing_id UUID)
RETURNS TABLE (
  client_id UUID,
  criteria_id UUID,
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id AS client_id,
    cc.id AS criteria_id,
    -- Calculate match score based on how many criteria match
    (
      CASE WHEN l.county = ANY(cc.counties) THEN 20 ELSE 0 END +
      CASE WHEN l.city = ANY(cc.cities) THEN 20 ELSE 0 END +
      CASE WHEN l.price BETWEEN COALESCE(cc.min_price, 0) AND COALESCE(cc.max_price, 999999999) THEN 20 ELSE 0 END +
      CASE WHEN l.beds >= COALESCE(cc.min_beds, 0) THEN 10 ELSE 0 END +
      CASE WHEN l.property_type = ANY(cc.property_types) OR cc.property_types IS NULL THEN 10 ELSE 0 END +
      CASE WHEN l.lot_size_acres >= COALESCE(cc.min_acres, 0) AND l.lot_size_acres <= COALESCE(cc.max_acres, 99999) THEN 10 ELSE 0 END +
      CASE WHEN l.living_area >= COALESCE(cc.min_sqft, 0) THEN 10 ELSE 0 END
    )::INTEGER AS match_score
  FROM mls_listings l
  CROSS JOIN client_profiles cp
  JOIN client_criteria cc ON cc.client_id = cp.id AND cc.is_active = TRUE
  WHERE
    l.id = listing_id
    AND l.status = 'Active'
    AND cp.status = 'active'
    -- Must match at least county or city
    AND (
      l.county = ANY(cc.counties)
      OR l.city = ANY(cc.cities)
      OR (cc.counties IS NULL AND cc.cities IS NULL)
    )
    -- Must be within price range
    AND l.price BETWEEN COALESCE(cc.min_price, 0) AND COALESCE(cc.max_price, 999999999)
    -- Must meet minimum beds if specified
    AND (cc.min_beds IS NULL OR l.beds >= cc.min_beds)
  ORDER BY match_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending notifications for admin dashboard
CREATE OR REPLACE FUNCTION get_notification_summary()
RETURNS TABLE (
  client_name TEXT,
  client_phone VARCHAR(20),
  client_id UUID,
  criteria_name VARCHAR(100),
  new_listings_count BIGINT,
  listing_addresses TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (cp.first_name || ' ' || cp.last_name) AS client_name,
    cp.phone AS client_phone,
    cp.id AS client_id,
    cc.name AS criteria_name,
    COUNT(DISTINCT nq.listing_id) AS new_listings_count,
    ARRAY_AGG(DISTINCT nq.listing_address) AS listing_addresses
  FROM notification_queue nq
  JOIN client_profiles cp ON cp.id = nq.client_id
  LEFT JOIN client_criteria cc ON cc.id = nq.criteria_id
  WHERE nq.status = 'pending'
  GROUP BY cp.id, cp.first_name, cp.last_name, cp.phone, cc.name
  ORDER BY new_listings_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger to queue notifications when new listings are added
CREATE OR REPLACE FUNCTION queue_listing_notifications()
RETURNS TRIGGER AS $$
DECLARE
  match_record RECORD;
BEGIN
  -- Only for new active listings
  IF NEW.status = 'Active' AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'Active')) THEN
    -- Find matching clients and queue notifications
    FOR match_record IN SELECT * FROM match_listing_to_clients(NEW.id) WHERE match_score >= 30 LOOP
      -- Check if we already queued this listing for this client
      IF NOT EXISTS (
        SELECT 1 FROM notification_queue
        WHERE client_id = match_record.client_id
        AND listing_id = NEW.id
      ) THEN
        INSERT INTO notification_queue (
          client_id,
          criteria_id,
          listing_id,
          listing_mls_number,
          listing_address,
          listing_price,
          status,
          delivery_method
        ) VALUES (
          match_record.client_id,
          match_record.criteria_id,
          NEW.id,
          NEW.mls_number,
          NEW.address || ', ' || NEW.city,
          NEW.price,
          'pending',
          'sms'
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to mls_listings
DROP TRIGGER IF EXISTS trigger_queue_notifications ON mls_listings;
CREATE TRIGGER trigger_queue_notifications
  AFTER INSERT OR UPDATE ON mls_listings
  FOR EACH ROW EXECUTE FUNCTION queue_listing_notifications();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_showings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to clients" ON client_profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to criteria" ON client_criteria
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to notifications" ON notification_queue
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to showings" ON scheduled_showings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to sms" ON sms_messages
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- SAMPLE DATA: Test Client
-- =============================================================================

-- Insert a test client (Tabitha for testing)
INSERT INTO client_profiles (first_name, last_name, phone, email, status, notes)
VALUES ('Test', 'Client', '606-224-3261', 'thouse@century21advantage.com', 'active', 'Test client for notification system')
ON CONFLICT DO NOTHING;

-- Insert criteria for test client
INSERT INTO client_criteria (client_id, name, counties, min_price, max_price, min_beds, property_types, acreage_range)
SELECT
  id,
  'Laurel County Homes',
  ARRAY['Laurel'],
  100000,
  400000,
  3,
  ARRAY['SF', 'FA'],
  '1-5'
FROM client_profiles WHERE phone = '606-224-3261'
ON CONFLICT DO NOTHING;
