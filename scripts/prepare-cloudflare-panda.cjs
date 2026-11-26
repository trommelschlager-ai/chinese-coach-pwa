/* Cloudflare test build. Copy tracked public frontend assets only. */
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'.cloudflare-dist');
const publicNotices=["assets/artwork-provenance.md","assets/game-native-voice-credits-v90.md","assets/game-words-v99/README.md","assets/hanzi-data/ARPHICPL.TXT","assets/hanzi-human/ATTRIBUTION.md","assets/hsk1-voice-corrections-v157/README.md","assets/illustrations-v233.md"];
const offlineExcluded=["scripts/verify-panda-hsk1-variants-v301.cjs","scripts/verify-panda-brain-v302.cjs"];
function publicAsset(path){
 if(typeof path!=="string"||path.startsWith("/")||path.split("/").some(part=>part===".."||part.startsWith(".")||/^(?:secrets?|credentials?)(?:\.|$)/i.test(part)))return false;
 if(!path.includes("/"))return /^(?:sw\.js|manifest\.webmanifest|AUDIO-CREDITS\.md|COPYRIGHT\.md)$/.test(path)||(/\.html$/i.test(path)&&!/(?:-backup-|-before-)/i.test(path));
 if(!/^(?:assets|icons)\//.test(path))return false;
 return publicNotices.includes(path)||/\.(?:js|mjs|css|json|mp3|wav|ogg|m4a|webp|png|jpe?g|gif|svg|avif|ico|woff2?|ttf|webm|mp4|wasm)$/i.test(path)||/(?:^|\/)[^/]*license(?:[-_.][^/]*)?$/i.test(path);
}
const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,maxBuffer:16*1024*1024,encoding:'utf8'}).split('\0').filter(Boolean);
const selected=tracked.filter(publicAsset);
const files=new Set(selected);
const clean=q=>q.replace(/^\.\//,"").split(/[?#]/)[0];
const pack=JSON.parse(fs.readFileSync(path.join(root,'assets/offline-pack.json'),'utf8'));
pack.files=pack.files.filter(q=>!offlineExcluded.includes(clean(q)));
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const coreMatch=sw.match(/const CORE=(\[[^\n]*\]);/);
if(!coreMatch)throw Error('Cannot validate service worker shell');
const core=JSON.parse(coreMatch[1]);
const required=[...pack.files,...core,'./index.html','./panda-voice-pilot.html','./panda-street-ai-preview.html','./hsk1-map.html','./hsk2-start.html','./manifest.webmanifest','./sw.js'];
const missing=[...new Set(required.map(clean).filter(x=>!files.has(x)))];
if(missing.length)throw Error('Missing required offline/entry files: '+missing.join(', '));
if(selected.length>20000)throw Error('Cloudflare Free static file limit exceeded');
let bytes=0;
for(const name of selected){
 const full=path.join(root,name),info=fs.lstatSync(full);
 if(!info.isFile()||info.isSymbolicLink()||!fs.realpathSync(full).startsWith(root+path.sep))throw Error('Invalid public asset: '+name);
 if(info.size>25*1024*1024)throw Error('Cloudflare file size limit exceeded: '+name);
 if(info.size<512&&fs.readFileSync(full).toString('utf8').startsWith('version https://git-lfs.github.com/spec/v1'))throw Error('Unresolved Git LFS pointer: '+name);
 bytes+=info.size;
}
if(fs.existsSync(output)&&fs.lstatSync(output).isSymbolicLink())throw Error('Refusing to overwrite symlink');
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});
for(const name of selected){
 const dest=path.join(output,name);
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,name),dest);
}
// Remove two explicitly reviewed developer scripts from the generated offline pack only.
pack.bytes=pack.files.reduce((sum,q)=>sum+fs.statSync(path.join(output,clean(q))).size,0);
fs.writeFileSync(path.join(output,'assets/offline-pack.json'),JSON.stringify(pack,null,2)+'\n');
console.log('Cloudflare public assets:',selected.length,'files;',bytes,'bytes;',required.length,'required entries validated.');
