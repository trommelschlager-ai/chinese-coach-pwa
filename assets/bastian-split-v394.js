/* Original artwork, two contiguous slices. No generated or substituted portrait. */
(()=>{'use strict';
const poster=document.getElementById('poster'),source=document.getElementById('bastian-approved-screen');
if(!poster||!source)return;
const cuts=[0,820,1536],pages=[];
for(let i=0;i<2;i++){
 const page=document.createElement('section');page.className='bs394-page';page.hidden=i!==0;
 const bar=document.createElement('nav');bar.className='bs394-bar';
 bar.innerHTML=(i?'<button data-bs-back aria-label="Предыдущая страница">← Назад</button>':'<a href="./hsk2-life-course.html?view=map">← К карте</a>')+'<span>'+(i+1)+' / 2</span>';
 const slice=document.createElement('div');slice.className='bs394-slice';slice.style.aspectRatio='864 / '+(cuts[i+1]-cuts[i]);
 const plane=document.createElement('div');plane.className='bs394-plane';plane.style.height=(1536/(cuts[i+1]-cuts[i])*100)+'%';plane.style.top=(-cuts[i]/(cuts[i+1]-cuts[i])*100)+'%';
 const img=source.querySelector('img').cloneNode(true);plane.append(img);
 source.querySelectorAll('.screen-hotspot').forEach(hit=>{const y=parseFloat(hit.style.top)*1536/100;if(y>=cuts[i]&&y<cuts[i+1]){const copy=hit.cloneNode(true);if(copy.id==='start'){copy.removeAttribute('id');copy.dataset.stepLink='0';}plane.append(copy)}});
 slice.append(plane);page.append(bar,slice);
 const next=document.createElement('button');next.className='bs394-next';next.textContent=i?'Начать практику →':'Дальше · разбор и тоны →';next.type='button';next.addEventListener('click',()=>i?document.getElementById('start').click():show(1));page.append(next);
 poster.append(page);pages.push(page);
}
function show(i){pages.forEach((page,n)=>page.hidden=n!==i);poster.scrollTop=0;fit();pages[i].querySelector('button,a').focus({preventScroll:true})}
poster.addEventListener('click',e=>{if(e.target.closest('[data-bs-back]'))show(0)});
function fit(){pages.forEach((page,i)=>{const slice=page.querySelector('.bs394-slice'),height=cuts[i+1]-cuts[i];slice.style.width=Math.max(1,Math.min(page.clientWidth-20,(page.clientHeight-116)*864/height))+'px'})}
window.addEventListener('resize',fit);new ResizeObserver(fit).observe(poster);fit();
})();
