import {readFileSync} from 'node:fs';
import {calibrateVoice,compareExperimental,MY_DAY_TONES} from '../assets/panda-tone-pro-v1.mjs';
// Input contains human-reviewed, manually segmented pitch frames, not raw audio.
// No network or automatic collection. Each speaker must have independent calibration.
export function evaluate(data){
 if(!Array.isArray(data?.speakers)||!Array.isArray(data?.cases))throw Error('speakers and cases required');
 const speakers=new Map();
 for(const s of data.speakers){
  if(typeof s.id!=='string'||speakers.has(s.id)||!['development','held-out'].includes(s.split))throw Error('invalid speaker or split');
  speakers.set(s.id,{...s,cal:calibrateVoice(s.calibrationFrames)});
 }
 const seen=new Set(),counts={total:0,correct:0,incorrect:0,acceptedCorrect:0,rejectedCorrect:0,acceptedIncorrect:0,rejectedIncorrect:0,abstainedCorrect:0,abstainedIncorrect:0};
 const byTone={},details=[];
 for(const c of data.cases){
  if(typeof c.id!=='string'||seen.has(c.id))throw Error('duplicate or invalid case ID');seen.add(c.id);
  const s=speakers.get(c.speakerId);
  if(!s)throw Error('unknown speaker');
  if(s.split!=='held-out')continue;
  if(c.reviewersAgree!==true||typeof c.acceptable!=='boolean'||c.verifiedBoundaries!==true||c.lexicalMatch!==true)throw Error('missing adjudicated human annotation: '+c.id);
  const allowed=MY_DAY_TONES[c.wordId]?.[c.syllableIndex];
  if(!allowed)throw Error('unknown target syllable '+c.id);
  const r=compareExperimental(c.frames,s.cal,allowed,{verifiedBoundaries:true,lexicalMatch:true});
  const outcome=r.comparison==='shape-consistent'?'accepted':r.comparison==='shape-different'?'rejected':'abstained';
  const suffix=c.acceptable?'Correct':'Incorrect';
  counts.total++;counts[c.acceptable?'correct':'incorrect']++;counts[outcome+suffix]++;
  const key=c.wordId+':'+c.syllableIndex;
  byTone[key]??={acceptedCorrect:0,rejectedCorrect:0,acceptedIncorrect:0,rejectedIncorrect:0,abstainedCorrect:0,abstainedIncorrect:0};
  byTone[key][outcome+suffix]++;
  details.push({id:c.id,speakerId:c.speakerId,outcome,acceptable:c.acceptable,kind:r.kind,reason:r.reason});
 }
 const graded=counts.total-counts.abstainedCorrect-counts.abstainedIncorrect;
 const ratio=(a,b)=>b?a/b:null;
 return {counts,coverage:ratio(graded,counts.total),accuracyAmongGraded:ratio(counts.acceptedCorrect+counts.rejectedIncorrect,graded),falseAcceptance:ratio(counts.acceptedIncorrect,counts.incorrect),falseRejection:ratio(counts.rejectedCorrect,counts.correct),heldOutSpeakers:new Set(details.map(d=>d.speakerId)).size,byTargetSyllable:byTone,details,releaseApproved:false,warning:'Contour-only syllable metrics; not word-level accuracy or a production release decision.'};
}
if(process.argv[2])console.log(JSON.stringify(evaluate(JSON.parse(readFileSync(process.argv[2],'utf8'))),null,2));
