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

const verifyAuth = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Verify Auth',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const h = $json.headers || {};\nconst auth = h.authorization || h.Authorization || '';\nif (!auth.startsWith('Bearer ')) throw new Error('Unauthorized');\nconst r = await fetch($env.SUPABASE_AUTH_URL, {\n  headers: { Authorization: auth }\n});\nif (!r.ok) throw new Error('Auth failed');\nconst u = await r.json();\nconst uid = $json.body?.userId;\nif (uid && u.id !== uid) throw new Error('User mismatch');\nreturn [{ json: { ...$json, verifiedUserId: u.id } }];"
    }
  },
  output: [{ body: {}, verifiedUserId: 'uuid' }]
});

const generateState = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Generate OAuth State',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const crypto = require('crypto');\nconst { userId, platform } = $json.body;\nconst state = crypto.randomBytes(32).toString('hex');\nconst codeVerifier = crypto.randomBytes(32).toString('hex');\nconst codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64')\n  .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');\nconst expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();\n\nreturn [{\n  json: {\n    userId,\n    platform,\n    state,\n    codeVerifier,\n    codeChallenge,\n    expiresAt\n  }\n}];"
    }
  },
  output: [{
    userId: 'uuid',
    platform: 'facebook',
    state: 'abc123...',
    codeVerifier: 'def456...',
    codeChallenge: 'base64url...',
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
      query: "INSERT INTO oauth_state (user_id, platform, state, code_verifier, expires_at) VALUES ($1::uuid, $2::platform_enum, $3, $4, $5::timestamptz)",
      options: {
        queryReplacement: expr('{{ $json.userId }}, {{ $json.platform }}, {{ $json.state }}, {{ $json.codeVerifier }}, {{ $json.expiresAt }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{}]
});

const buildRedirectUrl = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Redirect URL',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const stateItem = $('Generate OAuth State').item.json;\nconst base = 'https://www.facebook.com/v21.0/dialog/oauth';\nconst params = new URLSearchParams({\n  client_id: $env.FACEBOOK_APP_ID,\n  redirect_uri: $env.FRONTEND_URL + '/accounts/connect',\n  state: stateItem.state,\n  response_type: 'code',\n  code_challenge_method: 'S256',\n  code_challenge: stateItem.codeChallenge,\n  scope: 'pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish'\n});\nreturn [{ json: { redirectUrl: base + '?' + params.toString() } }];"
    }
  },
  output: [{ redirectUrl: 'https://...' }]
});

const respond = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond',
    parameters: {
      respondWith: 'json',
      responseBody: {
        redirectUrl: expr('{{ $json.redirectUrl }}')
      }
    }
  },
  output: [{}]
});

export default workflow('oauth-connect', 'OAuth Connect')
  .add(webhookTrigger)
  .to(verifyAuth)
  .to(generateState)
  .to(storeState)
  .to(buildRedirectUrl)
  .to(respond);
