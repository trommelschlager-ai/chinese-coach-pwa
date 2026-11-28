import assert from 'node:assert/strict';
import {calibrateVoice,describeTone,compareExperimental,MY_DAY_TONES} from '../assets/panda-tone-pro-v1.mjs';
const frames=(base,fn,n=25)=>Array.from({length:n},(_,i)=>({t:i*.016,hz:base*2**(fn(i/(n-1))/12),clarity:.95}));
for(const base of [105,190,260]){
 const cal=calibrateVoice(frames(base,x=>-5+10*x,100));
 assert(cal);
 for(const [name,fn] of [['high-level',()=>4],['rise',x=>-4+8*x],['fall',x=>4-9*x],['dip',x=>-4+24*(x-.5)**2],['low-level',()=>-4]]){
 const f=frames(base,fn);assert.equal(describeTone(f,cal).kind,name);
 assert.equal(compareExperimental(f,cal,[name],{verifiedBoundaries:true,lexicalMatch:true}).comparison,'shape-consistent');
 assert.equal(compareExperimental(f,cal,[name==='rise'?'fall':'rise'],{verifiedBoundaries:true,lexicalMatch:true}).comparison,'shape-different');
 assert.equal(compareExperimental(f,cal,[name]).kind,'uncertain');
 }
 const noisy=frames(base,x=>4*x).map(f=>({...f,clarity:.4}));
 assert.equal(describeTone(noisy,cal).kind,'uncertain');
 const jump=frames(base,x=>x<.5?0:12);
 assert.equal(describeTone(jump,cal).kind,'uncertain');
 assert.equal(describeTone(frames(base,()=>4,5),cal).kind,'uncertain');
 assert.equal(describeTone(frames(base,()=>4),null).kind,'uncertain');
 assert.equal(compareExperimental(frames(base,()=>0),cal,MY_DAY_TONES.daily[2],{verifiedBoundaries:true,lexicalMatch:true}).kind,'uncertain');
}
assert.equal(calibrateVoice(frames(150,()=>0,100)),null);
console.log('PASS synthetic contour and abstention cases; no real speech accuracy claim');
