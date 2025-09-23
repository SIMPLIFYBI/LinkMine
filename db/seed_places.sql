-- Run in Supabase SQL Editor (service role bypasses RLS)

-- Store the raw Google Place ID token (e.g., "ChIJ..."), not the "places/" prefix.
-- Replace the placeholders below before running.

update public.consultants
set place_id = 'REPLACE_WITH_SRK_PLACE_ID'       -- e.g., ChIJxxxxxxxxxxxxxxxx
where display_name = 'SRK Consulting';

update public.consultants
set place_id = 'REPLACE_WITH_GOLDER_PLACE_ID'    -- e.g., ChIJyyyyyyyyyyyyyyyy
where display_name = 'Golder';

update public.consultants
set place_id = 'REPLACE_WITH_DESWIK_PLACE_ID'    -- e.g., ChIJzzzzzzzzzzzzzzzz
where display_name = 'Deswik';

-- Verify
select display_name, place_id from public.consultants
where display_name in ('SRK Consulting', 'Golder', 'Deswik');