const fs=require('fs'),path=require('path');
const files=new Set();
function walk(dir){for(const name of fs.readdirSync(dir)){const p=path.join(dir,name);if(fs.statSync(p).isDirectory())walk(p);else if(!['approved-welcome.png','approved-lessons.png','approved-final-home.svg','offline-pack.json'].includes(name))files.add('./'+p.split(path.sep).join('/'))}}
walk('assets');walk('icons');
for(const [,p] of fs.readFileSync('index.html','utf8').matchAll(/(?:href|src)="(\.\/(?:assets|icons)\/[^"#]+)"/g))files.add(p);
for(const p of ['./index.html','./hanzi-lab.html','./manifest.webmanifest'])files.add(p);
const list=[...files].sort(),bytes=list.reduce((n,p)=>n+fs.statSync(p.split('?')[0]).size,0);
fs.writeFileSync('assets/offline-pack.json',JSON.stringify({version:68,bytes,files:list},null,2)+'\n');
console.log(`${list.length} offline assets; ${bytes} bytes`);
