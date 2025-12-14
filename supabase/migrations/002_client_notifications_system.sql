-- Client Notification System Schema
-- Migration: 002_client_notifications_system.sql

-- Client Profiles Table
CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Search Criteria Table
CREATE TABLE IF NOT EXISTS client_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
  counties TEXT[] DEFAULT '{}',
  location_type VARCHAR(50),
  min_price DECIMAL(12,2) DEFAULT 0,
  max_price DECIMAL(12,2) DEFAULT 10000000,
  min_bedrooms INTEGER DEFAULT 1,
  property_types TEXT[] DEFAULT '{}',
  acreage_preference VARCHAR(50) DEFAULT 'any',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Queue Table
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
  listing_id VARCHAR(50),
  notification_type VARCHAR(50) DEFAULT 'new_listing',
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Batches Table
CREATE TABLE IF NOT EXISTS notification_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_date DATE DEFAULT CURRENT_DATE,
  total_notifications INTEGER DEFAULT 0,
  sent_notifications INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Scheduled Showings Table
CREATE TABLE IF NOT EXISTS scheduled_showings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
  listing_address VARCHAR(255) NOT NULL,
  area VARCHAR(50),
  scheduled_date DATE NOT NULL,
  scheduled_time VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Messages Audit Log
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES client_profiles(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL,
  message_body TEXT NOT NULL,
  direction VARCHAR(10) DEFAULT 'outbound',
  status VARCHAR(20) DEFAULT 'sent',
  twilio_sid VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_client_profiles_email ON client_profiles(email);
CREATE INDEX IF NOT EXISTS idx_client_profiles_status ON client_profiles(status);
CREATE INDEX IF NOT EXISTS idx_client_criteria_client_id ON client_criteria(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_client_id ON notification_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_showings_client_id ON scheduled_showings(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_showings_date ON scheduled_showings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sms_messages_client_id ON sms_messages(client_id);

-- Enable Row Level Security
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_showings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anonymous access (for the public signup form)
CREATE POLICY "Allow anonymous insert on client_profiles" ON client_profiles
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous insert on client_criteria" ON client_criteria
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select on client_profiles" ON client_profiles
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous select on client_criteria" ON client_criteria
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous select on notification_queue" ON notification_queue
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous select on notification_batches" ON notification_batches
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous all on scheduled_showings" ON scheduled_showings
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous select on sms_messages" ON sms_messages
  FOR SELECT TO anon USING (true);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
DROP TRIGGER IF EXISTS update_client_profiles_updated_at ON client_profiles;
CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON client_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_criteria_updated_at ON client_criteria;
CREATE TRIGGER update_client_criteria_updated_at
  BEFORE UPDATE ON client_criteria
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_showings_updated_at ON scheduled_showings;
CREATE TRIGGER update_scheduled_showings_updated_at
  BEFORE UPDATE ON scheduled_showings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
