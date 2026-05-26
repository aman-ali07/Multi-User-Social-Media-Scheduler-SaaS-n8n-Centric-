import { workflow, node, trigger, expr, newCredential, ifElse } from '@n8n/workflow-sdk';

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
      mediaUrl: 'https://supabase.co/storage/v1/object/public/media/uuid/file.jpg',
      mediaType: 'image/jpeg'
    }
  }]
});

const buildContainerUrl = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Container URL',
    parameters: {
      mode: 'runOnceForAllItems',
      code: "const p = $json.body;\nconst isVideo = p.mediaType.startsWith('video');\nconst baseUrl = `https://graph.facebook.com/v21.0/${p.igUserId}/media`;\nconst caption = encodeURIComponent(p.caption || '');\nconst mediaUrl = encodeURIComponent(p.mediaUrl);\nlet url;\nif (isVideo) {\n  url = `${baseUrl}?video_url=${mediaUrl}&media_type=VIDEO&caption=${caption}&access_token=${p.accessToken}`;\n} else {\n  url = `${baseUrl}?image_url=${mediaUrl}&caption=${caption}&access_token=${p.accessToken}`;\n}\nreturn [{ json: { url, method: 'POST', postId: p.postId, userId: p.userId, accessToken: p.accessToken, igUserId: p.igUserId } }];"
    }
  },
  output: [{
    url: 'https://graph.facebook.com/...',
    method: 'POST',
    postId: 'uuid',
    userId: 'uuid',
    accessToken: 'token',
    igUserId: '12345'
  }]
});

const createContainer = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Create Container',
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

const waitNode = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'Wait for Processing',
    parameters: {
      resume: 'timeInterval',
      amount: 5,
      unit: 'seconds'
    }
  },
  output: [{}]
});

const buildPublishUrl = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Publish URL',
    parameters: {
      mode: 'runOnceForAllItems',
      code: "const containerId = $(\"Create Container\").item.json.body.id;\nconst p = $(\"Build Container URL\").item.json;\nconst url = `https://graph.facebook.com/v21.0/${p.igUserId}/media_publish?creation_id=${containerId}&access_token=${p.accessToken}`;\nreturn [{ json: { url, method: 'POST', postId: p.postId, containerId } }];"
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
        queryReplacement: expr('{{ $("Build Publish URL").item.json.postId }}')
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
      query: "INSERT INTO post_logs (post_id, workflow_name, status, response_payload, attempt_number) VALUES ($1::uuid, 'instagram-publish', 'success', $2::jsonb, 1)",
      options: {
        queryReplacement: expr('{{ $("Build Publish URL").item.json.postId }}, {{ $("Publish Container").item.json.body }}')
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
        postId: expr('{{ $("Build Publish URL").item.json.postId }}'),
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
      query: "INSERT INTO post_logs (post_id, workflow_name, status, error_message, response_payload, attempt_number) VALUES ($1::uuid, 'instagram-publish', 'error', $2, $3::jsonb, 1)",
      options: {
        queryReplacement: expr('{{ $("Build Publish URL").item.json.postId }}, {{ $("Publish Container").item.json.body.error.message }}, {{ $("Publish Container").item.json.body }}')
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
        queryReplacement: expr('{{ $("Publish Container").item.json.body.error.message }}, {{ $("Build Publish URL").item.json.postId }}')
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
        postId: expr('{{ $("Build Publish URL").item.json.postId }}'),
        platform: 'instagram',
        error: expr('{{ $("Publish Container").item.json.body.error.message }}')
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
        postId: expr('{{ $("Build Publish URL").item.json.postId }}'),
        error: expr('{{ $("Publish Container").item.json.body.error.message }}')
      }
    }
  },
  output: [{}]
});

export default workflow('instagram-publish', 'Instagram Publish Workflow')
  .add(webhookTrigger)
  .to(buildContainerUrl)
  .to(createContainer)
  .to(waitNode)
  .to(buildPublishUrl)
  .to(publishContainer)
  .to(checkPublishResult
    .onTrue(markPublished.to(logSuccess).to(respond))
    .onFalse(logFailure.to(markFailed.to(callRetry.to(respondError))))
  );
