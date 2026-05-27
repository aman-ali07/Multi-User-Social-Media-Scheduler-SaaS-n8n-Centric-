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
      jsCode: "const b = $json.body;\nreturn [{ json: {\n  user_id: b.userId,\n  account_id: b.accountId || null,\n  title: b.title || null,\n  caption: b.caption || null,\n  platforms: b.platforms || ['facebook'],\n  schedule_at: b.scheduleAt || null,\n  timezone: b.timezone || 'UTC',\n  status: b.status || 'draft',\n  media_ids: b.mediaIds || []\n}}];"
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
      jsCode: "const postId = $json.id;\nconst mediaIds = $('Parse Create Data').item.json.media_ids;\nif (!mediaIds || mediaIds.length === 0) return [{ json: { post_id: postId, linked: false } }];\nreturn mediaIds.map((mid, i) => ({ json: { post_id: postId, media_id: mid, sort_order: i } }));"
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
      jsCode: "const b = $json.body;\nreturn [{ json: {\n  post_id: b.postId,\n  user_id: b.userId,\n  title: b.title || null,\n  caption: b.caption || null,\n  platforms: b.platforms || null,\n  account_id: b.accountId || null,\n  schedule_at: b.scheduleAt || null,\n  status: b.status || null\n}}];"
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
      jsCode: "const b = $json.body;\nreturn [{ json: { post_id: b.postId, user_id: b.userId } }];"
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
  .to(routeOperation
    .onCase(0, parseCreateData.to(insertPost.to(linkMedia.to(checkNeedsMedia.onFalse(insertPostMedia).onTrue(logCreate))).to(logCreate).to(respondCreate)))
    .onCase(1, parseEditData.to(updatePost).to(respondEdit))
    .onCase(2, parseCancelData.to(cancelPost).to(respondCancel))
  );
