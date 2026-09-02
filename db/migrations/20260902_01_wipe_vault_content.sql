-- Wipe Vault content data so production-like resources can be reseeded.
-- Keeps taxonomy/config tables (e.g. resource_categories, resource_tags) intact.

truncate table
  public.resource_request_responses,
  public.resource_requests,
  public.resource_open_events,
  public.resource_download_events,
  public.resource_entitlements,
  public.resource_images,
  public.resource_assets,
  public.resource_tag_links,
  public.resource_payment_attempts,
  public.resource_order_items,
  public.resource_orders,
  public.resource_payout_ledger,
  public.resources
restart identity;

update public.resource_user_quotas
set
  active_resource_count = 0,
  active_storage_bytes = 0,
  updated_at = now();
