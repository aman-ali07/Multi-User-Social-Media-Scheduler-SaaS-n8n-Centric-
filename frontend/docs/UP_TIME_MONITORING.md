# Uptime Monitoring Recommendations

## Why Monitor
- Detect downtime before users notice
- Catch n8n workflow failures
- Monitor Meta API rate limits
- Track Supabase connectivity

## Recommended Services

### 1. Better Uptime (betteruptime.com) — Free tier
- Monitor: `https://multi-user-social-media-scheduler-s.vercel.app`
- Check interval: 1 minute
- Alert via: Email, Slack, SMS (paid)
- What to watch: HTTP 200 response, page content contains expected text

### 2. Sentry (sentry.io) — Free tier
- Already integrated via `@sentry/nextjs`
- Captures: Client-side errors, server errors, performance traces
- Set up alerts for error spikes

### 3. n8n Workflow Monitoring
- Each publishing workflow has built-in error handling (Failure Handler workflow)
- Check n8n execution logs for failed runs
- Suggested: Create a nightly "health check" workflow that:
  1. Queries `supabase_posts` for stuck "publishing" posts (>30 min)
  2. Alerts you via email/Slack

### 4. Custom Status Page (optional)
Use `openstatus.dev` or `instatus.com` for a public status page.

## Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Page load time | >3s | >5s |
| Error rate (Sentry) | >1% | >5% |
| n8n failure rate | >2/week | >5/day |
| Meta API errors | >10/day | >50/day |

## Checklist
- [ ] Set up Better Uptime (or similar) on Vercel URL
- [ ] Configure Sentry alert rules for error spikes
- [ ] Add Slack/email notification for n8n execution failures
- [ ] Create n8n health check workflow
- [ ] Document incident response steps
