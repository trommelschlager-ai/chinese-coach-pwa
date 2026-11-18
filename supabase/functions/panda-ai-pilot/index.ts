// Panda Go / Panda AI Model A: free, Supabase-only pilot.
// Intentionally no real AI provider, payments, or production keys.
import { createClient } from "npm:@supabase/supabase-js@2";
import { quotaPolicy as policy } from "./policy.ts";

type AppEnv = {
  url: string;
  key: string;
  service: string;
  origin: string;
  testMode: boolean;
};

function getEnv(): AppEnv {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const origin = Deno.env.get("PANDA_ALLOWED_ORIGIN") || "";
  return { url, key, service, origin, testMode: Deno.env.get("PANDA_TEST_MODE") === "true" };
}

function json(data: Record<string, unknown>, code: number, origin = ""): Response {
  const headers: Record<string,string> = {
    "content-type":"application/json; charset=utf-8",
    "cache-control":"no-store",
    "x-content-type-options":"nosniff",
    "vary":"Origin",
  };
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-headers"] = "authorization,apikey,content-type";
    headers["access-control-allow-methods"] = "GET,POST,OPTIONS";
  }
  return new Response(JSON.stringify(data), {status:code, headers});
}

function resetAt(now: number): string {
  const d = new Date(now);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)).toISOString();
}
function mockReply(message: string) {
  const t = message.toLowerCase();
  if (t.includes("你好")) return "你好！很高兴和你练习中文。";
  if (t.includes("工作")) return "你做什么工作？我们来聊聊吧。";
  if (t.includes("吃")) return "你今天吃了什么？";
  return "我听懂了。你能再说一句吗？";
}

Deno.serve(async (req: Request) => {
  const env = getEnv();
  const reqOrigin = req.headers.get("origin") || "";
  const origin = reqOrigin && reqOrigin === env.origin ? reqOrigin : "";
  if (reqOrigin && !origin) return json({error:"Origin not allowed"},403);
  if (req.method === "OPTIONS") {
    if (!origin) return json({error:"Origin not allowed"},403);
    return new Response(null, {
      status:204,
      headers:{
        "access-control-allow-origin":origin,
        "access-control-allow-headers":"authorization,apikey,content-type",
        "access-control-allow-methods":"GET,POST,OPTIONS",
        "vary":"Origin",
      },
    });
  }

  // Fail closed: no external service is called without explicit configuration.
  if (!env.url || !env.key || !env.service || !env.origin) {
    return json({error:"Pilot not configured"},503,origin);
  }
  if (req.method !== "GET" && req.method !== "POST") return json({error:"Unsupported method"},405,origin);
  const bearer = req.headers.get("authorization") || "";
  const token = /^Bearer (.+)$/.exec(bearer)?.[1];
  if (!token) return json({error:"Login required",code:"AUTH_REQUIRED"},401,origin);

  try {
    // Server-side token verification, not a browser-controlled student ID.
    const auth = createClient(env.url,env.key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:userData,error:userError} = await auth.auth.getUser(token);
    const uid = userData?.user?.id;
    if (userError || !uid) return json({error:"Invalid session",code:"AUTH_REQUIRED"},401,origin);

    // Service role is used ONLY on the Edge Function server.
    const admin = createClient(env.url,env.service,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:entitlement,error:entError} = await admin.from("panda_course_entitlements")
      .select("purchased_at,source").eq("user_id",uid).maybeSingle();
    if (entError) return json({error:"Quota database unavailable"},503,origin);
    if (!entitlement) return json({error:"Course access required",code:"NO_COURSE"},403,origin);

    const now = Date.now();
    const terms = policy(entitlement.purchased_at,now);
    const dayUTC = new Date(now).toISOString().slice(0,10);
    const resetsAt = resetAt(now);
    const {data:usage,error:usageError} = await admin.from("panda_ai_daily_usage")
      .select("used").eq("user_id",uid).eq("utc_day",dayUTC).maybeSingle();
    if (usageError) return json({error:"Quota database unavailable"},503,origin);
    const used = Number(usage?.used || 0);
    const remaining = Math.max(0,terms.limit - used);

    if (req.method === "GET") {
      return json({...terms,used,remaining,dayUTC,resetsAt,testGrant:entitlement.source === "test",realAI:false},200,origin);
    }

    // Only test entitlements and explicit env flag can obtain mock replies.
    // Never silently present scripted text as a paid LLM answer.
    if (!env.testMode || entitlement.source !== "test") {
      return json({error:"AI not connected; pilot mode only",code:"AI_NOT_CONFIGURED"},503,origin);
    }
    let data:unknown;
    try { const raw = await req.text(); if(raw.length > 4096) throw Error("too long"); data=JSON.parse(raw); }
    catch { return json({error:"Invalid JSON"},400,origin); }
    const message = typeof data === "object" && data !== null && "message" in data
      ? (data as {message?:unknown}).message : null;
    if (typeof message !== "string" || !message.trim() || message.length > 500) {
      return json({error:"Message must be 1–500 characters"},400,origin);
    }

    const {data:reserved,error:reserveError} = await admin.rpc("panda_reserve_response",{
      p_user_id:uid,p_utc_day:dayUTC,p_limit:terms.limit,
    });
    if (reserveError) return json({error:"Could not update quota"},503,origin);
    if (reserved == null) return json({error:"Daily quota used",code:"LIMIT_REACHED",limit:terms.limit,remaining:0,resetsAt},429,origin);
    return json({
      answer:mockReply(message.trim()),mock:true,realAI:false,
      ...terms,used:reserved,remaining:Math.max(0,terms.limit - Number(reserved)),resetsAt,
    },200,origin);
  } catch {
    return json({error:"Pilot temporarily unavailable"},503,origin);
  }
});
