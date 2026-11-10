/* Panda Go v240 — immutable female MeloTTS dictionary used only for weather lesson.
 * Capture immediately after v160, BEFORE v200/v221 owner recordings mutate its map.
 * Do not present these synthetic clips as the authorized native speaker.
 */
(()=>{'use strict';
 const female=window.PANDA_HSK1_VOICES?.female||{};
 window.PandaWeatherFemaleV240=Object.freeze({...female});
})();
