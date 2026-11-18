# Panda AI Model A — Supabase-only free pilot

This is an isolated **test**, not production Panda AI. It does not modify HSK lessons, approved Panda artwork, recordings, or any working application pages.

## Approved policy
- Starts on recorded course purchase timestamp (pilot uses a TEST grant, no money).
- First 30 × 24 hours: 10 responses per UTC day.
- After 30 days: 3 responses per UTC day.
- UTC midnight daily reset; local phone clocks cannot reset allowance.
- Only server requests to the mock chat endpoint use quota.

## Free test architecture
- Supabase Auth verifies the student account on every call.
- Supabase Postgres stores test entitlements and the counters.
- A Supabase Edge Function checks the account and returns a **clearly marked simulated Chinese reply**.
- The separate panda-ai-supabase-pilot.html is a browser tester.
- No paid AI provider, payment processing, AI keys, or paid voice is included.

## Setup (project owner)
1. Create a Supabase Free project. Do not choose a paid plan.
2. Apply the SQL migration file in this folder: migrations/202611180001_panda_ai_model_a.sql
3. Deploy Edge Function: functions/panda-ai-pilot/index.ts (and policy.ts).
4. supabase/config.toml disables legacy platform verify_jwt for this isolated function; the handler still verifies the user token server-side with auth.getUser.
5. Configure environment variables on the function:
   - PANDA_ALLOWED_ORIGIN = https://trommelschlager-ai.github.io
   - PANDA_TEST_MODE = true
   - SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are generally supplied by Supabase. If not, configure them as private server secrets. Never insert the service role key in HTML or GitHub source.
6. In Supabase Authentication, create a disposable test learner and record the UUID. Do not publish any passwords or UUIDs.
7. Using trusted SQL editor, manually grant a TEST entitlement; replace the UUID in the following SQL (not real purchase):

    insert into public.panda_course_entitlements(user_id,purchased_at,source)
    values('00000000-0000-4000-8000-000000000001', now(), 'test')
    on conflict(user_id) do update set purchased_at=excluded.purchased_at, source='test';

8. Publish the separate test HTML at the exact allowed origin, enter project URL and publishable key, sign in with the test student's credentials. No passwords are saved to the browser.
9. After testing day 1, use the trusted SQL editor to simulate day 31 (replace UUID):

    update public.panda_course_entitlements
    set purchased_at = now() - interval '31 days'
    where user_id='00000000-0000-4000-8000-000000000001';

10. Check that the same user sees at most 3 responses after day 30. Note daily usage for that UTC day does not disappear with a purchase date change.

## Automated checks
Run: deno test --no-config supabase/functions/panda-ai-pilot/policy.test.ts
Run: deno check --no-config supabase/functions/panda-ai-pilot/index.ts

## Before real sales
Needs verified payment events, billing and subscription rules, request idempotency, API abuse monitoring, privacy/retention controls, paid AI provider selection by country, and appropriate commercial hosting.
Do not enable real customer access based on manual test entitlements.
