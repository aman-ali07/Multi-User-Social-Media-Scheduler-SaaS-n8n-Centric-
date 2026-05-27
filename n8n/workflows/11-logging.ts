const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Logging Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'log',
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
      workflowName: 'facebook-publish',
      status: 'running',
      inputPayload: {},
      outputPayload: {},
      errorMessage: null,
      durationMs: 1234,
      triggeredBy: null
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

const insertLog = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Insert Workflow Run Log',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO workflow_runs (workflow_name, status, input_payload, output_payload, error_message, duration_ms, triggered_by) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7::uuid) RETURNING id",
      options: {
        queryReplacement: expr('{{ $json.body.workflowName }}, {{ $json.body.status }}, {{ $json.body.inputPayload }}, {{ $json.body.outputPayload }}, {{ $json.body.errorMessage }}, {{ $json.body.durationMs }}, {{ $json.body.triggeredBy }}')
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
      responseBody: { id: expr('{{ $json.id }}'), logged: true }
    }
  },
  output: [{}]
});

export default workflow('logging', 'Logging')
  .add(webhookTrigger)
  .to(verifyInternalToken)
  .to(insertLog)
  .to(respond);
