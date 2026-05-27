const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Facebook Publish Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'facebook-publish',
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
      pageId: '12345',
      caption: 'Hello world!',
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

const buildFbPayload = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Facebook Payload',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const payload = $json.body;\nconst mediaUrls = Array.isArray(payload.mediaUrls) ? payload.mediaUrls : (payload.mediaUrl ? [payload.mediaUrl] : []);\nconst caption = payload.caption || '';\nconst pageId = payload.pageId;\nconst accessToken = payload.accessToken;\n\nif (mediaUrls.length === 0) {\n  const url = `https://graph.facebook.com/v21.0/${pageId}/feed?message=${encodeURIComponent(caption)}&access_token=${accessToken}`;\n  return [{ json: { url, method: 'POST', postId: payload.postId, userId: payload.userId, caption } }];\n}\n\nif (mediaUrls.length === 1) {\n  const url = `https://graph.facebook.com/v21.0/${pageId}/photos?url=${encodeURIComponent(mediaUrls[0])}&message=${encodeURIComponent(caption)}&access_token=${accessToken}&published=true`;\n  return [{ json: { url, method: 'POST', postId: payload.postId, userId: payload.userId, caption } }];\n}\n\nconst photoIds = [];\nfor (const mediaUrl of mediaUrls) {\n  const uploadUrl = `https://graph.facebook.com/v21.0/${pageId}/photos?url=${encodeURIComponent(mediaUrl)}&published=false&access_token=${accessToken}`;\n  const res = await fetch(uploadUrl, { method: 'POST' });\n  const data = await res.json();\n  if (!data.id) throw new Error(`Photo upload failed: ${data.error?.message || 'unknown error'}`);\n  photoIds.push(data.id);\n}\n\nconst attachedMedia = photoIds.map(id => ({ media_fbid: id }));\nconst url = `https://graph.facebook.com/v21.0/${pageId}/feed?message=${encodeURIComponent(caption)}&access_token=${accessToken}&attached_media_ids=${encodeURIComponent(JSON.stringify(attachedMedia))}`;\nreturn [{ json: { url, method: 'POST', postId: payload.postId, userId: payload.userId, caption } }];"
    }
  },
  output: [{
    url: 'https://graph.facebook.com/...',
    method: 'POST',
    postId: 'uuid',
    userId: 'uuid',
    caption: 'Hello'
  }]
});

const callFbApi = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Post to Facebook',
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
    body: {
      id: '12345_67890'
    },
    statusCode: 200,
    headers: {}
  }]
});

const checkResult = ifElse({
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
        queryReplacement: expr('{{ $("Build Facebook Payload").item.json.postId }}')
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
      query: "INSERT INTO post_logs (post_id, workflow_name, status, user_id, response_payload, attempt_number) VALUES ($1::uuid, 'facebook-publish', 'success', $2::uuid, $3::jsonb, 1)",
      options: {
        queryReplacement: expr('{{ $("Build Facebook Payload").item.json.postId }}, {{ $("Build Facebook Payload").item.json.userId }}, {{ $("Post to Facebook").item.json.body }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ id: 'uuid' }]
});

const logFailure = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Log Failure',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO post_logs (post_id, workflow_name, status, user_id, error_message, response_payload, attempt_number) VALUES ($1::uuid, 'facebook-publish', 'error', $2::uuid, $3, $4::jsonb, 1)",
      options: {
        queryReplacement: expr('{{ $("Build Facebook Payload").item.json.postId }}, {{ $("Build Facebook Payload").item.json.userId }}, {{ $("Post to Facebook").item.json.body.error.message }}, {{ $("Post to Facebook").item.json.body }}')
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
        queryReplacement: expr('{{ $("Post to Facebook").item.json.body.error.message }}, {{ $("Build Facebook Payload").item.json.postId }}')
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
        postId: expr('{{ $("Build Facebook Payload").item.json.postId }}'),
        platform: 'facebook',
        error: expr('{{ $("Post to Facebook").item.json.body.error.message }}')
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

const respond = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond',
    parameters: {
      respondWith: 'json',
      responseBody: {
        success: true,
        postId: expr('{{ $("Build Facebook Payload").item.json.postId }}'),
        fbPostId: expr('{{ $("Post to Facebook").item.json.body.id }}')
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
        postId: expr('{{ $("Build Facebook Payload").item.json.postId }}'),
        error: expr('{{ $("Post to Facebook").item.json.body.error.message }}')
      }
    }
  },
  output: [{}]
});

export default workflow('facebook-publish', 'Facebook Publish Workflow')
  .add(webhookTrigger)
  .to(verifyInternalToken)
  .to(buildFbPayload)
  .to(callFbApi)
  .to(checkResult
    .onTrue(markPublished.to(logSuccess).to(respond))
    .onFalse(logFailure.to(markFailed.to(callRetry.to(respondError))))
  );