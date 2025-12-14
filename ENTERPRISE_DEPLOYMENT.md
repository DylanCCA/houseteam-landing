# Enterprise Real Estate AI - 48-State White-Label Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENTERPRISE MLS AI PLATFORM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Kentucky   │  │   Texas     │  │  Florida    │  │  48 States  │        │
│  │  Instance   │  │  Instance   │  │  Instance   │  │    ...      │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
│         └────────────────┴────────────────┴────────────────┘               │
│                                    │                                        │
│                          ┌─────────▼─────────┐                             │
│                          │   Supabase Edge   │                             │
│                          │    Functions      │                             │
│                          └─────────┬─────────┘                             │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐            │
│         │                          │                          │            │
│  ┌──────▼──────┐           ┌───────▼───────┐          ┌───────▼───────┐   │
│  │ CCA o1 LLM  │           │  MLS Data     │          │  Google/Serp  │   │
│  │ (Primary)   │           │  Sync Engine  │          │  Web Search   │   │
│  └──────┬──────┘           └───────┬───────┘          └───────────────┘   │
│         │                          │                                        │
│         │                 ┌────────┴────────┐                              │
│  ┌──────▼──────┐         │                  │                              │
│  │   OpenAI    │  ┌──────▼──────┐   ┌───────▼───────┐                     │
│  │  (Fallback) │  │   Bridge    │   │    Zillow     │                     │
│  └─────────────┘  │ Interactive │   │  (RapidAPI)   │                     │
│                   │    MLS      │   └───────────────┘                     │
│                   └─────────────┘                                          │
│                                                                             │
│                          ┌─────────────────┐                               │
│                          │    Supabase     │                               │
│                          │    PostgreSQL   │                               │
│                          │                 │                               │
│                          │ • mls_listings  │                               │
│                          │ • whitelabel    │                               │
│                          │ • agents        │                               │
│                          │ • leads         │                               │
│                          │ • analytics     │                               │
│                          └─────────────────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Sources

### Primary: Bridge Interactive MLS
- **Coverage**: 200+ MLS boards nationwide
- **API**: RESO Web API Standard (OData)
- **URL**: https://www.bridgeinteractive.com/
- **Pricing**: Enterprise pricing based on MLS coverage
- **Data**: Full listing details, photos, history

### Secondary: Zillow (via RapidAPI)
- **Coverage**: National
- **API**: REST via RapidAPI
- **URL**: https://rapidapi.com/apimaker/api/zillow-com1
- **Pricing**: ~$50/month for 500 requests/month
- **Data**: Public listings, Zestimates, market trends

### Tertiary: Realtor.com (via RapidAPI)
- **Coverage**: National
- **API**: REST via RapidAPI
- **URL**: https://rapidapi.com/apidojo/api/realtor
- **Pricing**: ~$75/month for 1000 requests/month
- **Data**: Detailed listings, agent info

### Alternative: Trestle/CoreLogic
- **Coverage**: Premium MLS access
- **API**: RESO OData
- **URL**: https://www.corelogic.com/solutions/trestle/
- **Pricing**: Enterprise agreements

## Environment Variables

```bash
# =============================================================================
# CORE CONFIGURATION
# =============================================================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# =============================================================================
# LLM CONFIGURATION
# =============================================================================
# Primary: CCA o1 (OpenAI)
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=o1

# Fallback: H200 Self-Hosted (Optional)
H200_LLM_URL=https://your-h200-instance.brevlab.com/v1/chat/completions
H200_MODEL=gpt-oss-120b
FALLBACK_TO_OPENAI=false  # Set true to disable H200

# =============================================================================
# WEB SEARCH (Google-Quality)
# =============================================================================
# SerpAPI - Google Search API (Recommended)
SERP_API_KEY=your-serpapi-key
# Get at: https://serpapi.com/ (~$50/month for 5000 searches)

# Fallback: H200 Browser Automation
H200_BROWSER_URL=https://your-browser-instance.brevlab.com
H200_BROWSER_API_KEY=your-browser-api-key

# =============================================================================
# MLS DATA SOURCES
# =============================================================================
# Bridge Interactive (Primary - Enterprise MLS Access)
BRIDGE_API_KEY=your-bridge-api-key
# Contact: https://www.bridgeinteractive.com/contact/

# Zillow via RapidAPI
ZILLOW_API_KEY=your-rapidapi-key
# Subscribe: https://rapidapi.com/apimaker/api/zillow-com1

# Realtor.com via RapidAPI
REALTOR_API_KEY=your-rapidapi-key
# Subscribe: https://rapidapi.com/apidojo/api/realtor

# Trestle/CoreLogic (Alternative)
TRESTLE_API_KEY=your-trestle-key
# Contact: https://www.corelogic.com/

# =============================================================================
# WHITE-LABEL CONFIGURATION
# =============================================================================
ACTIVE_STATE=KY
ACTIVE_STATE_NAME=Kentucky

# =============================================================================
# EMAIL (Lead Notifications)
# =============================================================================
RESEND_API_KEY=your-resend-key
# Get at: https://resend.com/

# =============================================================================
# CRON/SCHEDULING
# =============================================================================
CRON_SECRET=your-secure-cron-secret
```

