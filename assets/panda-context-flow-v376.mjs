/* Panda Go v376 — small, deterministic contextual dialogue extension.
 * Uses only reviewed Chinese constructions. No external AI, invented audio,
 * acoustic tone grading, or unlock of unpublished HSK2 lessons.
 */
const clean = value => String(value ?? '').normalize('NFC').replace(/[\s\u3000，。！？?!,.、]/g, '');
const JOBS = Object.freeze({
  '厨师': ['chúshī','поваром'],
  '工人': ['gōngrén','рабочим'],
  '医生': ['yīshēng','врачом'],
  '护士': ['hùshi','медицинским работником'],
  '司机': ['sījī','водителем'],
  '工程师': ['gōngchéngshī','инженером'],
  '程序员': ['chéngxùyuán','программистом'],
  '服务员': ['fúwùyuán','сотрудником сферы обслуживания'],
  '设计师': ['shèjìshī','дизайнером'],
  '经理': ['jīnglǐ','менеджером'],
  '教师': ['jiàoshī','преподавателем'],
  '售货员': ['shòuhuòyuán','продавцом']
});
const PLACES = Object.freeze({
  '餐厅': ['cāntīng','ресторане'],
  '学校': ['xuéxiào','школе'],
  '医院': ['yīyuàn','больнице'],
  '公司': ['gōngsī','компании'],
  '工厂': ['gōngchǎng','на заводе'],
  '超市': ['chāoshì','супермаркете']
});
const message = (hanzi,pinyin,ru) => ({hanzi,pinyin,ru,audioKey:hanzi});
export const occupationPrompt = (lesson=2) => ({
  hanzi:'你做什么工作？',pinyin:'Nǐ zuò shénme gōngzuò?',ru:'Кем ты работаешь?',
  lesson,intent:'occupation-v376',isContextual:true,audioKey:'你做什么工作',
  accepted:['我是厨师','我是工人','我是医生','我在公司工作'],
  instruction:'Расскажи, кем или где работаешь.'
});
const busyPrompt = (lesson=2) => ({
  hanzi:'你忙吗？',pinyin:'Nǐ máng ma?',ru:'Ты занят?',
  lesson,intent:'hsk2-bridge-busy',isContextual:true,audioKey:'你忙吗',
  accepted:['我很忙','我不忙'],instruction:'Ответь: 我很忙。 или 我不忙。'
});
export function interpretWorkReply(raw,{prompt=null}={}){
  const source=String(raw ?? '').trim(),s=clean(source),active=clean(prompt?.hanzi ?? '');
  // During a different active exercise do not pretend that an unrelated job
  // statement answers the pending question.
  if(prompt && active!=='你做什么工作')return null;
  if(!s || s.length>60)return null;
  let fact=null,py=null,ru=null;
  let m=/^我(是|当)([\u3400-\u9fff]{2,5})$/u.exec(s);
  if(m && JOBS[m[2]]){
    const entry=JOBS[m[2]];
    fact={profession:m[2]};
    py='Wǒ '+(m[1]==='当'?'dāng':'shì')+' '+entry[0]+'.';
    ru='Я работаю '+entry[1]+'.';
  }
  m=/^我在([\u3400-\u9fff]{2,5})工作$/u.exec(s);
  if(!fact && m && PLACES[m[1]]){
    const entry=PLACES[m[1]];
    fact={workplace:m[1]};
    py='Wǒ zài '+entry[0]+' gōngzuò.';
    ru='Я работаю в '+entry[1]+'.';
    if(m[1]==='工厂')ru='Я работаю на заводе.';
  }
  if(!fact)return null;
  const lesson=Number.isInteger(prompt?.lesson)?prompt.lesson:2;
  return {kind:active==='你做什么工作'?'answer':'statement',lesson,
    spoken:{known:true,hanzi:source,pinyin:py,translation:ru,topic:lesson,fact},
    reply:message('谢谢！','Xièxie!','Спасибо, я поняла.'),
    followup:busyPrompt(lesson),
    message:'Панда поняла рассказ о работе и продолжит беседу. Тоны речи не проверялись.'};
}
export function addPersonalFollowup(result,{allowed=[],recentQuestions=[]}={}){
  if(!result || !['answer','statement'].includes(result.kind)
      || !result.spoken?.known || !result.spoken?.fact?.name
      || !allowed.includes(2))return result;
  const recent=new Set(recentQuestions.map(clean));
  if(recent.has('你做什么工作'))return result;
  return {...result,followup:occupationPrompt(2)};
}
