/* Shared, pure HSK1–2 semantic pilot. Not wired to live UI. No invented translation, voice or tone scoring. */
export function interpretOpinion(raw){
 const s=String(raw||'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
 const targets={'':{py:'',ru:null},'中文':{py:'Zhōngwén',ru:'китайский язык'},'这个电影':{py:'zhège diànyǐng',ru:'этот фильм'},'这本书':{py:'zhè běn shū',ru:'эта книга'},'这个菜':{py:'zhège cài',ru:'это блюдо'},'这个工作':{py:'zhège gōngzuò',ru:'эта работа'},'这个地方':{py:'zhège dìfang',ru:'это место'},'这个问题':{py:'zhège wèntí',ru:'этот вопрос'},'今天的天气':{py:'jīntiān de tiānqì',ru:'сегодняшняя погода'}};
 const qualities={'好':{py:'hǎo',ru:'хорошо',polarity:'positive'},'坏':{py:'huài',ru:'плохо',polarity:'negative'},'难':{py:'nán',ru:'трудно',polarity:'neutral'},'简单':{py:'jiǎndān',ru:'просто',polarity:'neutral'},'有意思':{py:'yǒu yìsi',ru:'интересно',polarity:'positive'},'贵':{py:'guì',ru:'дорого',polarity:'neutral'},'漂亮':{py:'piàoliang',ru:'красиво',polarity:'positive'},'舒服':{py:'shūfu',ru:'комфортно',polarity:'positive'}};
 const modifiers={'':{py:'',ru:'',negated:false},'很':{py:'hěn',ru:'очень',negated:false},'非常':{py:'fēicháng',ru:'очень',negated:false},'不':{py:'bù',ru:'не',negated:true},'不太':{py:'bú tài',ru:'не слишком',negated:true}};
 const m=/^(我|你)觉得(.*)$/u.exec(s);if(!m)return null;
 const [_,speaker,body]=m;const base={raw:String(raw),construction:'觉得',speaker:speaker==='我'?'learner':'panda',toneVerified:false};
 const py=speaker==='我'?'Wǒ juéde':'Nǐ juéde';
 if(speaker==='你'&&body.endsWith('怎么样')){
  const target=body.slice(0,-3);if(!Object.hasOwn(targets,target))return null;
  return {...base,intent:'ask-opinion',target:target||null,targetMeaning:targets[target].ru,pinyin:[py,targets[target].py,'zěnmeyàng?'].filter(Boolean).join(' ')};
 }
 const question=body.endsWith('吗');if(question&&speaker!=='你')return null;
 const phrase=question?body.slice(0,-1):body;
 for(const target of Object.keys(targets).sort((a,b)=>b.length-a.length)){
  if(!phrase.startsWith(target))continue;
  const rest=phrase.slice(target.length);
  for(const mod of Object.keys(modifiers).sort((a,b)=>b.length-a.length)){
   if(!rest.startsWith(mod))continue;
   const q=rest.slice(mod.length);if(!Object.hasOwn(qualities,q))continue;
   const qual=qualities[q],modifier=modifiers[mod];
   return {...base,intent:question?'confirm-opinion':speaker==='我'?'express-opinion':'ask-opinion',target:target||null,targetMeaning:targets[target].ru,quality:q,qualityMeaning:qual.ru,modifier:mod,negated:modifier.negated,polarity:qual.polarity,pinyin:[py,targets[target].py,modifier.py,qual.py,question?'ma?':''].filter(Boolean).join(' ')+(question?'':'.')};
  }
 }
 return null;
}

export function interpretAction(raw){
 const s=String(raw??'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
 const time={'':['',''],'今天':['jīntiān','сегодня'],'明天':['míngtiān','завтра'],'每天':['měitiān','каждый день'],'现在':['xiànzài','сейчас'],'周末':['zhōumò','в выходные'],'今天早上':['jīntiān zǎoshang','сегодня утром'],'明天早上':['míngtiān zǎoshang','завтра утром'],'晚上':['wǎnshang','вечером']};
 const modal={'':['','activity',false],'想':['xiǎng','desire',false],'不想':['bù xiǎng','desire',true],'要':['yào','intention',false],'不要':['bú yào','intention',true],'打算':['dǎsuàn','plan',false],'不打算':['bù dǎsuàn','plan',true],'会':['huì','ability-or-future',false],'不会':['bú huì','ability-or-future',true]};
 const actions={'休息':['xiūxi','отдыхать','daily'],'睡觉':['shuìjiào','спать','daily'],'吃饭':['chīfàn','есть','food'],'吃早饭':['chī zǎofàn','завтракать','food'],'喝咖啡':['hē kāfēi','пить кофе','food'],'喝茶':['hē chá','пить чай','food'],'学中文':['xué Zhōngwén','учить китайский','study'],'学习中文':['xuéxí Zhōngwén','изучать китайский','study'],'去公园':['qù gōngyuán','идти в парк','leisure'],'跑步':['pǎobù','бегать','leisure'],'看书':['kàn shū','читать','leisure'],'听音乐':['tīng yīnyuè','слушать музыку','leisure'],'工作':['gōngzuò','работать','work'],'上班':['shàngbān','идти на работу','work'],'做饭':['zuòfàn','готовить еду','food'],'游泳':['yóuyǒng','плавать','leisure']};
 const m=/^(我|你)(.+)$/u.exec(s);if(!m)return null;const subject=m[1];let body=m[2];
 const reciprocal=subject==='我'&&body.endsWith('你呢');if(reciprocal)body=body.slice(0,-2);
 const yesNo=body.endsWith('吗');if(yesNo){if(subject!=='你'||reciprocal)return null;body=body.slice(0,-1);}
 const sp=subject==='我'?'Wǒ':'Nǐ';
 for(const t of Object.keys(time).sort((a,b)=>b.length-a.length)){
  if(!body.startsWith(t))continue;const after=body.slice(t.length);
  for(const v of Object.keys(modal).sort((a,b)=>b.length-a.length)){
   if(!after.startsWith(v))continue;const obj=after.slice(v.length),m=modal[v];
   if(obj==='做什么'&&subject==='你'&&!yesNo&&!reciprocal&&!m[2])return {raw:String(raw),construction:'modal-action',intent:'ask-action',subject,time:t||null,modal:v||null,modality:m[1],negated:false,action:null,actionMeaning:null,topic:null,pinyin:[sp,time[t][0],m[0],'zuò shénme?'].filter(Boolean).join(' '),toneVerified:false};
   if(!Object.hasOwn(actions,obj))continue;
   if(subject==='你'&&!yesNo)continue; // avoid treating assertions about another person as a question
   const a=actions[obj],py=[sp,time[t][0],m[0],a[0]].filter(Boolean).join(' ');
   return {raw:String(raw),construction:'modal-action',intent:yesNo?'ask-yes-no':reciprocal?'reciprocal-action':'express-action',subject,time:t||null,modal:v||null,modality:m[1],negated:m[2],action:obj,actionMeaning:a[1],topic:a[2],pinyin:py+(reciprocal?', nǐ ne?':yesNo?' ma?':'.'),toneVerified:false};
  }
 }return null;
}

export function interpretContextualTurn(raw,context={}){
 const s=String(raw??'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
 const positive={'对':'Duì.','对对':'Duì, duì.','对对对':'Duì, duì, duì.','是的':'Shì de.','是的是的':'Shì de, shì de.'};
 const negative={'不是':'Bú shì.','不对':'Bú duì.'};
 const repeat={'什么':'Shénme?','你说什么':'Nǐ shuō shénme?','请再说一遍':'Qǐng zài shuō yí biàn.','再说一遍':'Zài shuō yí biàn.','没听懂':'Méi tīng dǒng.','我没听懂':'Wǒ méi tīng dǒng.'};
 const base={raw:String(raw),construction:'contextual-turn',toneVerified:false};
 const prior=context.lastPandaTurn;
 if(Object.hasOwn(repeat,s))return {...base,intent:'request-repeat',pinyin:repeat[s],reference:typeof prior?.hanzi==='string'&&prior.hanzi.trim()?prior.hanzi:null,needsClarification:!prior?.hanzi};
 if(s==='什么意思')return {...base,intent:'request-meaning',pinyin:'Shénme yìsi?',reference:typeof prior?.hanzi==='string'&&prior.hanzi.trim()?prior.hanzi:null,needsClarification:!prior?.hanzi};
 if(Object.hasOwn(positive,s)||Object.hasOwn(negative,s)){
  const accepted=Object.hasOwn(positive,s),pending=context.pendingQuestion;
  const valid=pending?.intent==='ask-yes-no'&&pending.subject==='你'&&typeof pending.action==='string'&&typeof pending.negated==='boolean'&&pending.negated===false;
  return {...base,intent:valid?'answer-yes-no':'acknowledgement',pinyin:accepted?positive[s]:negative[s],accepted,reference:valid?pending.raw??null:null,action:valid?pending.action:null,topic:valid?pending.topic:null,needsClarification:!valid};
 }
 if(s==='你呢'){
  const fact=context.lastLearnerAction;
  const valid=fact?.intent==='express-action'&&fact.subject==='我'&&typeof fact.action==='string';
  return {...base,intent:'reciprocal-question',pinyin:'Nǐ ne?',reference:valid?fact.raw??null:null,action:valid?fact.action:null,topic:valid?fact.topic:null,modality:valid?fact.modality:null,time:valid?fact.time:null,needsClarification:!valid};
 }
 return null;
}

export function interpretLinkedTurn(raw){
 const text=String(raw??'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
 const clauses={
 '我很累':['wǒ hěn lèi','learner','health','tired'],'我很忙':['wǒ hěn máng','learner','work','busy'],'我没时间':['wǒ méi shíjiān','learner','time','unavailable'],'我喜欢中文':['wǒ xǐhuan Zhōngwén','learner','study','like-chinese'],'中文很难':['Zhōngwén hěn nán','chinese','study','difficult'],'我每天学中文':['wǒ měitiān xué Zhōngwén','learner','study','study-daily'],'我想休息':['wǒ xiǎng xiūxi','learner','health','want-rest'],'我还想学习':['wǒ hái xiǎng xuéxí','learner','study','want-study'],'我还是去上班':['wǒ háishi qù shàngbān','learner','work','go-work'],'我还是学中文':['wǒ háishi xué Zhōngwén','learner','study','study-chinese'],'我还是想去':['wǒ háishi xiǎng qù','learner','leisure','want-go'],'我有空':['wǒ yǒu kòng','learner','time','available'],'明天下雨':['míngtiān xià yǔ',null,'weather','rain'],'我不出去':['wǒ bù chūqu','learner','leisure','not-go-out'],'我去公园':['wǒ qù gōngyuán','learner','leisure','go-park'],'我就休息':['wǒ jiù xiūxi','learner','health','rest']
 };
 const action={
 '起床':['qǐchuáng','daily'],'刷牙':['shuāyá','daily'],'洗脸':['xǐliǎn','daily'],'吃早饭':['chī zǎofàn','food'],'下班':['xiàbān','work'],'回家':['huí jiā','daily'],'吃饭':['chīfàn','food'],'休息':['xiūxi','health'],'睡觉':['shuìjiào','daily'],'看书':['kàn shū','leisure'],'听音乐':['tīng yīnyuè','leisure'],'喝茶':['hē chá','food'],'喝咖啡':['hē kāfēi','food'],'学习中文':['xuéxí Zhōngwén','study'],'做饭':['zuòfàn','food'],'散步':['sànbù','leisure'],'跑步':['pǎobù','leisure'],'看电视':['kàn diànshì','leisure'],'聊天':['liáotiān','social']
 };
 const base={raw:String(raw),intent:'express-linked-actions',toneVerified:false};
 const getClause=k=>Object.hasOwn(clauses,k)?{text:k,pinyin:clauses[k][0],subject:clauses[k][1],topic:clauses[k][2],meaning:clauses[k][3]}:null;
 const capitalize=s=>s[0].toUpperCase()+s.slice(1);
 for(const [prefix,join,kind,pyA,pyB] of [['虽然','但是','concession','suīrán','dànshì'],['因为','所以','cause','yīnwèi','suǒyǐ']]){
  if(!text.startsWith(prefix))continue;
  const rest=text.slice(prefix.length),i=rest.indexOf(join);if(i<1)return null;
  const a=getClause(rest.slice(0,i)),b=getClause(rest.slice(i+join.length));if(!a||!b)return null;
  return {...base,construction:prefix+'…'+join+'…',relation:kind,clauses:[a,b],pinyin:capitalize(pyA+' '+a.pinyin+', '+pyB+' '+b.pinyin)+'.'};
 }
 // Preserve explicitly stated subject. No assertion of who acts without evidence.
 const m=/^(我|我们|他|她)(一边|一|先)(.+?)(一边|就|然后|再)(.+)$/u.exec(text);
 if(!m)return null;const [,subject,first,a,second,b]=m;
 const kind=first==='一边'&&second==='一边'?'simultaneous':first==='一'&&second==='就'?'immediate':first==='先'&&['再','然后'].includes(second)?'sequence':null;
 if(!kind||a===b||!Object.hasOwn(action,a)||!Object.hasOwn(action,b))return null;
 const subjectPy={我:'Wǒ',我们:'Wǒmen',他:'Tā',她:'Tā'}[subject];
 const firstPy={一边:'yìbiān',一:'yí',先:'xiān'}[first];
 const secondPy={一边:'yìbiān',就:'jiù',然后:'ránhòu',再:'zài'}[second];
 // yī changes to yì before tones 1–3 and yí before tone 4.
 const initialPy=first==='一'?( /[àèìòùǜ]/u.test(action[a][0].split(' ')[0])?'yí':'yì'):firstPy;
 return {...base,construction:first+'…'+second+'…',relation:kind,subject,actions:[a,b],topics:[action[a][1],action[b][1]],pinyin:subjectPy+' '+initialPy+' '+action[a][0]+', '+secondPy+' '+action[b][0]+'.'};
}
