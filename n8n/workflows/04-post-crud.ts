const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Post CRUD Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'post',
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
      jsCode: "const b = $json.body;\nreturn [{ json: {\n  user_id: $json.verifiedUserId,\n  account_id: b.accountId || null,\n  title: b.title || null,\n  caption: b.caption || null,\n  platforms: b.platforms || ['facebook'],\n  schedule_at: b.scheduleAt || null,\n  timezone: b.timezone || 'UTC',\n  status: b.status || 'draft',\n  media_ids: b.mediaIds || []\n}}];"
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
      jsCode: "const postId = $json.id;\nconst mediaIds = $('Parse Create Data').item.json.media_ids || [];\nconst pgMediaIds = '{' + mediaIds.join(',') + '}';\nconst pgSortOrders = '{' + mediaIds.map((_, i) => i).join(',') + '}';\nreturn [{ json: { post_id: postId, pgMediaIds, pgSortOrders } }];"
    }
  },
  output: [{
    post_id: 'uuid',
    pgMediaIds: '{uuid1,uuid2}',
    pgSortOrders: '{0,1}'
  }]
});

const insertPostMedia = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Insert Post-Media Links',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO post_media (post_id, media_id, sort_order) SELECT $1::uuid, unnest($2::text[]::uuid[]), unnest($3::int[]) ON CONFLICT DO NOTHING",
      options: {
        queryReplacement: expr('{{ $json.post_id }}, {{ $json.pgMediaIds }}, {{ $json.pgSortOrders }}')
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
      query: "INSERT INTO post_logs (post_id, workflow_name, status, user_id, attempt_number) VALUES ($1::uuid, 'post-crud', 'success', $2::uuid, 1)",
      options: {
        queryReplacement: expr('{{ $("Insert Scheduled Post").item.json.id }}, {{ $("Parse Create Data").item.json.user_id }}')
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
        id: expr('{{ $("Insert Scheduled Post").item.json.id }}'),
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
      jsCode: "const b = $json.body;\nreturn [{ json: {\n  post_id: b.postId,\n  user_id: $json.verifiedUserId,\n  title: b.title || null,\n  caption: b.caption || null,\n  platforms: b.platforms || null,\n  account_id: b.accountId || null,\n  schedule_at: b.scheduleAt || null,\n  status: b.status || null\n}}];"
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
      jsCode: "const b = $json.body;\nreturn [{ json: { post_id: b.postId, user_id: $json.verifiedUserId } }];"
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

export default workflow('post-crud', 'Post CRUD')
  .add(webhookTrigger)
  .to(verifyAuth)
  .to(routeOperation
    .onCase(0, parseCreateData.to(insertPost.to(linkMedia.to(insertPostMedia.to(logCreate.to(respondCreate))))))
    .onCase(1, parseEditData.to(updatePost).to(respondEdit))
    .onCase(2, parseCancelData.to(cancelPost).to(respondCancel))
  );
