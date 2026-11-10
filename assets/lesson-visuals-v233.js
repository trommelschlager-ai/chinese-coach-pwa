/* Shared presentation components for the approved lesson illustrations. */
(()=>{'use strict';
const family={'妈妈':0,'爸爸':1,'哥哥':2,'姐姐':3,'弟弟':4,'妹妹':5,'家':6,'我的':7};
const weather={'天气':0,'晴':0,'热':2,'冷':1,'下雨':3,'下雪':1,'阴':3,'风':3,'春天':0,'夏天':2,'秋天':0,'冬天':1};
const symbols={'家':'house-heart-fill','我的':'heart-fill','有':'check-circle-fill','没有':'x-circle-fill','一个':'1-circle-fill'};
const weatherSymbols={'阴':'cloud-fill','风':'wind','秋天':'leaf-fill'};
function art(word,lesson){
 if(lesson===7&&word in weatherSymbols)return '<span class="word-art symbol" aria-hidden="true" style="--word-symbol:url(./assets/icon-'+weatherSymbols[word]+'-v233.svg)"></span>';
 if(lesson===7&&word==='春天')return '<span class="word-art flower" aria-hidden="true"></span>';
 if(lesson===6&&word in family)return '<span class="word-art human" aria-hidden="true" style="background-position:'+(family[word]%4/3*100)+'% '+(Math.floor(family[word]/4)*100)+'%"></span>';
 if(lesson===6&&word in symbols)return '<span class="word-art symbol" aria-hidden="true" style="--word-symbol:url(./assets/icon-'+symbols[word]+'-v233.svg)"></span>';
 let type='scene',pos=0;
 if(lesson===6&&word in family){type='relative';pos=family[word]}
 if(lesson===7&&word in weather){type='weather';pos=weather[word]}
 if(lesson===5&&/月$/.test(word)){type='flower';if(['一月','十一月','十二月'].includes(word)){type='weather';pos=1}if(['六月','七月','八月'].includes(word)){type='weather';pos=0}}
 return '<span class="word-art '+type+'" aria-hidden="true" style="background-position:'+(pos%2*100)+'% '+(Math.floor(pos/2)*100)+'%"></span>';
}
function decorate(stage,lesson,step){
 stage.querySelectorAll('.word').forEach(word=>{
 const label=word.querySelector('strong');if(label)label.insertAdjacentHTML('beforebegin',art(label.textContent,lesson));
 word.querySelector('.word-emoji')?.remove();
 });
 if(step>0&&step<13&&!stage.querySelector('.word,.dialogue')){const scene=document.createElement('div');scene.className='coach-scene';scene.setAttribute('aria-hidden','true');stage.append(scene)}
}
window.PandaLessonVisuals={decorate};
})();
