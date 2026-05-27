# n8n Workflows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 5 missing user-facing n8n workflows (OAuth, Post CRUD, Scheduler) and convert 3 JSON skeletons to TypeScript SDK, all following the patterns in the existing `06-facebook-publish.ts`.

**Architecture:** n8n IS the backend. All business logic lives in n8n workflows triggered by webhooks or cron. Supabase PostgreSQL is the data store (accessed via Postgres nodes with `newCredential('Supabase DB')`). Meta Graph API v21.0 for Facebook/Instagram publishing.

**Tech Stack:** @n8n/workflow-sdk (TypeScript), Supabase PostgreSQL, Meta Graph API v21.0

---

## File Map

| # | File | Purpose |
|---|------|---------|
| WF-01 | `n8n/workflows/01-oauth-connect.ts` | Generate Meta OAuth URL, store state in oauth_state |
| WF-02 | `n8n/workflows/02-oauth-callback.ts` | Exchange OAuth code for tokens, create social_accounts |
| WF-03 | `n8n/workflows/03-media-upload.ts` | Register uploaded media in media_assets table |
| WF-04 | `n8n/workflows/04-post-crud.ts` | Switch-based create/edit/cancel for scheduled_posts |
| WF-05 | `n8n/workflows/05-cron-scheduler.ts` | Poll pending posts every 60s, dispatch to publish workflows |
| WF-08 | `n8n/workflows/08-token-refresh.ts` | Refresh expiring Meta tokens |
| WF-09 | `n8n/workflows/09-retry-handler.ts` | Exponential backoff retry logic |
| WF-11 | `n8n/workflows/11-logging.ts` | Centralized workflow_runs logging |

---

### Task 1: WF-01 OAuth Connect

**Files:**
- Create: `n8n/workflows/01-oauth-connect.ts`

- [ ] **Step 1: Write the OAuth Connect workflow**

```typescript
import { workflow, node, trigger, expr, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'OAuth Connect Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'oauth-connect',
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
      code: "const crypto = require('crypto');\nconst { userId, platform } = $json.body;\nconst state = crypto.randomBytes(32).toString('hex');\nconst codeVerifier = crypto.randomBytes(32).toString('hex');\nconst expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();\n\nreturn [{\n  json: {\n    userId,\n    platform,\n    state,\n    codeVerifier,\n    expiresAt\n  }\n}];"
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
      code: "const { state, userId } = $json;\nconst appId = $env.FACEBOOK_APP_ID;\nconst redirectUri = `${$env.N8N_WEBHOOK_URL}/webhook/oauth-callback`;\nconst scope = 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish';\nconst url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}&response_type=code`;\n\nreturn [{ json: { url, userId } }];"
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
```

---

### Task 2: WF-02 OAuth Callback

**Files:**
- Create: `n8n/workflows/02-oauth-callback.ts`

- [ ] **Step 1: Write the OAuth Callback workflow**

```typescript
import { workflow, node, trigger, expr, newCredential, ifElse } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'OAuth Callback Webhook',
    parameters: {
      httpMethod: 'GET',
      path: 'oauth-callback',
      authentication: 'none',
      responseMode: 'onReceived',
      options: {
        responseCode: {
          values: { responseCode: 302 }
        },
        rawBody: true
      }
    }
  },
  output: [{
    query: {
      code: 'abc123',
      state: 'def456'
    }
  }]
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
        queryReplacement: expr('{{ $json.query.state }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{
    id: 'uuid',
    user_id: 'uuid',
    code_verifier: 'abc',
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
          { name: 'redirect_uri', value: expr('{{ $env.N8N_WEBHOOK_URL }}/webhook/oauth-callback') },
          { name: 'code', value: expr('{{ $json.query.code }}') }
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

const fetchPages = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Fetch User Pages',
    parameters: {
      method: 'GET',
      url: expr('https://graph.facebook.com/v21.0/me/accounts?access_token={{ $("Exchange Code for Token").item.json.body.access_token }}&fields=id,name,instagram_business_account,access_token'),
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
      code: "const exchange = $('Exchange Code for Token').item.json;\nconst pages = $('Fetch User Pages').item.json.body?.data || [];\nconst stateData = $(\\'Lookup OAuth State\\').item.json;\nconst longToken = exchange.body.access_token;\nconst expiresAt = new Date(Date.now() + (exchange.body.expires_in || 5184000) * 1000).toISOString();\n\nconst records = pages.map(page => ({\n  user_id: stateData.user_id,\n  platform: 'facebook',\n  page_id: page.id,\n  page_name: page.name,\n  ig_user_id: page.instagram_business_account?.id || null,\n  ig_username: null,\n  access_token: page.access_token || 'missing',\n  token_expires_at: expiresAt,\n  status: 'active'\n}));\n\nreturn records.map(r => ({ json: r }));"
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
      query: "INSERT INTO social_accounts (user_id, platform, page_id, page_name, ig_user_id, access_token, token_expires_at, status) VALUES ($1::uuid, $2::platform_enum, $3, $4, $5, $6, $7::timestamptz, $8::account_status_enum) ON CONFLICT (user_id, platform, page_id) DO UPDATE SET access_token = EXCLUDED.access_token, page_name = EXCLUDED.page_name, ig_user_id = EXCLUDED.ig_user_id, token_expires_at = EXCLUDED.token_expires_at, status = EXCLUDED.status, updated_at = NOW()",
      options: {
        queryReplacement: expr('{{ $json.user_id }}, {{ $json.platform }}, {{ $json.page_id }}, {{ $json.page_name }}, {{ $json.ig_user_id }}, {{ $json.access_token }}, {{ $json.token_expires_at }}, {{ $json.status }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ success: true }]
);

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
    name: 'Redirect Success',
    parameters: {
      respondWith: 'redirect',
      redirectURL: expr('{{ $env.FRONTEND_URL }}/accounts?success=connected')
    }
  },
  output: [{}]
});

