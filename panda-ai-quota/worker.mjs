// Panda Go — isolated AI quota pilot. No production app files are changed.
// Cloudflare Worker + D1 + Supabase Auth. Test grants are admin-only and disabled by default.
const DAY_MS = 86_400_000;
const TRIAL_DAYS = 30;
const TRIAL_LIMIT = 10;
const BASE_LIMIT = 3;

export function quotaPolicy(purchasedAt, now = Date.now()) {
  const start = Date.parse(purchasedAt);
  if (!Number.isFinite(start) || now < start) throw new Error('Invalid purchase timestamp');
  const elapsedDays = (now - start) / DAY_MS;
  const trial = elapsedDays < TRIAL_DAYS;
  return {
    phase: trial ? 'trial' : 'base',
    limit: trial ? TRIAL_LIMIT : BASE_LIMIT,
    trialEndsAt: new Date(start + TRIAL_DAYS * DAY_MS).toISOString(),
    trialDay: trial ? Math.floor(elapsedDays) + 1 : null,
  };
}

const send = (data, status = 200, origin = '') => {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'vary': 'Origin' };
  if (origin) { headers['access-control-allow-origin'] = origin; headers['access-control-allow-headers'] = 'authorization,content-type'; headers['access-control-allow-methods'] = 'GET,POST,OPTIONS'; }
  return new Response(JSON.stringify(data), { status, headers });
};
function todayUTC(now) { return new Date(now).toISOString().slice(0, 10); }
function nextUtcDay(now) { const d = new Date(now); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)).toISOString(); }
function allowedOrigin(req, env) {
  const origin = req.headers.get('origin') || '';
  // Production must specify the complete, exact allowlisted site origin.
  return origin && origin === env.ALLOWED_ORIGIN ? origin : '';
}
async function validateUser(req, env) {
  const auth = req.headers.get('authorization') || '';
  if (!/^Bearer\s+\S+$/.test(auth)) return null;
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return null;
  const url = new URL('/auth/v1/user', env.SUPABASE_URL);
  // Verify token with Auth server; never trust browser-provided userId.
  const r = await fetch(url, { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization: auth }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) return null;
  const user = await r.json();
  return typeof user.id === 'string' && user.id.length <= 128 ? user.id : null;
}
async function getEntitlement(db, userId) {
  return db.prepare('SELECT purchased_at, source FROM course_entitlements WHERE user_id = ?').bind(userId).first();
}
async function getUsed(db, userId, day) {
  const row = await db.prepare('SELECT used FROM ai_daily_usage WHERE user_id = ? AND day_utc = ?').bind(userId, day).first();
  return Number(row?.used || 0);
}
async function reserve(db, userId, day, limit) {
  // One atomic statement: concurrent requests cannot exceed the daily cap.
  const row = await db.prepare("INSERT INTO ai_daily_usage (user_id, day_utc, used) VALUES (?, ?, 1) ON CONFLICT(user_id, day_utc) DO UPDATE SET used = used + 1 WHERE used < ? RETURNING used").bind(userId, day, limit).first();
  return !row ? null : Number(row.used);
}
async function refund(db, userId, day) {
  await db.prepare('UPDATE ai_daily_usage SET used = MAX(0, used - 1) WHERE user_id = ? AND day_utc = ?').bind(userId, day).run();
}
async function parseBody(req, limit = 4096) {
  const body = await req.text();
  if (body.length > limit) throw new Error('Request too large');
  return JSON.parse(body);
}
async function generateReply(env, text) {
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(model)) throw new Error('Invalid model setting');
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: 'You are Panda AI, a friendly Chinese HSK 1–2 conversational tutor. Reply in natural, simple Mandarin (1–2 brief sentences). If the learner makes a clear Chinese grammar error, add one short Russian correction. Never claim to have measured acoustic tones. Keep answers concise.' }] },
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
    }), signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error('AI provider unavailable');
  const data = await res.json();
  const answer = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('')?.trim();
  if (!answer) throw new Error('AI returned no response');
  return answer.slice(0, 1200);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = allowedOrigin(request, env);
    const fromBrowser = request.headers.has('origin');
    if (request.method === 'OPTIONS') return origin ? new Response(null, { status: 204, headers: { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'vary': 'Origin' } }) : send({ error: 'Origin not allowed' }, 403);
    if (fromBrowser && !origin) return send({ error: 'Origin not allowed' }, 403);
    if (url.pathname === '/health' && request.method === 'GET') return send({ ok: true, pilot: true }, 200, origin);
    if (!env.DB) return send({ error: 'Database not configured' }, 503, origin);

    // No browser-facing administrative grant mechanism. Disabled in normal deployment.
    if (url.pathname === '/admin/test-grant' && request.method === 'POST') {
      if (env.ENABLE_TEST_GRANTS !== 'true' || !env.ADMIN_SECRET || request.headers.get('x-admin-secret') !== env.ADMIN_SECRET)
        return send({ error: 'Forbidden' }, 403, origin);
      try {
        const b = await parseBody(request, 512);
        if (typeof b.userId !== 'string' || !/^[a-f0-9-]{36}$/i.test(b.userId)) return send({ error: 'Invalid userId' }, 400, origin);
        const stamp = b.purchasedAt || new Date().toISOString();
        const t = Date.parse(stamp);
        if (!Number.isFinite(t) || t > Date.now()) return send({ error: 'Invalid purchase date' }, 400, origin);
        await env.DB.prepare("INSERT INTO course_entitlements(user_id,purchased_at,source) VALUES (?, ?, 'test') ON CONFLICT(user_id) DO UPDATE SET purchased_at = excluded.purchased_at, source = 'test'").bind(b.userId, new Date(t).toISOString()).run();
        // Test-only reset makes boundary retesting deterministic; never used for real payments.
        await env.DB.prepare('DELETE FROM ai_daily_usage WHERE user_id = ?').bind(b.userId).run();
        return send({ ok: true, testGrant: true, purchasedAt: new Date(t).toISOString() }, 200, origin);
      } catch { return send({ error: 'Invalid request' }, 400, origin); }
    }

    if (!['/api/quota', '/api/chat'].includes(url.pathname)) return send({ error: 'Not found' }, 404, origin);
    if ((url.pathname === '/api/quota' && request.method !== 'GET') || (url.pathname === '/api/chat' && request.method !== 'POST'))
      return send({ error: 'Method not allowed' }, 405, origin);

    let userId;
    try { userId = await validateUser(request, env); }
    catch { return send({ error: 'Authentication service unavailable' }, 503, origin); }
    if (!userId) return send({ error: 'Login required', code: 'AUTH_REQUIRED' }, 401, origin);

    try {
      const entitlement = await getEntitlement(env.DB, userId);
      if (!entitlement) return send({ error: 'Course purchase required', code: 'NO_COURSE' }, 403, origin);
      const now = Date.now();
      const policy = quotaPolicy(entitlement.purchased_at, now);
      const day = todayUTC(now);
      if (url.pathname === '/api/quota') {
        const used = await getUsed(env.DB, userId, day);
        return send({ ...policy, used, remaining: Math.max(0, policy.limit - used), dayUTC: day, resetsAt: nextUtcDay(now), testGrant: entitlement.source === 'test' }, 200, origin);
      }
      if (!env.GEMINI_API_KEY) return send({ error: 'AI not configured yet', code: 'AI_NOT_CONFIGURED' }, 503, origin);
      let body;
      try { body = await parseBody(request); } catch { return send({ error: 'Invalid JSON or request too large' }, 400, origin); }
      if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 500)
        return send({ error: 'Message must be 1–500 characters' }, 400, origin);
      const used = await reserve(env.DB, userId, day, policy.limit);
      if (used === null) return send({ error: 'Daily quota reached', code: 'LIMIT_REACHED', remaining: 0, limit: policy.limit, resetsAt: nextUtcDay(now) }, 429, origin);
      try {
        const answer = await generateReply(env, body.message.trim());
        return send({ answer, phase: policy.phase, used, remaining: policy.limit - used, limit: policy.limit, resetsAt: nextUtcDay(now) }, 200, origin);
      } catch {
        await refund(env.DB, userId, day);
        return send({ error: 'AI temporarily unavailable; your quota was restored', code: 'AI_ERROR' }, 502, origin);
      }
    } catch {
      return send({ error: 'Service temporarily unavailable', code: 'SERVICE_ERROR' }, 503, origin);
    }
  },
};
