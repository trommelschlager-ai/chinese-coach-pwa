/* Panda Go HSK2 v448: exact reference-photo footer.
 * Keep the approved panda, navigation hotspots, audio and falling sakura untouched. */
(function(){
'use strict';
const mount=document.getElementById('screen');
if(!mount||typeof MutationObserver==='undefined')return;
const imagePath='./assets/hsk2-home-photo1-exact-footer-v448.webp';
function sync(){
 const art=mount.querySelector('.approved-welcome-screen .approved-art.pg445-enabled');
 if(!art)return;
 const stage=art.closest('.approved-welcome-screen');
 if(!stage||stage.querySelector('.pg447-footer'))return;
 const footer=document.createElement('footer');
 footer.className='pg447-footer';
 footer.setAttribute('aria-label','Учись, говори и понимай настоящий китайский!');
 const photo=document.createElement('img');
 photo.className='pg448-exact-photo';
 photo.alt='Учись, говори и понимай настоящий китайский! На фиолетовом мазке кистью, с золотой линией, горами и китайскими павильонами.';
 photo.width=695;photo.height=216;photo.decoding='async';photo.loading='eager';photo.draggable=false;
 const fallback=document.createElement('div');
 fallback.className='pg448-fallback';fallback.textContent='Учись, говори и понимай настоящий китайский!';
 footer.appendChild(photo);footer.appendChild(fallback);
 photo.addEventListener('load',()=>footer.classList.add('pg448-loaded'),{once:true});
 photo.addEventListener('error',()=>{footer.classList.remove('pg448-loaded')},{once:true});
 photo.src=imagePath;
 stage.appendChild(footer);
}
const obs=new MutationObserver(sync);
obs.observe(mount,{childList:true,subtree:true});
sync();
})();
