/* Panda Street AI: reviewed male Luvvoice MP3 registry.
 * Fail closed: there are no new approved files as of 2026-11-23.
 * Only add entries after the exact MP3 has been uploaded, listened to,
 * checked for correct Mandarin tones, exact wording and the same approved
 * male voice. This module must NEVER fall back to female/system TTS.
 */
export const STREET_APPROVED_MALE_VOICE_ID='panda-street-luvvoice-male-approved-v1';
export const APPROVED_STREET_MALE_MP3=Object.freeze([
  // Future verified format:
  // {hanzi:'我有点忙。',src:'assets/panda-street-male-voice-v1/01.mp3',
  //  voiceId:STREET_APPROVED_MALE_VOICE_ID,
  //  reviewRef:'reviewed:street-luvvoice-20261123-01',status:'approved',
  //  nativeSpeakerChecked:true}
]);
export const normalizeStreetMalePhrase=text=>String(text??'').normalize('NFC')
 .replace(/[\s\u3000，。！？?!,.、]/g,'');
const P0_PATH=/^assets\/panda-street-male-voice-v1\/0[1-6]\.mp3$/;
const REVIEW_REF=/^reviewed:street-luvvoice-[0-9]{8}-0[1-6]$/;
export function lookupApprovedStreetMaleMp3(text,catalog=APPROVED_STREET_MALE_MP3){
 const key=normalizeStreetMalePhrase(text);
 if(!key||!Array.isArray(catalog))return null;
 for(const item of catalog){
  if(!item||normalizeStreetMalePhrase(item.hanzi)!==key)continue;
  if(item.voiceId!==STREET_APPROVED_MALE_VOICE_ID||
     item.status!=='approved'||item.nativeSpeakerChecked!==true||
     typeof item.src!=='string'||!P0_PATH.test(item.src)||
     typeof item.reviewRef!=='string'||!REVIEW_REF.test(item.reviewRef))continue;
  return Object.freeze({src:'./'+item.src,hanzi:item.hanzi,voiceId:item.voiceId});
 }
 return null;
}
