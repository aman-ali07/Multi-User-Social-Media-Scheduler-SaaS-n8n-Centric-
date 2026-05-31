import { workflow, trigger, node, expr, newCredential } from '@n8n/workflow-sdk';

const scheduleTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Every 5 Minutes',
    parameters: {
      rule: {
        interval: [{ field: 'minutes', minutesInterval: 5 }]
      }
    }
  },
  output: [{}]
});

const fetchExpiringTokens = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Fetch Expiring Tokens',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT sa.id, sa.user_id, sa.platform, sa.page_id, decrypt_token(sa.access_token) AS access_token, sa.token_expires_at FROM social_accounts sa WHERE sa.status = 'active' AND sa.token_expires_at IS NOT NULL AND sa.token_expires_at < NOW() + INTERVAL '24 hours' AND sa.token_expires_at > NOW()",
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
    platform: 'facebook',
    page_id: '12345',
    access_token: 'EAA...',
    token_expires_at: '2026-05-28T...'
  }]
});

const hasExpiringTokens = ifElse({
  version: 2.3,
  config: {
    name: 'Has Expiring Tokens?',
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

const refreshSib = splitInBatches({
  version: 3,
  config: {
    name: 'Refresh Each Token',
    parameters: {
      batchSize: 1
    }
  }
});

const callTokenRefresh = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Exchange for Long-Lived Token',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const { id, access_token, page_id } = $json;\n// Page-scoped tokens cannot be refreshed via fb_exchange_token (user-token endpoint).\n// Instead, fetch a fresh page token via the Page node with the existing token.\nconst url = `https://graph.facebook.com/v21.0/${page_id}?fields=access_token&access_token=${encodeURIComponent(access_token)}`;\nconst res = await fetch(url);\nconst data = await res.json();\nif (!data.access_token) throw new Error(`Token refresh failed: ${data.error?.message || 'unknown error'}`);\n// Page tokens have a standard 60-day expiry from refresh time\nconst expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();\nreturn [{ json: { accountId: id, newToken: data.access_token, expiresAt } }];"
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
    name: 'Store Refreshed Token',
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
      query: "SELECT sp.id, sp.user_id, sp.account_id, sp.caption, sp.platforms, sp.schedule_at, sp.timezone, decrypt_token(sa.access_token) AS access_token, sa.page_id, sa.ig_user_id, sa.platform AS account_platform, sa.status AS account_status FROM scheduled_posts sp JOIN social_accounts sa ON sa.id = sp.account_id WHERE sp.status = 'scheduled' AND sp.schedule_at <= NOW() AND sp.deleted_at IS NULL AND sa.status = 'active' AND sa.token_expires_at > NOW() ORDER BY sp.schedule_at ASC LIMIT 50 FOR UPDATE SKIP LOCKED",
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
      query: "SELECT ma.file_url, ma.file_type, ma.id AS media_id FROM post_media pm JOIN media_assets ma ON ma.id = pm.media_id WHERE pm.post_id = $1::uuid ORDER BY pm.sort_order ASC",
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
    file_type: 'image/jpeg',
    media_id: 'uuid'
  }]
});

const dispatchToPublish = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Dispatch Payload',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const post = $json;\nconst mediaItems = $('Fetch Post Media').all();\nconst mediaUrls = mediaItems.map(m => m.json.file_url).filter(Boolean);\nconst mediaTypes = mediaItems.map(m => m.json.file_type).filter(Boolean);\nconst platforms = post.platforms || [];\nconst results = [];\n\nif (platforms.includes('facebook')) {\n  results.push({ json: {\n    postId: post.id,\n    userId: post.user_id,\n    accessToken: post.access_token,\n    pageId: post.page_id,\n    caption: post.caption || '',\n    mediaUrls: mediaUrls,\n    mediaTypes: mediaTypes,\n    targetPlatform: 'facebook'\n  }});\n}\n\nif (platforms.includes('instagram') && post.ig_user_id) {\n  results.push({ json: {\n    postId: post.id,\n    userId: post.user_id,\n    accessToken: post.access_token,\n    igUserId: post.ig_user_id,\n    caption: post.caption || '',\n    mediaUrls: mediaUrls,\n    mediaTypes: mediaTypes,\n    targetPlatform: 'instagram'\n  }});\n}\n\nreturn results;"
    }
  },
  output: [{
    postId: 'uuid',
    userId: 'uuid',
    accessToken: 'EAA...',
    pageId: '12345',
    igUserId: '67890',
    caption: 'Hello',
    mediaUrls: [],
    mediaTypes: [],
    targetPlatform: 'facebook'
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
          leftValue: expr('{{ $json.targetPlatform }}'),
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
      sendHeaders: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: {
        postId: expr('{{ $json.postId }}'),
        userId: expr('{{ $json.userId }}'),
        accessToken: expr('{{ $json.accessToken }}'),
        pageId: expr('{{ $json.pageId }}'),
        caption: expr('{{ $json.caption }}'),
        mediaUrls: expr('{{ $json.mediaUrls }}'),
        mediaTypes: expr('{{ $json.mediaTypes }}')
      },
      headerParameters: {
        parameters: [
          { name: 'x-internal-token', value: expr('{{ $env.INTERNAL_WEBHOOK_SECRET }}') }
        ]
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
      sendHeaders: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: {
        postId: expr('{{ $json.postId }}'),
        userId: expr('{{ $json.userId }}'),
        accessToken: expr('{{ $json.accessToken }}'),
        igUserId: expr('{{ $json.igUserId }}'),
        caption: expr('{{ $json.caption }}'),
        mediaUrls: expr('{{ $json.mediaUrls }}'),
        mediaTypes: expr('{{ $json.mediaTypes }}')
      },
      headerParameters: {
        parameters: [
          { name: 'x-internal-token', value: expr('{{ $env.INTERNAL_WEBHOOK_SECRET }}') }
        ]
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
  .to(fetchExpiringTokens)
  .to(hasExpiringTokens
    .onTrue(refreshSib.onEachBatch(callTokenRefresh.to(storeRefreshedToken).to(nextBatch(refreshSib))))
  )
  .to(fetchPendingPosts)
  .to(checkHasPosts
    .onTrue(sib
      .onEachBatch(fetchMedia.to(dispatchToPublish).to(routePlatform
        .onTrue(callFacebookPublish.to(nextBatch(sib)))
        .onFalse(callInstagramPublish.to(nextBatch(sib)))
      ))
    )
  );