const respondInvalidState = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Redirect Invalid',
    parameters: {
      respondWith: 'redirect',
      redirectURL: expr('{{ $env.FRONTEND_URL }}/accounts?error=invalid_state')
    }
  },
  output: [{}]
});

const respondTokenFailed = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Redirect Token Failed',
    parameters: {
      respondWith: 'redirect',
      redirectURL: expr('{{ $env.FRONTEND_URL }}/accounts?error=token_exchange_failed')
    }
  },
  output: [{}]
});

export default workflow('oauth-callback', 'OAuth Callback')
  .add(webhookTrigger)
  .to(lookupState)
  .to(checkState
    .onTrue(exchangeCode.to(checkToken
      .onTrue(fetchPages.to(storeAccount).to(insertAccounts).to(markStateUsed).to(respondSuccess))
      .onFalse(respondTokenFailed)
    ))
    .onFalse(respondInvalidState)
  );
```

---

### Task 3: WF-03 Media Upload

**Files:**
- Create: `n8n/workflows/03-media-upload.ts`

- [ ] **Step 1: Write the Media Upload workflow**

```typescript
import { workflow, node, trigger, expr, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Media Upload Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'media-upload',
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
      userId: 'uuid',
      fileUrl: 'https://supabase.co/storage/...',
      fileType: 'image/jpeg'
    }
  }]
});

const insertMedia = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Insert Media Asset',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO media_assets (user_id, file_url, file_type) VALUES ($1::uuid, $2, $3) RETURNING id, file_url, file_type, created_at",
      options: {
        queryReplacement: expr('{{ $json.body.userId }}, {{ $json.body.fileUrl }}, {{ $json.body.fileType }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{
    id: 'uuid',
    file_url: 'https://...',
    file_type: 'image/jpeg',
    created_at: '2026-05-27T...'
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
        id: expr('{{ $json.id }}'),
        file_url: expr('{{ $json.file_url }}'),
        file_type: expr('{{ $json.file_type }}'),
        created_at: expr('{{ $json.created_at }}')
      }
    }
  },
  output: [{}]
});

export default workflow('media-upload', 'Media Upload')
  .add(webhookTrigger)
  .to(insertMedia)
  .to(respond);
```

---

### Task 4: WF-04 Post CRUD

**Files:**
- Create: `n8n/workflows/04-post-crud.ts`

- [ ] **Step 1: Write the Post CRUD workflow**

```typescript
import { workflow, node, trigger, expr, newCredential, switchCase } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Post CRUD Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'post',
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
      operation: 'create',
      userId: 'uuid',
      accountId: 'uuid',
      title: 'My Post',
      caption: 'Hello!',
      mediaIds: ['uuid'],
      platforms: ['facebook'],
      scheduleAt: '2026-05-28T14:00:00Z',
      timezone: 'America/New_York',
      status: 'draft'
    }
  }]
});

