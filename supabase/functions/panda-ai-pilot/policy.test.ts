import { quotaPolicy, MS_PER_DAY } from "./policy.ts";

function eq(a:unknown,b:unknown,label:string) {
  if(a!==b) throw new Error(label+" — expected "+String(b)+", got "+String(a));
}
function throws(f:()=>unknown,label:string) {
  let didThrow=false;
  try{f()}catch{didThrow=true}
  if(!didThrow)throw new Error(label);
}

const epoch=Date.parse("2026-11-01T10:20:00Z");
const date=new Date(epoch).toISOString();
Deno.test("trial starts with 10 responses on day 1",()=>{
  const r=quotaPolicy(date,epoch);
  eq(r.phase,"trial","phase");eq(r.limit,10,"limit");eq(r.trialDay,1,"day");
});
Deno.test("day 30 still has 10 until last millisecond",()=>{
  const r=quotaPolicy(date,epoch+30*MS_PER_DAY-1);
  eq(r.phase,"trial","phase");eq(r.limit,10,"limit");eq(r.trialDay,30,"day");
});
Deno.test("at exact 30x24h boundary limit drops to 3",()=>{
  const r=quotaPolicy(date,epoch+30*MS_PER_DAY);
  eq(r.phase,"base","phase");eq(r.limit,3,"limit");eq(r.trialDay,null,"day");
});
Deno.test("day 31 and day 99 stay at 3",()=>{
  eq(quotaPolicy(date,epoch+31*MS_PER_DAY).limit,3,"day31");
  eq(quotaPolicy(date,epoch+99*MS_PER_DAY).limit,3,"day99");
});
Deno.test("invalid and future purchased_at are refused",()=>{
  throws(()=>quotaPolicy("INVALID",epoch),"invalid date");
  throws(()=>quotaPolicy(new Date(epoch+MS_PER_DAY).toISOString(),epoch),"future date");
});
Deno.test("trial ending timestamp matches purchase plus 30 days",()=>{
  eq(quotaPolicy(date,epoch).trialEndsAt,new Date(epoch+30*MS_PER_DAY).toISOString(),"trialEndsAt");
});
