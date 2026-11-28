/* Experimental contour classifier. No phonetic grade; requires human validation.
 * All inputs stay local. Confidence gates are heuristic, not probabilities.
 */
const median=a=>{const s=[...a].sort((a,b)=>a-b);return s.length%2?s[s.length>>1]:(s[s.length/2-1]+s[s.length/2])/2};
const st=(hz,base)=>12*Math.log2(hz/base);
const unknown=reason=>({kind:'uncertain',reason,isToneGrade:false});
export function calibrateVoice(samples){
 const good=(samples||[]).filter(f=>Number.isFinite(f.hz)&&f.hz>=65&&f.hz<=550&&f.clarity>=.8);
 if(good.length<60)return null;
 const hz=good.map(f=>f.hz).sort((a,b)=>a-b),baseHz=median(hz);
 const low=st(hz[Math.floor(hz.length*.1)],baseHz),high=st(hz[Math.floor(hz.length*.9)],baseHz);
 if(high-low<4||high-low>20)return null;
 return {baseHz,low,high,experimental:true};
}
export function describeTone(frames,calibration){
 if(!calibration||!(calibration.baseHz>0))return unknown('calibration-required');
 if(!Array.isArray(frames)||frames.length<9)return unknown('too-few-frames');
 const valid=frames.filter(f=>Number.isFinite(f.t)&&Number.isFinite(f.hz)&&f.hz>=65&&f.hz<=550&&f.clarity>=.75);
 if(valid.length<9||valid.length/frames.length<.8)return unknown('low-clarity');
 const duration=valid.at(-1).t-valid[0].t;
 if(duration<.13||duration>1.5)return unknown('duration');
 for(let i=1;i<valid.length;i++){
 const gap=valid[i].t-valid[i-1].t;
 if(gap<=0||gap>.055||Math.abs(st(valid[i].hz,valid[i-1].hz))>5)return unknown('pitch-discontinuity');
 }
 const v=valid.map((f,i)=>median(valid.slice(Math.max(0,i-1),i+2).map(p=>st(p.hz,calibration.baseHz))));
 const n=v.length,k=Math.max(2,Math.floor(n*.2));
 const a=median(v.slice(0,k)),b=median(v.slice(-k)),mid=median(v.slice(Math.floor(n*.35),Math.ceil(n*.65)));
 const range=Math.max(...v)-Math.min(...v),change=b-a;
 let kind='uncertain';
 if(a-mid>1.5&&b-mid>1.5)kind='dip';
 else if(change>2.6&&mid>=a-.8&&b>=mid-.5)kind='rise';
 else if(change< -3&&a>=mid-.5&&mid>=b-.8)kind='fall';
 else if(range<1.6&&a>calibration.high-2)kind='high-level';
 else if(range<2&&a<calibration.low+1.5)kind='low-level';
 return {kind,reason:kind==='uncertain'?'ambiguous-contour':'experimental-shape-only',duration,change,range,isToneGrade:false};
}
// Explicit pronunciation alternatives, not automatic universal sandhi rules.
// Neutral tone depends on preceding tone and duration; no shape-only grade.
export const MY_DAY_TONES=Object.freeze({
 brush:[['high-level'],['rise']],
 wake:[['low-level','fall','dip'],['rise']],
 wash:[['rise'],['dip','low-level']],
 breakfast:[['high-level'],['low-level','fall','dip'],['fall']],
 work:[['fall'],['fall'],['high-level']],
 sleep:[['fall'],['fall']],
 daily:[['rise','low-level','dip'],['low-level','fall','dip'],[],['rise'],['dip','low-level']]
});
export function compareExperimental(frames,calibration,allowed,{verifiedBoundaries=false,lexicalMatch=false}={}){
 if(!verifiedBoundaries||!lexicalMatch)return unknown('unverified-syllable-or-word');
 if(!Array.isArray(allowed)||!allowed.length)return unknown('context-dependent-tone');
 const result=describeTone(frames,calibration);
 if(result.kind==='uncertain')return result;
 return {...result,comparison:allowed.includes(result.kind)?'shape-consistent':'shape-different',isToneGrade:false};
}
