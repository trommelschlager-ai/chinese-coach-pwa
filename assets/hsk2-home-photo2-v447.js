/* Photo-2 inspired footer for the live HSK2 landing screen.
 * Existing image and transparent hotspots stay in place, including floating petals.
 * Never alter the lesson state machine, audio, student records, or navigation. */
(function(){
'use strict';
const mount=document.getElementById('screen');
if(!mount||typeof MutationObserver==='undefined')return;
function update(){
 const art=mount.querySelector('.approved-welcome-screen .approved-art.pg445-enabled');
 if(!art)return;
 const stage=art.closest('.approved-welcome-screen');
 if(!stage||stage.querySelector('.pg447-footer'))return;
 const footer=document.createElement('footer');
 footer.className='pg447-footer';
 footer.setAttribute('aria-label','Девиз курса Panda Go');
 footer.innerHTML='<svg class="pg447-landscape" aria-hidden="true" viewBox="0 0 390 170" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">'+
 '<defs><linearGradient id="pg447sky" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#f5dbfa"/><stop offset="1" stop-color="#d4a9ec"/></linearGradient></defs>'+
 '<rect width="390" height="170" fill="url(#pg447sky)"/>'+
 '<path d="M0 137L34 115l26 17 56-39 41 38 35-29 44 29 41-28 47 31 36-24v64H0z" fill="#d3b0ef" opacity=".85"/>'+
 '<path d="M0 157l34-16 45 17 65-27 56 25 59-29 46 29 42-16 43 14v30H0z" fill="#bd95e5" opacity=".63"/>'+
 '<g fill="#9670bf" opacity=".85">'+
 '<path d="M0 135l22-15 26 15-6 4H4zM8 113l17-9 18 9-5 4H13z"/><rect x="12" y="140" width="31" height="27"/><rect x="21" y="116" width="15" height="19"/><path d="M343 133l25-13 24 13-3 5h-45zM353 112l15-10 17 10-4 5h-23z"/><rect x="349" y="138" width="38" height="30"/><rect x="359" y="114" width="17" height="19"/>'+
 '</g><g stroke="#b08ad7" stroke-width="2" opacity=".8"><path d="M17 147v20M29 147v20M365 146v22M374 146v22"/></g>'+
 '</svg>'+
 '<div class="pg447-brush"><span>Учись, говори и понимай</span><span>настоящий китайский!</span></div>';
 stage.appendChild(footer);
}
const observer=new MutationObserver(update);
observer.observe(mount,{childList:true,subtree:true});
update();
})();
