/* Panda Go v200: three exact Mandarin words from a user-authorized original female recording.
 * Sources: one supplied 8 s recording split at pauses into 我 / 是 / 天气.
 * Ogg Opus retains the speaker's natural tonal contours; do not synthesize or clone.
 * Keep existing MP3 voices untouched as fallback on browsers without Opus support.
 */
(() => {
  'use strict';
  const clips=Object.freeze({
    '我':'./assets/native-owner-v200/wo.ogg',
    '是':'./assets/native-owner-v200/shi.ogg',
    '天气':'./assets/native-owner-v200/tianqi.ogg'
  });
  const probe=document.createElement('audio');
  const supported=typeof probe.canPlayType==='function' &&
    !!probe.canPlayType('audio/ogg; codecs="opus"');
  if(!supported)return;
  if(window.PANDA_HSK1_VOICES?.female)Object.assign(window.PANDA_HSK1_VOICES.female,clips);
  if(window.courseHumanAudio)Object.assign(window.courseHumanAudio,clips);
  if(window.courseNaturalAudio)Object.assign(window.courseNaturalAudio,clips);
  window.PANDA_HSK1_OWNER_V200=clips;
})();
