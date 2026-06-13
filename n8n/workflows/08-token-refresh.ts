import { workflow, trigger, node, expr, ifElse, newCredential } from '@n8n/workflow-sdk';

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
      jsCode: "const h = $json.headers || {};\nconst token = h['x-internal-token'] || h['X-Internal-Token'] || '';\nconst expected = $env.INTERNAL_WEBHOOK_SECRET;\nif (!expected) throw new Error('INTERNAL_WEBHOOK_SECRET not configured');\nif (token !== expected) throw new Error('Forbidden: invalid internal token');\nreturn [{ json: { ...$json, verified: true } }];"
    }
  }
});

const callTokenRefresh = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: `const { id, access_token, page_id } = $json.body;
const url = 'https://graph.facebook.com/v21.0/' + page_id + '?fields=access_token';
try {
  const res = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + access_token }
  });
  const data = await res.json();
  if (!data.access_token) {
    return [{ json: {
      success: false,
      accountId: id,
      errorMsg: data.error?.message || 'Token refresh failed - no access_token in response'
    } }];
  }
  const expiresIn = data.expires_in || 60 * 24 * 60 * 60;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  return [{ json: {
    success: true,
    accountId: id,
    newToken: data.access_token,
    expiresAt: expiresAt,
    oldExpiresAt: null
  } }];
} catch (err) {
  return [{ json: {
    success: false,
    accountId: id,
    errorMsg: err.message || 'Token refresh failed - network or parsing error'
  } }];
}`
    }
  }
});

const checkResult = ifElse({
  version: 2.3,
  config: {
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          leftValue: expr('{{ $json.success }}'),
          operator: { type: 'boolean', operation: 'true' }
        }],
        combinator: 'and'
      }
    }
  }
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

const logRefreshSuccess = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO token_refresh_log (account_id, old_expires_at, new_expires_at, status, error_message) VALUES ($1::uuid, $2::timestamptz, $3::timestamptz, 'success', NULL)",
      options: {
        queryReplacement: expr('{{ $json.accountId }}, {{ $json.oldExpiresAt }}, {{ $json.expiresAt }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  }
});

const logRefreshFailure = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO token_refresh_log (account_id, status, error_message) VALUES ($1::uuid, 'failed', $2)",
      options: {
        queryReplacement: expr('{{ $json.accountId }}, {{ $json.errorMsg }}')
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
  .to(checkResult)
  .branch(checkResult, storeRefreshedToken, logRefreshFailure)
  .after(storeRefreshedToken, logRefreshSuccess);
