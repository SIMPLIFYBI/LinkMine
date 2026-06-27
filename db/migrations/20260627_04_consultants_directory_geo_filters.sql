drop function if exists public.get_consultants_directory_page(text, text, text, text, integer, integer, text, text);
drop function if exists public.get_consultants_directory_page(text, text, text, text, integer, integer, text, text, text);
drop function if exists public.get_consultants_directory_page(text, text, text, text, integer, integer, text, text, text, text);

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
  p_global_region text default null
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
        and ($1 is null or c.display_name ilike ''%'' || $1 || ''%'')
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
    v_sql := v_sql || ' and ($9 is null or c.country_code = $9)';
  end if;

  if v_has_global_region then
    v_sql := v_sql || ' and ($10 is null or c.global_region = $10)';
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
          order by md5(coalesce($6, ''0'') || '':'' || f.id::text), f.id
        ) as rn
      from filtered f
    ),
    page_window as (
      select *
      from ordered
      where rn > $7
        and rn <= ($7 + $8 + 1)
    ),
    page_info as (
      select count(*) > $8 as has_next
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
    where pw.rn <= ($7 + $8)
    order by pw.rn';

  return query execute v_sql
    using nullif(btrim(p_q), ''),
          v_market,
          nullif(btrim(p_service_slug), ''),
          nullif(btrim(p_category_slug), ''),
          nullif(btrim(p_provider_kind), ''),
          nullif(btrim(p_seed_bucket), ''),
          v_offset,
          v_page_size,
          nullif(btrim(upper(p_country_code)), ''),
          nullif(btrim(lower(p_global_region)), '');
end;
$$;

grant execute on function public.get_consultants_directory_page(text, text, text, text, integer, integer, text, text, text, text) to anon, authenticated, service_role;

select pg_notify('pgrst', 'reload schema');