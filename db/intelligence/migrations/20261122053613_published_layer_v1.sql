-- Applied to Supabase project wfelikvlymtvkmljkvri as migration 20261122053613 (published_layer_v1).
-- Exported from supabase_migrations.schema_migrations: this is the exact SQL that ran.
-- Do not run against the LinkMine app project.

set local statement_timeout = '300s';

create schema if not exists published;
comment on schema published is
  'Public read layer. Licence-cleared, precomputed, read-only. Nothing here reads staging or operational prov tables at request time.';

create materialized view published.source as
select source_code, name, publisher, licence_name, licence_url, attribution_text
from prov.source
where commercial_reuse_ok is true and is_active;

create unique index on published.source (source_code);

create table published.unit_to_tonnes (
  unit   text primary key,
  tonnes numeric not null check (tonnes > 0),
  note   text
);

insert into published.unit_to_tonnes (unit, tonnes, note) values
  ('metric tons',          1,         null),
  ('thousand metric tons', 1000,      null),
  ('1000 metric tons',     1000,      null),
  ('million metric tons',  1000000,   null),
  ('kilograms',            0.001,     null),
  ('million short tons',   907184.74, '1 short ton = 0.90718474 t. EIA coal reserves are short tons; EIA coal production is metric.'),
  ('million carats',       0.2,       '1 carat = 0.2 g. Diamonds and gemstones are published by count and shown here by mass.'),
  ('thousands of carats',  0.0002,    '1 carat = 0.2 g.');

create table published.rp_basis (
  commodity_code         text primary key references core.commodity (code),
  reserve_source_code    text not null,
  reserve_detail         text not null,
  production_source_code text not null,
  production_detail      text not null,
  note                   text
);

comment on table published.rp_basis is
  'Explicit like-for-like basis for reserves-to-production. A commodity absent here is refused, not guessed. Not mapped on purpose: iron ore, zirconium, titanium minerals (mixed bases); bauxite (labels not confirmed comparable); vanadium (unit inconsistency); tantalum, strontium, niobium, asbestos (4 or fewer countries with both measures).';

insert into published.rp_basis (commodity_code, reserve_source_code, reserve_detail, production_source_code, production_detail)
select code, 'M15', 'Reserves', 'M15', 'Mine production'
from unnest(array[
  'SB','BARITE','CO','CU','DIAMOND_IND','DIATOMITE','FELDSPAR_NEPH','FLUORSPAR','GEMSTONES','AU','GRAPHITE','GYPSUM',
  'I','PB','LI','MG_COMPOUNDS','MN','NI','PEAT','PHOSPHATE_ROCK','REE_TREO','RE','AG','SN','W','VERMICULITE','ZN'
]) as code;

insert into published.rp_basis (commodity_code, reserve_source_code, reserve_detail, production_source_code, production_detail, note) values
  ('PERLITE',   'M15', 'Reserves',      'M15', 'Production',      'USGS labels perlite production as "Production", not "Mine production".'),
  ('COAL_ALL',  'E1',  'Coal Reserves', 'E1',  'Coal Production', 'Reserves are carried forward unchanged between editions, so the series is a standing estimate.');

