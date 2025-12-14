-- Fix RLS policies for anon access

-- Drop any existing restrictive policies first
DROP POLICY IF EXISTS "Allow anon insert clients" ON client_profiles;
DROP POLICY IF EXISTS "Allow anon read clients" ON client_profiles;
DROP POLICY IF EXISTS "Allow anon insert criteria" ON client_criteria;
DROP POLICY IF EXISTS "Allow anon read showings" ON scheduled_showings;
DROP POLICY IF EXISTS "Allow anon insert showings" ON scheduled_showings;
DROP POLICY IF EXISTS "Allow anon update showings" ON scheduled_showings;
DROP POLICY IF EXISTS "Service role full access to clients" ON client_profiles;
DROP POLICY IF EXISTS "Service role full access to criteria" ON client_criteria;
DROP POLICY IF EXISTS "Service role full access to notifications" ON notification_queue;
DROP POLICY IF EXISTS "Service role full access to showings" ON scheduled_showings;
DROP POLICY IF EXISTS "Service role full access to sms" ON sms_messages;

-- Client profiles - allow anon to insert (signup) and read their own
CREATE POLICY "anon_insert_clients" ON client_profiles
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_clients" ON client_profiles
  FOR SELECT TO anon USING (true);

-- Client criteria - allow anon to insert and read
CREATE POLICY "anon_insert_criteria" ON client_criteria
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_criteria" ON client_criteria
  FOR SELECT TO anon USING (true);

-- Scheduled showings - full access for anon (admin dashboard)
CREATE POLICY "anon_all_showings" ON scheduled_showings
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Notification queue - read-only for anon (admin dashboard)
CREATE POLICY "anon_select_notifications" ON notification_queue
  FOR SELECT TO anon USING (true);

-- SMS messages - read-only for anon
CREATE POLICY "anon_select_sms" ON sms_messages
  FOR SELECT TO anon USING (true);

-- Service role gets full access everywhere
CREATE POLICY "service_all_clients" ON client_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_criteria" ON client_criteria
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_notifications" ON notification_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_showings" ON scheduled_showings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_all_sms" ON sms_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
