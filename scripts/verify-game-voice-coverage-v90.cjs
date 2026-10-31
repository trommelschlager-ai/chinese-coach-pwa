// v90: single-source native Mandarin audio inventory, without synthetic fallback.
const fs=require('node:fs'),assert=require('node:assert/strict');
const js=fs.readFileSync('assets/game-practice-v76.js','utf8');
const mapFile=fs.readFileSync('assets/human-audio-map.js','utf8');
const dict=JSON.parse(mapFile.match(/window\.courseHumanAudio=(\{.*\});/)?.[1]||'{}');
const pack=JSON.parse(fs.readFileSync('assets/offline-pack.json','utf8'));
const mustHave=["在","几","点","很","多","大","不","中","国","小"];
for(const han of mustHave){
 const file=dict[han];assert(file,'Missing native-audio mapping: '+han);
 const rel=file.replace(/^\.\//,'');
 const bytes=fs.readFileSync(rel);
 assert(bytes.length>2000,'Broken MP3 '+han);
 assert(bytes[0]===0xff||bytes.toString('ascii',0,3)==='ID3','Not MP3 '+han);
 assert(pack.files.includes(file),'Missing offline inclusion '+han);
}
assert(js.includes("const compoundAudioParts={'中国人':['中','国','人'],'二十五':['二','十','五']}"));
assert(!js.includes('new SpeechSynthesisUtterance'),'No robotic TTS in game');
assert(!dict['小明'],'Do not claim an unverified same-speaker full-name recording');
console.log('V90 single-source Mandarin voice inventory: 10 added clips; compounds explicit; no robot fallback.');