create materialized view published.reserves_to_production as
with res_all as (
  select b.commodity_code, c.name as commodity_name, x.jurisdiction_id,
         x.quantity * u.tonnes as reserves_t, x.quantity_bound as reserve_bound,
         x.reference_year as reserve_year, b.reserve_source_code,
         max(x.reference_year) over (partition by b.commodity_code) as latest_year
  from published.rp_basis b
  join core.commodity c on c.code = b.commodity_code
  join mining.country_commodity_statistic x
    on x.commodity_id = c.id and x.statistic = 'reserves' and x.statistic_detail = b.reserve_detail
  join prov.source_record sr on sr.id = x.source_record_id
  join prov.source_run run on run.id = sr.source_run_id
  join prov.source s on s.id = run.source_id and s.source_code = b.reserve_source_code and s.commercial_reuse_ok
  join published.unit_to_tonnes u on u.unit = x.quantity_unit
  where x.jurisdiction_id is not null
    and not coalesce(x.is_country_aggregate, false)
    and not coalesce(x.is_duplicate_of_sibling, false)
    and x.quantity > 0
),
prod_all as (
  select b.commodity_code, x.jurisdiction_id,
         x.quantity * u.tonnes as production_t, x.quantity_bound as production_bound,
         x.reference_year as production_year, b.production_source_code, x.key_ordinal, x.id,
         max(x.reference_year) over (partition by b.commodity_code) as latest_year
  from published.rp_basis b
  join core.commodity c on c.code = b.commodity_code
  join mining.country_commodity_statistic x
    on x.commodity_id = c.id and x.statistic = 'production' and x.statistic_detail = b.production_detail
  join prov.source_record sr on sr.id = x.source_record_id
  join prov.source_run run on run.id = sr.source_run_id
  join prov.source s on s.id = run.source_id and s.source_code = b.production_source_code and s.commercial_reuse_ok
  join published.unit_to_tonnes u on u.unit = x.quantity_unit
  where x.jurisdiction_id is not null
    and not coalesce(x.is_country_aggregate, false)
    and not coalesce(x.is_duplicate_of_sibling, false)
    and x.quantity > 0
),
res as (
  select * from res_all where reserve_year = latest_year
),
prod as (
  select *,
         row_number() over (partition by commodity_code, jurisdiction_id order by key_ordinal, id) as rn,
         count(*)     over (partition by commodity_code, jurisdiction_id)                          as production_lines
  from prod_all
  where production_year = latest_year
),
joined as (
  select r.commodity_code, r.commodity_name, j.iso_alpha3, j.name as country_name,
         r.reserves_t, p.production_t, r.reserves_t / p.production_t as years_remaining,
         r.reserve_year, p.production_year, r.reserve_bound, p.production_bound,
         p.production_lines, r.reserve_source_code, p.production_source_code
  from res r
  join prod p on p.commodity_code = r.commodity_code and p.jurisdiction_id = r.jurisdiction_id and p.rn = 1
  join core.jurisdiction j on j.id = r.jurisdiction_id
  where j.iso_alpha3 is not null
),
ranked as (
  select *,
         rank() over (partition by commodity_code order by reserves_t desc)   as reserve_rank,
         rank() over (partition by commodity_code order by production_t desc) as production_rank,
         count(*) over (partition by commodity_code)                          as n_ranked
  from joined
)
select * from ranked
where n_ranked >= 5;

create unique index on published.reserves_to_production (commodity_code, iso_alpha3);

create table published.build_info (
  object_name  text primary key,
  refreshed_at timestamptz not null,
  note         text
);

create function published.refresh_all() returns void
language plpgsql
as $$
begin
  refresh materialized view published.source;
  refresh materialized view concurrently published.reserves_to_production;

  insert into published.build_info (object_name, refreshed_at)
  values ('source', now()), ('reserves_to_production', now())
  on conflict (object_name) do update set refreshed_at = excluded.refreshed_at;
end;
$$;

revoke execute on function published.refresh_all() from public, anon, authenticated;

grant usage on schema published to anon, authenticated;
grant select on published.source, published.reserves_to_production,
                published.rp_basis, published.unit_to_tonnes, published.build_info to anon, authenticated;

alter table published.rp_basis       enable row level security;
alter table published.unit_to_tonnes enable row level security;
alter table published.build_info     enable row level security;

create policy p_read_rp_basis       on published.rp_basis       for select to anon, authenticated using (true);
create policy p_read_unit_to_tonnes on published.unit_to_tonnes for select to anon, authenticated using (true);
create policy p_read_build_info     on published.build_info     for select to anon, authenticated using (true);

select published.refresh_all();
