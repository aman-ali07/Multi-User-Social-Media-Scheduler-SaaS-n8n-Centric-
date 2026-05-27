# Graph Report - .  (2026-05-27)

## Corpus Check
- Corpus is ~34,555 words - fits in a single context window. You may not need a graph.

## Summary
- 534 nodes · 785 edges · 58 communities (27 shown, 31 thin omitted)
- Extraction: 98% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.87)
- Token cost: 25,000 input · 3,000 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth & Accounts UI|Auth & Accounts UI]]
- [[_COMMUNITY_Post & Calendar Components|Post & Calendar Components]]
- [[_COMMUNITY_Dashboard Activity Feed|Dashboard Activity Feed]]
- [[_COMMUNITY_Root Layout & Calendar Grid|Root Layout & Calendar Grid]]
- [[_COMMUNITY_Project Dependencies|Project Dependencies]]
- [[_COMMUNITY_Social Media API Integration|Social Media API Integration]]
- [[_COMMUNITY_SaaS Architecture & Docs|SaaS Architecture & Docs]]
- [[_COMMUNITY_Landing Page UI|Landing Page UI]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Post Composer UI|Post Composer UI]]
- [[_COMMUNITY_Auth Pages & Forms|Auth Pages & Forms]]
- [[_COMMUNITY_Instagram Publish Workflow|Instagram Publish Workflow]]
- [[_COMMUNITY_Supabase Skills Config|Supabase Skills Config]]
- [[_COMMUNITY_Postgres Best Practices|Postgres Best Practices]]
- [[_COMMUNITY_Facebook Publish Workflow|Facebook Publish Workflow]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
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
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 27 edges
2. `Supabase Postgres Best Practices` - 24 edges
3. `compilerOptions` - 16 edges
4. `cn()` - 14 edges
5. `N8N Social Scheduler SaaS` - 14 edges
6. `AuthGuard()` - 13 edges
7. `supabase` - 13 edges
8. `ConsoleShell()` - 12 edges
9. `Button` - 11 edges
10. `workflow` - 10 edges

## Surprising Connections (you probably didn't know these)
- `N8N Social Scheduler PRD` --cites--> `N8N Social Scheduler SaaS`  [AMBIGUOUS]
  N8N_Social_Scheduler_PRD.pdf → Phase 1 Planning.md
- `post_media Junction Table` --references--> `scheduled_posts Table`  [EXTRACTED]
  Phase 2 Planning.md → supabase/migrations/001_initial_schema.sql
- `WF-4 Post CRUD Workflow` --references--> `scheduled_posts Table`  [EXTRACTED]
  Phase 4 Planning.md → supabase/migrations/001_initial_schema.sql
- `scheduled_posts Table` --references--> `social_accounts Table`  [EXTRACTED]
  supabase/migrations/001_initial_schema.sql → Phase 2 Planning.md
- `WF-5 Cron Scheduler Workflow` --references--> `scheduled_posts Table`  [EXTRACTED]
  Phase 4 Planning.md → supabase/migrations/001_initial_schema.sql

## Hyperedges (group relationships)
- **Failure Recovery System** — failure_handler_workflow, retry_handler_workflow, workflow_runs_table, post_logs_table [INFERRED 0.85]
- **Social Media Publishing Pipeline** — facebook_publish_workflow, instagram_publish_workflow, scheduled_posts_table, post_logs_table, facebook_graph_api [INFERRED 0.90]
- **Database Schema Entities** — profiles_table, social_accounts_table, scheduled_posts_table, media_assets_table, post_media_table, post_logs_table, workflow_runs_table, oauth_state_table, token_refresh_log_table [EXTRACTED 1.00]
- **System Architecture Components** — nextjs_frontend, n8n_backend, supabase_auth, supabase_db, supabase_storage, meta_graph_api [EXTRACTED 1.00]
- **N8N Workflow Suite** — wf_oauth_connect, wf_oauth_callback, wf_media_upload, wf_post_crud, wf_cron_scheduler, wf_facebook_publish, wf_instagram_publish, wf_token_refresh, wf_retry_handler, wf_failure_handler, wf_logging [EXTRACTED 1.00]
- **Best Practice Rule Categories** — supabase_postgres_best_practices_skill, query_missing_indexes_ref, query_index_types_ref, query_composite_indexes_ref, query_covering_indexes_ref, advanced_jsonb_indexing_ref, monitor_explain_analyze_ref, monitor_pg_stat_statements_ref, monitor_vacuum_analyze_ref, security_rls_basics_ref, security_rls_performance_ref, security_privileges_ref, schema_data_types_ref, schema_lowercase_identifiers_ref, schema_constraints_ref, schema_partitioning_ref, conn_limits_ref, conn_pooling_ref, conn_idle_timeout_ref, lock_deadlock_prevention_ref, lock_short_transactions_ref, data_pagination_ref, data_upsert_ref [EXTRACTED 1.00]
- **Connection Management Practices** — concept_connection_limits, concept_connection_pooling, concept_idle_connection_timeout, concept_pgbouncer [INFERRED 0.90]
- **Postgres Index Types** — concept_btree_index, concept_gin_index, concept_gist_index, concept_brin_index, concept_hash_index [EXTRACTED 1.00]

## Communities (58 total, 31 thin omitted)

### Community 0 - "Auth & Accounts UI"
Cohesion: 0.06
Nodes (50): ConnectButton(), ConnectButtonProps, AccountsPage(), container, item, container, item, themes (+42 more)

### Community 1 - "Post & Calendar Components"
Cohesion: 0.06
Nodes (31): AccountCard(), usePosts(), ActivityTimeline(), ActivityTimelineProps, MediaGrid(), MediaGridProps, FilterBar(), FilterBarProps (+23 more)

### Community 2 - "Dashboard Activity Feed"
Cohesion: 0.07
Nodes (22): ActivityFeed(), ActivityFeedProps, ActivityItem, activityItems, container, item, statCards, upcomingPosts (+14 more)

### Community 3 - "Root Layout & Calendar Grid"
Cohesion: 0.09
Nodes (19): bilderberg, jetbrainsMono, metadata, RootLayout(), satoshi, CalendarGrid(), CalendarGridProps, CalendarPost (+11 more)

### Community 4 - "Project Dependencies"
Cohesion: 0.07
Nodes (28): dependencies, class-variance-authority, clsx, framer-motion, next, react, react-dom, @supabase/ssr (+20 more)

### Community 5 - "Social Media API Integration"
Cohesion: 0.13
Nodes (28): Facebook Graph API v21.0, Facebook Publish Workflow, Failure Handler Workflow, Instagram Publish Workflow, Logging Workflow, media_assets Table, Meta Graph API v21.0, oauth_state Table (+20 more)

### Community 6 - "SaaS Architecture & Docs"
Cohesion: 0.10
Nodes (26): AGENTS.md Graphify Configuration, n8n Backend (Primary Orchestrator), N8N Social Scheduler SaaS, N8N Social Scheduler PRD, Next.js Frontend (Signal Design), Advisory Locks, Batch INSERT Statements, Foreign Key Column Indexes (+18 more)

### Community 7 - "Landing Page UI"
Cohesion: 0.11
Nodes (13): FeatureCard(), FeatureCardProps, features, FeaturesSection(), Footer(), container, HeroSection(), item (+5 more)

### Community 8 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 9 - "Post Composer UI"
Cohesion: 0.14
Nodes (14): AccountCardProps, AccountSelector(), AccountSelectorProps, CaptionEditor(), CaptionEditorProps, ComposerPage(), container, item (+6 more)

### Community 10 - "Auth Pages & Forms"
Cohesion: 0.20
Nodes (9): AuthForm(), AuthFormProps, AuthLayout(), AuthLayoutProps, MotionNarrative(), LoginPage(), RegisterPage(), Input (+1 more)

### Community 11 - "Instagram Publish Workflow"
Cohesion: 0.13
Nodes (14): buildContainerUrl, buildPublishUrl, callRetry, checkPublishResult, createContainer, logFailure, logSuccess, markFailed (+6 more)

### Community 12 - "Supabase Skills Config"
Cohesion: 0.15
Nodes (12): skills, supabase, supabase-postgres-best-practices, computedHash, computedHash, skillPath, source, sourceType (+4 more)

### Community 13 - "Postgres Best Practices"
Cohesion: 0.18
Nodes (12): Covering Index, Lowercase Identifiers Convention, pg_stat_statements, Short Transactions, Writing Guidelines for Postgres References, Keep Transactions Short to Reduce Lock Contention, Enable pg_stat_statements for Query Analysis, Use Covering Indexes to Avoid Table Lookups (+4 more)

### Community 14 - "Facebook Publish Workflow"
Cohesion: 0.17
Nodes (11): buildFbPayload, callFbApi, callRetry, checkResult, logFailure, logSuccess, markFailed, markPublished (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (11): Breaking Next.js Changes, Local Next.js Documentation Guide, AGENTS.md Reference Convention, Geist Font, Next.js Frontend, app/page.tsx Entry Point, Vercel Deployment, File Icon Asset (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (11): AuthCallbackPage, AuthGuard, AuthLayout, ConsoleShell, LeftNav, LoginPage, RegisterPage, StatusBar (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (10): workflow, active, description, id, name, nodeCount, nodes, path (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (10): workflow, active, description, id, name, nodeCount, nodes, path (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.20
Nodes (9): mcp, supabase, plugin, $schema, skills, paths, enabled, type (+1 more)

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (8): Index JSONB Columns for Efficient Querying, BRIN Index, B-tree Index, GIN Index, GiST Index, Hash Index, JSONB Indexing, Choose the Right Index Type for Your Data

### Community 21 - "Community 21"
Cohesion: 0.40
Nodes (5): Connection Pooling, Idle Connection Timeout, PgBouncer, Configure Idle Connection Timeouts, Use Connection Pooling for All Applications

### Community 22 - "Community 22"
Cohesion: 0.40
Nodes (5): RLS Performance Optimization, Row Level Security, Security Definier Function, Enable Row Level Security for Multi-Tenant Data, Optimize RLS Policies for Performance

### Community 23 - "Community 23"
Cohesion: 0.40
Nodes (4): callRetry, logToWorkflowRuns, respond, webhookTrigger

### Community 25 - "Community 25"
Cohesion: 1.00
Nodes (3): ANALYZE, VACUUM, Maintain Table Statistics with VACUUM and ANALYZE

## Ambiguous Edges - Review These
- `N8N Social Scheduler SaaS` → `N8N Social Scheduler PRD`  [AMBIGUOUS]
  N8N_Social_Scheduler_PRD.pdf · relation: cites

## Knowledge Gaps
- **265 isolated node(s):** `version`, `source`, `sourceType`, `skillPath`, `computedHash` (+260 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `N8N Social Scheduler SaaS` and `N8N Social Scheduler PRD`?**
  _Edge tagged AMBIGUOUS (relation: cites) - confidence is low._
- **Why does `useAuth()` connect `Auth & Accounts UI` to `Post Composer UI`, `Auth Pages & Forms`, `Post & Calendar Components`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `AuthGuard()` connect `Auth & Accounts UI` to `Post & Calendar Components`, `Dashboard Activity Feed`, `Post Composer UI`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `cn()` connect `Root Layout & Calendar Grid` to `Auth & Accounts UI`, `Post & Calendar Components`, `Auth Pages & Forms`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `version`, `source`, `sourceType` to the rest of the system?**
  _266 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & Accounts UI` be split into smaller, more focused modules?**
  _Cohesion score 0.06486486486486487 - nodes in this community are weakly interconnected._
- **Should `Post & Calendar Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06207482993197279 - nodes in this community are weakly interconnected._