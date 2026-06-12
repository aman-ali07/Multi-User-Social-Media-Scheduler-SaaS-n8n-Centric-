import { workflow, trigger, node, expr, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    parameters: {
      httpMethod: 'POST',
      path: 'token-refresh',
      authentication: 'none',
      responseMode: 'onReceived',
      options: {
        responseCode: {
          values: { responseCode: 200 }
        }
      }
    }
  },
  output: [{
    body: {
      id: 'uuid',
      access_token: 'EAA...',
      page_id: '12345'
    }
  }]
});

const verifyInternalToken = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const h = $json.headers || {};\nconst token = h['x-internal-token'] || h['X-Internal-Token'] || '';\nconst expected = $env.INTERNAL_WEBHOOK_SECRET;\nif (!expected) throw new Error('INTERNAL_WEBHOOK_SECRET not configured');\nif (token !== expected) throw new Error('Forbidden: invalid internal token');\nreturn [{ json: $json }];"
    }
  }
});

const callTokenRefresh = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const { id, access_token, page_id } = $json.body;\nconst url = `https://graph.facebook.com/v21.0/${page_id}?fields=access_token`;\nconst res = await fetch(url, {\n  headers: { 'Authorization': 'Bearer ' + encodeURIComponent(access_token) }\n});\nconst data = await res.json();\nif (!data.access_token) throw new Error(`Token refresh failed: ${data.error?.message || 'unknown error'}`);\nconst expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();\nreturn [{ json: { accountId: id, newToken: data.access_token, expiresAt } }];"
    }
  },
  output: [{
    accountId: 'uuid',
    newToken: 'EAA...',
    expiresAt: '2026-06-...'
  }]
});

const storeRefreshedToken = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE social_accounts SET access_token = encrypt_token($1), token_expires_at = $2::timestamptz, updated_at = NOW() WHERE id = $3::uuid",
      options: {
        queryReplacement: expr('{{ $json.newToken }}, {{ $json.expiresAt }}, {{ $json.accountId }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  }
});

export default workflow('token-refresh', 'Token Refresh')
  .add(webhookTrigger)
  .to(verifyInternalToken)
  .to(callTokenRefresh)
  .to(storeRefreshedToken);
