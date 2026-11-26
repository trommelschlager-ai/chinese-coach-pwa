/* Experimental temporal action parser, not connected to the published application. */
export function interpretTemporalAction(raw){
 const source=String(raw??'').normalize('NFC').trim();
 const q=source.replace(/[。！？?!]+$/u,'').replace(/\s+/gu,'');
 const people={我:'Wǒ',我们:'Wǒmen',你:'Nǐ',他:'Tā',她:'Tā'};
 const time={昨天:['zuótiān','past'],前天:['qiántiān','past'],上周:['shàng zhōu','past'],上个月:['shàng ge yuè','past'],今天:['jīntiān','today'],现在:['xiànzài','now'],明天:['míngtiān','future'],后天:['hòutiān','future'],下周:['xià zhōu','future'],每天:['měitiān','habit']};
 // Split the verb and object so 了 is placed correctly, rather than appended blindly.
 const actions=[
 ['吃','chī','饭','fàn','eat'],['吃','chī','早饭','zǎofàn','breakfast'],
 ['喝','hē','茶','chá','tea'],['喝','hē','咖啡','kāfēi','coffee'],
 ['看','kàn','电影','diànyǐng','movie'],['看','kàn','书','shū','read'],
 ['学','xué','中文','Zhōngwén','chinese'],['学习','xuéxí','中文','Zhōngwén','chinese'],
 ['去','qù','中国','Zhōngguó','china'],['去','qù','北京','Běijīng','beijing'],
 ['去','qù','公园','gōngyuán','park'],['工作','gōngzuò','','','work'],
 ['休息','xiūxi','','','rest'],['睡','shuì','觉','jiào','sleep'],
 ['跑','pǎo','步','bù','run'],['回','huí','家','jiā','home']
 ];
 const m=/^(我们|我|你|他|她)(昨天|前天|上周|上个月|今天|现在|明天|后天|下周|每天)?(没有|没|不想|不打算|不|想|打算)?(.+)$/u.exec(q);
 if(!m)return null;
 const [,subject,t='',modal='',body0]=m;
 const question=body0.endsWith('吗');
 if(question&&subject!=='你')return null;
 const body=question?body0.slice(0,-1):body0;
 const tm=t?time[t][1]:null;
 const negated=/^(?:不|没)/u.test(modal);
 const volitional=['想','不想','打算','不打算'].includes(modal);
 for(const [v,vpy,o,opy,action] of actions){
  const plain=v+o,completed=v+'了'+o,experiential=v+'过'+o;
  const aspect=body===plain?'unmarked':body===completed?'perfective':body===experiential?'experiential':null;
  if(!aspect)continue;
  // Keep the supported subset conservative; reject ambiguous and unreviewed combinations.
  if(negated&&aspect==='perfective'||volitional&&aspect!=='unmarked'||tm==='future'&&aspect!=='unmarked'||tm==='habit'&&aspect!=='unmarked'||tm==='now'&&aspect==='experiential')return null;
  if((modal==='没'||modal==='没有')&&tm==='future'||modal==='不'&&(tm==='past'||aspect==='experiential'))return null;
  if(aspect==='experiential'&&!['china','beijing','park','movie','tea','coffee','read'].includes(action))return null;
  if(question&&negated)return null; // do not resolve polarity of negative questions automatically
  const p={'':'','没':'méi','没有':'méiyǒu','不想':'bù xiǎng','不打算':'bù dǎsuàn','想':'xiǎng','打算':'dǎsuàn','不':/[àèìòùǜ]/u.test(vpy.split(' ')[0])?'bú':'bù'}[modal];
  const py=[people[subject],t?time[t][0]:'',p,vpy,aspect==='perfective'?'le':aspect==='experiential'?'guo':'',opy,question?'ma':''].filter(Boolean).join(' ')+(question?'?':'.');
  return {raw:source,construction:'temporal-action',intent:question?'ask-temporal-action':'express-temporal-action',subject,time:t||null,timeReference:tm,modal:modal||null,negated,aspect,action,verb:v,object:o||null,pinyin:py,toneVerified:false};
 }
 return null;
}