const routeOperation = switchCase({
  version: 3.2,
  config: {
    name: 'Route by Operation',
    parameters: {
      rules: {
        values: [
          {
            outputKey: 'create',
            conditions: {
              options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
              conditions: [{ leftValue: expr('{{ $json.body.operation }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'create' }],
              combinator: 'and'
            }
          },
          {
            outputKey: 'edit',
            conditions: {
              options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
              conditions: [{ leftValue: expr('{{ $json.body.operation }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'edit' }],
              combinator: 'and'
            }
          },
          {
            outputKey: 'cancel',
            conditions: {
              options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
              conditions: [{ leftValue: expr('{{ $json.body.operation }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'cancel' }],
              combinator: 'and'
            }
          }
        ]
      }
    }
  }
});

const parseCreateData = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Parse Create Data',
    parameters: {
      mode: 'runOnceForAllItems',
      code: "const b = $json.body;\nreturn [{ json: {\n  user_id: b.userId,\n  account_id: b.accountId || null,\n  title: b.title || null,\n  caption: b.caption || null,\n  platforms: b.platforms || ['facebook'],\n  schedule_at: b.scheduleAt || null,\n  timezone: b.timezone || 'UTC',\n  status: b.status || 'draft',\n  media_ids: b.mediaIds || []\n}}];"
    }
  },
  output: [{
    user_id: 'uuid',
    account_id: 'uuid',
    title: 'My Post',
    caption: 'Hello!',
    platforms: ['facebook'],
    schedule_at: '2026-05-28T14:00:00Z',
    timezone: 'America/New_York',
    status: 'draft',
    media_ids: ['uuid']
  }]
});

const insertPost = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Insert Scheduled Post',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO scheduled_posts (user_id, account_id, title, caption, platforms, schedule_at, timezone, status) VALUES ($1::uuid, $2::uuid, $3, $4, $5::platform_enum[], $6::timestamptz, $7, $8::post_status_enum) RETURNING id",
      options: {
        queryReplacement: expr('{{ $json.user_id }}, {{ $json.account_id }}, {{ $json.title }}, {{ $json.caption }}, {{ $json.platforms }}, {{ $json.schedule_at }}, {{ $json.timezone }}, {{ $json.status }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ id: 'uuid' }]
});

const linkMedia = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Link Media to Post',
    parameters: {
      mode: 'runOnceForAllItems',
      code: "const postId = $json.id;\nconst mediaIds = $('Parse Create Data').item.json.media_ids;\nif (!mediaIds || mediaIds.length === 0) return [{ json: { post_id: postId, linked: false } }];\nreturn mediaIds.map((mid, i) => ({ json: { post_id: postId, media_id: mid, sort_order: i } }));"
    }
  },
  output: [{
    post_id: 'uuid',
    media_id: 'uuid',
    sort_order: 0
  }]
});

const checkNeedsMedia = ifElse({
  version: 2.3,
  config: {
    name: 'Has Media?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          leftValue: expr('{{ $json.linked }}'),
          operator: { type: 'boolean', operation: 'equals' },
          rightValue: false
        }],
        combinator: 'and'
      }
    }
  }
});

const insertPostMedia = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Insert Post-Media Links',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO post_media (post_id, media_id, sort_order) VALUES ($1::uuid, $2::uuid, $3) ON CONFLICT DO NOTHING",
      options: {
        queryReplacement: expr('{{ $json.post_id }}, {{ $json.media_id }}, {{ $json.sort_order }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ success: true }]
});

const logCreate = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Log Create',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO post_logs (post_id, workflow_name, status, attempt_number) VALUES ($1::uuid, 'post-crud', 'success', 1)",
      options: {
        queryReplacement: expr('{{ $json.id || $json.post_id }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ id: 'uuid' }]
});

const respondCreate = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond Created',
    parameters: {
      respondWith: 'json',
      responseBody: {
        id: expr('{{ $json.id }}'),
        status: expr('{{ $("Parse Create Data").item.json.status }}')
      }
    }
  },
  output: [{}]
});

