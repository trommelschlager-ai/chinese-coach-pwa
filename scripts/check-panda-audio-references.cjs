'use strict';
// Advisory audit of literal audio references. Dynamic JS paths cannot be proven by source regex.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const sourceExtensions=new Set(['.html','.htm','.js','.mjs','.cjs','.json','.css']);
const excluded=new Set(['node_modules','.git','dist','reports','coverage','test-fixtures','.vite']);
const matches=new Map();
let sources=0;
function visit(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,entry.name);
  if(entry.isDirectory()){if(!excluded.has(entry.name))visit(p);continue;}
  if(!entry.isFile()||!sourceExtensions.has(path.extname(entry.name).toLowerCase()))continue;
  sources++;
  let content='';
  try{content=fs.readFileSync(p,'utf8');}catch{continue;}
  // Recognize only fully static quoted assets/foo.mp3 references.
  const re=/(["'\x60])((?:\.\/)?assets\/[A-Za-z0-9_./-]+\.(?:mp3|m4a|aac|wav|ogg|oga|opus|flac|webm))(?:\?[^"'\x60\s]*)?\1/gi;
  let m;
  while((m=re.exec(content))){
   const key=m[2].replace(/^\.\//,'').replace(/\\/g,'/');
   if(!matches.has(key))matches.set(key,new Set());
   matches.get(key).add(path.relative(root,p).split(path.sep).join('/'));
  }
 }
}
visit(root);
const referenced=[...matches].map(([file,where])=>({file,exists:fs.existsSync(path.join(root,file)),sources:[...where].sort()})).sort((a,b)=>a.file.localeCompare(b.file));
const missing=referenced.filter(x=>!x.exists);
function category(entry){
 if(entry.sources.some(p=>p.endsWith('.html')||
  ((p.startsWith('assets/')||!p.includes('/'))&&/\.(?:m?js|cjs)$/i.test(p))))return 'active-or-library-code';
 if(entry.sources.every(p=>p.startsWith('scripts/')||p.startsWith('tests/')))return 'test-only';
 if(entry.sources.every(p=>p.endsWith('.json')))return 'manifest-or-planned';
 return 'needs-review';
}
const missingByCategory=Object.groupBy?Object.groupBy(missing,category):missing.reduce((out,x)=>{
 (out[category(x)]??=[]).push(x);return out;
},{});
const missingCategoryCounts=Object.fromEntries(Object.entries(missingByCategory).map(([key,items])=>[key,items.length]));
const report={
 generatedAt:new Date().toISOString(),sourceFilesScanned:sources,
 uniqueStaticAudioReferences:referenced.length,existingReferences:referenced.length-missing.length,
 missing,missingCategoryCounts,limitations:'Advisory static quoted references only; dynamically generated paths and correctness of spoken Mandarin not checked.'
};
fs.mkdirSync(path.join(root,'reports'),{recursive:true});
fs.writeFileSync(path.join(root,'reports/panda-audio-references.json'),JSON.stringify(report,null,2)+'\n');
console.log('Static audio references: '+referenced.length+'; existing: '+report.existingReferences+'; missing: '+missing.length+'; breakdown: '+JSON.stringify(missingCategoryCounts));
for(const item of missing.slice(0,30))console.log('MISSING '+item.file+' (used in '+item.sources.slice(0,3).join(', ')+')');
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
 '\n### Static audio references\n'+report.existingReferences+'/'+referenced.length+' referenced files exist; '+missing.length+' missing (advisory; dynamic paths excluded).\n');
// Do not fail for old unused lessons: use the report to prioritize repairs.
