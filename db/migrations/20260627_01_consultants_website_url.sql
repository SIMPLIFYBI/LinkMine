alter table public.consultants
  add column if not exists website_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'consultants_website_url_check'
  ) then
    alter table public.consultants
      add constraint consultants_website_url_check
      check (
        website_url is null
        or (
          char_length(website_url) <= 2048
          and website_url ~* '^https?://'
        )
      );
  end if;
end $$;

update public.consultants
set website_url = nullif(trim(metadata->>'website_url'), '')
where website_url is null
  and coalesce(metadata->>'website_url', '') <> '';