const parseEditData = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Parse Edit Data',
    parameters: {
      mode: 'runOnceForAllItems',
      code: "const b = $json.body;\nreturn [{ json: {\n  post_id: b.postId,\n  user_id: b.userId,\n  title: b.title || null,\n  caption: b.caption || null,\n  platforms: b.platforms || null,\n  account_id: b.accountId || null,\n  schedule_at: b.scheduleAt || null,\n  status: b.status || null\n}}];"
    }
  },
  output: [{
    post_id: 'uuid',
    user_id: 'uuid',
    title: 'Updated Title',
    caption: 'Updated caption',
    platforms: ['facebook'],
    account_id: 'uuid',
    schedule_at: '2026-05-28T...',
    status: 'scheduled'
  }]
});

const updatePost = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Update Scheduled Post',
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE scheduled_posts SET title = COALESCE($1, title), caption = COALESCE($2, caption), platforms = COALESCE($3::platform_enum[], platforms), account_id = COALESCE($4::uuid, account_id), schedule_at = COALESCE($5::timestamptz, schedule_at), status = COALESCE($6::post_status_enum, status), updated_at = NOW() WHERE id = $7::uuid AND user_id = $8::uuid",
      options: {
        queryReplacement: expr('{{ $json.title }}, {{ $json.caption }}, {{ $json.platforms }}, {{ $json.account_id }}, {{ $json.schedule_at }}, {{ $json.status }}, {{ $json.post_id }}, {{ $json.user_id }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ success: true }]
});

const respondEdit = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond Edited',
    parameters: {
      respondWith: 'json',
      responseBody: { success: true }
    }
  },
  output: [{}]
});

const parseCancelData = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Parse Cancel Data',
    parameters: {
      mode: 'runOnceForAllItems',
      code: "const b = $json.body;\nreturn [{ json: { post_id: b.postId, user_id: b.userId } }];"
    }
  },
  output: [{
    post_id: 'uuid',
    user_id: 'uuid'
  }]
});

const cancelPost = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Cancel Post',
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE scheduled_posts SET status = 'cancelled', deleted_at = NOW(), updated_at = NOW() WHERE id = $1::uuid AND user_id = $2::uuid",
      options: {
        queryReplacement: expr('{{ $json.post_id }}, {{ $json.user_id }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ success: true }]
});

const respondCancel = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond Cancelled',
    parameters: {
      respondWith: 'json',
      responseBody: { success: true }
    }
  },
  output: [{}]
});

const respondUnknown = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond Unknown Operation',
    parameters: {
      respondWith: 'json',
      responseBody: { error: 'Unknown operation' }
    }
  },
  output: [{}]
});

export default workflow('post-crud', 'Post CRUD')
  .add(webhookTrigger)
  .to(routeOperation
    .onCase('create', parseCreateData.to(insertPost.to(linkMedia.to(checkNeedsMedia.onFalse(insertPostMedia).onTrue(logCreate))).to(logCreate).to(respondCreate)))
    .onCase('edit', parseEditData.to(updatePost).to(respondEdit))
    .onCase('cancel', parseCancelData.to(cancelPost).to(respondCancel))
    .onDefault(respondUnknown)
  );

// Note: checkNeedsMedia.onFalse means linked=false (no media) → skip insertPostMedia
// checkNeedsMedia.onTrue means linked=true → insertPostMedia already ran via the code above
```

---

### Task 5: WF-05 Cron Scheduler

**Files:**
- Create: `n8n/workflows/05-cron-scheduler.ts`

- [ ] **Step 1: Write the Cron Scheduler workflow**

```typescript
import { workflow, node, trigger, expr, newCredential, splitInBatches, nextBatch, ifElse } from '@n8n/workflow-sdk';

const scheduleTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Every Minute',
    parameters: {
      rule: {
        interval: 1
      }
    }
  },
  output: [{}]
});

