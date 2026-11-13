import {brainQuestion} from './panda-brain-hsk1-v302.mjs?v=302';
// Panda AI: local HSK1 tutor. No API, no internet, no invented answers.
const norm=s=>String(s??'').normalize('NFC').toLowerCase().replace(/ё/g,'е').replace(/[.,!?！？。、;:«»"'()]/g,' ').replace(/\s+/g,' ').trim();
export function answerCurriculumQuestion(question,lesson,curriculum=[]){
 const q=String(question??'').trim(),n=Number(lesson),topic=curriculum[n-1];
 if(!q)return 'Задай вопрос по выбранному уроку.';
 if(q.length>500)return 'Максимум 500 символов в вопросе.';
 if(!Number.isInteger(n)||n<1||n>7||!topic)return 'Выбери урок от 1 до 7.';
 const lexicon=brainQuestion(q,[n],curriculum);
 if(lexicon?.kind==='question')return lexicon.explanation;
 const lower=norm(q),words=[...(topic.words||[])].sort((a,b)=>b[0].length-a[0].length);
 if(/диалог|реплик|разговор/u.test(lower))
  return (topic.dialogue||[]).slice(0,4).map(line=>line[1]+' — '+line[2]+' — '+line[3]).join('\n')||'Диалога по теме пока нет.';
 if(/правил|грамматик|порядок слов|как построить/u.test(lower))
  return (topic.rules||[]).map(r=>r[0]+': '+r[1]+'\n'+r[2]+' — '+r[3]).join('\n')||'Проверенного объяснения пока нет.';
 const line=(topic.dialogue||[]).find(l=>q.includes(l[1].replace(/[。！？]/g,''))&&l[1].length>3||norm(l[3]).length>=5&&lower.includes(norm(l[3])));
 if(line&&/перевод|чита|знач|сказать|предложен|пиньин|фраз/u.test(lower))return line[1]+' — '+line[2]+' — '+line[3];
 let remaining=q,found=[];
 for(const w of words)if(remaining.includes(w[0])){found.push(w);remaining=remaining.split(w[0]).join(' ');}
 if(!found.length)found=words.filter(w=>norm(w[1]).length>=3&&(lower===norm(w[1])||lower.includes(' '+norm(w[1])+' '))).slice(0,2);
 if(!found.length)found=words.filter(w=>w[2].split(/[;,\/]/).map(norm).some(piece=>piece.length>=4&&lower.includes(piece))).slice(0,2);
 if(found.length)return found.slice(0,4).map(w=>w[0]+' — '+w[1]+' — '+w[2]).join('\n');
 if(/тон|пиньин|произн/u.test(lower))return (topic.pronunciation||[]).join('\n')||'Правило произношения пока не добавлено.';
 if(/что изучаем|цель урока/u.test(lower))return topic.goal||topic.name;
 return '🐼 По уроку «'+topic.name+'» у меня пока нет проверенного ответа. Спроси о слове, грамматике или диалоге этой темы.';
}
