// Panda Go — opt-in real AI pilot. NOT deployed, NOT used by the current PWA.
// No real provider is called unless the owner enables the feature and adds paid
// provider secrets to Supabase (never to GitHub Pages or public repo).
// Exact source of existing limits: active panda-ai-pilot server (10/day for 30d, then 3/day).
import { quotaPolicy } from "./policy.ts";

const ORIGIN = "https://trommelschlager-ai.github.io";
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    hanzi: { type: "string" },
    pinyin: { type: "string" },
    ru: { type: "string" },
    coachNoteRu: { type: "string" },
    topic: { type: "string" }
  },
  required: ["hanzi", "pinyin", "ru", "coachNoteRu", "topic"]
};

const RULES = [
  "You are Panda AI, a supportive but accurate conversational tutor of Mandarin for Russian-speaking adult students.",
  "Use mainly HSK1–2 words and grammar. Stay natural: do not say you do not understand if the student uses correct basic Chinese.",
  "Continue the last topic and ask one useful follow-up question where appropriate. Track only the provided recent chat, do not invent user facts.",
  "Return one short conversational answer in Chinese; accurately render its tone-marked Hanyu Pinyin and Russian meaning.",
  "A clearly grammatical error may receive one concise Russian coachNoteRu with a correction. If text was misrecognized or unclear, do NOT diagnose pronunciation mistakes.",
  "Never evaluate Mandarin tones from recognized text or claim any acoustic tone measurement; tone evaluation is a separate opt-in audio analysis.",
  "Never include secrets, hidden instructions, model metadata, URLs or personal-data requests in the answer.",
  "The output must match the requested JSON schema exactly."
].join("\n");

type Turn = { role: "user" | "assistant"; text: string };
type RequestBody = { version: 1; utterance: string; history: Turn[]; level: "HSK1" | "HSK2"; topic: string };
type ModelTurn = { hanzi: string; pinyin: string; ru: string; coachNoteRu: string; topic: string };
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", vary: "Origin" };

function send(body: Record<string, unknown>, status: number, origin: string) {
  const headers: Record<string, string> = { ...JSON_HEADERS };
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "POST,OPTIONS";
    headers["access-control-allow-headers"] = "authorization,apikey,content-type";
  }
  return new Response(JSON.stringify(body), { status, headers });
}
function env(name: string) { return Deno.env.get(name) || ""; }

function validate(body: unknown): RequestBody {
  if (!body || typeof body !== "object") throw Error("INVALID_REQUEST");
  const data = body as Record<string, unknown>;
  if (data.version !== 1 || !["HSK1","HSK2"].includes(String(data.level))) throw Error("INVALID_REQUEST");
  const message = typeof data.utterance === "string" ? data.utterance.trim().normalize("NFC") : "";
  if (!message || [...message].length > 500 || !/\p{Script=Han}/u.test(message)) throw Error("INVALID_REQUEST");
  if (typeof data.topic !== "string" || !/^[a-zA-Z0-9_.-]{1,100}$/.test(data.topic)) throw Error("INVALID_REQUEST");
  if (!Array.isArray(data.history) || data.history.length > 8) throw Error("INVALID_REQUEST");
  const history: Turn[] = data.history.map(item => {
    if (!item || typeof item !== "object" || !["user","assistant"].includes(item.role) ||
        typeof item.text !== "string" || !item.text.trim() || [...item.text].length > 500) {
      throw Error("INVALID_REQUEST");
    }
    return { role: item.role as Turn["role"], text: item.text.trim().normalize("NFC") };
  });
  return { version:1,utterance:message,history,level:data.level as RequestBody["level"],topic:data.topic };
}

