alter table public.resources
  add column if not exists resource_format text;

update public.resources r
set resource_format = (
  case
    when r.resource_type = 'external' then
      case
        when coalesce(r.source_url, '') ~* '(^https?://)?(www\.)?github\.com(/|$)' then 'repository'
        else 'website'
      end
    else
      case
        when lower(coalesce((
          select asset.file_ext
          from public.resource_assets asset
          where asset.resource_id = r.id
            and asset.is_current = true
          limit 1
        ), '')) in ('xls', 'xlsx', 'xlsm', 'xlsb', 'xltx', 'xltm') then 'excel'
        when lower(coalesce((
          select asset.file_ext
          from public.resource_assets asset
          where asset.resource_id = r.id
            and asset.is_current = true
          limit 1
        ), '')) in ('doc', 'docx', 'docm', 'dotx', 'dotm') then 'word'
        when lower(coalesce((
          select asset.file_ext
          from public.resource_assets asset
          where asset.resource_id = r.id
            and asset.is_current = true
          limit 1
        ), '')) in ('ppt', 'pptx', 'pptm', 'potx', 'potm') then 'powerpoint'
        when lower(coalesce((
          select asset.file_ext
          from public.resource_assets asset
          where asset.resource_id = r.id
            and asset.is_current = true
          limit 1
        ), '')) in ('js', 'jsx', 'ts', 'tsx', 'py', 'r', 'sql', 'sh', 'bash', 'ps1', 'psm1', 'psd1', 'ipynb', 'json', 'yaml', 'yml', 'toml') then 'script'
        when lower(coalesce((
          select asset.file_ext
          from public.resource_assets asset
          where asset.resource_id = r.id
            and asset.is_current = true
          limit 1
        ), '')) in ('apk', 'aab', 'ipa', 'appimage', 'msix') then 'app'
        when lower(coalesce((
          select asset.file_ext
          from public.resource_assets asset
          where asset.resource_id = r.id
            and asset.is_current = true
          limit 1
        ), '')) = 'pdf' then 'pdf'
        else 'generic'
      end
  end
)
where r.resource_format is null;

update public.resources
set resource_format = case
  when resource_type = 'external' then
    case
      when coalesce(source_url, '') ~* '(^https?://)?(www\.)?github\.com(/|$)' then 'repository'
      else 'website'
    end
  else 'generic'
end
where resource_format is null;

alter table public.resources
  alter column resource_format set default 'generic';

alter table public.resources
  alter column resource_format set not null;

alter table public.resources
  drop constraint if exists resources_resource_format_check;

alter table public.resources
  add constraint resources_resource_format_check
  check (resource_format = any (array[
    'website'::text,
    'repository'::text,
    'excel'::text,
    'word'::text,
    'powerpoint'::text,
    'script'::text,
    'app'::text,
    'pdf'::text,
    'generic'::text
  ]));

create index if not exists idx_resources_resource_format
  on public.resources (resource_format);

select pg_notify('pgrst', 'reload schema');
