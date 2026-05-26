import { workflow, node, trigger, expr, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Failure Handler Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'failure-handler',
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
      workflowName: 'facebook-publish',
      error: 'Error message',
      attemptNumber: 1,
      platform: 'facebook',
      source: 'Workflow Node Name'
    }
  }]
});

const logToWorkflowRuns = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Log to Workflow Runs',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO workflow_runs (workflow_name, status, error_message, input_payload, duration_ms, triggered_by) VALUES ($1, 'failed', $2, $3::jsonb, 0, NULL) RETURNING id",
      options: {
        queryReplacement: expr('{{ $json.body.workflowName }}, {{ $json.body.error }}, { "attempt_number": {{ $json.body.attemptNumber }}, "source": "{{ $json.body.source }}", "postId": "{{ $json.body.postId }}" }')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{ id: 'uuid' }]
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
        postId: expr('{{ $("Failure Handler Webhook").item.json.body.postId }}'),
        platform: expr('{{ $("Failure Handler Webhook").item.json.body.platform }}'),
        error: expr('{{ $("Failure Handler Webhook").item.json.body.error }}'),
        attemptNumber: expr('{{ $("Failure Handler Webhook").item.json.body.attemptNumber }}')
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
        message: 'Failure handled and retry initiated'
      }
    }
  },
  output: [{}]
});

export default workflow('failure-handler', 'Failure Handler Workflow')
  .add(webhookTrigger)
  .to(logToWorkflowRuns)
  .to(callRetry)
  .to(respond);