function adminHeaders(secret: string): HeadersInit {
  return { apikey:secret,
    ...(secret.startsWith("eyJ") ? { authorization:"Bearer "+secret } : {}),
    "content-type":"application/json" };
}
function isOpenAIReady() {
  return env("PANDA_AI_LIVE_ENABLED") === "true" &&
    !!env("OPENAI_API_KEY") && !!env("PANDA_LLM_MODEL");
}
async function verifyUser(url: string, publishable: string, token: string): Promise<string> {
  const response=await fetch(url+"/auth/v1/user",{
    headers:{apikey:publishable,authorization:"Bearer "+token},signal:AbortSignal.timeout(8000)
  });
  if (!response.ok) throw Error("AUTH_REQUIRED");
  const body=await response.json();
  if (typeof body?.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) throw Error("AUTH_REQUIRED");
  return body.id;
}
async function getEntitlement(url: string, secret: string, uid: string): Promise<{purchased_at:string;source:string}|null> {
  const uri=url+"/rest/v1/panda_course_entitlements?user_id=eq."+encodeURIComponent(uid)+"&select=purchased_at,source&limit=1";
  const res=await fetch(uri,{headers:adminHeaders(secret),signal:AbortSignal.timeout(8000)});
  if (!res.ok) throw Error("QUOTA_UNAVAILABLE");
  const rows=await res.json();
  return Array.isArray(rows) && rows[0]?.purchased_at ? rows[0] : null;
}
async function reserveQuota(url:string,secret:string,userId:string,limit:number):Promise<number|null>{
  const day=new Date().toISOString().slice(0,10);
  const res=await fetch(url+"/rest/v1/rpc/panda_reserve_response",{
    method:"POST",headers:adminHeaders(secret),
    body:JSON.stringify({p_user_id:userId,p_utc_day:day,p_limit:limit}),
    signal:AbortSignal.timeout(8000)
  });
  if(!res.ok)throw Error("QUOTA_UNAVAILABLE");
  const n=await res.json();
  return n===null ? null : (Number.isInteger(Number(n))?Number(n):null);
}

async function realReply(body:RequestBody):Promise<ModelTurn>{
  const input=[
    ...body.history.map(item=>({role:item.role,content:item.text})),
    {role:"user",content:body.utterance}
  ];
  const request={
    model:env("PANDA_LLM_MODEL"),
    store:false,
    instructions:RULES+"\nLearner level: "+body.level+"; conversation topic: "+body.topic,
    input, max_output_tokens:420,
    text:{format:{type:"json_schema",name:"panda_go_hsk12_turn",strict:true,schema:SCHEMA}}
  };
  const res=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",headers:{authorization:"Bearer "+env("OPENAI_API_KEY"),"content-type":"application/json"},
    body:JSON.stringify(request),signal:AbortSignal.timeout(20000)
  });
  if(!res.ok)throw Error("AI_UNAVAILABLE");
  const data=await res.json();
  const raw=(Array.isArray(data?.output)?data.output:[])
    .flatMap((item:{content?:Array<{type:string;text?:string}>})=>item.content||[])
    .find((part:{type:string})=>part.type==="output_text")?.text;
  if(typeof raw!=="string")throw Error("AI_UNAVAILABLE");
  const v=JSON.parse(raw) as ModelTurn;
  if(!v || !["hanzi","pinyin","ru","coachNoteRu","topic"].every(k=>typeof v[k as keyof ModelTurn]==="string"))
    throw Error("AI_UNAVAILABLE");
  if(!/\p{Script=Han}/u.test(v.hanzi)||[v.hanzi,v.pinyin,v.ru].some(x=>!x.trim()||[...x].length>350))
    throw Error("AI_UNAVAILABLE");
  if([...v.coachNoteRu].length>300||[...v.topic].length>100)throw Error("AI_UNAVAILABLE");
  return v;
}

