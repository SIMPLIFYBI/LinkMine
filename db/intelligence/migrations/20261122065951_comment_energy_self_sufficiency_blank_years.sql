-- Applied to Supabase project wfelikvlymtvkmljkvri as migration 20261122065951 (comment_energy_self_sufficiency_blank_years).
-- Exported from supabase_migrations.schema_migrations: this is the exact SQL that ran.
-- Do not run against the LinkMine app project.

comment on materialized view published.energy_self_sufficiency is
  'Production as a percentage of consumption (EIA international data, public domain). is_estimate marks the latest year, which is a publisher estimate. Rows with no reported trade are excluded; a missing country-year means no usable reading, not zero.

COVERAGE BREAK, 1993-2003: in those years EIA leaves non-producing countries BLANK in total petroleum and other liquids production (about 85-88 countries a year with a value, no zero rows), whereas 1990-1992 and 2004 onward carry explicit zeros (about 80-90 zero rows a year). So a country that produces nothing is absent from this view in 1993-2003 but present at 0% in other years. The year-to-year count of countries (about 87 in 1994, about 172 in 2004) is a recording convention, not a change in the world. Do not read absence in 1993-2003 as unknown, and do not sum or count countries across the break without saying so.';
