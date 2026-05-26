import { workflow, node, trigger, expr, newCredential, ifElse } from '@n8n/workflow-sdk';

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
      mediaUrl: 'https://supabase.co/storage/v1/object/public/media/uuid/file.jpg',
      mediaType: 'image/jpeg'
    }
  }]
});

const buildFbPayload = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Facebook Payload',
    parameters: {
      mode: 'runOnceForAllItems',
      code: "const payload = $json.body;\nconst url = payload.mediaUrl\n  ? `https://graph.facebook.com/v21.0/${payload.pageId}/photos?url=${encodeURIComponent(payload.mediaUrl)}&message=${encodeURIComponent(payload.caption || '')}&access_token=${payload.accessToken}&published=true`\n  : `https://graph.facebook.com/v21.0/${payload.pageId}/feed?message=${encodeURIComponent(payload.caption || '')}&access_token=${payload.accessToken}`;\n\nreturn [{\n  json: {\n    url: url,\n    method: 'POST',\n    postId: payload.postId,\n    userId: payload.userId,\n    caption: payload.caption\n  }\n}];"
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
      query: "INSERT INTO post_logs (post_id, workflow_name, status, response_payload, attempt_number) VALUES ($1::uuid, 'facebook-publish', 'success', $2::jsonb, 1)",
      options: {
        queryReplacement: expr('{{ $("Build Facebook Payload").item.json.postId }}, {{ $("Post to Facebook").item.json.body }}')
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
      query: "INSERT INTO post_logs (post_id, workflow_name, status, error_message, response_payload, attempt_number) VALUES ($1::uuid, 'facebook-publish', 'error', $2, $3::jsonb, 1)",
      options: {
        queryReplacement: expr('{{ $("Build Facebook Payload").item.json.postId }}, {{ $("Post to Facebook").item.json.body.error.message }}, {{ $("Post to Facebook").item.json.body }}')
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
  .to(buildFbPayload)
  .to(callFbApi)
  .to(checkResult
    .onTrue(markPublished.to(logSuccess).to(respond))
    .onFalse(logFailure.to(markFailed.to(callRetry.to(respondError))))
  );
