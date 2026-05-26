# Graph Report - .  (2026-05-26)

## Corpus Check
- Corpus is ~6,205 words - fits in a single context window. You may not need a graph.

## Summary
- 58 nodes · 84 edges · 8 communities (6 shown, 2 thin omitted)
- Extraction: 76% EXTRACTED · 24% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_n8n Workflow Core|n8n Workflow Core]]
- [[_COMMUNITY_Infrastructure & Security|Infrastructure & Security]]
- [[_COMMUNITY_Retry Handler Workflow Schema|Retry Handler Workflow Schema]]
- [[_COMMUNITY_Logging Workflow Schema|Logging Workflow Schema]]
- [[_COMMUNITY_OpenCode Config|OpenCode Config]]
- [[_COMMUNITY_Plugin Dependencies|Plugin Dependencies]]
- [[_COMMUNITY_Graphify Integration|Graphify Integration]]

## God Nodes (most connected - your core abstractions)
1. `Phase 1 — System Understanding Artifact` - 13 edges
2. `Phase 4 — n8n Workflow Implementation Plan` - 13 edges
3. `n8n as Primary Backend — All business logic, orchestration, OAuth, scheduling, retries, logging lives in n8n` - 11 edges
4. `WF-11: Logging Workflow — centralized structured logging, receives webhook, persists to workflow_runs` - 11 edges
5. `workflow` - 10 edges
6. `workflow` - 10 edges
7. `WF-9: Retry Handler Workflow — exponential backoff, reschedule or mark failed` - 8 edges
8. `WF-5: Cron Scheduler Workflow — polls pending posts every 1min, dispatches Publish` - 5 edges
9. `WF-6: Facebook Publish Workflow — creates FB post via Graph API` - 5 edges
10. `WF-7: Instagram Publish Workflow — 2-step container → publish via Graph API` - 5 edges

## Surprising Connections (you probably didn't know these)
- `AGENTS.md — Graphify Project Instructions` --references--> `GraphifyPlugin — OpenCode plugin injecting knowledge graph reminder before bash calls`  [INFERRED]
  AGENTS.md → .opencode/plugins/graphify.js
- `Exponential Backoff Retry — 3 attempts, 1m/5m/30m intervals` --rationale_for--> `WF-9: Retry Handler Workflow — exponential backoff, reschedule or mark failed`  [INFERRED]
  Phase 1 Planning.md → Phase 4 Planning.md
- `Token Encryption at Rest — pgp_sym_encrypt with server-side key from env vars` --rationale_for--> `WF-8: Token Refresh Workflow — refreshes expiring Meta long-lived tokens`  [INFERRED]
  Phase 1 Planning.md → Phase 4 Planning.md
- `1-Minute Cron Interval — balance between timely publishing and DB load` --rationale_for--> `WF-5: Cron Scheduler Workflow — polls pending posts every 1min, dispatches Publish`  [INFERRED]
  Phase 1 Planning.md → Phase 4 Planning.md
- `Phase 1 — System Understanding Artifact` --references--> `Phase 2 — Database & Storage Implementation Plan`  [INFERRED]
  Phase 1 Planning.md → Phase 2 Planning.md

## Hyperedges (group relationships)
- **n8n Workflow Dependency Ordering (from Phase 4)** — openschema_logging_wf, openschema_token_refresh_wf, openschema_retry_handler_wf, openschema_oauth_connect_wf, openschema_oauth_callback_wf, openschema_media_upload_wf, openschema_post_crud_wf, openschema_scheduler_cron_wf, openschema_facebook_publish_wf, openschema_instagram_publish_wf, openschema_failure_handler_wf [EXTRACTED 1.00]
- **System Architecture Stack: Next.js → n8n → Supabase → Meta Graph API** — openschema_n8n_as_primary_backend, openschema_supabase_auth, openschema_meta_graph_api, openschema_row_level_security, openschema_service_role_architecture [EXTRACTED 1.00]
- **MVP Feature Set (from Phase 1 §5)** — openschema_oauth_connect_wf, openschema_oauth_callback_wf, openschema_media_upload_wf, openschema_post_crud_wf, openschema_scheduler_cron_wf, openschema_facebook_publish_wf, openschema_instagram_publish_wf, openschema_retry_handler_wf, openschema_token_refresh_wf, openschema_logging_wf [EXTRACTED 1.00]
- **Sequential Phase Planning Documents** — phase_1_planning_artifact, phase_2_planning_artifact, phase_3_planning_artifact, phase_4_planning_artifact [INFERRED 0.95]

