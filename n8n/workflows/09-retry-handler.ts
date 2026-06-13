import { workflow, trigger, node, expr, newCredential, ifElse } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    parameters: {
      httpMethod: 'POST',
      path: 'retry',
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
      postId: 'uuid',
      platform: 'facebook',
      error: 'Error message',
      attemptNumber: 1
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

const checkPost = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "SELECT id, user_id, retry_count, max_retries FROM scheduled_posts WHERE id = $1::uuid",
      options: {
        queryReplacement: expr('{{ $json.body.postId }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{
    id: 'uuid',
    user_id: 'uuid',
    retry_count: 1,
    max_retries: 3
  }]
});

const checkRetries = ifElse({
  version: 2.3,
  config: {
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          leftValue: expr('{{ $json.retry_count }}'),
          operator: { type: 'number', operation: 'lessThan' },
          rightValue: expr('{{ $json.max_retries }}')
        }],
        combinator: 'and'
      }
    }
  }
});

const computeBackoff = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const retryCount = $json.retry_count;\nconst baseDelayMs = Math.pow(2, retryCount) * 5 * 60 * 1000;\nconst jitter = Math.random() * baseDelayMs * 0.1;\nconst retryAt = new Date(Date.now() + baseDelayMs + jitter).toISOString();\nreturn [{ json: { retryAt } }];"
    }
  },
  output: [{ retryAt: '2026-06-10T...' }]
});

const incrementAndReschedule = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE scheduled_posts SET status = 'scheduled', retry_count = retry_count + 1, schedule_at = $1::timestamptz, updated_at = NOW() WHERE id = $2::uuid AND status = 'failed' AND deleted_at IS NULL",
      options: {
        queryReplacement: expr('{{ $json.retryAt }}, {{ $("checkPost").item.json.id }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  }
});

const callFailureHandler = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    parameters: {
      method: 'POST',
      url: expr('{{ $env.N8N_WEBHOOK_URL }}/webhook/failure-handler'),
      authentication: 'none',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: {
        postId: expr('{{ $("checkPost").item.json.id }}'),
        userId: expr('{{ $("checkPost").item.json.user_id || "" }}'),
        workflowName: expr('{{ $("webhookTrigger").item.body.platform }}-publish'),
        error: expr('{{ $("webhookTrigger").item.body.error }}'),
        attemptNumber: expr('{{ $("webhookTrigger").item.body.attemptNumber || 1 }}'),
        platform: expr('{{ $("webhookTrigger").item.body.platform }}'),
        source: 'Retry Handler'
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

const respond = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    parameters: {
      respondWith: 'json',
      responseBody: {
        action: expr('{{ $json.retryAt ? "retry" : "exhausted" }}'),
        postId: expr('{{ $("checkPost").item.json.id }}')
      }
    }
  }
});

export default workflow('retry-handler', 'Retry Handler')
  .add(webhookTrigger)
  .to(verifyInternalToken)
  .to(checkPost)
  .to(checkRetries
    .onTrue(computeBackoff.to(incrementAndReschedule).to(respond))
    .onFalse(callFailureHandler.to(respond))
  );
