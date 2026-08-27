alter table public.consultants
  add column if not exists profile_type text;

update public.consultants
set profile_type = 'consultant'
where profile_type is null;

alter table public.consultants
  alter column profile_type set default 'consultant';

alter table public.consultants
  alter column profile_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'consultants_profile_type_check'
      and conrelid = 'public.consultants'::regclass
  ) then
    alter table public.consultants
      add constraint consultants_profile_type_check
      check (profile_type = any (array['consultant'::text, 'creator'::text, 'both'::text]));
  end if;
end;
$$;

create index if not exists idx_consultants_profile_type
  on public.consultants (profile_type);

alter table public.resources
  add column if not exists claim_contact_email text;

create index if not exists idx_resources_claim_contact_email
  on public.resources (lower(claim_contact_email))
  where claim_contact_email is not null;

-- Expand directory RPC with a profile-surface filter:
--   consultant (default) => consultant + both
--   creator               => creator + both
--   all                   => no profile filter
create or replace function public.get_consultants_directory_page(
  p_service_slug text default null,
  p_category_slug text default null,
  p_q text default null,
  p_provider_kind text default null,
  p_page integer default 1,
  p_page_size integer default 15,
  p_seed_bucket text default null,
  p_market text default 'mining',
  p_country_code text default null,
  p_global_region text default null,
  p_profile_surface text default 'consultant'
)
returns table (
  id uuid,
  slug text,
  display_name text,
  headline text,
  location text,
  country_code text,
  global_region text,
  metadata jsonb,
  has_next boolean
)
language plpgsql
stable
as $$
declare
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := greatest(coalesce(p_page_size, 15), 1);
  v_offset integer := (v_page - 1) * v_page_size;
  v_has_status boolean;
  v_has_provider_kind boolean;
  v_provider_kind_type text;
  v_has_country_code boolean;
  v_has_global_region boolean;
  v_has_profile_type boolean;
  v_market public.service_market := case
    when lower(coalesce(p_market, 'mining')) in ('oil_gas', 'oil-gas') then 'oil_gas'::public.service_market
    else 'mining'::public.service_market
  end;
  v_sql text;
begin
  select exists (
    select 1 from pg_attribute
    where attrelid = 'public.consultants'::regclass and attname = 'status' and not attisdropped
  ) into v_has_status;

  select exists (
    select 1 from pg_attribute
    where attrelid = 'public.consultants'::regclass and attname = 'provider_kind' and not attisdropped
  ) into v_has_provider_kind;

  select exists (
    select 1 from pg_attribute
    where attrelid = 'public.consultants'::regclass and attname = 'country_code' and not attisdropped
  ) into v_has_country_code;

  select exists (
    select 1 from pg_attribute
    where attrelid = 'public.consultants'::regclass and attname = 'global_region' and not attisdropped
  ) into v_has_global_region;

  select exists (
    select 1 from pg_attribute
    where attrelid = 'public.consultants'::regclass and attname = 'profile_type' and not attisdropped
  ) into v_has_profile_type;

  if v_has_provider_kind then
    select format_type(a.atttypid, a.atttypmod)
    into v_provider_kind_type
    from pg_attribute a
    where a.attrelid = 'public.consultants'::regclass
      and a.attname = 'provider_kind'
      and not a.attisdropped;
  end if;

  v_sql := '
    with filtered as (
      select
        c.id,
        c.slug,
        c.display_name,
        c.headline,
        c.location,';

  if v_has_country_code then
    v_sql := v_sql || '
        c.country_code,';
  else
    v_sql := v_sql || '
        null::text as country_code,';
  end if;

  if v_has_global_region then
    v_sql := v_sql || '
        c.global_region,';
  else
    v_sql := v_sql || '
        null::text as global_region,';
  end if;

  v_sql := v_sql || '
        c.metadata
      from public.consultants c
      where c.visibility = ''public''
        and (
          $1 is null
          or not exists (
            select 1
            from regexp_split_to_table($1, ''\\s+'') as tok(term)
            where tok.term <> ''''
              and not (
                c.display_name ilike ''%'' || tok.term || ''%''
                or coalesce(c.company, '''') ilike ''%'' || tok.term || ''%''
                or coalesce(c.headline, '''') ilike ''%'' || tok.term || ''%''
              )
          )
        )
        and exists (
          select 1
          from public.consultant_services cs
          join public.services s on s.id = cs.service_id
          join public.service_categories sc on sc.id = s.category_id
          where cs.consultant_id = c.id
            and sc.market = $2
            and ($3 is null or s.slug = $3)
            and ($4 is null or sc.slug = $4)
        )';

  if v_has_status then
    v_sql := v_sql || ' and c.status = ''approved''';
  end if;

  if v_has_provider_kind then
    v_sql := v_sql || format(' and ($5 is null or c.provider_kind = ($5)::%s)', v_provider_kind_type);
  end if;

  if v_has_country_code then
    v_sql := v_sql || ' and ($6 is null or c.country_code = $6)';
  end if;

  if v_has_global_region then
    v_sql := v_sql || ' and ($7 is null or c.global_region = $7)';
  end if;

  if v_has_profile_type then
    v_sql := v_sql || '
      and (
        $8 = ''all''
        or ($8 = ''creator'' and c.profile_type in (''creator'', ''both''))
        or ($8 <> ''creator'' and c.profile_type in (''consultant'', ''both''))
      )';
  end if;

  v_sql := v_sql || '
    ),
    ordered as (
      select
        f.id,
        f.slug,
        f.display_name,
        f.headline,
        f.location,
        f.country_code,
        f.global_region,
        f.metadata,
        row_number() over (
          order by md5(coalesce($9, ''0'') || '':'' || f.id::text), f.id
        ) as rn
      from filtered f
    ),
    page_window as (
      select *
      from ordered
      where rn > $10
        and rn <= ($10 + $11 + 1)
    ),
    page_info as (
      select count(*) > $11 as has_next
      from page_window
    )
    select
      pw.id,
      pw.slug,
      pw.display_name,
      pw.headline,
      pw.location,
      pw.country_code,
      pw.global_region,
      pw.metadata,
      pi.has_next
    from page_window pw
    cross join page_info pi
    order by pw.rn
    limit $11';

  return query execute v_sql
    using
      nullif(btrim(p_q), ''),
      v_market,
      nullif(btrim(p_service_slug), ''),
      nullif(btrim(p_category_slug), ''),
      nullif(btrim(p_provider_kind), ''),
      nullif(upper(btrim(p_country_code)), ''),
      nullif(lower(btrim(p_global_region)), ''),
      coalesce(nullif(lower(btrim(p_profile_surface)), ''), 'consultant'),
      coalesce(nullif(btrim(p_seed_bucket), ''), '0'),
      v_offset,
      v_page_size;
end;
$$;

grant execute on function public.get_consultants_directory_page(
  text, text, text, text, integer, integer, text, text, text, text, text
) to anon, authenticated, service_role;

select pg_notify('pgrst', 'reload schema');
