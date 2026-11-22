-- Applied to Supabase project wfelikvlymtvkmljkvri as migration 20261122072323 (published_series_exclude_misattributed_names).
-- Exported from supabase_migrations.schema_migrations: this is the exact SQL that ran.
-- Do not run against the LinkMine app project.

set local statement_timeout = '300s';

-- Source rows whose country name was resolved to the wrong jurisdiction. They are left out of the published layer
-- until the mapping is corrected at source, so a country is never shown with another country's figures.
create table published.name_exclusion (
  source_code         text not null,
  country_name_source text not null,
  iso_alpha3          text not null,
  reason              text not null,
  primary key (source_code, country_name_source, iso_alpha3)
);

insert into published.name_exclusion (source_code, country_name_source, iso_alpha3, reason) values
  ('M3', 'Congo', 'COD',
   'BGS "Congo" is the Republic of Congo (Brazzaville), but these 312 rows were resolved to the Democratic Republic of the Congo. In 90 country-years both names report the same figure, so the Democratic Republic''s series was corrupted (copper mine output shows about 8,000 t in place of about 2.5 million t). Excluded until the name is mapped to COG at source.');

alter table published.name_exclusion enable row level security;
create policy p_read_name_exclusion on published.name_exclusion for select to anon, authenticated using (true);
grant select on published.name_exclusion to anon, authenticated;

drop materialized view published.series_facet;
drop materialized view published.series;

create materialized view published.series as
with pts as (
  select 'mining'::text as sector, x.statistic as measure, c.code as commodity_code, c.name as commodity_name,
         src.source_code,
         nullif(btrim(coalesce(x.statistic_detail, '') || case when x.key_ordinal > 1 then ' #' || x.key_ordinal::text else '' end), '') as basis,
         x.quantity_unit as unit, false as is_group,
         j.iso_alpha3, j.name as country_name, x.reference_year as y, x.quantity as v, x.id::text as rid,
         x.country_name_source as nm
  from mining.country_commodity_statistic x
  join core.commodity c on c.id = x.commodity_id
  join core.jurisdiction j on j.id = x.jurisdiction_id and j.iso_alpha3 is not null
  join prov.source_record sr on sr.id = x.source_record_id
  join prov.source_run run on run.id = sr.source_run_id
  join prov.source src on src.id = run.source_id and src.commercial_reuse_ok
  left join published.name_exclusion e
    on e.source_code = src.source_code and e.country_name_source = x.country_name_source and e.iso_alpha3 = j.iso_alpha3
  where x.statistic in ('production', 'import', 'export')
    and e.source_code is null
    and not coalesce(x.is_country_aggregate, false)
    and not coalesce(x.is_duplicate_of_sibling, false)
    and x.quantity is not null
  union all
  select 'petroleum', x.statistic, x.product_code, x.product_name, src.source_code, null::text, x.quantity_unit, false,
         j.iso_alpha3, j.name, x.reference_year, x.quantity, x.id::text, x.country_name_source
  from petroleum.country_product_statistic x
  join core.jurisdiction j on j.id = x.jurisdiction_id and j.iso_alpha3 is not null
  join prov.source_record sr on sr.id = x.source_record_id
  join prov.source_run run on run.id = sr.source_run_id
  join prov.source src on src.id = run.source_id and src.commercial_reuse_ok
  where not coalesce(x.is_country_aggregate, false)
    and x.quantity is not null
    and ((x.statistic = 'production' and x.product_code in ('53', '57', '58', '26'))
      or (x.statistic = 'consumption' and x.product_code = '5')
      or (x.statistic = 'imports' and x.product_code in ('57', '26')))
  union all
  select 'petroleum', 'consumption', '26', 'Dry natural gas', 'E1', null::text, s.quantity_unit, false,
         j.iso_alpha3, j.name, s.reference_year, s.consumption, s.jurisdiction_id::text || ':' || s.reference_year::text, s.country
  from serving.v_energy_self_sufficiency s
  join core.jurisdiction j on j.id = s.jurisdiction_id and j.iso_alpha3 is not null
  where s.pair_key = 'gas' and s.trade_data_reported and not coalesce(s.is_country_aggregate, false) and s.consumption is not null
  union all
  select 'power', x.statistic, g.code, g.name, src.source_code, null::text, x.quantity_unit, coalesce(g.is_aggregate, false),
         j.iso_alpha3, j.name, x.reference_year, x.quantity, x.id::text, x.country_name_source
  from power.country_source_statistic x
  join power.generation_source g on g.id = x.generation_source_id
  join core.jurisdiction j on j.id = x.jurisdiction_id and j.iso_alpha3 is not null
  join prov.source_record sr on sr.id = x.source_record_id
  join prov.source_run run on run.id = sr.source_run_id
  join prov.source src on src.id = run.source_id and src.commercial_reuse_ok
  where not coalesce(x.is_country_aggregate, false) and x.quantity is not null
),
dedup as (
  -- Where West Germany and the unified Germany both report a year, the unified figure is kept.
  select sector, measure, commodity_code, commodity_name, source_code, basis, unit, is_group, iso_alpha3, country_name, y,
         (array_agg(v order by (nm ilike 'German Federal%'), rid))[1] as v, count(*) as n
  from pts
  group by 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
),
agg as (
  select sector, measure, commodity_code, commodity_name, source_code, basis, unit, is_group, iso_alpha3, country_name,
         array_agg(y order by y) as years, array_agg(v order by y) as vals,
         (sum(n) filter (where n > 1))::int as dup_points
  from dedup
  group by 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
)
select left(md5(concat_ws('|', a.sector, a.measure, a.commodity_code, a.source_code, coalesce(a.basis, ''), a.unit)), 10) as series_key, a.*
from (
  select agg.*, count(*) over (partition by sector, measure, commodity_code, source_code, coalesce(basis, ''), unit) as n_countries
  from agg
) a
where a.n_countries >= 3;

