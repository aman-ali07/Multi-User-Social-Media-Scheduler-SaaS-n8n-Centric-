import { workflow, trigger, node, expr, newCredential, ifElse } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
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
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const h = $json.headers || {};\nconst token = h['x-internal-token'] || h['X-Internal-Token'] || '';\nconst expected = $env.INTERNAL_WEBHOOK_SECRET;\nif (!expected) throw new Error('INTERNAL_WEBHOOK_SECRET not configured');\nif (token !== expected) throw new Error('Forbidden: invalid internal token');\nreturn [{ json: $json }];"
    }
  }
});

const checkAlreadyPublished = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "SELECT id, published_meta_id FROM scheduled_posts WHERE id = $1::uuid",
      options: {
        queryReplacement: expr('{{ $json.body.postId }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ id: 'uuid', published_meta_id: '12345_67890' }]
});

const isAlreadyPublished = ifElse({
  version: 2.3,
  config: {
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          leftValue: expr('{{ $json.published_meta_id }}'),
          operator: { type: 'string', operation: 'isNotEmpty' },
          rightValue: ''
        }],
        combinator: 'and'
      }
    }
  }
});

const buildFbPayload = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "try {\n  const payload = $json.body;\n  const mediaUrls = Array.isArray(payload.mediaUrls) ? payload.mediaUrls : (payload.mediaUrl ? [payload.mediaUrl] : []);\n  const mediaTypes = Array.isArray(payload.mediaTypes) ? payload.mediaTypes : (payload.mediaType ? [payload.mediaType] : []);\n  const caption = payload.caption || '';\n  const pageId = payload.pageId;\n  const accessToken = payload.accessToken;\n\n  const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };\n  const base = `https://graph.facebook.com/v21.0/${pageId}`;\n\n  if (mediaUrls.length === 0) {\n    const url = `${base}/feed`;\n    const body = { message: caption };\n    return [{ json: { url, method: 'POST', postId: payload.postId, userId: payload.userId, caption, headers, body } }];\n  }\n\n  const hasVideo = mediaTypes.some(t => typeof t === 'string' && t.startsWith('video'));\n  if (hasVideo && mediaUrls.length > 1) {\n    throw new Error('Cannot mix videos with other media or upload multiple videos in one Facebook post');\n  }\n\n  if (hasVideo) {\n    const url = `${base}/videos`;\n    const body = { file_url: mediaUrls[0], description: caption, published: true };\n    return [{ json: { url, method: 'POST', postId: payload.postId, userId: payload.userId, caption, headers, body } }];\n  }\n\n  if (mediaUrls.length === 1) {\n    const url = `${base}/photos`;\n    const body = { url: mediaUrls[0], message: caption, published: true };\n    return [{ json: { url, method: 'POST', postId: payload.postId, userId: payload.userId, caption, headers, body } }];\n  }\n\n  const photoIds = [];\n  for (const mediaUrl of mediaUrls) {\n    const uploadUrl = `${base}/photos`;\n    const res = await fetch(uploadUrl, {\n      method: 'POST',\n      headers,\n      body: JSON.stringify({ url: mediaUrl, published: false })\n    });\n    const data = await res.json();\n    if (!data.id) throw new Error(`Photo upload failed: ${data.error?.message || 'unknown error'}`);\n    photoIds.push(data.id);\n  }\n\n  const attachedMedia = photoIds.map(id => ({ media_fbid: id }));\n  const url = `${base}/feed`;\n  const body = { message: caption, attached_media: attachedMedia };\n  return [{ json: { url, method: 'POST', postId: payload.postId, userId: payload.userId, caption, headers, body } }];\n} catch (err) {\n  return [{ json: { hasError: true, errorMsg: err.message, postId: $json.body?.postId, userId: $json.body?.userId } }];\n}"
    }
  },
  output: [{
    url: 'https://graph.facebook.com/...',
    method: 'POST',
    headers: {},
    body: {},
    postId: 'uuid',
    userId: 'uuid',
    caption: 'Hello'
  }]
});

const checkPayloadError = ifElse({
  version: 2.3,
  config: {
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          leftValue: expr('{{ $json.hasError }}'),
          operator: { type: 'boolean', operation: 'true' }
        }],
        combinator: 'and'
      }
    }
  }
});

