# Graph Report - .  (2026-05-26)

## Corpus Check
- 0 files · ~99,999 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 514 nodes · 647 edges · 66 communities (37 shown, 29 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]

## God Nodes (most connected - your core abstractions)
1. `Supabase Postgres Best Practices` - 24 edges
2. `compilerOptions` - 16 edges
3. `useAuth()` - 15 edges
4. `N8N Social Scheduler SaaS` - 14 edges
5. `cn()` - 11 edges
6. `PostsPage` - 11 edges
7. `ComposerPage` - 11 edges
8. `AccountsPage` - 11 edges
9. `workflow` - 10 edges
10. `workflow` - 10 edges

## Surprising Connections (you probably didn't know these)
- `N8N Social Scheduler SaaS` --cites--> `N8N Social Scheduler PRD`  [AMBIGUOUS]
  Phase 1 Planning.md → N8N_Social_Scheduler_PRD.pdf
- `scheduled_posts Table` --references--> `WF-4 Post CRUD Workflow`  [EXTRACTED]
  supabase/migrations/001_initial_schema.sql → Phase 4 Planning.md
- `scheduled_posts Table` --references--> `post_media Junction Table`  [EXTRACTED]
  supabase/migrations/001_initial_schema.sql → Phase 2 Planning.md
- `scheduled_posts Table` --references--> `WF-5 Cron Scheduler Workflow`  [EXTRACTED]
  supabase/migrations/001_initial_schema.sql → Phase 4 Planning.md
- `scheduled_posts Table` --references--> `social_accounts Table`  [EXTRACTED]
  supabase/migrations/001_initial_schema.sql → Phase 2 Planning.md

## Hyperedges (group relationships)
- **Authenticated Page Pattern** — dashboard_page, posts_page, composer_page, accounts_page [INFERRED 0.90]
- **Auth Flow Pages** — login_page, register_page, auth_callback_page [INFERRED 0.90]
- **Social Media Publishing Pipeline** — facebook_publish_workflow, instagram_publish_workflow, scheduled_posts_table, post_logs_table, facebook_graph_api [INFERRED 0.90]
- **Failure Recovery System** — failure_handler_workflow, retry_handler_workflow, workflow_runs_table, post_logs_table [INFERRED 0.85]
- **Supabase Backend Infrastructure** — initial_schema_migration, storage_setup_migration, media_storage_bucket, scheduled_posts_table, workflow_runs_table, supabase_db_credential [INFERRED 0.90]
- **Best Practice Rule Categories** — supabase_postgres_best_practices_skill, query_missing_indexes_ref, query_index_types_ref, query_composite_indexes_ref, query_covering_indexes_ref, advanced_jsonb_indexing_ref, monitor_explain_analyze_ref, monitor_pg_stat_statements_ref, monitor_vacuum_analyze_ref, security_rls_basics_ref, security_rls_performance_ref, security_privileges_ref, schema_data_types_ref, schema_lowercase_identifiers_ref, schema_constraints_ref, schema_partitioning_ref, conn_limits_ref, conn_pooling_ref, conn_idle_timeout_ref, lock_deadlock_prevention_ref, lock_short_transactions_ref, data_pagination_ref, data_upsert_ref [EXTRACTED 1.00]
- **Postgres Index Types** — concept_btree_index, concept_gin_index, concept_gist_index, concept_brin_index, concept_hash_index [EXTRACTED 1.00]
- **Connection Management Practices** — concept_connection_limits, concept_connection_pooling, concept_idle_connection_timeout, concept_pgbouncer [INFERRED 0.90]
- **System Architecture Components** — nextjs_frontend, n8n_backend, supabase_auth, supabase_db, supabase_storage, meta_graph_api [EXTRACTED 1.00]
- **N8N Workflow Suite** — wf_oauth_connect, wf_oauth_callback, wf_media_upload, wf_post_crud, wf_cron_scheduler, wf_facebook_publish, wf_instagram_publish, wf_token_refresh, wf_retry_handler, wf_failure_handler, wf_logging [EXTRACTED 1.00]
- **Database Schema Entities** — profiles_table, social_accounts_table, scheduled_posts_table, media_assets_table, post_media_table, post_logs_table, workflow_runs_table, oauth_state_table, token_refresh_log_table [EXTRACTED 1.00]

