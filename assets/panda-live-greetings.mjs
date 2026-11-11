// Device-local time; greeting remains stable throughout the current conversation.
export const GREETINGS=Object.freeze([
 Object.freeze({panda:'早上好！',pinyin:'Zǎoshang hǎo!',ru:'Доброе утро!',audioKey:'早上好',answer:'早上好',numbered:'zao3 shang5 hao3'}),
 Object.freeze({panda:'中午好！',pinyin:'Zhōngwǔ hǎo!',ru:'Добрый день! (около полудня)',audioKey:'中午好',answer:'中午好',numbered:'zhong1 wu3 hao3'}),
 Object.freeze({panda:'下午好！',pinyin:'Xiàwǔ hǎo!',ru:'Добрый день!',audioKey:'下午好',answer:'下午好',numbered:'xia4 wu3 hao3'}),
 Object.freeze({panda:'晚上好！',pinyin:'Wǎnshang hǎo!',ru:'Добрый вечер!',audioKey:'晚上好',answer:'晚上好',numbered:'wan3 shang5 hao3'})
]);
export function greetingForHour(hour){
 if(!Number.isInteger(hour)||hour<0||hour>23)throw new RangeError('Expected local hour 0–23');
 return GREETINGS[hour>=5&&hour<11?0:hour>=11&&hour<13?1:hour>=13&&hour<18?2:3];
}
export function withLocalGreeting(conversation,date=new Date()){
 const greeting=greetingForHour(date.getHours()),first=conversation.lines[0];
 return {...conversation,lines:[{...first,...greeting,instruction:`Ответь «${greeting.answer}» или «你好».`,accepted:[...first.accepted,greeting.answer,greeting.pinyin.replace(/!$/, ''),greeting.numbered],options:[...first.options,{match:greeting.answer,branch:'greeting'}]},...conversation.lines.slice(1)]};
}
// Circular topic navigation; future drafts stay out of normal navigation.
export function adjacentConversation(conversations,id,direction,preview=false){
 const available=conversations.filter(x=>x.lines.length&&(!x.status.startsWith('draft')||preview));
 const index=available.findIndex(x=>x.id===id);
 return available[(index+(direction<0?-1:1)+available.length)%available.length];
}