## Communities (8 total, 2 thin omitted)

### Community 0 - "n8n Workflow Core"
Cohesion: 0.37
Nodes (14): Centralized Structured Logging — utility consumed by all workflows, zero deps, WF-6: Facebook Publish Workflow — creates FB post via Graph API, WF-10: Failure Handler Workflow — centralized failure recording and retry dispatch, WF-7: Instagram Publish Workflow — 2-step container → publish via Graph API, WF-11: Logging Workflow — centralized structured logging, receives webhook, persists to workflow_runs, n8n as Primary Backend — All business logic, orchestration, OAuth, scheduling, retries, logging lives in n8n, WF-2: OAuth Callback Workflow — exchanges code, stores tokens, creates social_accounts, WF-1: OAuth Connect Workflow — generates Meta authorization URL with state (+6 more)

### Community 1 - "Infrastructure & Security"
Cohesion: 0.24
Nodes (11): 1-Minute Cron Interval — balance between timely publishing and DB load, Exponential Backoff Retry — 3 attempts, 1m/5m/30m intervals, WF-3: Media Upload Workflow — validates metadata, inserts media_assets record, Meta Graph API — Facebook + Instagram publishing endpoint, Public Bucket for Meta API — signed URLs expire too soon for scheduled posts days away, Row Level Security (RLS) — per-user row filtering via auth.uid(), Supabase Auth — authentication provider, manages users and sessions, Token Encryption at Rest — pgp_sym_encrypt with server-side key from env vars (+3 more)

### Community 2 - "Retry Handler Workflow Schema"
Cohesion: 0.18
Nodes (10): workflow, active, description, id, name, nodeCount, nodes, path (+2 more)

### Community 3 - "Logging Workflow Schema"
Cohesion: 0.18
Nodes (10): workflow, active, description, id, name, nodeCount, nodes, path (+2 more)

### Community 6 - "Graphify Integration"
Cohesion: 0.67
Nodes (3): AGENTS.md — Graphify Project Instructions, graphify-out Knowledge Graph — project graph with god nodes, community structure, cross-file relationships, GraphifyPlugin — OpenCode plugin injecting knowledge graph reminder before bash calls

## Knowledge Gaps
- **24 isolated node(s):** `id`, `name`, `active`, `webhookUrl`, `webhookMethod` (+19 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Phase 1 — System Understanding Artifact` connect `Infrastructure & Security` to `n8n Workflow Core`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `Phase 4 — n8n Workflow Implementation Plan` connect `n8n Workflow Core` to `Infrastructure & Security`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Phase 1 — System Understanding Artifact` (e.g. with `Phase 2 — Database & Storage Implementation Plan` and `Phase 3 — Supabase Storage Implementation Plan`) actually correct?**
  _`Phase 1 — System Understanding Artifact` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `n8n as Primary Backend — All business logic, orchestration, OAuth, scheduling, retries, logging lives in n8n` (e.g. with `n8n uses service_role key for DB — n8n is trusted backend, manages access control itself` and `WF-1: OAuth Connect Workflow — generates Meta authorization URL with state`) actually correct?**
  _`n8n as Primary Backend — All business logic, orchestration, OAuth, scheduling, retries, logging lives in n8n` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `WF-11: Logging Workflow — centralized structured logging, receives webhook, persists to workflow_runs` (e.g. with `Centralized Structured Logging — utility consumed by all workflows, zero deps` and `n8n as Primary Backend — All business logic, orchestration, OAuth, scheduling, retries, logging lives in n8n`) actually correct?**
  _`WF-11: Logging Workflow — centralized structured logging, receives webhook, persists to workflow_runs` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `id`, `name`, `active` to the rest of the system?**
  _24 weakly-connected nodes found - possible documentation gaps or missing edges._