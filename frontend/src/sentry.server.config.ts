import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  // NOTE: includeLocalVariables intentionally omitted — it would
  // leak PII (request bodies, DB results) to Sentry error reports.
  environment: process.env.NODE_ENV,
})
