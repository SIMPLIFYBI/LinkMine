-- Ensure the marketplace storage bucket exists.
-- This enables resource file and preview image uploads without requiring service-role usage.

insert into storage.buckets (id, name, public)
values ('resources', 'resources', false)
on conflict (id) do nothing;

select pg_notify('pgrst', 'reload schema');
