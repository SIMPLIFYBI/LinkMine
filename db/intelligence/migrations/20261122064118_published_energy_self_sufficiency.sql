-- Applied to Supabase project wfelikvlymtvkmljkvri as migration 20261122064118 (published_energy_self_sufficiency).
-- Exported from supabase_migrations.schema_migrations: this is the exact SQL that ran.
-- Do not run against the LinkMine app project.

set local statement_timeout = '300s';

create table published.fuel (
  fuel          text primary key,
  label         text not null,
  quantity_unit text not null,
  note          text
);

insert into published.fuel (fuel, label, quantity_unit, note)
select pair_key, label, quantity_unit, note from petroleum.supply_demand_pair;

comment on table published.fuel is
  'Fuels covered by published.energy_self_sufficiency. Liquids are a daily rate and gas an annual total, so compare percentages, never quantities.';

-- One row per country, fuel and year. Rows where the publisher reported no trade are removed, because there
-- consumption is set equal to production and the 100% reading is a filing convention, not a balance.
create materialized view published.energy_self_sufficiency as
select j.iso_alpha3,
       j.name as country_name,
       s.pair_key as fuel,
       s.reference_year as year,
       s.production,
       s.consumption,
       round(s.self_sufficiency_pct, 1) as self_sufficiency_pct,
       s.reference_year = max(s.reference_year) over () as is_estimate
from serving.v_energy_self_sufficiency s
join core.jurisdiction j on j.id = s.jurisdiction_id and j.iso_alpha3 is not null
where not coalesce(s.is_country_aggregate, false)
  and s.trade_data_reported
  and s.consumption > 0;

create unique index on published.energy_self_sufficiency (iso_alpha3, fuel, year);
create index on published.energy_self_sufficiency (fuel, year);

comment on materialized view published.energy_self_sufficiency is
  'Production as a percentage of consumption (EIA international data, public domain). is_estimate marks the latest year, which is a publisher estimate. Rows with no reported trade are excluded; a missing country-year means no usable reading, not zero.';

create or replace function published.refresh_all() returns void
language plpgsql
as $$
begin
  refresh materialized view published.source;
  refresh materialized view concurrently published.reserves_to_production;
  refresh materialized view concurrently published.energy_self_sufficiency;

  insert into published.build_info (object_name, refreshed_at)
  values ('source', now()), ('reserves_to_production', now()), ('energy_self_sufficiency', now())
  on conflict (object_name) do update set refreshed_at = excluded.refreshed_at;
end;
$$;

revoke execute on function published.refresh_all() from public, anon, authenticated;

grant select on published.fuel, published.energy_self_sufficiency to anon, authenticated;
alter table published.fuel enable row level security;
create policy p_read_fuel on published.fuel for select to anon, authenticated using (true);

select published.refresh_all();