const fetchPendingPosts = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Fetch Pending Posts',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT sp.id, sp.user_id, sp.account_id, sp.caption, sp.platforms, sp.schedule_at, sp.timezone, sa.access_token, sa.page_id, sa.ig_user_id, sa.platform AS account_platform, sa.status AS account_status FROM scheduled_posts sp JOIN social_accounts sa ON sa.id = sp.account_id WHERE sp.status = 'scheduled' AND sp.schedule_at <= NOW() AND sp.deleted_at IS NULL AND sa.status = 'active' ORDER BY sp.schedule_at ASC LIMIT 5",
      options: {
        queryReplacement: ''
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{
    id: 'uuid',
    user_id: 'uuid',
    account_id: 'uuid',
    caption: 'Hello',
    platforms: ['facebook'],
    schedule_at: '2026-05-27T...',
    access_token: 'EAA...',
    page_id: '12345',
    ig_user_id: '67890',
    account_platform: 'facebook'
  }]
});

const checkHasPosts = ifElse({
  version: 2.3,
  config: {
    name: 'Has Pending Posts?',
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

const fetchMedia = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Fetch Post Media',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT ma.file_url, ma.file_type FROM post_media pm JOIN media_assets ma ON ma.id = pm.media_id WHERE pm.post_id = $1::uuid ORDER BY pm.sort_order ASC LIMIT 1",
      options: {
        queryReplacement: expr('{{ $json.id }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{
    file_url: 'https://supabase.co/storage/...',
    file_type: 'image/jpeg'
  }]
});

const dispatchToPublish = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Dispatch Payload',
    parameters: {
      mode: 'runOnceForAllItems',
      code: "const post = $json;\nconst media = $('Fetch Post Media').item?.json || {};\nreturn [{ json: {\n  postId: post.id,\n  userId: post.user_id,\n  accessToken: post.access_token,\n  pageId: post.page_id,\n  igUserId: post.ig_user_id,\n  caption: post.caption || '',\n  mediaUrl: media.file_url || '',\n  mediaType: media.file_type || '',\n  accountPlatform: post.account_platform\n}}];"
    }
  },
  output: [{
    postId: 'uuid',
    userId: 'uuid',
    accessToken: 'EAA...',
    pageId: '12345',
    igUserId: '67890',
    caption: 'Hello',
    mediaUrl: 'https://...',
    mediaType: 'image/jpeg',
    accountPlatform: 'facebook'
  }]
});

const routePlatform = ifElse({
  version: 2.3,
  config: {
    name: 'Route by Platform',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          leftValue: expr('{{ $json.accountPlatform }}'),
          operator: { type: 'string', operation: 'equals' },
          rightValue: 'facebook'
        }],
        combinator: 'and'
      }
    }
  }
});

const callFacebookPublish = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Dispatch Facebook Publish',
    parameters: {
      method: 'POST',
      url: expr('{{ $env.N8N_WEBHOOK_URL }}/webhook/facebook-publish'),
      authentication: 'none',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: {
        postId: expr('{{ $json.postId }}'),
        userId: expr('{{ $json.userId }}'),
        accessToken: expr('{{ $json.accessToken }}'),
        pageId: expr('{{ $json.pageId }}'),
        caption: expr('{{ $json.caption }}'),
        mediaUrl: expr('{{ $json.mediaUrl }}'),
        mediaType: expr('{{ $json.mediaType }}')
      },
      options: {
        response: {
          response: {
            neverError: true
          }
        }
      }
    }
  },
  output: [{}]
});

const callInstagramPublish = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Dispatch Instagram Publish',
    parameters: {
      method: 'POST',
      url: expr('{{ $env.N8N_WEBHOOK_URL }}/webhook/instagram-publish'),
      authentication: 'none',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: {
        postId: expr('{{ $json.postId }}'),
        userId: expr('{{ $json.userId }}'),
        accessToken: expr('{{ $json.accessToken }}'),
        igUserId: expr('{{ $json.igUserId }}'),
        caption: expr('{{ $json.caption }}'),
        mediaUrl: expr('{{ $json.mediaUrl }}'),
        mediaType: expr('{{ $json.mediaType }}')
      },
      options: {
        response: {
          response: {
            neverError: true
          }
        }
      }
    }
  },
  output: [{}]
});

const sib = splitInBatches({
  version: 3,
  config: {
    name: 'Process Each Post',
    parameters: {
      batchSize: 1
    }
  }
});

