const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'OAuth Connect Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'oauth-connect',
      authentication: 'none',
      responseMode: 'responseNode',
      options: {
        responseCode: {
          values: { responseCode: 200 }
        }
      }
    }
  },
  output: [{
    body: {
      userId: 'uuid',
      platform: 'facebook'
    }
  }]
});

const generateState = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Generate OAuth State',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const crypto = require('crypto');\nconst { userId, platform } = $json.body;\nconst state = crypto.randomBytes(32).toString('hex');\nconst codeVerifier = crypto.randomBytes(32).toString('hex');\nconst expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();\n\nreturn [{\n  json: {\n    userId,\n    platform,\n    state,\n    codeVerifier,\n    expiresAt\n  }\n}];"
    }
  },
  output: [{
    userId: 'uuid',
    platform: 'facebook',
    state: 'abc123...',
    codeVerifier: 'def456...',
    expiresAt: '2026-05-27T...'
  }]
});

const storeState = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Store OAuth State',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO oauth_state (user_id, platform, state, code_verifier, expires_at) VALUES ($1::uuid, $2::platform_enum, $3, $4, $5::timestamptz) RETURNING id",
      options: {
        queryReplacement: expr('{{ $json.userId }}, {{ $json.platform }}, {{ $json.state }}, {{ $json.codeVerifier }}, {{ $json.expiresAt }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ id: 'uuid' }]
});

const buildRedirectUrl = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Redirect URL',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const { state, userId } = $json;\nconst appId = $env.FACEBOOK_APP_ID;\nconst redirectUri = `${$env.N8N_WEBHOOK_URL}/webhook/oauth-callback`;\nconst scope = 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish';\nconst url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}&response_type=code`;\n\nreturn [{ json: { url, userId } }];"
    }
  },
  output: [{
    url: 'https://www.facebook.com/...',
    userId: 'uuid'
  }]
});

const respond = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond',
    parameters: {
      respondWith: 'json',
      responseBody: {
        url: expr('{{ $json.url }}')
      }
    }
  },
  output: [{}]
});

export default workflow('oauth-connect', 'OAuth Connect')
  .add(webhookTrigger)
  .to(generateState)
  .to(storeState)
  .to(buildRedirectUrl)
  .to(respond);
