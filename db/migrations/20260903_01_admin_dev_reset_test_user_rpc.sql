-- Admin-only developer reset RPC without service-role key usage.

create or replace function public.admin_dev_reset_test_user(
  p_email text,
  p_mode text default 'preview',
  p_confirm_text text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor_id uuid := auth.uid();
  v_email text := lower(trim(coalesce(p_email, '')));
  v_mode text := case
    when lower(trim(coalesce(p_mode, 'preview'))) = 'execute' then 'execute'
    else 'preview'
  end;
  v_user_id uuid;
  v_expected text;
  v_consultant_ids uuid[] := '{}'::uuid[];
  v_course_ids uuid[] := '{}'::uuid[];
  v_session_ids uuid[] := '{}'::uuid[];
  v_affected jsonb := '[]'::jsonb;
  v_deleted jsonb := '[]'::jsonb;
  v_count bigint := 0;
  v_has_table boolean := false;
  v_step record;
begin
  if v_actor_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.app_admins admin
    where admin.user_id = v_actor_id
  ) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  if v_email = '' or position('@' in v_email) = 0 then
    raise exception 'A valid email is required.' using errcode = '22023';
  end if;

  select usr.id
  into v_user_id
  from auth.users usr
  where lower(coalesce(usr.email, '')) = v_email
  order by usr.created_at desc
  limit 1;

  if v_user_id is null then
    return jsonb_build_object(
      'ok', true,
      'mode', v_mode,
      'email', v_email,
      'userExists', false,
      'userId', null,
      'affected', v_affected,
      'deleted', v_deleted,
      'authUserDeleted', false
    );
  end if;

  select coalesce(array_agg(c.id), '{}'::uuid[])
  into v_consultant_ids
  from public.consultants c
  where c.user_id = v_user_id or c.claimed_by = v_user_id;

  if to_regclass('public.training_courses') is not null and coalesce(array_length(v_consultant_ids, 1), 0) > 0 then
    execute 'select coalesce(array_agg(id), ''{}''::uuid[]) from public.training_courses where consultant_id = any($1)'
    into v_course_ids
    using v_consultant_ids;
  end if;

  if to_regclass('public.training_sessions') is not null and coalesce(array_length(v_course_ids, 1), 0) > 0 then
    execute 'select coalesce(array_agg(id), ''{}''::uuid[]) from public.training_sessions where course_id = any($1)'
    into v_session_ids
    using v_course_ids;
  end if;

  for v_step in
    select * from (
      values
        ('consultant_verifications', 'consultant_verifications', 'user_id'),
        ('job_applications', 'job_applications', 'applicant_user_id'),
        ('event_attendees', 'event_attendees', 'user_id'),
        ('event_waitlist', 'event_waitlist', 'user_id'),
        ('consultant_favourites', 'consultant_favourites', 'user_id'),
        ('favorites', 'favorites', 'user_id'),
        ('claim_requests', 'claim_requests', 'user_id'),
        ('consultant_contacts', 'consultant_contacts', 'sender_user_id'),
        ('profile_views', 'profile_views', 'viewer_id'),
        ('consultant_page_views', 'consultant_page_views', 'viewer_id'),
        ('training_session_bookings', 'training_session_bookings', 'user_id'),
        ('resource_request_responses', 'resource_request_responses', 'responder_user_id'),
        ('resource_requests', 'resource_requests', 'requester_user_id'),
        ('resources_owned', 'resources', 'owner_user_id'),
        ('support_tickets', 'support_tickets', 'user_id'),
        ('audit_log_entries', 'audit_log', 'user_id'),
        ('app_admin_row', 'app_admins', 'user_id'),
        ('worker_experiences', 'worker_experiences', 'worker_id'),
        ('worker_roles', 'worker_roles', 'worker_id'),
        ('worker_availability', 'worker_availability', 'worker_id'),
        ('workers', 'workers', 'id'),
        ('user_profiles', 'user_profiles', 'id')
    ) as t(key_name, table_name, column_name)
  loop
    v_has_table := to_regclass('public.' || v_step.table_name) is not null;

    if not v_has_table then
      v_affected := v_affected || jsonb_build_array(
        jsonb_build_object('key', v_step.key_name, 'count', null, 'skipped', true, 'reason', 'missing_table')
      );
      if v_mode = 'execute' then
        v_deleted := v_deleted || jsonb_build_array(
          jsonb_build_object('key', v_step.key_name, 'count', null, 'skipped', true, 'reason', 'missing_table')
        );
      end if;
      continue;
    end if;

    execute format('select count(*) from public.%I where %I = $1', v_step.table_name, v_step.column_name)
    into v_count
    using v_user_id;

    v_affected := v_affected || jsonb_build_array(jsonb_build_object('key', v_step.key_name, 'count', v_count));

    if v_mode = 'execute' then
      if v_step.key_name = 'resources_owned' then
        if v_count > 0 then
          execute 'delete from public.resources where owner_user_id = $1' using v_user_id;
        end if;
      else
        if v_count > 0 then
          execute format('delete from public.%I where %I = $1', v_step.table_name, v_step.column_name) using v_user_id;
        end if;
      end if;

      v_deleted := v_deleted || jsonb_build_array(jsonb_build_object('key', v_step.key_name, 'count', v_count));
    end if;
  end loop;

  if to_regclass('public.resources') is not null then
    execute 'select count(*) from public.resources where approved_by = $1' into v_count using v_user_id;
    v_affected := v_affected || jsonb_build_array(jsonb_build_object('key', 'resources_approved_by_user', 'count', v_count));
    if v_mode = 'execute' then
      if v_count > 0 then
        execute 'update public.resources set approved_by = null where approved_by = $1' using v_user_id;
      end if;
      v_deleted := v_deleted || jsonb_build_array(jsonb_build_object('key', 'resources_approved_by_user', 'count', v_count));
    end if;
  else
    v_affected := v_affected || jsonb_build_array(
      jsonb_build_object('key', 'resources_approved_by_user', 'count', null, 'skipped', true, 'reason', 'missing_table')
    );
    if v_mode = 'execute' then
      v_deleted := v_deleted || jsonb_build_array(
        jsonb_build_object('key', 'resources_approved_by_user', 'count', null, 'skipped', true, 'reason', 'missing_table')
      );
    end if;
  end if;

  if coalesce(array_length(v_session_ids, 1), 0) > 0 and to_regclass('public.training_session_bookings') is not null then
    execute 'select count(*) from public.training_session_bookings where session_id = any($1)' into v_count using v_session_ids;
    v_affected := v_affected || jsonb_build_array(jsonb_build_object('key', 'training_bookings_on_owned_sessions', 'count', v_count));
    if v_mode = 'execute' then
      if v_count > 0 then
        execute 'delete from public.training_session_bookings where session_id = any($1)' using v_session_ids;
      end if;
      v_deleted := v_deleted || jsonb_build_array(jsonb_build_object('key', 'training_bookings_on_owned_sessions', 'count', v_count));
    end if;
  end if;

  if coalesce(array_length(v_session_ids, 1), 0) > 0 and to_regclass('public.training_sessions') is not null then
    execute 'select count(*) from public.training_sessions where id = any($1)' into v_count using v_session_ids;
    v_affected := v_affected || jsonb_build_array(jsonb_build_object('key', 'owned_training_sessions', 'count', v_count));
    if v_mode = 'execute' then
      if v_count > 0 then
        execute 'delete from public.training_sessions where id = any($1)' using v_session_ids;
      end if;
      v_deleted := v_deleted || jsonb_build_array(jsonb_build_object('key', 'owned_training_sessions', 'count', v_count));
    end if;
  end if;

  if coalesce(array_length(v_course_ids, 1), 0) > 0 and to_regclass('public.training_courses') is not null then
    execute 'select count(*) from public.training_courses where id = any($1)' into v_count using v_course_ids;
    v_affected := v_affected || jsonb_build_array(jsonb_build_object('key', 'owned_training_courses', 'count', v_count));
    if v_mode = 'execute' then
      if v_count > 0 then
        execute 'delete from public.training_courses where id = any($1)' using v_course_ids;
      end if;
      v_deleted := v_deleted || jsonb_build_array(jsonb_build_object('key', 'owned_training_courses', 'count', v_count));
    end if;
  end if;

  v_count := coalesce(array_length(v_consultant_ids, 1), 0);
  v_affected := v_affected || jsonb_build_array(jsonb_build_object('key', 'consultants_owned', 'count', v_count));

  if v_mode = 'execute' then
    v_expected := 'RESET ' || v_email;
    if trim(coalesce(p_confirm_text, '')) <> v_expected then
      raise exception 'Confirmation phrase mismatch. Type exactly: %', v_expected using errcode = '22023';
    end if;

    if v_count > 0 then
      delete from public.consultants c
      where c.user_id = v_user_id or c.claimed_by = v_user_id;
    end if;

    v_deleted := v_deleted || jsonb_build_array(jsonb_build_object('key', 'consultants_owned', 'count', v_count));

    delete from auth.users usr
    where usr.id = v_user_id;

    return jsonb_build_object(
      'ok', true,
      'mode', v_mode,
      'email', v_email,
      'userExists', true,
      'userId', v_user_id,
      'affected', v_affected,
      'deleted', v_deleted,
      'authUserDeleted', true
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'mode', v_mode,
    'email', v_email,
    'userExists', true,
    'userId', v_user_id,
    'affected', v_affected,
    'deleted', v_deleted,
    'authUserDeleted', false
  );
end;
$$;

revoke all on function public.admin_dev_reset_test_user(text, text, text) from public;
grant execute on function public.admin_dev_reset_test_user(text, text, text) to authenticated;
