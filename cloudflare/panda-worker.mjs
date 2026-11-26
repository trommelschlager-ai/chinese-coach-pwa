// Existing explicit .html URLs must remain unchanged for PWA and offline cache.
export default {
 async fetch(request,env){
  const u=new URL(request.url);
  if(u.pathname==='/'&&(request.method==='GET'||request.method==='HEAD')){
   u.pathname='/index.html';
   return Response.redirect(u.toString(),302);
  }
  return new Response('Not found',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
 }
};
