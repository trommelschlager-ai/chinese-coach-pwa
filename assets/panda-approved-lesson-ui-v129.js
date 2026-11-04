/* Panda Go v129: lightweight sakura on the learning screens.
 * Keeps existing Game Practice's separate approved petal implementation unchanged.
 * No speech/audio calls, changes to progress, or click handlers.
 */
(()=>{
 'use strict';
 if(window.__pandaLessonPetals129)return;
 window.__pandaLessonPetals129=true;
 const host=document.createElement('div');
 host.className='panda-v129-petals';host.setAttribute('aria-hidden','true');
 const shades=[['#fa83ca','#ffd9ef'],['#e2a1f2','#f9eaff'],['#ffc3e2','#fff1fa'],['#c58ce8','#ecd8ff']];
 const shapes=[
   '<path d="M7 49Q20 23 55 9Q51 37 7 49Z" fill="var(--fill)" stroke="var(--stroke)" stroke-width="2"/><path d="M12 45L50 14" fill="none" stroke="#fff8" stroke-width="2"/>',
   '<path d="M32 57Q2 36 10 18Q17 8 32 23Q47 8 54 18Q62 36 32 57Z" fill="var(--fill)" stroke="var(--stroke)" stroke-width="1.7"/>',
   '<path d="M9 49C19 27 41 13 54 12c-4 24-24 38-45 37Z" fill="var(--fill)" stroke="var(--stroke)" stroke-width="1.7"/>',
   '<g fill="var(--fill)" stroke="var(--stroke)" stroke-width="1"><ellipse cx="32" cy="19" rx="10" ry="15"/><ellipse cx="45" cy="29" rx="10" ry="15" transform="rotate(70 45 29)"/><ellipse cx="39" cy="45" rx="10" ry="15" transform="rotate(145 39 45)"/><ellipse cx="23" cy="45" rx="10" ry="15" transform="rotate(215 23 45)"/><ellipse cx="19" cy="29" rx="10" ry="15" transform="rotate(290 19 29)"/></g><circle cx="32" cy="32" r="4" fill="#ffe6a2"/>'
 ];
 const number=12;
 for(let i=0;i<number;i++){
   const el=document.createElement('span');
   el.className='panda-v129-petal';
   const shade=shades[(i*3)%shades.length];
   const type=i%5===0?3:i%3;
   const values={
    '--sx':(3+((i*37+17)%94))+'%',
    '--sz':(18+(i*11)%20)+'px',
    '--dur':(12+(i*13)%8)+'s',
    '--delay':(-i*1.39)+'s',
    '--fill':shade[0],'--stroke':shade[1],
    '--a':(i%2?26:-16)+'px','--b':(i%3?41:-29)+'px',
    '--c':(i%2?14:-38)+'px','--d':(i%2?55:-42)+'px'
   };
   for(const [k,v] of Object.entries(values))el.style.setProperty(k,v);
   el.innerHTML='<svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">'+shapes[type]+'</svg>';
   host.append(el);
 }
 document.body.append(host);
 // Screens may be replaced on navigation; fixed overlay follows the active page.
 document.addEventListener('visibilitychange',()=>{host.style.animationPlayState=document.hidden?'paused':'running'});
 window.__pandaLessonPetalsQA129={count:()=>host.children.length};
})();