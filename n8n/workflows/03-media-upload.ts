const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Media Upload Webhook',
    parameters: {
      httpMethod: 'POST',
      path: 'media-upload',
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
      userId: 'uuid',
      fileUrl: 'https://supabase.co/storage/...',
      fileType: 'image/jpeg'
    }
  }]
});

const insertMedia = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Insert Media Asset',
    parameters: {
      operation: 'executeQuery',
      query: "INSERT INTO media_assets (user_id, file_url, file_type) VALUES ($1::uuid, $2, $3) RETURNING id, file_url, file_type, created_at",
      options: {
        queryReplacement: expr('{{ $json.body.userId }}, {{ $json.body.fileUrl }}, {{ $json.body.fileType }}')
      }
    }
  },
  credentials: {
    postgres: newCredential('Supabase DB')
  },
  output: [{
    id: 'uuid',
    file_url: 'https://...',
    file_type: 'image/jpeg',
    created_at: '2026-05-27T...'
  }]
});

const respond = node({
  type: 'n8n-nodes-base.respondToWebhook',
  version: 1.5,
  config: {
    name: 'Respond',
    parameters: {
      respondWith: 'json',
      responseBody: {
        id: expr('{{ $json.id }}'),
        file_url: expr('{{ $json.file_url }}'),
        file_type: expr('{{ $json.file_type }}'),
        created_at: expr('{{ $json.created_at }}')
      }
    }
  },
  output: [{}]
});

export default workflow('media-upload', 'Media Upload')
  .add(webhookTrigger)
  .to(insertMedia)
  .to(respond);
