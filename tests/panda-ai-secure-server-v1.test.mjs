import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const f=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const server=f('supabase/functions/panda-ai-chat-v1/index.ts');
const html=f('panda-voice-pilot.html');
const core=f('assets/panda-hsk2-preview-core-v1.mjs');
const bridge=f('assets/panda-ai-secure-bridge-v1.mjs');
const config=f('supabase/config.toml');

test('New real-AI code is staged and NOT wired into production Panda',()=>{
 assert.doesNotMatch(html,/panda-ai-secure-bridge-v1/);
 assert.doesNotMatch(core,/panda-ai-secure-bridge-v1|panda-ai-chat-v1/);
 assert.match(server,/PANDA_AI_LIVE_ENABLED/);
 assert.match(server,/isOpenAIReady\(\)/);
 assert.match(server,/AI_DISABLED/);
 assert.match(server,/realAI:true/);
 assert.doesNotMatch(server,/mockReply\(|mock:true/);
});

test('OpenAI and Luvvoice secrets can only be read on Supabase server',()=>{
 assert.doesNotMatch(html,/OPENAI_API_KEY|LUVVOICE_API_TOKEN|PANDA_SUPABASE_SECRET_KEY/);
 assert.doesNotMatch(core,/OPENAI_API_KEY|LUVVOICE_API_TOKEN|PANDA_SUPABASE_SECRET_KEY/);
 assert.doesNotMatch(bridge,/OPENAI_API_KEY|LUVVOICE_API_TOKEN|PANDA_SUPABASE_SECRET_KEY/);
 assert.match(server,/env\("OPENAI_API_KEY"\)/);
 assert.match(server,/env\("LUVVOICE_API_TOKEN"\)/);
 assert.match(server,/env\("PANDA_AI_LIVE_ENABLED"\) === "true"/);
 assert.match(server,/env\("PANDA_XIAOXIAO_TTS_ENABLED"\)!=="true"/);
 assert.match(server,/voice_id:"voice-093"/);
 assert.doesNotMatch(server,/speechSynthesis|voice-001|panda-street/i);
});

test('Server reserves authenticated daily quota and limits browser CORS',()=>{
 assert.match(server,/verifyUser\(supabaseUrl,publicKey,token\)/);
 assert.match(server,/getEntitlement\(supabaseUrl,secret,uid\)/);
 assert.match(server,/reserveQuota\(supabaseUrl,secret,uid,quota.limit\)/);
 assert.match(server,/panda_reserve_response/);
 assert.match(server,/LIMIT_REACHED/);
 assert.match(server,/ORIGIN = "https:\/\/trommelschlager-ai\.github\.io"/);
 assert.match(config,/verify_jwt = false/);
 assert.match(server,/No approved Xiaoxiao|voice-093/);
});

test('Structured HSK response cannot claim tone scoring based on ASR text',()=>{
 assert.match(server,/json_schema/);
 assert.match(server,/No acoustic tone|Never evaluate Mandarin tones from recognized text/);
 assert.match(bridge,/toneVerified: false/);
 assert.match(server,/history\.length > 8/);
 assert.match(server,/\[\.\.\.message\]\.length > 500/);
 assert.match(server,/data\.level/);
});
