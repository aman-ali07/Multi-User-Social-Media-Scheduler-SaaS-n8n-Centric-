import { workflow, trigger, node, expr, newCredential, ifElse } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
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
      query: "SELECT id, published_meta_id, container_id FROM scheduled_posts WHERE id = $1::uuid",
      options: {
        queryReplacement: expr('{{ $json.body.postId }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ id: 'uuid', published_meta_id: '123456789', container_id: '123456789' }]
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

const hasExistingContainer = ifElse({
  version: 2.3,
  config: {
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          leftValue: expr('{{ $json.container_id }}'),
          operator: { type: 'string', operation: 'isNotEmpty' },
          rightValue: ''
        }],
        combinator: 'and'
      }
    }
  }
});

const formatExistingContainer = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "return [{ json: {\n  containerId: $json.container_id,\n  postId: $json.body.postId,\n  userId: $json.body.userId,\n  accessToken: $json.body.accessToken,\n  igUserId: $json.body.igUserId\n} }];"
    }
  }
});

const createContainer = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "try {\n  const p = $json.body;\n  const mediaUrls = Array.isArray(p.mediaUrls) ? p.mediaUrls : (p.mediaUrl ? [p.mediaUrl] : []);\n  const mediaTypes = Array.isArray(p.mediaTypes) ? p.mediaTypes : (p.mediaType ? [p.mediaType] : []);\n  if (mediaUrls.length === 0) throw new Error('Instagram requires at least one media item');\n\n  const accessToken = p.accessToken;\n  const igUserId = p.igUserId;\n  const caption = p.caption || '';\n  const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };\n  const base = `https://graph.facebook.com/v21.0/${igUserId}`;\n\n  if (mediaUrls.length === 1) {\n    const mediaUrl = mediaUrls[0];\n    const isVideo = mediaTypes[0]?.startsWith('video');\n    const body = isVideo\n      ? { video_url: mediaUrl, media_type: 'VIDEO', caption }\n      : { image_url: mediaUrl, media_type: 'IMAGE', caption };\n    const res = await fetch(`${base}/media`, { method: 'POST', headers, body: JSON.stringify(body) });\n    const data = await res.json();\n    if (!data.id) throw new Error(`Container creation failed: ${data.error?.message || 'unknown'}`);\n    return [{ json: { containerId: data.id, postId: p.postId, userId: p.userId, accessToken, igUserId } }];\n  }\n\n  const childrenIds = [];\n  for (let i = 0; i < mediaUrls.length; i++) {\n    const mediaUrl = mediaUrls[i];\n    const isVideo = mediaTypes[i]?.startsWith('video');\n    const body = isVideo ? { video_url: mediaUrl, is_carousel_item: true, media_type: 'VIDEO' } : { image_url: mediaUrl, is_carousel_item: true };\n    const res = await fetch(`${base}/media`, { method: 'POST', headers, body: JSON.stringify(body) });\n    const data = await res.json();\n    if (!data.id) throw new Error(`Carousel item creation failed: ${data.error?.message || 'unknown'}`);\n    childrenIds.push(data.id);\n  }\n\n  const body = { media_type: 'CAROUSEL', children: childrenIds, caption };\n  const res = await fetch(`${base}/media`, { method: 'POST', headers, body: JSON.stringify(body) });\n  const data = await res.json();\n  if (!data.id) throw new Error(`Carousel container creation failed: ${data.error?.message || 'unknown'}`);\n  return [{ json: { containerId: data.id, postId: p.postId, userId: p.userId, accessToken, igUserId } }];\n} catch (err) {\n  return [{ json: { hasError: true, errorMsg: err.message, postId: $json.body?.postId, userId: $json.body?.userId } }];\n}"
    }
  }
});

