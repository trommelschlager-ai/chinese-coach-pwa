// Serve the production PWA unchanged: Vite's CSS modules can be cached by the
// service worker during development and then served as invalid stylesheets.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const args=process.argv.slice(2),option=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const base=process.cwd(),types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'};
http.createServer((req,res)=>{let name;try{name=decodeURIComponent(new URL(req.url,'http://local').pathname)}catch{res.writeHead(400);res.end();return}
 const file=path.resolve(base,'.'+(name.endsWith('/')?name+'index.html':name));
 if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return}
 fs.stat(file,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404);res.end('Not found');return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res)});
}).listen(Number(option('--port',4173)),option('--host','0.0.0.0'));