## Deployment Steps

### 1. Database Setup

Run the migration to create the enterprise schema:

```bash
# Via Supabase CLI
supabase db push

# Or via Supabase Dashboard -> SQL Editor
# Copy and run: supabase/migrations/001_enterprise_mls_schema.sql
```

### 2. Deploy Edge Functions

```bash
# Deploy bot function
supabase functions deploy ky-realestate-bot

# Deploy MLS sync function
supabase functions deploy mls-data-sync
```

### 3. Configure Secrets

```bash
# Set all secrets via Supabase CLI
supabase secrets set OPENAI_API_KEY=sk-xxx
supabase secrets set SERP_API_KEY=xxx
supabase secrets set BRIDGE_API_KEY=xxx
supabase secrets set ZILLOW_API_KEY=xxx
supabase secrets set REALTOR_API_KEY=xxx
supabase secrets set RESEND_API_KEY=xxx
supabase secrets set CRON_SECRET=xxx
```

### 4. Enable Cron Jobs

In Supabase Dashboard -> Database -> Extensions:
1. Enable `pg_cron` extension
2. Enable `pg_net` extension (for HTTP calls)

Then run in SQL Editor:

```sql
-- Morning sync at 7 AM EST (12:00 UTC)
SELECT cron.schedule(
  'mls-sync-morning',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/mls-data-sync',
    headers := '{"Content-Type": "application/json", "X-Cron-Secret": "YOUR_CRON_SECRET"}'::jsonb,
    body := '{"state": "KY"}'::jsonb
  );
  $$
);

-- Afternoon sync at 3 PM EST (20:00 UTC)
SELECT cron.schedule(
  'mls-sync-afternoon',
  '0 20 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/mls-data-sync',
    headers := '{"Content-Type": "application/json", "X-Cron-Secret": "YOUR_CRON_SECRET"}'::jsonb,
    body := '{"state": "KY"}'::jsonb
  );
  $$
);
```

### 5. Manual Sync Test

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/mls-data-sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{"state": "KY"}'
```

## White-Label Deployment (New State)

### 1. Add State Configuration

```sql
INSERT INTO whitelabel_configs (
  state_code,
  state_name,
  company_name,
  contact_phone,
  contact_email,
  office_address
) VALUES (
  'TX',
  'Texas',
  'Your Texas Realty Partner',
  '(555) 123-4567',
  'contact@texasrealty.com',
  '123 Main St, Austin, TX 78701'
);
```

### 2. Deploy State-Specific Instance

Option A: Subdomain routing (recommended)
```
ky.yourplatform.com -> ACTIVE_STATE=KY
tx.yourplatform.com -> ACTIVE_STATE=TX
```

Option B: Path-based routing
```
yourplatform.com/ky/bot -> ACTIVE_STATE=KY
yourplatform.com/tx/bot -> ACTIVE_STATE=TX
```

### 3. Configure State-Specific MLS Access

Some MLS boards require individual access agreements. Contact:
- KSRAR (Kentucky): https://www.ksrar.com/
- HAR (Texas - Houston): https://www.har.com/
- CRMLS (California): https://www.crmls.org/

## Monitoring & Analytics

### View Sync Logs

```sql
SELECT * FROM mls_sync_logs
WHERE state = 'KY'
ORDER BY created_at DESC
LIMIT 10;
```

### Daily Metrics Dashboard

```sql
SELECT
  date,
  total_sessions,
  total_messages,
  leads_generated,
  active_listings
FROM daily_metrics
WHERE whitelabel_state = 'KY'
ORDER BY date DESC
LIMIT 30;
```

### Listing Coverage

```sql
SELECT
  state,
  source,
  COUNT(*) as total_listings,
  COUNT(*) FILTER (WHERE status = 'Active') as active_listings,
  MAX(updated_at) as last_updated
FROM mls_listings
GROUP BY state, source
ORDER BY state, source;
```

## Cost Estimates (Per State)

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Supabase Pro | $25 | Database, Edge Functions |
| OpenAI o1 | $50-200 | ~10K requests/month |
| SerpAPI | $50 | 5000 Google searches |
| Bridge MLS | $200-500 | Varies by coverage |
| Zillow API | $50 | 500 requests |
| Realtor API | $75 | 1000 requests |
| Resend Email | $20 | 10K emails |
| **Total** | **$470-920** | Per state/month |

## Security Considerations

1. **API Keys**: All stored in Supabase Secrets (encrypted)
2. **RLS**: Row-level security enabled on all tables
3. **CORS**: Configured for specific domains only
4. **Rate Limiting**: Implement at Edge Function level
5. **Audit Logs**: All sync operations logged

## Support

- Technical Issues: Create issue in this repository
- MLS Access: Contact Bridge Interactive or state MLS board
- Billing: Supabase Dashboard -> Settings -> Billing