const callFbApi = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    parameters: {
      method: 'POST',
      url: expr('{{ $json.url }}'),
      authentication: 'none',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: {
        message: expr('{{ $json.body.message }}'),
        url: expr('{{ $json.body.url }}'),
        published: expr('{{ $json.body.published }}'),
        attached_media: expr('{{ $json.body.attached_media }}')
      },
      headerParameters: {
        parameters: [
          { name: 'Authorization', value: expr('{{ $json.headers.Authorization }}') }
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
    body: { id: '12345_67890' },
    statusCode: 200,
    headers: {}
  }]
});

const checkResult = ifElse({
  version: 2.3,
  config: {
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          leftValue: expr('{{ $json.statusCode }}'),
          operator: { type: 'number', operation: 'equals' },
          rightValue: 200
        }, {
          leftValue: expr('{{ $json.body.error }}'),
          operator: { type: 'boolean', operation: 'exists' },
          rightValue: false
        }],
        combinator: 'and'
      }
    }
  }
});

const saveMetaId = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE scheduled_posts SET published_meta_id = $1, updated_at = NOW() WHERE id = $2::uuid",
      options: {
        queryReplacement: expr('{{ $("Post to Facebook").item.json.body.id }}, {{ $("Build Facebook Payload").item.json.postId }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  }
});

const markPublished = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
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
  }
});

const logSuccess = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO post_logs (post_id, workflow_name, status, user_id, attempt_number) VALUES ($1::uuid, 'facebook-publish', 'success', $2::uuid, $3::int)",
      options: {
        queryReplacement: expr('{{ $("Build Facebook Payload").item.json.postId }}, {{ $("Build Facebook Payload").item.json.userId }}, {{ $("Webhook").item.body.attemptNumber || 1 }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  }
});

// ==========================================
// FAILURE PATH A: API Failed
// ==========================================

const logFailure = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO post_logs (post_id, workflow_name, status, user_id, error_message, attempt_number) VALUES ($1::uuid, 'facebook-publish', 'error', $2::uuid, $3, $4::int)",
      options: {
        queryReplacement: expr('{{ $("Build Facebook Payload").item.json.postId }}, {{ $("Build Facebook Payload").item.json.userId }}, {{ $("Post to Facebook").item.json.body.error?.message || $("Post to Facebook").item.json.statusCode }}, {{ $("Webhook").item.body.attemptNumber || 1 }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  }
});

const markFailed = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE scheduled_posts SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2::uuid",
      options: {
        queryReplacement: expr('{{ $("Post to Facebook").item.json.body.error?.message || $("Post to Facebook").item.json.statusCode }}, {{ $("Build Facebook Payload").item.json.postId }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  }
});

const callRetry = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
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
        error: expr('{{ $("Post to Facebook").item.json.body.error?.message || $("Post to Facebook").item.json.statusCode }}')
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
  }
});

// ==========================================
// FAILURE PATH B: Payload Build Failed
// ==========================================

const logPayloadFailure = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO post_logs (post_id, workflow_name, status, user_id, error_message, attempt_number) VALUES ($1::uuid, 'facebook-publish', 'error', $2::uuid, $3, $4::int)",
      options: {
        queryReplacement: expr('{{ $("Build Facebook Payload").item.json.postId }}, {{ $("Build Facebook Payload").item.json.userId }}, {{ $("Build Facebook Payload").item.json.errorMsg }}, {{ $("Webhook").item.body.attemptNumber || 1 }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  }
});

const markPayloadFailed = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE scheduled_posts SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2::uuid",
      options: {
        queryReplacement: expr('{{ $("Build Facebook Payload").item.json.errorMsg }}, {{ $("Build Facebook Payload").item.json.postId }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  }
});

const callPayloadRetry = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
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
        error: expr('{{ $("Build Facebook Payload").item.json.errorMsg }}')
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
  }
});

// ==========================================
// RESPONSES
// ==========================================

const respondAlreadyPublished = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    parameters: {
      respondWith: 'json',
      responseBody: {
        success: true,
        postId: expr('{{ $json.id }}'),
        note: 'Already published (skipped)'
      }
    }
  }
});

export default workflow('facebook-publish', 'Facebook Publish Workflow')
  .add(webhookTrigger)
  .to(verifyInternalToken)
  .to(checkAlreadyPublished)
  .to(isAlreadyPublished
    .onTrue(respondAlreadyPublished)
    .onFalse(buildFbPayload.to(checkPayloadError
      .onFalse(callFbApi.to(checkResult
        .onTrue(saveMetaId.to(markPublished).to(logSuccess))
        .onFalse(logFailure.to(markFailed).to(callRetry))
      ))
      .onTrue(logPayloadFailure.to(markPayloadFailed).to(callPayloadRetry))
    ))
  );