create unique index on published.series (series_key, iso_alpha3);
create index on published.series (sector, measure, commodity_code);

comment on materialized view published.series is
  'One row per series and country, with parallel years[] and vals[] arrays. A series is one source, measure, commodity, basis and unit and is never merged with another. Series with fewer than 3 countries are left out (17 of 21 mining statistics exist for one country only). Licence-cleared sources only. Source rows listed in published.name_exclusion are left out because their country name was resolved to the wrong jurisdiction. Unlike the underlying tables, this layer never holds two values for one country, year and series: a second value is dropped (dup_points counts them).';

create materialized view published.series_facet as
select series_key, sector, measure, commodity_code, commodity_name, source_code, basis, unit, is_group,
       count(*)::int as countries,
       min(years[1]) as year_from,
       max(years[array_upper(years, 1)]) as year_to,
       sum(array_length(years, 1))::int as points,
       coalesce(sum(dup_points), 0)::int as dup_points,
       case
         when sector = 'petroleum' and measure = 'production' and commodity_code = '53' then
           'From 1993 to 2003 the source leaves countries that produce nothing blank instead of recording zero, so the number of countries with a value jumps in 2004. That is a recording convention, not a change in the world.'
         when sector = 'petroleum' and measure = 'consumption' and commodity_code = '26' then
           'Where the publisher reported no trade it set consumption equal to production. Those country-years are removed here, so some values are missing.'
         when commodity_code in ('CEMENT', 'MICA', 'REE_TREO', 'REE_HEAVY', 'SAND_GRAVEL_CON', 'SAND_GRAVEL_IND', 'STONE_CRUSHED') then
           'Reporting coverage is partial, or the published term spans several products, so totals across countries can mislead. Read each country on its own.'
         when is_group then
           'This is a total or group. Other series in this list are its parts, so do not add them together.'
       end as caveat,
       commodity_code not in ('CEMENT', 'MICA', 'REE_TREO', 'REE_HEAVY', 'SAND_GRAVEL_CON', 'SAND_GRAVEL_IND', 'STONE_CRUSHED') and not is_group as share_ok
from published.series
group by series_key, sector, measure, commodity_code, commodity_name, source_code, basis, unit, is_group;

create unique index on published.series_facet (series_key);
create index on published.series_facet (sector, measure);

comment on materialized view published.series_facet is
  'The catalogue for the Data area: one row per selectable series with its breadth, caveat and whether a share-of-total is meaningful (share_ok).';

grant select on published.series, published.series_facet to anon, authenticated;

select published.refresh_all();
