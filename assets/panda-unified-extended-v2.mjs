/* Stage 2: narrow compositional grammar. No live reply routing or acoustic scoring. */
export function interpretExtendedGrammar(raw){
 const original=String(raw??'').normalize('NFC').trim();
 // Only terminal punctuation is ignored; do not silently concatenate independent sentences.
 const s=original.replace(/[。！？?!]+$/u,'').replace(/\s+/gu,'');
 const people={我:'Wǒ',你:'Nǐ',他:'Tā',她:'Tā',我们:'Wǒmen'};
 const interests={音乐:['yīnyuè','музыка'],中文:['Zhōngwén','китайский язык'],中国文化:['Zhōngguó wénhuà','китайская культура'],运动:['yùndòng','спорт'],电影:['diànyǐng','кино'],历史:['lìshǐ','история'],旅行:['lǚxíng','путешествия']};
 const objects={茶:['chá','чай'],咖啡:['kāfēi','кофе'],水:['shuǐ','вода'],牛奶:['niúnǎi','молоко'],米饭:['mǐfàn','рис'],面条:['miàntiáo','лапша'],鸡肉:['jīròu','курица'],牛肉:['niúròu','говядина']};
 const verbs={喝:{py:'hē',allow:['茶','咖啡','水','牛奶']},吃:{py:'chī',allow:['米饭','面条','鸡肉','牛肉']}};
 const places={中国:'Zhōngguó',北京:'Běijīng',上海:'Shànghǎi',广州:'Guǎngzhōu',深圳:'Shēnzhèn',家:'jiā',公司:'gōngsī',学校:'xuéxiào',公园:'gōngyuán'};
 const experience={去:{py:'qù',items:places},吃:{py:'chī',items:{米饭:'mǐfàn',面条:'miàntiáo',中国菜:'Zhōngguó cài',鸡肉:'jīròu'}},喝:{py:'hē',items:{茶:'chá',咖啡:'kāfēi',牛奶:'niúnǎi'}},看:{py:'kàn',items:{这部电影:'zhè bù diànyǐng',这本书:'zhè běn shū'}}};
 const own=(o,k)=>Object.hasOwn(o,k),base={raw:String(raw),toneVerified:false};
 let m=/^(我们|我|你|他|她)对(.+?)(很|不太|不|非常)?感兴趣(吗)?$/u.exec(s);
 if(m){
  const [,subject,target,modifier='',question]=m;if(!own(interests,target)||question&&subject!=='你')return null;
  const py={'':'','很':'hěn','不太':'bú tài','不':'bù','非常':'fēicháng'}[modifier];
  return {...base,construction:'对…感兴趣',intent:question?'ask-interest':'express-interest',subject,target,targetMeaning:interests[target][1],negated:modifier.startsWith('不'),pinyin:[people[subject],'duì',interests[target][0],py,'gǎn xìngqù',question?'ma?':''].filter(Boolean).join(' ')+(question?'':'.')};
 }
 m=/^(我|你)(想|要)(喝|吃)(.+?)(还是|或者)(?:(喝|吃))?(.+)$/u.exec(s);
 if(m){
  const [,subject,modal,verb,left,join,repeated,right]=m;
  if(!own(verbs,verb)||!verbs[verb].allow.includes(left)||!verbs[verb].allow.includes(right)||left===right||repeated&&repeated!==verb)return null;
  if(join==='还是'&&subject!=='你'||join==='或者'&&subject!=='我')return null;
  return {...base,construction:join,intent:join==='还是'?'ask-choice':'express-options',subject,modal,verb,options:[left,right],pinyin:[people[subject],modal==='想'?'xiǎng':'yào',verbs[verb].py,objects[left][0],join==='还是'?'háishi':'huòzhě',repeated?verbs[verb].py:'',objects[right][0]].filter(Boolean).join(' ')+(join==='还是'?'?':'.')};
 }
 m=/^(我们|我|你|他|她)(没|没有)?(去|吃|喝|看)过(.+?)(吗)?$/u.exec(s);
 if(m){
  const [,subject,neg='',verb,obj,question]=m;if(!own(experience[verb].items,obj)||question&&(subject!=='你'||neg))return null;
  return {...base,construction:'过',intent:question?'ask-experience':'express-experience',subject,verb,object:obj,negated:!!neg,aspect:'experiential',pinyin:[people[subject],neg==='没'?'méi':neg==='没有'?'méiyǒu':'',experience[verb].py+'guo',experience[verb].items[obj],question?'ma?':''].filter(Boolean).join(' ')+(question?'':'.')};
 }
 m=/^(我们|我|你|他|她)从(.+?)到(.+)$/u.exec(s);
 if(m){
  const [,subject,origin,destination]=m;if(!own(places,origin)||!own(places,destination)||origin===destination)return null;
  return {...base,construction:'从…到…',intent:'express-route',subject,origin,destination,time:null,pinyin:people[subject]+' cóng '+places[origin]+' dào '+places[destination]+'.'};
 }
 return null;
}