const checkCreateError = ifElse({
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

const saveContainerId = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE scheduled_posts SET container_id = $1, updated_at = NOW() WHERE id = $2::uuid",
      options: {
        queryReplacement: expr('{{ $json.containerId }}, {{ $json.postId }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  }
});

const checkContainerStatus = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "try {\n  const containerId = $json.containerId;\n  const accessToken = $json.accessToken;\n  const headers = { 'Authorization': `Bearer ${accessToken}` };\n  const url = `https://graph.facebook.com/v21.0/${containerId}?fields=status_code`;\n  const res = await fetch(url, { headers });\n  const data = await res.json();\n  if (data.status_code === 'FINISHED') return [{ json: { containerId, userId: $json.userId, postId: $json.postId, igUserId: $json.igUserId, accessToken } }];\n  if (data.status_code === 'ERROR') throw new Error(`Container processing failed with ERROR status`);\n  if (data.status_code === 'IN_PROGRESS' || data.status_code === 'PUBLISHED') throw new Error(`Container processing: ${data.status_code}. Will retry later.`);\n  if (data.error) throw new Error(`Container check failed: ${data.error.message}`);\n  throw new Error(`Unknown status: ${data.status_code}`);\n} catch (err) {\n  return [{ json: { hasError: true, errorMsg: err.message, postId: $json.postId, userId: $json.userId } }];\n}"
    }
  }
});

const checkStatusError = ifElse({
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

const publishContainer = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "try {\n  const containerId = $json.containerId;\n  const igUserId = $json.igUserId;\n  const accessToken = $json.accessToken;\n  const url = `https://graph.facebook.com/v21.0/${igUserId}/media_publish`;\n  const body = { creation_id: containerId };\n  const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };\n  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });\n  const data = await res.json();\n  if (!data.id) {\n    return [{ json: { hasError: true, errorMsg: data.error?.message || 'Publish failed', postId: $json.postId, userId: $json.userId } }];\n  }\n  return [{ json: { body: { id: data.id }, statusCode: 200, postId: $json.postId, userId: $json.userId } }];\n} catch (err) {\n  return [{ json: { hasError: true, errorMsg: err.message, postId: $json.postId, userId: $json.userId } }];\n}"
    }
  }
});

const checkPublishError = ifElse({
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

const saveIgMetaId = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE scheduled_posts SET published_meta_id = $1, updated_at = NOW() WHERE id = $2::uuid",
      options: {
        queryReplacement: expr('{{ $json.body.id }}, {{ $json.postId }}')
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
        queryReplacement: expr('{{ $json.postId }}')
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
      query: "INSERT INTO post_logs (post_id, workflow_name, status, user_id, attempt_number) VALUES ($1::uuid, 'instagram-publish', 'success', $2::uuid, 1)",
      options: {
        queryReplacement: expr('{{ $json.postId }}, {{ $json.userId }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  }
});

// ==========================================
// FAILURE PATH
// ==========================================
// All failure paths funnel into this logging chain.

const logFailure = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO post_logs (post_id, workflow_name, status, user_id, error_message, attempt_number) VALUES ($1::uuid, 'instagram-publish', 'error', $2::uuid, $3, 1)",
      options: {
        queryReplacement: expr('{{ $json.postId }}, {{ $json.userId }}, {{ $json.errorMsg }}')
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
        queryReplacement: expr('{{ $json.errorMsg }}, {{ $json.postId }}')
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
        postId: expr('{{ $json.postId }}'),
        platform: 'instagram',
        error: expr('{{ $json.errorMsg }}')
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

export default workflow('instagram-publish', 'Instagram Publish Workflow')
  .add(webhookTrigger)
  .to(verifyInternalToken)
  .to(checkAlreadyPublished)
  .to(isAlreadyPublished
    .onTrue(respondAlreadyPublished)
    .onFalse(hasExistingContainer
      .onTrue(formatExistingContainer.to(checkContainerStatus))
      .onFalse(createContainer.to(checkCreateError
        .onFalse(saveContainerId.to(checkContainerStatus))
        .onTrue(logFailure.to(markFailed).to(callRetry))
      ))
      .then(checkStatusError
        .onFalse(publishContainer.to(checkPublishError
          .onFalse(saveIgMetaId.to(markPublished).to(logSuccess))
          .onTrue(logFailure)
        ))
        .onTrue(logFailure)
      )
    )
  );
