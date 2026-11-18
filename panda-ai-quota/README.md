# Panda Go — quota pilot / Model A

**Prepared for testing, not deployed.** No live Panda AI or HSK lesson files are changed. Test entitlements are **not real purchases**.

## Approved policy
- After a confirmed course purchase: **10 successful generated AI responses per UTC day** for the first **30 × 24 hours**.
- After exactly 30 days: **3 AI responses per UTC day**.
- Reset at **00:00 UTC**. Response includes explicit resetsAt.
- Reading quotas, listening to existing MP3, lessons, and scripted dialogs do **not** consume paid AI allowance.
- AI quota enforced on **Cloudflare D1** (server side), not in user-controlled browser storage.
- A failed AI call refunds the reserved quota unit. Parallel chat requests are limited by an atomic SQL statement.

## Setup (owner only)
1. Create a separate Supabase Auth project. Create a test student account.
2. Create a Cloudflare D1 database panda-ai-quota-pilot. Apply schema.sql.
3. Copy wrangler.example.toml to wrangler.toml, fill database ID, Supabase URL and publishable key, and configure exact ALLOWED_ORIGIN.
4. Store GEMINI_API_KEY with wrangler secret put GEMINI_API_KEY only when ready to test paid AI. Until then the AI route returns AI_NOT_CONFIGURED with no quota charge.
5. For private tests only, set ENABLE_TEST_GRANTS = "true" and store unpredictable ADMIN_SECRET using wrangler secret put ADMIN_SECRET. **Turn off test grants before public release**.
6. Deploy a Worker. Open the separate panda-ai-quota-pilot.html preview after deployment. Its email/password login is strictly for test accounts.
7. From a trusted terminal, issue test entitlement (the UUID must correspond to the real Supabase Auth test user; never expose admin secret in frontend):

~~~sh
curl -X POST https://YOUR-WORKER.workers.dev/admin/test-grant \
  -H "x-admin-secret: $ADMIN_SECRET" \
  -H "content-type: application/json" \
  -d '{"userId":"00000000-0000-4000-8000-000000000001","purchasedAt":"2026-11-18T09:00:00Z"}'
~~~

To simulate day 31, backdate purchasedAt by 30+ days using the test grant. That test-only operation resets the test user's daily usage.

## APIs
- GET /health — basic reachability.
- GET /api/quota with Supabase user access token — phase, 10/3 limit, used, remaining, day, UTC reset, test/purchase entitlement type.
- POST /api/chat with Supabase access token + JSON {"message":"你好"} — verifies course ownership, reserves one quota unit atomically, calls Gemini and returns generated Chinese reply.
- POST /admin/test-grant — disabled by default and requires private secret, restricted to test accounts. **Never a payment webhook.**

## Security before any sales
- [ ] Test 10 → 3 boundary, separate users, concurrency, origin enforcement, and AI failure refunds.
- [ ] Add verified payment processor webhooks, replay/idempotency protections, refunds and cancellation policies.
- [ ] Add chat request idempotency and safe timeout/retry reconciliation before public paid launch.
- [ ] Configure spending ceilings and retry/rate limits with a real AI vendor.
- [ ] Check vendor geographic eligibility for real students, especially mainland China.
- [ ] Commercial hosting and student privacy/consent requirements must be resolved.
- [ ] No student AI keys or admin secrets in GitHub Pages. Avoid leaving a public password test-login UI enabled.

The current version is a separate technical pilot. **No Supabase, Cloudflare, payment processor, or Gemini billing account has been connected by these GitHub file changes.**
