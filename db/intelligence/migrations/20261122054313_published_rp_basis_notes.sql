-- Applied to Supabase project wfelikvlymtvkmljkvri as migration 20261122054313 (published_rp_basis_notes).
-- Exported from supabase_migrations.schema_migrations: this is the exact SQL that ran.
-- Do not run against the LinkMine app project.

update published.rp_basis set note = 'Treat nickel ratios with care. The latest production year is a USGS estimate, and for Australia 25 Mt of reserves over 45,000 t of 2025 output (under half 2024''s 98,000 t) gives 556 years. USGS notes only 11 Mt of Australian reserves are JORC-compliant or equivalent, which gives 244 years.' where commodity_code = 'NI';

update published.rp_basis set note = 'Reserves are carried forward unchanged between editions, so the series is a standing estimate. Countries reporting zero 2025 production (for example Spain, Italy, France and Egypt) have no defined ratio and are not ranked.' where commodity_code = 'COAL_ALL';

update published.rp_basis set note = 'USGS publishes diamond in carats; shown here by mass at 0.2 g per carat.' where commodity_code = 'DIAMOND_IND';

update published.rp_basis set note = 'USGS publishes gemstones in carats; shown here by mass at 0.2 g per carat.' where commodity_code = 'GEMSTONES';