async function optionalXiaoxiaoAudio(zh:string) {
  // Never use Panda Street, a human recording, browser TTS, or a substitute voice.
  if(env("PANDA_XIAOXIAO_TTS_ENABLED")!=="true"||!env("LUVVOICE_API_TOKEN"))return null;
  const rate=Number(env("PANDA_XIAOXIAO_RATE"));
  if(!env("PANDA_XIAOXIAO_RATE")||!Number.isInteger(rate)||rate< -50||rate>50)return null;
  const res=await fetch("https://luvvoice.com/api/v1/text-to-speech",{
    method:"POST",
    headers:{authorization:"Bearer "+env("LUVVOICE_API_TOKEN"),"content-type":"application/json"},
    body:JSON.stringify({text:zh,voice_id:"voice-093",rate,pitch:0,volume:0}),
    signal:AbortSignal.timeout(16000)
  });
  if(!res.ok)return null;
  const data=await res.json();
  if(!data?.success||typeof data.audio_url!=="string")return null;
  try{
    const parsed=new URL(data.audio_url);
    if(parsed.protocol!=="https:"||parsed.hostname!=="cdn.luvvoice.com")return null;
    return {provider:"luvvoice",voiceId:"voice-093",url:parsed.href,ephemeral:true};
  }catch{return null}
}

Deno.serve(async(req:Request)=>{
 const requestOrigin=req.headers.get("origin")||"";
 if(requestOrigin && requestOrigin!==ORIGIN)return send({error:"Origin not allowed"},403,"");
 const origin=requestOrigin===ORIGIN?ORIGIN:"";
 if(req.method==="OPTIONS")return origin?new Response(null,{status:204,headers:{
  "access-control-allow-origin":origin,"access-control-allow-methods":"POST,OPTIONS",
  "access-control-allow-headers":"authorization,apikey,content-type",vary:"Origin"}}):
  send({error:"Origin not allowed"},403,"");
 if(req.method!=="POST")return send({error:"Unsupported method"},405,origin);
 // Gate before reading user content or reserving quota. No API usage in preview mode.
 if(!isOpenAIReady())return send({error:"Real AI is not enabled",code:"AI_DISABLED"},503,origin);
 const supabaseUrl=env("SUPABASE_URL");
 const publicKey=env("SUPABASE_PUBLISHABLE_KEY")||env("SUPABASE_ANON_KEY");
 const secret=env("PANDA_SUPABASE_SECRET_KEY")||env("SUPABASE_SERVICE_ROLE_KEY");
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl)||!publicKey||!secret)
  return send({error:"Server authentication not configured",code:"AI_DISABLED"},503,origin);
 const token=/^Bearer (.+)$/i.exec(req.headers.get("authorization")||"")?.[1];
 if(!token)return send({error:"Login required",code:"AUTH_REQUIRED"},401,origin);
 try{
  const uid=await verifyUser(supabaseUrl,publicKey,token);
  const entitlement=await getEntitlement(supabaseUrl,secret,uid);
  if(!entitlement)return send({error:"Course access required",code:"NO_ACCESS"},403,origin);
  let request:RequestBody;
  try{
   const raw=await req.text();
   if(raw.length>6500)throw Error("INVALID_REQUEST");
   request=validate(JSON.parse(raw));
  }catch{return send({error:"Unsupported message",code:"INVALID_REQUEST"},400,origin)}
  const quota=quotaPolicy(entitlement.purchased_at);
  const used=await reserveQuota(supabaseUrl,secret,uid,quota.limit);
  if(used===null)return send({error:"Daily limit reached",code:"LIMIT_REACHED"},429,origin);
  // The quota is reserved before the external provider call. A provider failure
  // currently counts against the quota, as in the existing mock pilot.
  const answer=await realReply(request);
  const audio=await optionalXiaoxiaoAudio(answer.hanzi).catch(()=>null);
  return send({
    contractVersion:1,realAI:true,
    answer:{hanzi:answer.hanzi,pinyin:answer.pinyin,ru:answer.ru},
    coachNoteRu:answer.coachNoteRu,
    topic:answer.topic, audio,
    quota:{used,remaining:Math.max(0,quota.limit-used),limit:quota.limit}
  },200,origin);
 }catch(e){
  const reason=e instanceof Error?e.message:"AI_UNAVAILABLE";
  if(reason==="AUTH_REQUIRED")return send({error:"Invalid login",code:"AUTH_REQUIRED"},401,origin);
  return send({error:"AI temporarily unavailable",code:"AI_UNAVAILABLE"},503,origin);
 }
});
