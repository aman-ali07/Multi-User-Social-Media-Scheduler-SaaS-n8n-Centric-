const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Instagram Publish Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'instagram-publish',
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
      userId: 'uuid',
      accessToken: 'token',
      igUserId: '12345',
      caption: 'Hello Instagram!',
      mediaUrls: [],
      mediaTypes: []
    }
  }]
});

const verifyInternalToken = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Verify Internal Token',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const h = $json.headers || {};\nconst token = h['x-internal-token'] || h['X-Internal-Token'] || '';\nconst expected = $env.INTERNAL_WEBHOOK_SECRET;\nif (!expected) throw new Error('INTERNAL_WEBHOOK_SECRET not configured');\nif (token !== expected) throw new Error('Forbidden: invalid internal token');\nreturn [{ json: $json }];"
    }
  }
});

const buildContainerUrl = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Container URL',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const p = $json.body;\nconst mediaUrls = Array.isArray(p.mediaUrls) ? p.mediaUrls : (p.mediaUrl ? [p.mediaUrl] : []);\nconst mediaTypes = Array.isArray(p.mediaTypes) ? p.mediaTypes : (p.mediaType ? [p.mediaType] : []);\nif (mediaUrls.length === 0) throw new Error('Instagram requires at least one media item');\nreturn [{ json: { postId: p.postId, userId: p.userId, accessToken: p.accessToken, igUserId: p.igUserId, caption: p.caption || '', mediaUrls, mediaTypes } }];"
    }
  },
  output: [{
    postId: 'uuid',
    userId: 'uuid',
    accessToken: 'token',
    igUserId: '12345',
    caption: 'Hello',
    mediaUrls: [],
    mediaTypes: []
  }]
});

const createContainer = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Create Container',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const { accessToken, igUserId, caption, mediaUrls, mediaTypes, postId, userId } = $json;\n\nif (mediaUrls.length === 1) {\n  const mediaUrl = mediaUrls[0];\n  const isVideo = mediaTypes[0]?.startsWith('video');\n  const params = isVideo\n    ? `video_url=${encodeURIComponent(mediaUrl)}&media_type=VIDEO`\n    : `image_url=${encodeURIComponent(mediaUrl)}&media_type=IMAGE`;\n  const url = `https://graph.facebook.com/v21.0/${igUserId}/media?${params}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`;\n  const res = await fetch(url, { method: 'POST' });\n  const data = await res.json();\n  if (!data.id) throw new Error(`Container creation failed: ${data.error?.message || 'unknown'}`);\n  return [{ json: { containerId: data.id, postId, userId, accessToken, igUserId } }];\n}\n\nconst childrenIds = [];\nfor (const mediaUrl of mediaUrls) {\n  const url = `https://graph.facebook.com/v21.0/${igUserId}/media?image_url=${encodeURIComponent(mediaUrl)}&is_carousel_item=true&access_token=${accessToken}`;\n  const res = await fetch(url, { method: 'POST' });\n  const data = await res.json();\n  if (!data.id) throw new Error(`Carousel item creation failed: ${data.error?.message || 'unknown'}`);\n  childrenIds.push(data.id);\n}\n\nconst carouselUrl = `https://graph.facebook.com/v21.0/${igUserId}/media?media_type=CAROUSEL&children=${encodeURIComponent(childrenIds.join(','))}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`;\nconst res = await fetch(carouselUrl, { method: 'POST' });\nconst data = await res.json();\nif (!data.id) throw new Error(`Carousel container creation failed: ${data.error?.message || 'unknown'}`);\nreturn [{ json: { containerId: data.id, postId, userId, accessToken, igUserId } }];"
    }
  },
  output: [{
    containerId: '123456789',
    postId: 'uuid',
    userId: 'uuid',
    accessToken: 'token',
    igUserId: '12345'
  }]
});

const checkContainerStatus = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Check Container Status',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const containerId = $(\"Create Container\").item.json.containerId;\nconst accessToken = $(\"Create Container\").item.json.accessToken;\nconst maxAttempts = 6;\nconst pollMs = 5000;\nfor (let i = 0; i < maxAttempts; i++) {\n  if (i > 0) await new Promise(r => setTimeout(r, pollMs));\n  const res = await fetch(`https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${accessToken}`);\n  const data = await res.json();\n  if (data.status_code === 'FINISHED') return [{ json: { containerId } }];\n  if (data.status_code === 'ERROR') throw new Error(`Container processing failed with ERROR status`);\n  if (data.error) throw new Error(`Container check failed: ${data.error.message}`);\n}\nthrow new Error(`Container not FINISHED after ${maxAttempts * pollMs / 1000}s (status: ${data.status_code}), will retry`);"
    }
  },
  output: [{ containerId: '123456789' }]
});

