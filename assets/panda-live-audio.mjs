// Only the user-supplied Luvvoice recording, split into four exact phrases.
export const PILOT_AUDIO=Object.freeze({"你好": "./assets/panda-live-voice-v2/hello.mp3", "你好吗": "./assets/panda-live-voice-v2/how-are-you.mp3", "很好": "./assets/panda-live-voice-v2/good.mp3", "我也很好谢谢": "./assets/panda-live-voice-v2/me-too-thanks.mp3"});
export const lookupPilotAudio=text=>PILOT_AUDIO[String(text||'').replace(/[。！?!？，,\s]/g,'')]||null;