export default workflow('cron-scheduler', 'Cron Scheduler')
  .add(scheduleTrigger)
  .to(fetchPendingPosts)
  .to(checkHasPosts
    .onTrue(sib
      .onEachBatch(fetchMedia.to(dispatchToPublish).to(routePlatform
        .onTrue(callFacebookPublish.to(nextBatch(sib)))
        .onFalse(callInstagramPublish.to(nextBatch(sib)))
      ))
    )
  );
```

---

### Task 6: WF-08 Token Refresh (SDK conversion)

**Files:**
- Create: `n8n/workflows/08-token-refresh.ts`

- [ ] **Step 1: Write the Token Refresh workflow**

```typescript
import { workflow, node, trigger, expr, newCredential, ifElse } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Token Refresh Webhook',
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
```

---

### Task 7: WF-09 Retry Handler (SDK conversion)

**Files:**
- Create: `n8n/workflows/09-retry-handler.ts`

- [ ] **Step 1: Write the Retry Handler workflow**

```typescript
import { workflow, node, trigger, expr, newCredential, ifElse } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Retry Handler Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'retry',
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
      postId: 'uuid',
      platform: 'facebook',
      error: 'Error message',
      attemptNumber: 1
    }
  }]
});

const checkPost = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Check Post Status',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT id, retry_count, max_retries FROM scheduled_posts WHERE id = $1::uuid",
      options: {
        queryReplacement: expr('{{ $json.body.postId }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{
    id: 'uuid',
    retry_count: 1,
    max_retries: 3
  }]
});

const checkRetries = ifElse({
  version: 2.3,
  config: {
    name: 'Retries Remaining?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          leftValue: expr('{{ $json.retry_count }}'),
          operator: { type: 'number', operation: 'lessThan' },
          rightValue: expr('{{ $json.max_retries }}')
        }],
        combinator: 'and'
      }
    }
  }
});

const computeBackoff = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Compute Backoff',
    parameters: {
      mode: 'runOnceForAllItems',
      code: "const retryCount = $json.retry_count;\nconst delayMinutes = Math.pow(2, retryCount) * 5;\nconst retryAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();\nreturn [{ json: { retryAt, delayMinutes } }];"
    }
  },
  output: [{
    retryAt: '2026-05-27T...',
    delayMinutes: 10
  }]
});

const reschedulePost = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Reschedule Post',
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE scheduled_posts SET status = 'scheduled', schedule_at = $1::timestamptz, updated_at = NOW() WHERE id = $2::uuid",
      options: {
        queryReplacement: expr('{{ $json.retryAt }}, {{ $("Check Post Status").item.json.id }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ success: true }]
});

const callFailureHandler = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Call Failure Handler',
    parameters: {
      method: 'POST',
      url: expr('{{ $env.N8N_WEBHOOK_URL }}/webhook/failure-handler'),
      authentication: 'none',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: {
        postId: expr('{{ $json.body.postId }}'),
        workflowName: expr('{{ $json.body.platform }}-publish'),
        error: expr('{{ $json.body.error }}'),
        attemptNumber: expr('{{ $json.body.attemptNumber || 1 }}'),
        platform: expr('{{ $json.body.platform }}'),
        source: 'Retry Handler'
      },
      options: {
        response: {
          response: {
            neverError: true
          }
        }
      }
    }
  },
  output: [{}]
});

const respond = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond',
    parameters: {
      respondWith: 'json',
      responseBody: {
        action: expr('{{ $json.delayMinutes ? "retry" : "exhausted" }}'),
        postId: expr('{{ $("Check Post Status").item.json.id }}')
      }
    }
  },
  output: [{}]
});

export default workflow('retry-handler', 'Retry Handler')
  .add(webhookTrigger)
  .to(checkPost)
  .to(checkRetries
    .onTrue(computeBackoff.to(reschedulePost).to(respond))
    .onFalse(callFailureHandler.to(respond))
  );
```

---

### Task 8: WF-11 Logging (SDK conversion)

**Files:**
- Create: `n8n/workflows/11-logging.ts`

- [ ] **Step 1: Write the Logging workflow**

```typescript
import { workflow, node, trigger, expr, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Logging Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'log',
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
      workflowName: 'facebook-publish',
      status: 'running',
      inputPayload: {},
      outputPayload: {},
      errorMessage: null,
      durationMs: 1234,
      triggeredBy: null
    }
  }]
});

