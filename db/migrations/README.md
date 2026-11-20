# Database Migration Inventory

Reviewed 2026-11-19 for the LinkMine repository and the connected Supabase project `MineLink` (`gtcgworgdcgyfwwvysbm`).

## Canonical location

New forward-only database schema and security changes belong in this directory. Once a migration has been applied to a shared database, do not edit or replay it as a new change; add a later migration instead.

This repository currently contains 77 SQL files in `db/migrations`, including `20261120_01_restrict_job_notification_queue_access.sql`. Supabase's migration listing for the connected project returned no recorded migrations on the review date. That does not establish which files were applied manually or whether the live schema matches this directory. Do not baseline, mark versions as applied, or replay the directory against production until the live schema has been reconciled with the files.

The notification-queue access migration does not require `SUPABASE_SERVICE_ROLE_KEY`. Authenticated database admins can use the admin RPC path. The cron dispatcher secret is stored as a SHA-256 hash in a private table; an authenticated database admin initializes or refreshes it from the server-side `CRON_SECRET` (or `NOTIFY_CRON_SECRET`) on an admin notification-page or dispatch request. The cron secret is passed only from the server to Supabase in a request header. Ensure the secret is at least 24 characters and configured in the server environment before relying on scheduled dispatch.

## SQL files outside this directory

These files should not be moved or executed as migrations without first confirming their history and intent:

| File | Classification | Follow-up |
| --- | --- | --- |
| `db/services_categories_migration.sql` | Legacy, idempotent taxonomy DDL plus category/service seed data | Compare against the dated taxonomy migrations, especially `20260610_01_service_taxonomy_markets.sql` and the adjacent taxonomy migrations. Treat any missing schema change as a new migration; keep seed data separate where appropriate. |
| `db/add_job_type_to_listings.sql` | Enum/column DDL with a data backfill | Check the live type, column, default, and nullability before deciding whether this is already deployed or needs a new migration. |
| `db/indexes_for_directory.sql` | Index helper script | Compare each index with current indexes and migration definitions before folding any missing index into a new migration. |
| `SQL/public_vault_read_policies.sql` | RLS/policy script | It overlaps with `20260716_01_resource_public_read.sql` but is not identical: it also changes policy scope for resource tag links and images. Review intended policy behavior before consolidating. |
| `db/seed_consultants.sql` | Consultant seed data mixed with column/index DDL | Separate historical schema changes from seed/upsert behavior; do not replay wholesale. |
| `db/seed_listings.sql` | Organization/listing seed data mixed with column DDL | Separate historical schema changes from seed behavior; do not replay wholesale. |
| `db/seed_places.sql` | Manual data update with placeholder Place IDs | Not a migration. Replace placeholders and run only as an intentional data operation. |
| `SQL/seed_talenthub_dummy_workers.sql` | Development/test data script with deletes and inserts | Keep out of production migration replay; inspect its target filters before any use. |
| `db/schema.sql` | Legacy bootstrap schema and RLS script | Snapshot/bootstrap material, not a forward migration. Reconcile or label as historical before anyone treats it as authoritative. |
| `SQL/sql.sql` | Schema-only context snapshot; its header says it is not meant to be run | Keep as reference only, or regenerate from a documented source. Never replay it. |

## Safe reconciliation sequence

1. Inspect the live schema, policies, grants, functions, views, and indexes without changing them.
2. Compare that state with the repository migrations and the legacy files above; record which changes are present, absent, or uncertain.
3. Confirm deployment history from the people or automation that applied SQL. The Supabase migration registry is currently empty, so it cannot resolve that history by itself.
4. Choose and document a baseline strategy for future deployments. Do not edit historical migrations to make them match the live database.
5. Add any security fixes as new migrations, then validate them against a non-production database and the relevant web-app flows before production deployment.