## Communities (66 total, 29 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (35): AccountsPage(), container, item, AuthForm(), AuthGuard(), AuthLayout(), AuthLayoutProps, MotionNarrative() (+27 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (28): dependencies, class-variance-authority, clsx, framer-motion, next, react, react-dom, @supabase/ssr (+20 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (22): activityItems, container, item, statCards, upcomingPosts, AccountStatus, DashboardStats, LogStatus (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (28): Facebook Graph API v21.0, Facebook Publish Workflow, Failure Handler Workflow, Instagram Publish Workflow, Logging Workflow, media_assets Table, Meta Graph API v21.0, oauth_state Table (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (26): AGENTS.md Graphify Configuration, n8n Backend (Primary Orchestrator), N8N Social Scheduler SaaS, N8N Social Scheduler PRD, Next.js Frontend (Signal Design), Advisory Locks, Batch INSERT Statements, Foreign Key Column Indexes (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (23): AccountsPage, AuthCallbackPage, AuthForm, AuthGuard, AuthLayout, Badge, Button, ComposerPage (+15 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (13): bilderberg, jetbrainsMono, metadata, RootLayout(), satoshi, AuthFormProps, cn(), containerVariants (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (13): CalendarGrid(), CalendarGridProps, CalendarPost, dayLabels, CalendarPost, DayCell(), DayCellProps, CalendarPage() (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (14): buildContainerUrl, buildPublishUrl, callRetry, checkPublishResult, createContainer, logFailure, logSuccess, markFailed (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (9): CaptionEditor(), CaptionEditorProps, options, PlatformSelector(), PlatformSelectorProps, SchedulePicker(), SchedulePickerProps, container (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (14): Principle of Least Privilege, Lowercase Identifiers Convention, pg_stat_statements, Table Partitioning, UPSERT, Writing Guidelines for Postgres References, Use UPSERT for Insert-or-Update Operations, Enable pg_stat_statements for Query Analysis (+6 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (12): skills, supabase, supabase-postgres-best-practices, computedHash, computedHash, skillPath, source, sourceType (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.17
Nodes (11): buildFbPayload, callFbApi, callRetry, checkResult, logFailure, logSuccess, markFailed, markPublished (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (10): workflow, active, description, id, name, nodeCount, nodes, path (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (10): workflow, active, description, id, name, nodeCount, nodes, path (+2 more)

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (9): mcp, supabase, plugin, $schema, skills, paths, enabled, type (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.31
Nodes (6): useMedia(), MediaGrid(), MediaGridProps, container, item, MediaPage()

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (8): Index JSONB Columns for Efficient Querying, BRIN Index, B-tree Index, GIN Index, GiST Index, Hash Index, JSONB Indexing, Choose the Right Index Type for Your Data

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (4): colorMap, item, StatCardProps, StatsRowProps

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (4): ActivityTimeline(), ActivityTimelineProps, container, item

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (7): Connection Limits, Connection Pooling, Idle Connection Timeout, PgBouncer, Configure Idle Connection Timeouts, Set Appropriate Connection Limits, Use Connection Pooling for All Applications

### Community 23 - "Community 23"
Cohesion: 0.47
Nodes (4): useSettings(), container, item, SettingsPage()

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (6): Cursor-Based Pagination, EXPLAIN ANALYZE, Missing Index, Use Cursor-Based Pagination Instead of OFFSET, Use EXPLAIN ANALYZE to Diagnose Slow Queries, Add Indexes on WHERE and JOIN Columns

### Community 26 - "Community 26"
Cohesion: 0.40
Nodes (4): callRetry, logToWorkflowRuns, respond, webhookTrigger

### Community 27 - "Community 27"
Cohesion: 0.40
Nodes (3): container, item, themes

### Community 29 - "Community 29"
Cohesion: 0.40
Nodes (5): RLS Performance Optimization, Row Level Security, Security Definier Function, Enable Row Level Security for Multi-Tenant Data, Optimize RLS Policies for Performance

### Community 33 - "Community 33"
Cohesion: 0.50
Nodes (4): Deadlock Prevention, Short Transactions, Prevent Deadlocks with Consistent Lock Ordering, Keep Transactions Short to Reduce Lock Contention

### Community 34 - "Community 34"
Cohesion: 0.50
Nodes (4): Composite Index, Covering Index, Create Composite Indexes for Multi-Column Queries, Use Covering Indexes to Avoid Table Lookups

### Community 44 - "Community 44"
Cohesion: 1.00
Nodes (3): ANALYZE, VACUUM, Maintain Table Statistics with VACUUM and ANALYZE

## Ambiguous Edges - Review These
- `N8N Social Scheduler SaaS` → `N8N Social Scheduler PRD`  [AMBIGUOUS]
  N8N_Social_Scheduler_PRD.pdf · relation: cites

## Knowledge Gaps
- **243 isolated node(s):** `version`, `source`, `sourceType`, `skillPath`, `computedHash` (+238 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `N8N Social Scheduler SaaS` and `N8N Social Scheduler PRD`?**
  _Edge tagged AMBIGUOUS (relation: cites) - confidence is low._
- **Why does `Supabase Postgres Best Practices` connect `Community 11` to `Community 33`, `Community 34`, `Community 44`, `Community 19`, `Community 22`, `Community 55`, `Community 24`, `Community 29`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `N8N Social Scheduler SaaS` connect `Community 4` to `Community 3`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `Meta Graph API v21.0` connect `Community 3` to `Community 4`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `version`, `source`, `sourceType` to the rest of the system?**
  _243 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08144796380090498 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._