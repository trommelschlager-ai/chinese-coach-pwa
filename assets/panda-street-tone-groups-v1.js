/* Street tone contrasts: same syllable, four lexical tones.
   Only exact Street voice registry matches may play. */
(function(root){
'use strict';
const groups={
  1:{syllable:'shi',words:[['诗','shī','стихотворение'],['十','shí','десять'],['始','shǐ','начало'],['是','shì','быть']]},
  2:{syllable:'tang',words:[['汤','tāng','суп'],['糖','táng','сахар'],['躺','tǎng','лежать'],['烫','tàng','обжигать; горячий']]},
  3:{syllable:'ba',words:[['八','bā','восемь'],['拔','bá','выдёргивать'],['把','bǎ','держать; брать в руку'],['爸','bà','папа']]}
};
const names=['Высокий ровный','Восходящий','Низкий, затем подъём','Нисходящий'];
const curves=['M12 9 H108','M12 32 Q60 28 108 9','M12 29 Q44 65 108 16','M12 9 L108 49'];
const colors=['#26794d','#28699e','#a47022','#b83c3c'];
function render(lesson,hasAudio){
 const g=groups[lesson];if(!g)return '';
 return '<div class="street-tone-intro">Один слог <strong>'+g.syllable+'</strong> — четыре значения</div><div class="street-tone-grid">'+g.words.map((w,i)=>{
 const ready=hasAudio(w[0]);
 return '<article class="street-tone-card"><div class="street-tone-top"><span class="street-tone-index">'+(i+1)+'-й тон</span><button type="button" class="street-tone-play" data-say="'+w[0]+'" aria-label="'+(ready?'Прослушать '+w[1]:'Запись '+w[1]+' пока не готова')+'" '+(ready?'':'disabled')+'>'+(ready?'▶':'—')+'</button></div><strong class="street-tone-hanzi" lang="zh-Hans">'+w[0]+'</strong><span class="street-tone-pinyin">'+w[1]+'</span><span class="street-tone-meaning">'+w[2]+'</span><svg viewBox="0 0 120 58" role="img" aria-label="'+names[i]+'"><path d="M12 9H108 M12 29H108 M12 49H108" stroke="#deded3" stroke-width="1" stroke-dasharray="3 4" fill="none"/><path d="'+curves[i]+'" stroke="'+colors[i]+'" stroke-width="3.5" stroke-linecap="round" fill="none"/></svg><span class="street-tone-label">'+names[i]+'</span>'+(!ready?'<small class="street-tone-pending">Озвучка готовится</small>':'')+'</article>';
 }).join('')+'</div><p class="street-tone-foot">Третий тон в обычной связной речи часто остаётся низким. Перед другим третьим тоном первый произносится как второй.</p>';
}
root.PandaStreetToneGroups=Object.freeze({groups,render});
})(globalThis);
