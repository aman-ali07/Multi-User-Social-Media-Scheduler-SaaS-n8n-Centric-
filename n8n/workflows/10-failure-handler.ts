import { workflow, node, trigger, expr, newCredential } from '@n8n/workflow-sdk';

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
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

const logToWorkflowRuns = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO workflow_runs (workflow_name, status, error_message, input_payload, duration_ms, triggered_by) VALUES ($1, 'failed', $2, jsonb_build_object('attempt_number', $3::int, 'source', $4, 'postId', $5::uuid), 0, NULL) RETURNING id",
      options: {
        queryReplacement: expr('{{ $json.body.workflowName }}, {{ $json.body.error }}, {{ $json.body.attemptNumber || 1 }}, {{ $json.body.source }}, {{ $json.body.postId }}')
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
    parameters: {
      respondWith: 'json',
      responseBody: {
        success: true,
        message: 'Failure recorded, retries exhausted'
      }
    }
  }
});

export default workflow('failure-handler', 'Failure Handler Workflow')
  .add(webhookTrigger)
  .to(verifyInternalToken)
  .to(logToWorkflowRuns)
  .to(respond);
