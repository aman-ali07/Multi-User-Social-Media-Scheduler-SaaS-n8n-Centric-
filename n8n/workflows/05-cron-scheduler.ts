const scheduleTrigger = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Every Minute',
    parameters: {
      rule: {
        interval: [{ field: 'minutes', minutesInterval: 1 }]
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
      jsCode: "const post = $json;\nconst media = $('Fetch Post Media').item?.json || {};\nreturn [{ json: {\n  postId: post.id,\n  userId: post.user_id,\n  accessToken: post.access_token,\n  pageId: post.page_id,\n  igUserId: post.ig_user_id,\n  caption: post.caption || '',\n  mediaUrl: media.file_url || '',\n  mediaType: media.file_type || '',\n  accountPlatform: post.account_platform\n}}];"
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