const buildPublishUrl = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Publish URL',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const containerId = $(\"Create Container\").item.json.containerId;\nconst p = $(\"Create Container\").item.json;\nconst url = `https://graph.facebook.com/v21.0/${p.igUserId}/media_publish?creation_id=${containerId}&access_token=${p.accessToken}`;\nreturn [{ json: { url, method: 'POST', postId: p.postId, containerId } }];"
    }
  },
  output: [{
    url: 'https://graph.facebook.com/...',
    method: 'POST',
    postId: 'uuid',
    containerId: '123456789'
  }]
});

const publishContainer = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Publish Container',
    parameters: {
      method: 'POST',
      url: expr('{{ $json.url }}'),
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
    body: { id: '123456789' },
    statusCode: 200
  }]
});

const checkPublishResult = ifElse({
  version: 2.3,
  config: {
    name: 'Publish Success?',
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

const markPublished = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Mark Published',
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE scheduled_posts SET status = 'published', published_at = NOW(), updated_at = NOW() WHERE id = $1::uuid",
      options: {
        queryReplacement: expr('{{ $("Create Container").item.json.postId }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ success: true }]
});

const logSuccess = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Log Success',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO post_logs (post_id, workflow_name, status, user_id, response_payload, attempt_number) VALUES ($1::uuid, 'instagram-publish', 'success', $2::uuid, $3::jsonb, 1)",
      options: {
        queryReplacement: expr('{{ $("Create Container").item.json.postId }}, {{ $("Create Container").item.json.userId }}, {{ $("Publish Container").item.json.body }}')
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
      responseBody: {
        success: true,
        postId: expr('{{ $("Create Container").item.json.postId }}'),
        igPostId: expr('{{ $("Publish Container").item.json.body.id }}')
      }
    }
  },
  output: [{}]
});

const logFailure = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Log Failure',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO post_logs (post_id, workflow_name, status, user_id, error_message, response_payload, attempt_number) VALUES ($1::uuid, 'instagram-publish', 'error', $2::uuid, $3, $4::jsonb, 1)",
      options: {
        queryReplacement: expr('{{ $("Create Container").item.json.postId }}, {{ $("Create Container").item.json.userId }}, {{ $("Publish Container").item.json.body.error.message }}, {{ $("Publish Container").item.json.body }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ id: 'uuid' }]
});

const markFailed = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Mark Failed',
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE scheduled_posts SET status = 'failed', error_message = $1, retry_count = retry_count + 1, updated_at = NOW() WHERE id = $2::uuid",
      options: {
        queryReplacement: expr('{{ $("Publish Container").item.json.body.error.message }}, {{ $("Create Container").item.json.postId }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ success: true }]
});

const callRetry = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Call Retry Handler',
    parameters: {
      method: 'POST',
      url: expr('{{ $env.N8N_WEBHOOK_URL }}/webhook/retry'),
      authentication: 'none',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: {
        postId: expr('{{ $("Create Container").item.json.postId }}'),
        platform: 'instagram',
        error: expr('{{ $("Publish Container").item.json.body.error.message }}')
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

const respondError = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond Error',
    parameters: {
      respondWith: 'json',
      responseBody: {
        success: false,
        postId: expr('{{ $("Create Container").item.json.postId }}'),
        error: expr('{{ $("Publish Container").item.json.body.error.message }}')
      }
    }
  },
  output: [{}]
});

export default workflow('instagram-publish', 'Instagram Publish Workflow')
  .add(webhookTrigger)
  .to(verifyInternalToken)
  .to(buildContainerUrl)
  .to(createContainer)
  .to(checkContainerStatus)
  .to(buildPublishUrl)
  .to(publishContainer)
  .to(checkPublishResult
    .onTrue(markPublished.to(logSuccess).to(respond))
    .onFalse(logFailure.to(markFailed.to(callRetry.to(respondError))))
  );