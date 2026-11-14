/* Panda Brain v341: offline HSK1-2 facts, semantic gating and uncertainty.
 * Rules verify structures and limited known vocabulary, NOT tones or universal semantics.
 * Personal facts remain in the caller's lesson memory; no server/API calls.
 */
(function(){'use strict';
const slots=['greeting','name','job','age','city'];
const words={
 jobs:'厨师 工人 老师 教师 医生 护士 学生 司机 工程师 程序员 电工 焊工 木工 建筑工人 工厂工人 维修工 清洁工 服务员 售货员 理发师 农民 警察 消防员 军人 律师 会计 经理 店员 老板 商人 记者 摄影师 设计师 画家 歌手 演员 翻译 导游 作家 编辑 牙医 药剂师 兽医 机械师 管理员 教练 保安 快递员 外卖员 飞行员 教授 科学家 自由职业者'.split(' '),
 nonjobs:'苹果 香蕉 西瓜 水 茶 饭 米饭 面条 猫 狗 熊猫 书 桌子 手机 电脑 天气 下雨 今天 明天 北京 上海 中国 俄罗斯 莫斯科 德国 法国 学校 饭店 公司 工厂 医院 朋友 爸爸 妈妈 哥哥 姐姐 名字 工作 学习 汉语 中文 英语 时间 岁 你好 很好 忙 漂亮 什么 谁 哪里 哪儿 不知道'.split(' '),
 notNames:'工人 厨师 老师 医生 护士 司机 工程师 学生 工作 学习 中国 北京 苹果 香蕉 水 天气 今天 名字 什么 谁 哪里 哪儿 很忙'.split(' '),
 notCities:'苹果 香蕉 水 天气 今天 明天 工人 厨师 老师 学生 医生 工作 学习 什么 谁 哪里 哪儿 很好'.split(' ')
};
const sets=Object.fromEntries(Object.entries(words).map(([k,v])=>[k,new Set(v)]));
const word=s=>/^[\u3400-\u9fffA-Za-zА-Яа-яЁё\-]{1,36}$/u.test(s);
const normalize=s=>String(s??'').normalize('NFKC').replace(/\s|\u200b/g,'').trim();
const digits={'零':0,'〇':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
function ageNumber(s){
 if(/^\d{1,3}$/.test(s)){const n=Number(s);return n>=1&&n<=120?n:null}
 if(!/^[零〇一二两三四五六七八九十百]+$/.test(s))return null;
 let x=s,n=0;
 if(x.includes('百')){const p=x.split('百');if(p.length!==2||!(digits[p[0]]>=1))return null;n=digits[p[0]]*100;x=p[1]}
 if(x.includes('十')){const p=x.split('十');if(p.length!==2)return null;const a=p[0]===''?1:digits[p[0]],b=p[1]===''?0:digits[p[1]];if(!(a>=1)||b===undefined)return null;n+=10*a+b}
 else if(x){x=x.replace(/^零/,'');if(x.length>1||digits[x]===undefined)return null;n+=digits[x]}
 return n>=1&&n<=120?n:null;
}
const fact=(kind,value,status='valid',message='',extra={})=>({kind,value,status,message,...extra});
function clause(s){
 if(/^(你好|您好|老师好|熊猫你好|你们好)(呀|啊)?$/.test(s))return fact('greeting','你好');
 let m=s.match(/^我叫(.+)$/)||s.match(/^我的名字(?:是|叫)(.+)$/);
 if(m){const v=m[1];return word(v)&&!sets.notNames.has(v)&&!sets.jobs.has(v)?fact('name',v,'valid',/[A-Za-zА-Яа-яЁё]/.test(v)?'Форма правильная, но китайское написание имени не проверено.':'Верно: 我叫 + имя.'):fact('name',v,'invalid','Это не похоже на имя. Скажи: 我叫 + имя.')}
 m=s.match(/^我(?:今年|已经)?([零〇一二两三四五六七八九十百\d]+)岁(?:了)?$/);
 if(m){const n=ageNumber(m[1]);return n==null?fact('age',m[1],'invalid','Возраст должен быть от 1 до 120 лет.'):fact('age',n)}
 if(/^我(?:现在)?(?:没有|没|不)工作$/.test(s))return fact('job','не работаю');
 m=s.match(/^我在([\u3400-\u9fff]{1,16})工作$/);
 if(m)return fact('job','работаю','valid','Ты назвал место работы.',{workplace:m[1]});
 m=s.match(/^我是(?:一名|一位|一个)?([\u3400-\u9fff]{1,18})$/)||s.match(/^我当([\u3400-\u9fff]{1,18})$/)||s.match(/^我的(?:工作|职业)是([\u3400-\u9fff]{1,18})$/)||s.match(/^我在[\u3400-\u9fff]{1,16}当([\u3400-\u9fff]{1,18})$/);
 if(m){
  const v=m[1];
  if(sets.nonjobs.has(v)||/^(很|正在|不|住|叫|在|什么|哪儿|哪里|喜欢|我)/.test(v)||v.endsWith('岁'))return fact('job',v,'invalid','Это не профессия. Например, 我是工人。');
  if(sets.jobs.has(v))return fact('job',v,'valid','Профессия распознана.');
  return fact('job',v,'uncertain','Слово «'+v+'» пока не распознано как профессия. Подтверди, что это действительно твоя профессия.');
 }
 m=s.match(/^我住在(.+)$/);
 if(m){const v=m[1];return word(v)&&!sets.notCities.has(v)&&!sets.jobs.has(v)?fact('city',v,'valid','Правильная форма 我住在 + место. Географию не проверяем.'):fact('city',v,'invalid','После 我住在 должно быть место, а не предмет.')}
 return null;
}
function parse(raw){
 const v=normalize(raw);if(v.length>240)return [];
 return v.split(/[。？！!?，,、；;\n]+/).filter(Boolean).flatMap(p=>p.replace(/(?!^)(?=我(?:叫|是|在|住在|今年|没有|没工作))/g,'\n').split('\n')).filter(Boolean).slice(0,8).map(clause).filter(Boolean);
}
function assess(index,raw){
 const slot=slots[index];
 if(!slot)return {ok:false,feedback:'Нет такого вопроса.',facts:[]};
 if(!String(raw??'').trim())return {ok:false,feedback:'Ответь голосом или напиши по-китайски.',facts:[]};
 const all=parse(raw),good=all.filter(f=>f.status==='valid'),facts=good.filter(f=>f.kind!=='greeting');
 const target=all.find(f=>f.kind===slot&&f.status==='valid')||all.find(f=>f.kind===slot&&f.status==='uncertain')||all.find(f=>f.kind===slot&&f.status==='invalid');
 if(target?.status==='valid')return {ok:true,code:slot,feedback:'✓ '+(target.message||'Правильно!'),facts,matched:target};
 if(target?.status==='uncertain')return {ok:false,uncertain:true,code:'uncertain-'+slot,feedback:target.message,facts,matched:target};
 if(target?.status==='invalid')return {ok:false,code:'invalid-'+slot,feedback:target.message,facts,matched:target};
 const prompts=['Поздоровайся: 你好！','Имя: 我叫 + имя.','Профессия: 我是厨师。 Можно ответить: 我没有工作。','Возраст: 我今年二十五岁。','Место: 我住在 + город.'];
 return {ok:false,code:'wrong-slot',feedback:prompts[index],facts:[]};
}
function memory(facts){
 const out={};for(const f of facts||[]){if(f.status==='valid'&&slots.includes(f.kind))out[f.kind]=f.value;if(f.status==='valid'&&f.workplace)out.workplace=f.workplace}
 return out;
}
function nextPending(index,passed,skipped){for(let i=index+1;i<5;i++)if(!passed[i]&&!skipped[i])return i;return -1}
window.PandaBrainV341=Object.freeze({version:'341',slots,words,parse,assess,ageNumber,memory,nextPending});
})();