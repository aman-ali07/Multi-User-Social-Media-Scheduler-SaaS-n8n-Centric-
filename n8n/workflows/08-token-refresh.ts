const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Token Refresh Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'token-refresh',
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
      accountId: 'uuid',
      userId: 'uuid',
      accessToken: 'EAA...',
      platform: 'facebook'
    }
  }]
});

const refreshToken = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Refresh Token',
    parameters: {
      method: 'GET',
      url: expr('https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={{ $env.FACEBOOK_APP_ID }}&client_secret={{ $env.FACEBOOK_APP_SECRET }}&fb_exchange_token={{ $json.body.accessToken }}'),
      authentication: 'none',
      options: {
        response: {
          response: {
            fullResponse: true,
            neverError: true
          }
        }
      }
    }
  },
  output: [{
    body: {
      access_token: 'EAA...',
      expires_in: 5184000
    },
    statusCode: 200
  }]
});

const checkResult = ifElse({
  version: 2.3,
  config: {
    name: 'Refresh Success?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          leftValue: expr('{{ $json.statusCode }}'),
          operator: { type: 'number', operation: 'equals' },
          rightValue: 200
        }],
        combinator: 'and'
      }
    }
  }
});

const updateToken = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Update Token',
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE social_accounts SET access_token = $1, token_expires_at = $2::timestamptz, updated_at = NOW() WHERE id = $3::uuid",
      options: {
        queryReplacement: expr('{{ $json.body.access_token }}, {{ new Date(Date.now() + $json.body.expires_in * 1000).toISOString() }}, {{ $("Token Refresh Webhook").item.json.body.accountId }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ success: true }]
});

const logRefresh = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Log Refresh',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO token_refresh_log (account_id, status, error_message) VALUES ($1::uuid, $2, $3)",
      options: {
        queryReplacement: expr('{{ $("Token Refresh Webhook").item.json.body.accountId }}, success, NULL')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ id: 'uuid' }]
});

const logFailed = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Log Failed',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO token_refresh_log (account_id, status, error_message) VALUES ($1::uuid, 'failed', $2)",
      options: {
        queryReplacement: expr('{{ $("Token Refresh Webhook").item.json.body.accountId }}, {{ $json.body.error?.message || "Token refresh failed" }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ id: 'uuid' }]
});

const markExpired = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Mark Account Expired',
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE social_accounts SET status = 'expired', updated_at = NOW() WHERE id = $1::uuid",
      options: {
        queryReplacement: expr('{{ $("Token Refresh Webhook").item.json.body.accountId }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ success: true }]
});

const respond = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond',
    parameters: {
      respondWith: 'json',
      responseBody: { success: true }
    }
  },
  output: [{}]
});

const respondError = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond Error',
    parameters: {
      respondWith: 'json',
      responseBody: { success: false, error: expr('{{ $json.body?.error?.message || "Token refresh failed" }}') }
    }
  },
  output: [{}]
});

export default workflow('token-refresh', 'Token Refresh')
  .add(webhookTrigger)
  .to(refreshToken)
  .to(checkResult
    .onTrue(updateToken.to(logRefresh).to(respond))
    .onFalse(logFailed.to(markExpired).to(respondError))
  );