const insertLog = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Insert Workflow Run Log',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO workflow_runs (workflow_name, status, input_payload, output_payload, error_message, duration_ms, triggered_by) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7::uuid) RETURNING id",
      options: {
        queryReplacement: expr('{{ $json.body.workflowName }}, {{ $json.body.status }}, {{ $json.body.inputPayload }}, {{ $json.body.outputPayload }}, {{ $json.body.errorMessage }}, {{ $json.body.durationMs }}, {{ $json.body.triggeredBy }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ id: 'uuid' }]
});

const respond = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond',
    parameters: {
      respondWith: 'json',
      responseBody: { id: expr('{{ $json.id }}'), logged: true }
    }
  },
  output: [{}]
});

export default workflow('logging', 'Logging')
  .add(webhookTrigger)
  .to(insertLog)
  .to(respond);
```

---

### Task 9: Validate All Workflows

**Files:** All 8 new `.ts` files

- [ ] **Step 1: Validate each workflow**

```bash
for f in n8n/workflows/0*.ts; do
  echo "=== Validating $f ==="
  npx n8n-workflow-sdk validate "$f" 2>&1
  echo ""
done
```

Expected: Each file passes validation with no errors.

- [ ] **Step 2: Fix any validation errors**

Troubleshoot and fix based on `n8n-workflow-sdk validate` output. Common issues:
- `newCredential('Supabase DB')` must match the credential name configured in n8n UI
- `expr()` expressions must use correct node names
- Postgres queries must match actual table/column names in the schema

---

### Task 10: Deploy Workflows

- [ ] **Step 1: Deploy all workflows to n8n cloud**

```bash
npx n8n-workflow-sdk deploy n8n/workflows/ \
  --url https://aman01.app.n8n.cloud/ \
  --api-key $N8N_API_KEY
```

Expected: All 8 workflows created successfully in the n8n instance.

- [ ] **Step 2: Verify deployment via n8n MCP**

```bash
# Search for deployed workflows
n8n-mcp search_workflows --query "OAuth"
n8n-mcp search_workflows --query "Scheduler"
```

Expected: All workflows visible with active status.

---

### Task 11: End-to-End Smoke Tests

- [ ] **Step 1: Test OAuth Connect webhook**

```bash
curl -X POST https://aman01.app.n8n.cloud/webhook/oauth-connect \
  -H "Content-Type: application/json" \
  -d '{"userId": "00000000-0000-0000-0000-000000000000", "platform": "facebook"}'
```

Expected: Returns `{ "url": "https://www.facebook.com/v21.0/dialog/oauth?..." }`

- [ ] **Step 2: Test Post CRUD - create**

```bash
curl -X POST https://aman01.app.n8n.cloud/webhook/post \
  -H "Content-Type: application/json" \
  -d '{"operation": "create", "userId": "00000000-0000-0000-0000-000000000000", "accountId": "00000000-0000-0000-0000-000000000000", "title": "Test", "caption": "Hello", "platforms": ["facebook"], "status": "draft"}'
```

Expected: Returns `{ "id": "uuid", "status": "draft" }`

- [ ] **Step 3: Test Media Upload webhook**

```bash
curl -X POST https://aman01.app.n8n.cloud/webhook/media-upload \
  -H "Content-Type: application/json" \
  -d '{"userId": "00000000-0000-0000-0000-000000000000", "fileUrl": "https://supabase.co/storage/v1/object/public/media/test.jpg", "fileType": "image/jpeg"}'
```

Expected: Returns `{ "id": "uuid", "file_url": "...", "file_type": "image/jpeg" }`

---

### Task 12: Environment Variables Setup

- [ ] **Step 1: Verify n8n env vars are configured in the n8n cloud instance**

Required env vars in n8n:
- `FACEBOOK_APP_ID` — Meta App ID
- `FACEBOOK_APP_SECRET` — Meta App Secret
- `FACEBOOK_TOKEN_URL` — `https://graph.facebook.com/v21.0/oauth/access_token`
- `N8N_WEBHOOK_URL` — `https://aman01.app.n8n.cloud`
- `FRONTEND_URL` — Frontend URL for OAuth redirect

- [ ] **Step 2: Verify Supabase DB credential exists in n8n**

Credential name: `Supabase DB` (PostgreSQL)
Connection string from `.env.local`: Supabase project connection pooler URL
