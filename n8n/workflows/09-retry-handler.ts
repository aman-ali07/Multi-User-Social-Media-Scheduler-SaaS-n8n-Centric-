const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Retry Handler Webhook',
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

const checkPost = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Check Post Status',
    parameters: {
      operation: 'executeQuery',
      query: "SELECT id, retry_count, max_retries FROM scheduled_posts WHERE id = $1::uuid",
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
    retry_count: 1,
    max_retries: 3
  }]
});

const checkRetries = ifElse({
  version: 2.3,
  config: {
    name: 'Retries Remaining?',
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
    name: 'Compute Backoff',
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: "const retryCount = $json.retry_count;\nconst delayMinutes = Math.pow(2, retryCount) * 5;\nconst retryAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();\nreturn [{ json: { retryAt, delayMinutes } }];"
    }
  },
  output: [{
    retryAt: '2026-05-27T...',
    delayMinutes: 10
  }]
});

const reschedulePost = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Reschedule Post',
    parameters: {
      operation: 'executeQuery',
      query: "UPDATE scheduled_posts SET status = 'scheduled', schedule_at = $1::timestamptz, updated_at = NOW() WHERE id = $2::uuid",
      options: {
        queryReplacement: expr('{{ $json.retryAt }}, {{ $("Check Post Status").item.json.id }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ success: true }]
});

const callFailureHandler = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Call Failure Handler',
    parameters: {
      method: 'POST',
      url: expr('{{ $env.N8N_WEBHOOK_URL }}/webhook/failure-handler'),
      authentication: 'none',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: {
        postId: expr('{{ $json.body.postId }}'),
        workflowName: expr('{{ $json.body.platform }}-publish'),
        error: expr('{{ $json.body.error }}'),
        attemptNumber: expr('{{ $json.body.attemptNumber || 1 }}'),
        platform: expr('{{ $json.body.platform }}'),
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
        action: expr('{{ $json.delayMinutes ? "retry" : "exhausted" }}'),
        postId: expr('{{ $("Check Post Status").item.json.id }}')
      }
    }
  },
  output: [{}]
});

export default workflow('retry-handler', 'Retry Handler')
  .add(webhookTrigger)
  .to(checkPost)
  .to(checkRetries
    .onTrue(computeBackoff.to(reschedulePost).to(respond))
    .onFalse(callFailureHandler.to(respond))
  );
