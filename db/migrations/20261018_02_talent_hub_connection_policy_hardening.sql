-- The first migration granted participants broad update access, which could let a
-- requester accept their own request through a direct PostgREST call. Retain the
-- session-authenticated API path, but enforce allowed state transitions in Postgres.

create or replace function public.enforce_talent_connection_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if new.candidate_worker_id <> old.candidate_worker_id
		or new.requester_user_id <> old.requester_user_id
		or new.intent <> old.intent
		or new.opportunity_title is distinct from old.opportunity_title
		or new.opportunity_location is distinct from old.opportunity_location
		or new.opportunity_url is distinct from old.opportunity_url
		or new.message <> old.message
		or new.created_at <> old.created_at then
		raise exception 'Connection request details cannot be changed after sending';
	end if;

	if new.status = old.status then
		return new;
	end if;

	if old.status <> 'pending' then
		raise exception 'Only pending connection requests can change status';
	end if;

	if auth.uid() = old.requester_user_id and new.status = 'withdrawn' then
		if new.withdrawn_at is null then
			raise exception 'Withdrawn requests need a withdrawal timestamp';
		end if;
		return new;
	end if;

	if public.talent_request_candidate_user_id(old.candidate_worker_id) = auth.uid()
		and new.status in ('accepted', 'declined', 'blocked') then
		if new.responded_at is null then
			raise exception 'Candidate decisions need a response timestamp';
		end if;
		return new;
	end if;

	raise exception 'Not permitted to make this connection request transition';
end;
$$;

drop trigger if exists enforce_talent_connection_request_update on public.talent_connection_requests;
create trigger enforce_talent_connection_request_update
	before update on public.talent_connection_requests
	for each row execute function public.enforce_talent_connection_request_update();

drop policy if exists talent_connection_requests_participants_update on public.talent_connection_requests;
create policy talent_connection_requests_participants_update on public.talent_connection_requests
	for update to authenticated
	using (
		requester_user_id = auth.uid()
		or public.talent_request_candidate_user_id(candidate_worker_id) = auth.uid()
	)
	with check (
		requester_user_id = auth.uid()
		or public.talent_request_candidate_user_id(candidate_worker_id) = auth.uid()
	);

-- Keep direct messages insert/select-only as designed.

drop policy if exists talent_messages_recipient_update on public.talent_messages;

select pg_notify('pgrst', 'reload schema');