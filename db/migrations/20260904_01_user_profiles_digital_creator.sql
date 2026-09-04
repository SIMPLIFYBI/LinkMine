-- Allow Digital Creator as a valid onboarding/account user_type.

do $$
declare
  v_constraint text;
begin
  for v_constraint in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'user_profiles'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%user_type%'
  loop
    execute format('alter table public.user_profiles drop constraint %I', v_constraint);
  end loop;

  alter table public.user_profiles
    add constraint user_profiles_user_type_check
    check (
      user_type = any (
        array[
          'unspecified'::text,
          'consultant'::text,
          'client'::text,
          'digital_creator'::text,
          'both'::text
        ]
      )
    );
end
$$;
