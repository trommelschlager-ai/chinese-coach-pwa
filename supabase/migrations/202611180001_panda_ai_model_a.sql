-- Panda AI Model A: Supabase-only free pilot.
-- IMPORTANT: Test entitlements are manually granted in SQL by the project owner.
-- Does not implement or imply real purchases.
create table if not exists public.panda_course_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  purchased_at timestamptz not null,
  source text not null default 'test' check (source in ('test','payment')),
  created_at timestamptz not null default now()
);

create table if not exists public.panda_ai_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  utc_day date not null,
  used integer not null default 0 check (used >= 0),
  primary key (user_id, utc_day)
);

alter table public.panda_course_entitlements enable row level security;
alter table public.panda_ai_daily_usage enable row level security;

-- No browser roles can grant themselves a course or change usage.
revoke all on public.panda_course_entitlements from anon, authenticated;
revoke all on public.panda_ai_daily_usage from anon, authenticated;

-- Atomic UPSERT: two requests at the same time cannot exceed a daily cap.
create or replace function public.panda_reserve_response(
  p_user_id uuid, p_utc_day date, p_limit integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used integer;
begin
  if p_user_id is null or p_utc_day is null or p_limit not in (3,10) then
    raise exception 'Invalid quota reservation';
  end if;

  insert into public.panda_ai_daily_usage as u(user_id, utc_day, used)
    values (p_user_id, p_utc_day, 1)
  on conflict (user_id, utc_day) do update
    set used = u.used + 1
    where u.used < p_limit
  returning used into v_used;

  return v_used; -- null means quota reached
end;
$$;

-- Only service_role may call this, never a signed-in student.
revoke all on function public.panda_reserve_response(uuid,date,integer) from public, anon, authenticated;
grant execute on function public.panda_reserve_response(uuid,date,integer) to service_role;

-- Test entitlement grant example, executed manually after creating a test
-- user in Supabase Auth. Replace the UUID, do not publish actual accounts:
--
-- insert into public.panda_course_entitlements(user_id, purchased_at, source)
-- values ('00000000-0000-4000-8000-000000000001', now(), 'test')
-- on conflict(user_id) do update set purchased_at=excluded.purchased_at, source='test';
--
-- To test day 31: set purchased_at = now() - interval '31 days' for the test user.
