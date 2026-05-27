const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'OAuth Callback Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'oauth-callback',
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
      code: 'abc123',
      state: 'def456'
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
      jsCode: "const h = $json.headers || {};\nconst auth = h.authorization || h.Authorization || '';\nif (!auth.startsWith('Bearer ')) throw new Error('Unauthorized');\nconst r = await fetch($env.SUPABASE_AUTH_URL, {\n  headers: { Authorization: auth }\n});\nif (!r.ok) throw new Error('Auth failed');\nconst u = await r.json();\nreturn [{ json: { ...$json, verifiedUserId: u.id } }];"
    }
  },
  output: [{ body: {}, verifiedUserId: 'uuid' }]
});

const lookupState = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Lookup OAuth State',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT id, user_id, code_verifier, platform FROM oauth_state WHERE state = $1 AND used = false AND expires_at > NOW() LIMIT 1",
      options: {
        queryReplacement: expr('{{ $json.body.state }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{
    id: 'uuid',
    user_id: 'uuid',
    code_verifier: 'abc123...',
    platform: 'facebook'
  }]
});

const checkState = ifElse({
  version: 2.3,
  config: {
    name: 'State Valid?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          leftValue: expr('{{ $json.id }}'),
          operator: { type: 'string', operation: 'isNotEmpty' },
          rightValue: ''
        }],
        combinator: 'and'
      }
    }
  }
});

const exchangeCode = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Exchange Code for Token',
    parameters: {
      method: 'POST',
      url: expr('{{ $env.FACEBOOK_TOKEN_URL }}'),
      authentication: 'none',
      sendBody: true,
      contentType: 'form-urlencoded',
      specifyBody: 'keypair',
      bodyParameters: {
        parameters: [
          { name: 'client_id', value: expr('{{ $env.FACEBOOK_APP_ID }}') },
          { name: 'client_secret', value: expr('{{ $env.FACEBOOK_APP_SECRET }}') },
          { name: 'redirect_uri', value: expr('{{ $env.FRONTEND_URL }}/accounts/connect') },
          { name: 'code', value: expr('{{ $json.body.code }}') },
          { name: 'code_verifier', value: expr('{{ $("Lookup OAuth State").item.json.code_verifier }}') }
        ]
      },
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

const checkToken = ifElse({
  version: 2.3,
  config: {
    name: 'Token Exchanged?',
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

const exchangeLongLived = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Exchange for Long-Lived Token',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const shortToken = $json.body.access_token;\nconst url = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent($env.FACEBOOK_APP_ID)}&client_secret=${encodeURIComponent($env.FACEBOOK_APP_SECRET)}&fb_exchange_token=${encodeURIComponent(shortToken)}`;\nconst res = await fetch(url);\nconst data = await res.json();\nif (!data.access_token) throw new Error(`Long-lived token exchange failed: ${data.error?.message || 'unknown error'}`);\nreturn [{ json: { ...$json, body: { ...$json.body, access_token: data.access_token, expires_in: data.expires_in || 5184000 } } }];"
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

const fetchPages = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch User Pages',
    parameters: {
      method: 'GET',
      url: expr('https://graph.facebook.com/v21.0/me/accounts?access_token={{ $("Exchange for Long-Lived Token").item.json.body.access_token }}&fields=id,name,instagram_business_account,access_token'),
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
      data: [{
        id: '12345',
        name: 'My Page',
        instagram_business_account: { id: '67890' },
        access_token: 'EAA...'
      }]
    },
    statusCode: 200
  }]
});

const storeAccount = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Store Account Data',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const exchange = $('Exchange for Long-Lived Token').item.json;\nconst pages = $('Fetch User Pages').item.json.body?.data || [];\nconst stateData = $('Lookup OAuth State').item.json;\nconst longToken = exchange.body.access_token;\nconst expiresAt = new Date(Date.now() + (exchange.body.expires_in || 5184000) * 1000).toISOString();\n\nconst records = [];\nfor (const page of pages) {\n  if (!page.access_token) {\n    throw new Error(`Page \"${page.name}\" (ID: ${page.id}) did not grant an access token. Ensure \"pages_manage_posts\" permission is accepted for all pages.`);\n  }\n  records.push({\n    user_id: stateData.user_id,\n    platform: 'facebook',\n    page_id: page.id,\n    page_name: page.name,\n    ig_user_id: page.instagram_business_account?.id || null,\n    ig_username: null,\n    access_token: page.access_token,\n    token_expires_at: expiresAt,\n    status: 'active'\n  });\n}\n\nreturn records.map(r => ({ json: r }));"
    }
  },
  output: [{
    user_id: 'uuid',
    platform: 'facebook',
    page_id: '12345',
    page_name: 'My Page',
    ig_user_id: '67890',
    access_token: 'EAA...',
    token_expires_at: '2026-06-...',
    status: 'active'
  }]
});

const insertAccounts = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Insert Social Accounts',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO social_accounts (user_id, platform, page_id, page_name, ig_user_id, access_token, token_expires_at, status) VALUES ($1::uuid, $2::platform_enum, $3, $4, $5, encrypt_token($6), $7::timestamptz, $8::account_status_enum) ON CONFLICT (user_id, platform, page_id) DO UPDATE SET access_token = EXCLUDED.access_token, page_name = EXCLUDED.page_name, ig_user_id = EXCLUDED.ig_user_id, token_expires_at = EXCLUDED.token_expires_at, status = EXCLUDED.status, updated_at = NOW()",
      options: {
        queryReplacement: expr('{{ $json.user_id }}, {{ $json.platform }}, {{ $json.page_id }}, {{ $json.page_name }}, {{ $json.ig_user_id }}, {{ $json.access_token }}, {{ $json.token_expires_at }}, {{ $json.status }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ success: true }]
});

const markStateUsed = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Mark State Used',
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE oauth_state SET used = true WHERE id = $1::uuid",
      options: {
        queryReplacement: expr('{{ $("Lookup OAuth State").item.json.id }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ success: true }]
});

const respondSuccess = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond Success',
    parameters: {
      respondWith: 'json',
      responseBody: {
        userId: expr('{{ $("Lookup OAuth State").item.json.user_id }}'),
        url: expr('{{ $env.FRONTEND_URL }}/accounts?success=connected')
      }
    }
  },
  output: [{}]
});

const respondInvalidState = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond Invalid State',
    parameters: {
      respondWith: 'json',
      responseBody: {
        error: 'invalid_state'
      }
    }
  },
  output: [{}]
});

const respondTokenFailed = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond Token Failed',
    parameters: {
      respondWith: 'json',
      responseBody: {
        userId: expr('{{ $("Lookup OAuth State").item.json.user_id }}'),
        url: expr('{{ $env.FRONTEND_URL }}/accounts?error=token_exchange_failed')
      }
    }
  },
  output: [{}]
});

export default workflow('oauth-callback', 'OAuth Callback')
  .add(webhookTrigger)
  .to(verifyAuth)
  .to(lookupState)
  .to(checkState
    .onTrue(exchangeCode.to(checkToken
      .onTrue(exchangeLongLived.to(fetchPages.to(storeAccount).to(insertAccounts).to(markStateUsed).to(respondSuccess)))
      .onFalse(respondTokenFailed)
    ))
    .onFalse(respondInvalidState)
  );