// v516: v514 approved voice sources plus verified user's three context responses, 2026-11-22.
import {lookupPandaVoiceClip as original} from './panda-live-audio.mjs?v=451';
import {PANDA_V422_VOICE} from './qa-v411/panda-voice-v422.mjs?v=422';
import {PANDA_CLARIFICATION_VOICE} from './panda-clarification-voice-20261122/index.mjs?v=505';
import {PANDA_AI_NATURAL_V546} from './panda-ai-natural-voice-batch01-v546.mjs?v=546';
const DAY=Object.freeze([{"zh":"你好！今天我说说我的一天。","src":"./assets/panda-hsk2-my-day-voice-20261120/day01.mp3"},{"zh":"我早上刷牙。","src":"./assets/panda-hsk2-my-day-voice-20261120/day02.mp3"},{"zh":"你早上吃早饭吗？","src":"./assets/panda-hsk2-my-day-voice-20261120/day03.mp3"},{"zh":"你几点去上班？","src":"./assets/panda-hsk2-my-day-voice-20261120/day04.mp3"},{"zh":"你晚上几点睡觉？","src":"./assets/panda-hsk2-my-day-voice-20261120/day05.mp3"},{"zh":"我九点去上班。","src":"./assets/panda-hsk2-my-day-voice-20261120/day06.mp3"},{"zh":"我晚上十一点睡觉。","src":"./assets/panda-hsk2-my-day-voice-20261120/day07.mp3"},{"zh":"我早上不吃早饭。","src":"./assets/panda-hsk2-my-day-voice-20261120/day08.mp3"},{"zh":"我不上班。","src":"./assets/panda-hsk2-my-day-voice-20261120/day09.mp3"},{"zh":"现在请你说说你的一天。","src":"./assets/panda-hsk2-my-day-voice-20261120/day10.mp3"},{"zh":"我没听清楚，请再说一遍。","src":"./assets/panda-hsk2-my-day-voice-20261120/day11.mp3"},{"zh":"这是你的一天。","src":"./assets/panda-hsk2-my-day-voice-20261120/day12.mp3"},{"zh":"做得好！","src":"./assets/panda-hsk2-my-day-voice-20261120/day13.mp3"},{"zh":"我们再试一次。","src":"./assets/panda-hsk2-my-day-voice-20261120/day14.mp3"}]);
const EMBEDDED_KEYS=Object.freeze(["起床","洗脸","刷牙","吃早饭","去上班","睡觉","你每天几点起床？","我每天七点起床。","我每天八点起床。","我早上洗脸。","我起床以后刷牙。"]);
export const voiceNorm=s=>String(s||'').normalize('NFC').replace(/[\p{P}\s]/gu,'');
const exact=new Map([...PANDA_V422_VOICE.map(e=>({...e,batch:'family-v422'})),...DAY.map(e=>({...e,batch:'my-day'})),...PANDA_CLARIFICATION_VOICE.map(e=>({...e,batch:'clarification'}))].map(e=>[voiceNorm(e.zh),e]));
const OLD_ALLOWED=/^\.\/assets\/(?:panda-voice-clips-v365\/p\d{3}|panda-voice-clips-v411\/p\d{3}|panda-grammar-voice-v451\/g\d{3}|panda-live-voice-v[234]\/[\w-]+|panda-live-voice-bridge-v307\/B\d{2}|hsk2-user-voice\/20261114-job-question-v343)\.mp3$/;
// Frozen exact text-to-file map. Do not admit future course files automatically.
const APPROVED_HSK2=Object.freeze({
  "来自": "./assets/hsk2-about-me/voice-luvvoice-20261120/about01.mp3",
  "现在": "./assets/hsk2-about-me/voice-luvvoice-20261120/about02.mp3",
  "住在": "./assets/hsk2-about-me/voice-luvvoice-20261120/about03.mp3",
  "工作": "./assets/hsk2-about-me/voice-luvvoice-20261120/about04.mp3",
  "爱好": "./assets/hsk2-about-me/voice-luvvoice-20261120/about05.mp3",
  "学习": "./assets/hsk2-about-me/voice-luvvoice-20261120/about06.mp3",
  "我叫米沙": "./assets/hsk2-about-me/voice-luvvoice-20261120/about07.mp3",
  "我来自俄罗斯": "./assets/hsk2-about-me/voice-luvvoice-20261120/about08.mp3",
  "我现在住在莫斯科": "./assets/hsk2-about-me/voice-luvvoice-20261120/about09.mp3",
  "我在公司工作": "./assets/hsk2-about-me/voice-luvvoice-20261120/about10.mp3",
  "我的爱好是听音乐": "./assets/hsk2-about-me/voice-luvvoice-20261120/about11.mp3",
  "我每天学习中文": "./assets/hsk2-about-me/voice-luvvoice-20261120/about12.mp3",
  "你来自哪里": "./assets/hsk2-about-me/voice-luvvoice-20261120/about13.mp3",
  "我来自中国": "./assets/hsk2-about-me/voice-luvvoice-20261120/about14.mp3",
  "你现在住在哪里": "./assets/hsk2-about-me/voice-luvvoice-20261120/about15.mp3",
  "我现在住在北京": "./assets/hsk2-about-me/voice-luvvoice-20261120/about16.mp3",
  "你的爱好是什么": "./assets/hsk2-about-me/voice-luvvoice-20261120/about17.mp3",
  "我的爱好是运动": "./assets/hsk2-about-me/voice-luvvoice-20261120/about18.mp3",
  "周末": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby01.mp3",
  "听音乐": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby02.mp3",
  "看电影": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby03.mp3",
  "看书": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby04.mp3",
  "跑步": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby05.mp3",
  "游泳": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby06.mp3",
  "我喜欢看书": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby07.mp3",
  "我周末常常跑步": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby08.mp3",
  "我喜欢听音乐": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby09.mp3",
  "周末我常常看电影": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby10.mp3",
  "我每天晚上看书": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby11.mp3",
  "我周末喜欢跑步": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby12.mp3",
  "她喜欢游泳": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby13.mp3",
  "我喜欢看电影": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby14.mp3",
  "我喜欢游泳": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby15.mp3",
  "你有什么爱好": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby16.mp3",
  "我喜欢跑步": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby17.mp3",
  "你周末喜欢做什么": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby18.mp3",
  "我周末常常看电影": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby19.mp3",
  "我周末喜欢游泳": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby20.mp3",
  "我周末喜欢看书": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby21.mp3",
  "你喜欢运动吗": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby22.mp3",
  "喜欢我喜欢跑步": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby23.mp3",
  "喜欢我喜欢游泳": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby24.mp3",
  "不太喜欢我喜欢看书": "./assets/hsk2-lesson4-hobby-voice-20261121/hobby25.mp3",
  "一起": "./assets/hsk2-lesson5-voice/l5_01.mp3",
  "见面": "./assets/hsk2-lesson5-voice/l5_02.mp3",
  "有空": "./assets/hsk2-lesson5-voice/l5_03.mp3",
  "明天": "./assets/hsk2-lesson5-voice/l5_04.mp3",
  "下午": "./assets/hsk2-lesson5-voice/l5_05.mp3",
  "时间": "./assets/hsk2-lesson5-voice/l5_06.mp3",
  "计划": "./assets/hsk2-lesson5-voice/l5_07.mp3",
  "我和朋友一起学习中文": "./assets/hsk2-lesson5-voice/l5_08.mp3",
  "我们一起去吧": "./assets/hsk2-lesson5-voice/l5_09.mp3",
  "我们明天见面吧": "./assets/hsk2-lesson5-voice/l5_10.mp3",
  "你明天有空吗": "./assets/hsk2-lesson5-voice/l5_11.mp3",
  "明天我们去看电影": "./assets/hsk2-lesson5-voice/l5_12.mp3",
  "我们下午三点见面": "./assets/hsk2-lesson5-voice/l5_13.mp3",
  "你有时间吗": "./assets/hsk2-lesson5-voice/l5_14.mp3",
  "你周末有什么计划": "./assets/hsk2-lesson5-voice/l5_15.mp3",
  "我明天下午有空": "./assets/hsk2-lesson5-voice/l5_16.mp3",
  "我们一起看电影吧": "./assets/hsk2-lesson5-voice/l5_17.mp3",
  "我们一起喝咖啡吧": "./assets/hsk2-lesson5-voice/l5_18.mp3",
  "你明天下午有空吗": "./assets/hsk2-lesson5-voice/l5_19.mp3",
  "有空我们可以见面": "./assets/hsk2-lesson5-voice/l5_20.mp3",
  "有空我下午四点有时间": "./assets/hsk2-lesson5-voice/l5_21.mp3",
  "明天下午没空周末可以": "./assets/hsk2-lesson5-voice/l5_22.mp3",
  "我们几点见面": "./assets/hsk2-lesson5-voice/l5_23.mp3",
  "下午三点吧": "./assets/hsk2-lesson5-voice/l5_24.mp3",
  "下午四点吧": "./assets/hsk2-lesson5-voice/l5_25.mp3",
  "下午五点吧": "./assets/hsk2-lesson5-voice/l5_26.mp3",
  "我们一起做什么": "./assets/hsk2-lesson5-voice/l5_27.mp3",
  "我们一起去公园吧": "./assets/hsk2-lesson5-voice/l5_28.mp3",
  "昨天": "./assets/hsk2-lesson6-voice/l6_01.mp3",
  "以前": "./assets/hsk2-lesson6-voice/l6_02.mp3",
  "去过": "./assets/hsk2-lesson6-voice/l6_03.mp3",
  "听了音乐": "./assets/hsk2-lesson6-voice/l6_04.mp3",
  "看了电影": "./assets/hsk2-lesson6-voice/l6_05.mp3",
  "看了书": "./assets/hsk2-lesson6-voice/l6_06.mp3",
  "跑步了": "./assets/hsk2-lesson6-voice/l6_07.mp3",
  "游泳了": "./assets/hsk2-lesson6-voice/l6_08.mp3",
  "昨天我去了公园": "./assets/hsk2-lesson6-voice/l6_09.mp3",
  "我以前在公司工作": "./assets/hsk2-lesson6-voice/l6_10.mp3",
  "我去过上海": "./assets/hsk2-lesson6-voice/l6_11.mp3",
  "我昨天听了音乐": "./assets/hsk2-lesson6-voice/l6_12.mp3",
  "我昨天看了电影": "./assets/hsk2-lesson6-voice/l6_13.mp3",
  "我昨天看了书": "./assets/hsk2-lesson6-voice/l6_14.mp3",
  "我昨天跑步了": "./assets/hsk2-lesson6-voice/l6_15.mp3",
  "我昨天游泳了": "./assets/hsk2-lesson6-voice/l6_16.mp3",
  "你昨天做什么了": "./assets/hsk2-lesson6-voice/l6_17.mp3",
  "你昨天运动了吗": "./assets/hsk2-lesson6-voice/l6_18.mp3",
  "运动了我昨天跑步了": "./assets/hsk2-lesson6-voice/l6_19.mp3",
  "运动了我昨天游泳了": "./assets/hsk2-lesson6-voice/l6_20.mp3",
  "没有我昨天没有运动": "./assets/hsk2-lesson6-voice/l6_21.mp3",
  "你去过上海吗": "./assets/hsk2-lesson6-voice/l6_22.mp3",
  "去过我去过上海": "./assets/hsk2-lesson6-voice/l6_23.mp3",
  "没有我没去过上海": "./assets/hsk2-lesson6-voice/l6_24.mp3",
  "我以前去过上海": "./assets/hsk2-lesson6-voice/l6_25.mp3",
  "下周": "./assets/hsk2-lesson7-voice/l7_01.mp3",
  "下个月": "./assets/hsk2-lesson7-voice/l7_02.mp3",
  "打算": "./assets/hsk2-lesson7-voice/l7_03.mp3",
  "准备": "./assets/hsk2-lesson7-voice/l7_04.mp3",
  "学中文": "./assets/hsk2-lesson7-voice/l7_05.mp3",
  "去旅行": "./assets/hsk2-lesson7-voice/l7_06.mp3",
  "明天我要学中文": "./assets/hsk2-lesson7-voice/l7_07.mp3",
  "下周我打算去旅行": "./assets/hsk2-lesson7-voice/l7_08.mp3",
  "下个月我想去中国": "./assets/hsk2-lesson7-voice/l7_09.mp3",
  "我打算明天学中文": "./assets/hsk2-lesson7-voice/l7_10.mp3",
  "我准备下周去旅行": "./assets/hsk2-lesson7-voice/l7_11.mp3",
  "我明天学中文": "./assets/hsk2-lesson7-voice/l7_12.mp3",
  "我下个月想去旅行": "./assets/hsk2-lesson7-voice/l7_13.mp3",
  "我想下周去旅行": "./assets/hsk2-lesson7-voice/l7_14.mp3",
  "我准备找工作": "./assets/hsk2-lesson7-voice/l7_15.mp3",
  "我下个月想去中国": "./assets/hsk2-lesson7-voice/l7_16.mp3",
  "我明天要运动": "./assets/hsk2-lesson7-voice/l7_17.mp3",
  "你明天打算做什么": "./assets/hsk2-lesson7-voice/l7_18.mp3",
  "我打算学中文": "./assets/hsk2-lesson7-voice/l7_19.mp3",
  "我想去运动": "./assets/hsk2-lesson7-voice/l7_20.mp3",
  "我打算在家休息": "./assets/hsk2-lesson7-voice/l7_21.mp3",
  "你下个月想去哪儿": "./assets/hsk2-lesson7-voice/l7_22.mp3",
  "我想去北京": "./assets/hsk2-lesson7-voice/l7_23.mp3",
  "我想去上海": "./assets/hsk2-lesson7-voice/l7_24.mp3",
  "我下个月不打算旅行": "./assets/hsk2-lesson7-voice/l7_25.mp3",
  "你为什么想学中文": "./assets/hsk2-lesson7-voice/l7_26.mp3",
  "因为我想去中国": "./assets/hsk2-lesson7-voice/l7_27.mp3",
  "因为我想和朋友说中文": "./assets/hsk2-lesson7-voice/l7_28.mp3",
  "商店": "./assets/hsk2-lesson8-voice/l8_01.mp3",
  "衣服": "./assets/hsk2-lesson8-voice/l8_02.mp3",
  "多少钱": "./assets/hsk2-lesson8-voice/l8_03.mp3",
  "便宜": "./assets/hsk2-lesson8-voice/l8_04.mp3",
  "贵": "./assets/hsk2-lesson8-voice/l8_05.mp3",
  "颜色": "./assets/hsk2-lesson8-voice/l8_06.mp3",
  "试穿": "./assets/hsk2-lesson8-voice/l8_07.mp3",
  "这家商店很大": "./assets/hsk2-lesson8-voice/l8_08.mp3",
  "我想买衣服": "./assets/hsk2-lesson8-voice/l8_09.mp3",
  "这件衣服很好看": "./assets/hsk2-lesson8-voice/l8_10.mp3",
  "这件衣服多少钱": "./assets/hsk2-lesson8-voice/l8_11.mp3",
  "这件衣服很便宜": "./assets/hsk2-lesson8-voice/l8_12.mp3",
  "这个太贵了": "./assets/hsk2-lesson8-voice/l8_13.mp3",
  "我喜欢这个颜色": "./assets/hsk2-lesson8-voice/l8_14.mp3",
  "我可以试穿吗": "./assets/hsk2-lesson8-voice/l8_15.mp3",
  "我想买一件衣服": "./assets/hsk2-lesson8-voice/l8_16.mp3",
  "你想买什么": "./assets/hsk2-lesson8-voice/l8_17.mp3",
  "我想看看": "./assets/hsk2-lesson8-voice/l8_18.mp3",
  "我想买一件红色的衣服": "./assets/hsk2-lesson8-voice/l8_19.mp3",
  "你喜欢什么颜色": "./assets/hsk2-lesson8-voice/l8_20.mp3",
  "我喜欢红色": "./assets/hsk2-lesson8-voice/l8_21.mp3",
  "我喜欢蓝色": "./assets/hsk2-lesson8-voice/l8_22.mp3",
  "这件衣服怎么样": "./assets/hsk2-lesson8-voice/l8_23.mp3",
  "很好看": "./assets/hsk2-lesson8-voice/l8_24.mp3",
  "身体": "./assets/hsk2-lesson9-voice/l9_01.mp3",
  "不舒服": "./assets/hsk2-lesson9-voice/l9_02.mp3",
  "生病": "./assets/hsk2-lesson9-voice/l9_03.mp3",
  "头疼": "./assets/hsk2-lesson9-voice/l9_04.mp3",
  "发烧": "./assets/hsk2-lesson9-voice/l9_05.mp3",
  "吃药": "./assets/hsk2-lesson9-voice/l9_06.mp3",
  "休息": "./assets/hsk2-lesson9-voice/l9_07.mp3",
  "看医生": "./assets/hsk2-lesson9-voice/l9_08.mp3",
  "我身体很好": "./assets/hsk2-lesson9-voice/l9_09.mp3",
  "我今天不舒服": "./assets/hsk2-lesson9-voice/l9_10.mp3",
  "他生病了": "./assets/hsk2-lesson9-voice/l9_11.mp3",
  "我有点儿头疼": "./assets/hsk2-lesson9-voice/l9_12.mp3",
  "她发烧了": "./assets/hsk2-lesson9-voice/l9_13.mp3",
  "我按医生说的吃药": "./assets/hsk2-lesson9-voice/l9_14.mp3",
  "你应该多休息": "./assets/hsk2-lesson9-voice/l9_15.mp3",
  "我想去看医生": "./assets/hsk2-lesson9-voice/l9_16.mp3",
  "我今天身体很好": "./assets/hsk2-lesson9-voice/l9_17.mp3",
  "我今天有点儿不舒服": "./assets/hsk2-lesson9-voice/l9_18.mp3",
  "我头疼想休息": "./assets/hsk2-lesson9-voice/l9_19.mp3",
  "我生病了想去看医生": "./assets/hsk2-lesson9-voice/l9_20.mp3",
  "我觉得好多了": "./assets/hsk2-lesson9-voice/l9_21.mp3",
  "你哪儿不舒服": "./assets/hsk2-lesson9-voice/l9_22.mp3",
  "我头疼": "./assets/hsk2-lesson9-voice/l9_23.mp3",
  "我发烧了": "./assets/hsk2-lesson9-voice/l9_24.mp3",
  "我没事": "./assets/hsk2-lesson9-voice/l9_25.mp3",
  "你现在想做什么": "./assets/hsk2-lesson9-voice/l9_26.mp3",
  "我想喝点儿水": "./assets/hsk2-lesson9-voice/l9_27.mp3",
  "认识": "./assets/hsk2-lesson10-voice/l10_01.mp3",
  "约会": "./assets/hsk2-lesson10-voice/l10_02.mp3",
  "男朋友": "./assets/hsk2-lesson10-voice/l10_03.mp3",
  "女朋友": "./assets/hsk2-lesson10-voice/l10_04.mp3",
  "我喜欢和你聊天": "./assets/hsk2-lesson10-voice/l10_05.mp3",
  "我们一起去散步吧": "./assets/hsk2-lesson10-voice/l10_06.mp3",
  "我今晚有个约会": "./assets/hsk2-lesson10-voice/l10_07.mp3",
  "他是我的男朋友": "./assets/hsk2-lesson10-voice/l10_08.mp3",
  "她是我的女朋友": "./assets/hsk2-lesson10-voice/l10_09.mp3",
  "我爱你": "./assets/hsk2-lesson10-voice/l10_10.mp3",
  "周末要不要一起喝咖啡": "./assets/hsk2-lesson10-voice/l10_11.mp3",
  "不好意思我今天没空": "./assets/hsk2-lesson10-voice/l10_12.mp3",
  "你好很高兴认识你": "./assets/hsk2-lesson10-voice/l10_13.mp3",
  "我也很高兴认识你": "./assets/hsk2-lesson10-voice/l10_14.mp3",
  "你好我叫小安": "./assets/hsk2-lesson10-voice/l10_15.mp3",
  "你好很高兴见到你": "./assets/hsk2-lesson10-voice/l10_16.mp3",
  "好啊我们几点见面": "./assets/hsk2-lesson10-voice/l10_17.mp3",
  "不好意思我周末没空": "./assets/hsk2-lesson10-voice/l10_18.mp3",
  "谢谢下次吧": "./assets/hsk2-lesson10-voice/l10_19.mp3",
  "我们在哪儿见面": "./assets/hsk2-lesson10-voice/l10_20.mp3",
  "在咖啡馆见面吧": "./assets/hsk2-lesson10-voice/l10_21.mp3",
  "我们在公园门口见面吧": "./assets/hsk2-lesson10-voice/l10_22.mp3",
  "你想在哪儿见面": "./assets/hsk2-lesson10-voice/l10_23.mp3",
  "要不要一起喝咖啡": "./assets/hsk2-lesson10-voice/l10_24.mp3",
  "公司": "./assets/hsk2-lesson3-voice/l3-01.mp3",
  "学校": "./assets/hsk2-lesson3-voice/l3-02.mp3",
  "同事": "./assets/hsk2-lesson3-voice/l3-03.mp3",
  "同学": "./assets/hsk2-lesson3-voice/l3-04.mp3",
  "电脑": "./assets/hsk2-lesson3-voice/l3-05.mp3",
  "会说": "./assets/hsk2-lesson3-voice/l3-06.mp3",
  "我在学校学习": "./assets/hsk2-lesson3-voice/l3-07.mp3",
  "他是我的同事": "./assets/hsk2-lesson3-voice/l3-08.mp3",
  "她是我的同学": "./assets/hsk2-lesson3-voice/l3-09.mp3",
  "这是我的电脑": "./assets/hsk2-lesson3-voice/l3-10.mp3",
  "我会说中文": "./assets/hsk2-lesson3-voice/l3-11.mp3",
  "你在哪里工作": "./assets/hsk2-lesson3-voice/l3-12.mp3",
  "你在学校学习吗": "./assets/hsk2-lesson3-voice/l3-13.mp3",
  "你会说中文吗": "./assets/hsk2-lesson3-voice/l3-14.mp3",
  "我在家工作": "./assets/hsk2-lesson3-voice/l3-15.mp3",
  "我现在不工作": "./assets/hsk2-lesson3-voice/l3-16.mp3",
  "不我在家学习": "./assets/hsk2-lesson3-voice/l3-17.mp3",
  "我会说一点中文": "./assets/hsk2-lesson3-voice/l3-18.mp3",
  "我不会说中文": "./assets/hsk2-lesson3-voice/l3-19.mp3",
  "我在家学习": "./assets/hsk2-lesson3-voice/l3-20.mp3"
});
const HSK1_CATALOG_V514=Object.freeze([
  {
    "zh": "你今天好吗？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q01.mp3",
    "sha256": "b0e6abf1b7daf4bcf603a3577d7a715d477b997aa5dd563f6a913d7ed8c37cf2"
  },
  {
    "zh": "晚上好！你好吗？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q02.mp3",
    "sha256": "fe1834bd53a2f58591d2899e712f5186630920a58b8dfd8b35055efe6e3528f3"
  },
  {
    "zh": "你吃了吗？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q03.mp3",
    "sha256": "2cf57f53bb98e919c2f7a58f29231b2c7d03f04b5fef3bc84d94c28afaa05f6d"
  },
  {
    "zh": "他是学生吗？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q04.mp3",
    "sha256": "dce308b96c9db69ea46f8a0aef79cb28a90446128015873ff17a9b662bcc006d"
  },
  {
    "zh": "她是老师吗？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q05.mp3",
    "sha256": "56b5b7a9df963425081e7367f2cba0653451e2b229908f2dbac54956353c8b5e"
  },
  {
    "zh": "你有几个？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q06.mp3",
    "sha256": "71f03dc3723c2dc1568fb2121f435d137289c5ea30cd6d7a9121ff20754c88af"
  },
  {
    "zh": "十后面是几？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q07.mp3",
    "sha256": "9f0ed7428f242bfd4135c2975b2dda9e9f5d01638ef91f4d714524f2c11216e5"
  },
  {
    "zh": "三十加二是多少？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q08.mp3",
    "sha256": "f22989ea56a9b16d0a55485975889db81c344ca64ce955e6a9bcab360d646dca"
  },
  {
    "zh": "明天星期几？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q09.mp3",
    "sha256": "d02627261455a50ce368eabaa8607a4574a7aacdf02251ed243d7589c7591db6"
  },
  {
    "zh": "昨天星期几？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q10.mp3",
    "sha256": "3b8d03c2772766c2a5c733b8827684c60ed53d3ef9926edbeb0591bf85513c3c"
  },
  {
    "zh": "你星期天有空吗？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q11.mp3",
    "sha256": "16a4e4ada19a1cb98e4c0d3526935b500ed14b6a9dcb85f673c2a45955137fdb"
  },
  {
    "zh": "明天几月几号？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q12.mp3",
    "sha256": "6be14ad27dfd926ef43e64381fce28a2e0991963604012e20a62a6cd5e76d0aa"
  },
  {
    "zh": "现在几月？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q13.mp3",
    "sha256": "41f4c4c23f0c9aacd0f7299cb0e2d894a5a87cd8c840e6a7bf1a41ec59e2454d"
  },
  {
    "zh": "今年是哪一年？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q14.mp3",
    "sha256": "8ffcc18acbcfaa93ceba1cd2f87041f2a279eed993edd94f9e37d54713c1678e"
  },
  {
    "zh": "这个月有多少天？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q15.mp3",
    "sha256": "0bbb6a91bc7096af5b6e98995f75664c80670df1fea65a680d670bb7c064cff0"
  },
  {
    "zh": "下个月是几月？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q16.mp3",
    "sha256": "a12d0bbf57d32cff2916c3bac5e7f167e26e029bdb415d1a2684cc948491391f"
  },
  {
    "zh": "今天下雪吗？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q17.mp3",
    "sha256": "b19661871eacfe3e4df226251fcc04119953ab533ae26d5d492365eef920c62a"
  },
  {
    "zh": "冬天天气怎么样？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q18.mp3",
    "sha256": "2ba5c2b6c16ce12631862920182cb7277c9745129004880a56c2539dc972301c"
  },
  {
    "zh": "夏天天气怎么样？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q19.mp3",
    "sha256": "454b0015e94a49e3c616a8a614438aaffefaf02699ffc501eb9205c3a225597d"
  },
  {
    "zh": "今天有风吗？",
    "src": "./assets/panda-hsk1-catalog-voice-20261122/hsk1q20.mp3",
    "sha256": "d6a54f2f93cef3b1f79b9c820585788c1e891414595a8eaa0521eb0094847158"
  }
]);
const approvedCatalog=new Map(HSK1_CATALOG_V514.map(e=>[voiceNorm(e.zh),e]));
const PANDA_CONTEXT_V516=Object.freeze([
  {
    "file": "chat01.mp3",
    "zh": "我想帮助更多人学习中文。",
    "pinyin": "Wǒ xiǎng bāngzhù gèng duō rén xuéxí Zhōngwén.",
    "ru": "Я хочу помочь большему числу людей изучать китайский.",
    "src": "./assets/panda-context-voice-20261122/chat01.mp3",
    "git_blob_sha1": "ba11283628c52e2863aa4374d1b07ed931e694c5",
    "sha256": "a824efb5ed785b6f85eb918e70d0051c57b3bfe677ed9ca3c79442cf395aac26"
  },
  {
    "file": "chat02.mp3",
    "zh": "我在跟你聊天。",
    "pinyin": "Wǒ zài gēn nǐ liáotiān.",
    "ru": "Я сейчас разговариваю с тобой.",
    "src": "./assets/panda-context-voice-20261122/chat02.mp3",
    "git_blob_sha1": "a1c8d8fa9254530d242b37c7eb901ee010dd7efd",
    "sha256": "a078193a6bdd6dd11517eaeb9b755f1e95974d7445cfc522825c3505ee60c7be"
  },
  {
    "file": "chat03.mp3",
    "zh": "我喜欢喜剧片。",
    "pinyin": "Wǒ xǐhuan xǐjùpiàn.",
    "ru": "Я люблю комедии.",
    "src": "./assets/panda-context-voice-20261122/chat03.mp3",
    "git_blob_sha1": "8fe37d037ac23d1e8714e4fa78b2656714d98c44",
    "sha256": "b9510aafebba0438b5ee1a9295c37b6c1a6af13c4e78cd64a69b0cbfd99553bd"
  }
]);
const CONTEXT_BY_ZH=new Map(PANDA_CONTEXT_V516.map(e=>[voiceNorm(e.zh),e]));
// User-supplied Xiaoxiao MP3s verified by exact transcript and Git blob hash, 2026-11-22.
// Preserve the original bytes and avoid any TTS, native-speaker or Street fallback.
export const PANDA_XIAOXIAO_NEW_REPLIES_V520=Object.freeze([{"zh":"今天我有空，可以聊聊天。","src":"./assets/panda-ai-xiaoxiao-new-replies-20261122/panda01.mp3"},{"zh":"好的，那你先忙吧。","src":"./assets/panda-ai-xiaoxiao-new-replies-20261122/panda02.mp3"},{"zh":"那你今天想做什么？","src":"./assets/panda-ai-xiaoxiao-new-replies-20261122/panda03.mp3"},{"zh":"那你想聊聊天吗？","src":"./assets/panda-ai-xiaoxiao-new-replies-20261122/panda04.mp3"},{"zh":"你想聊聊工作吗？","src":"./assets/panda-ai-xiaoxiao-new-replies-20261122/panda05.mp3"},{"zh":"因为喜剧片很好笑。","src":"./assets/panda-ai-xiaoxiao-new-replies-20261122/panda06.mp3"}]);
const NEW_XIAOXIAO_REPLIES_BY_ZH=new Map(PANDA_XIAOXIAO_NEW_REPLIES_V520.map(x=>[voiceNorm(x.zh),x]));
const NATURAL_V546_BY_ZH=new Map(PANDA_AI_NATURAL_V546.map(x=>[voiceNorm(x.zh),x]));
export const PANDA_XIAOXIAO_V557_BATCH=Object.freeze([
  {
    "zh": "你是司机！你在哪儿工作？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-001.mp3",
    "sha256": "23ab61d8651451e17c5864b47e45660d55dd66d6884b33e8ace2ce02ef39ddc2"
  },
  {
    "zh": "你是厨师！你在哪儿工作？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-002.mp3",
    "sha256": "fa3259c0196375d882c3e084f539cc3350cefff419934db7a0b57a0d10a695ac"
  },
  {
    "zh": "你是护士！你在哪儿工作？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-003.mp3",
    "sha256": "08f001378247468ec8376946dba6fb1accaf9f06fccb3457b00b45e15293ed04"
  },
  {
    "zh": "你为什么想做这个工作？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-004.mp3",
    "sha256": "ba969b9f62820da9e0043d5fad47a7b09db58e0376c84d014e35b6f7c96fbcc1"
  },
  {
    "zh": "你现在喜欢做什么？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-005.mp3",
    "sha256": "8cfa922d63688f23d1e85d4c179106d6feb0eb2dc60df2de599955df3139d719"
  },
  {
    "zh": "你想做什么工作？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-006.mp3",
    "sha256": "a24bae7564b98cbac73515986838a3d0c0133549a9940df65aa2d0ffa6fbcfe8"
  },
  {
    "zh": "我在这里陪你练习中文。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-007.mp3",
    "sha256": "1441d6a666c662eb219f68bcac21a30cd025f62dcd49630761396d4b0e4565fc"
  },
  {
    "zh": "我喜欢帮你学中文。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-008.mp3",
    "sha256": "f55612aa38a642888a43995d8bf6256bdae660083e266ac9a8436ea29139e076"
  },
  {
    "zh": "我现在有空，可以陪你练习。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-009.mp3",
    "sha256": "5f4002ad4f90fa3b887d9ede8b7e4812565fd593bd3139afc9d55aea434701d8"
  },
  {
    "zh": "我没有固定的下班时间。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-010.mp3",
    "sha256": "c78b340a5a5607631d9a800df7030cff05ca17786e861bf1716c1f1681c9a231"
  },
  {
    "zh": "我是虚拟中文老师，没有实际的工作年限。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-011.mp3",
    "sha256": "382aa4e10470d35030fa51970f16864e58b2755f27fa4a40d3030b106dd0a59e"
  },
  {
    "zh": "明白了。你想换工作吗？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-012.mp3",
    "sha256": "01b8fdbaa047184ba655a28be529223f486dc632b43dac8a6ef000f070b0116d"
  },
  {
    "zh": "辛苦了！你每天几点下班？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-013.mp3",
    "sha256": "c50f98eb14d1ce5e9130ccf5ee781843bd8270cbb068957f00a473c96e9137d9"
  },
  {
    "zh": "那很好！你下班后喜欢做什么？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-014.mp3",
    "sha256": "b0df32351b4b20efa6b9f7765cffb15f2ae5019b5e994523d30da11ae7a0e6b5"
  },
  {
    "zh": "你下班后喜欢做什么？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-015.mp3",
    "sha256": "0d88c7ffa7290e78ae00bcf73cd5dd4866205ec9272b0f71d63a084cb3c6c444"
  },
  {
    "zh": "明白了。你工作忙吗？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-016.mp3",
    "sha256": "f460a36f60dbd6349577afa324bc8ab9d77d2b13627e967847da7d418d67dc9d"
  },
  {
    "zh": "很高兴认识你！你今年多大？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-017.mp3",
    "sha256": "7ad877b782562a8f274fe34ddb46520ea62d20591ae7a3e3c163c92735f2eaa5"
  },
  {
    "zh": "我也很高兴认识你！你今年多大？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-018.mp3",
    "sha256": "969590dbf038d737f3f29b7b0c265d522cb93b1cd405c30bdee7a6f713142b4c"
  },
  {
    "zh": "我没有姓，我叫熊猫。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-019.mp3",
    "sha256": "1f22ce83a5e5d9268c7b8da01a51635877bc2dbd67e005477b69f615869f5963"
  },
  {
    "zh": "我是虚拟熊猫，没有实际年龄。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-020.mp3",
    "sha256": "ce28367e9b94c052c4aa0e2f2c2eec44c0fbdd888fbedd76d2f0860d869e411d"
  },
  {
    "zh": "我是虚拟熊猫，没有国籍。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-021.mp3",
    "sha256": "a5a587a3a9090f82f53a4a69df8ce5eff9a1414ddca5daaa2346ec942ccac842"
  },
  {
    "zh": "我住在山里。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-022.mp3",
    "sha256": "73bd615888d47eb10b44c4c23134d97ab16431aadea48897de81da617e09cbf3"
  },
  {
    "zh": "明白了。你家有几口人？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-023.mp3",
    "sha256": "5ca2bc70c0483541ec515f18f8dbf4b64abd02f9676d123ff40379f8a963a321"
  },
  {
    "zh": "你儿子几岁？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-024.mp3",
    "sha256": "792a90a890d59014fb0fab7b676fc4b82e347ab4c5f86e51c582fe022f6ff9cf"
  },
  {
    "zh": "你有兄弟姐妹吗？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-025.mp3",
    "sha256": "879450a2d9fd4db7aaa7883349ea919224fc5a901aaef7fdd7abd706344994fd"
  },
  {
    "zh": "我没有弟弟。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-026.mp3",
    "sha256": "f55864fbfef0bd4689a40166e86f82d5b0e74d837c667ab98ef0017aee99bc2b"
  },
  {
    "zh": "我有一个哥哥和一个妹妹。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-027.mp3",
    "sha256": "7dc2969e2a341f851365c2f22e2803a0f818548c6d652c3279a905088b48c44b"
  },
  {
    "zh": "谢谢你告诉我。你喜欢做什么？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-028.mp3",
    "sha256": "92d710d76e39e76d36ca8e076f65a5cac85d1d1a3c74a79a7203b27a2b6cc9e6"
  },
  {
    "zh": "你经常做这件事吗？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-029.mp3",
    "sha256": "cef9e14d61dc2c727a9d7e533cf34136596ed383d8b14b0538345b7cc4ccb975"
  },
  {
    "zh": "我喜欢跑步。你呢？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-030.mp3",
    "sha256": "4634f57f82663c793528c17d6e10c988d4861115f8e5f0bc80e9621275027180"
  },
  {
    "zh": "你还喜欢吃什么？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-031.mp3",
    "sha256": "a800f9e57b68f0d55a439f7651fd1339d9b77572dbee7fdbb597f792ec478b6b"
  },
  {
    "zh": "还要别的吗？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-032.mp3",
    "sha256": "98fdfb8e893fd498a348a643e7eaf9537842fa12d597928abedfd1f65fe59171"
  },
  {
    "zh": "那你现在想吃什么？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-033.mp3",
    "sha256": "0195f06ccb897f51e20ade25d21d92a5180fdb99b9e44735bfdff170a80b3ee6"
  },
  {
    "zh": "我喜欢吃竹子。你呢？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-034.mp3",
    "sha256": "85b404e042b7459e4ac383cd0c91943743a21bca601461e767756aeb96bb1211"
  },
  {
    "zh": "我喜欢喝茶。你呢？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-035.mp3",
    "sha256": "2d97a18f219b8cb562566b146816e01f31bf864a728684219156a068a3b3d01f"
  },
  {
    "zh": "好的。我们聊点别的吧！",
    "src": "./assets/panda-ai-voice-v557/PA-V556-036.mp3",
    "sha256": "378b456c3e0c96667d210575493e831734a31615cfec8276be827853c96f55da"
  },
  {
    "zh": "谢谢你介绍你的一天。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-037.mp3",
    "sha256": "0c0e4ab9ff255d40c6aa93b5fd4e6ac24b616053deb06752b1968779022b2f6e"
  },
  {
    "zh": "我没有固定的起床时间。你几点起床？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-038.mp3",
    "sha256": "f4ae5ee44fc46dbe8b1ebc4ed950097c7a4552983ad10b487abdf09ec7c02a95"
  },
  {
    "zh": "我没有固定的睡觉时间。你呢？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-039.mp3",
    "sha256": "ff64cc7576a5a60d9511909c3c98482839db593a6ac6f8804307aaaf6baaea72"
  },
  {
    "zh": "你今天想出去吗？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-040.mp3",
    "sha256": "4790626175323139be8a3c919b7653532a33597d8172a13664c35b1a74350c84"
  },
  {
    "zh": "注意保暖！你今天想做什么？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-041.mp3",
    "sha256": "7027c018c779eb6d4a3eb45e735f2148ec8d2e063a857a58c2d7b53cb8f2f7f3"
  },
  {
    "zh": "记得喝水。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-042.mp3",
    "sha256": "0ae5351fd9213598f5ce649bdc44d07c175065c9b1b69d38f95e1542f063a022"
  },
  {
    "zh": "出门别忘了带伞。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-043.mp3",
    "sha256": "ea62110cdbf566567953c3f43321abe2e9e881fae4e505a41c3d16b708556a6d"
  },
  {
    "zh": "我不知道你那里的天气。你能告诉我吗？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-044.mp3",
    "sha256": "0647f9fb7b2d3e65e2ffefb7f88eb0e891a6cd7bee354accd452b2c964474d3b"
  },
  {
    "zh": "我不知道明天的实际天气。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-045.mp3",
    "sha256": "d9bd080dace38f463c23e2830127fdef33b87ec74a2a1f4acbb795c7f226b5ba"
  },
  {
    "zh": "好的，还需要别的吗？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-046.mp3",
    "sha256": "ca3f0b140c2022967b149921d1351ae09241a51476e47a3b221a2e720e468247"
  },
  {
    "zh": "练习对话：五十块钱。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-047.mp3",
    "sha256": "17152a6af5bf32c841341fce02ceb46b603b8f0079d076a41a7bb6b19462d4a5"
  },
  {
    "zh": "练习对话：四十块钱，可以吗？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-048.mp3",
    "sha256": "cdd3a31c62706411f2fc3781a92c7a330f49a67bdfd0bd2c0558e706563010c7"
  },
  {
    "zh": "没关系，我们看看别的吧。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-049.mp3",
    "sha256": "cd9606595e0746a4225c063f842ce0a7b269c5fea969c337492b9fee50c7d387"
  },
  {
    "zh": "练习对话：可以刷卡。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-050.mp3",
    "sha256": "3593db877171947eb4e60e3c56249f69af1326a30c0abd12869f0e39678b39a9"
  },
  {
    "zh": "你想买几件？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-051.mp3",
    "sha256": "a33f56758533d934e1935a2800c9b55aa5ffdf41930c33ba59d1db897fa4cb0a"
  },
  {
    "zh": "你打算什么时候去？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-052.mp3",
    "sha256": "f968446923eeb00bb504b04ab3363896cc5b0b760aad12d08f881bd2f3cf52fe"
  },
  {
    "zh": "你打算怎么去？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-053.mp3",
    "sha256": "4b0e510af51aec5b52992c0f6f62c5e4d70e4f3bdd9dff2bb82ecb0ddfd8314d"
  },
  {
    "zh": "你在那里做了什么？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-054.mp3",
    "sha256": "0e1151dd792b71d636a8095444b3e8e752816aad2cf23b78c7240f9d4a412a47"
  },
  {
    "zh": "你以后想去吗？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-055.mp3",
    "sha256": "8978c50910d2f89b396016879e4096da6fd1dca5b85781c7c0261433f4d8545e"
  },
  {
    "zh": "你到了那里想做什么？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-056.mp3",
    "sha256": "d2c81c60e34e29860b7bc5010629ac064b122ca91d9424135055049a5395fe13"
  },
  {
    "zh": "我是虚拟熊猫，没有实际的旅行经历。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-057.mp3",
    "sha256": "c80da9c5ebaa8118ab25f91604da043aa3c088727bb6d7bca3bfcb8a93f12211"
  },
  {
    "zh": "祝你旅途愉快！",
    "src": "./assets/panda-ai-voice-v557/PA-V556-058.mp3",
    "sha256": "45ec6df5f5d1ccc6fea631d9ebe8d62231b9934dfdd125a9a01dfe05970ae291"
  },
  {
    "zh": "那你休息一下吧。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-059.mp3",
    "sha256": "b3d2687d2b51c5c7fa746927b02bf2f155bad5e22295d8fc67725a8b5e916a1d"
  },
  {
    "zh": "太好了！为什么这么开心？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-060.mp3",
    "sha256": "d4ec95962d54890a0559b1643c678bd5133b98c3e15a058bb20dc4847ae25b0b"
  },
  {
    "zh": "怎么了？你想说说吗？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-061.mp3",
    "sha256": "b5c47b5d14181016d060e90be5e2f3865ed345947e9fc4f17ba9de196a4a1c72"
  },
  {
    "zh": "如果不舒服，请考虑看医生。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-062.mp3",
    "sha256": "277e44044e9c0f863bce296a7823aefd6b472b98311b4913eeeb462d03476583"
  },
  {
    "zh": "我很好，谢谢！你呢？",
    "src": "./assets/panda-ai-voice-v557/PA-V556-063.mp3",
    "sha256": "e4cb4bcab371a80fd931769a4ef6bea83623f932ec691f16c67238fbf7a0bbe0"
  },
  {
    "zh": "那就好！请照顾好自己。",
    "src": "./assets/panda-ai-voice-v557/PA-V556-064.mp3",
    "sha256": "3ce77af27a6f7294f78f9470a1e7a8dbce98079c7381f68befa3574fbeb60c95"
  }
]);
const XIAOXIAO_V557_BY_ZH=new Map(PANDA_XIAOXIAO_V557_BATCH.map(e=>[voiceNorm(e.zh),e]));
// User-supplied batch; listening/tones remain pending physical Android QA.
export const PANDA_USER_V563_BATCH=Object.freeze([
  {
    "id": "PA-V563-01",
    "zh": "然后呢？",
    "src": "./assets/panda-ai-voice-batch01-v563/PA-V563-01.mp3",
    "sha256": "34dbeb496e5463a318ba567c68c09d534ef90daba4b1bc817a633d77bfa083d8",
    "bytes": 9452
  },
  {
    "id": "PA-V563-02",
    "zh": "你接下来想做什么？",
    "src": "./assets/panda-ai-voice-batch01-v563/PA-V563-02.mp3",
    "sha256": "6410fb2d2e42a6b40757cda1b97aac8d1908442640dce0bc1a415ee2bef85346",
    "bytes": 17132
  },
  {
    "id": "PA-V563-03",
    "zh": "你早上吃什么？",
    "src": "./assets/panda-ai-voice-batch01-v563/PA-V563-03.mp3",
    "sha256": "bbf091127f6c4f12737d0cb1363ea1de4d2f46ad42c3375ebb74f778724cb431",
    "bytes": 14252
  },
  {
    "id": "PA-V563-04",
    "zh": "我先刷牙，再吃早饭。",
    "src": "./assets/panda-ai-voice-batch01-v563/PA-V563-04.mp3",
    "sha256": "134bef87c762bcc6cf0a39e285c9331feb46b3491d0f310d7783bb29eedb50ae",
    "bytes": 22124
  },
  {
    "id": "PA-V563-05",
    "zh": "我每天七点起床。",
    "src": "./assets/panda-ai-voice-batch01-v563/PA-V563-05.mp3",
    "sha256": "7143f30b46dedef56ba81b21a866d7ec0da6be8eb712117b1a09b905a48cf629",
    "bytes": 17516
  },
  {
    "id": "PA-V563-06",
    "zh": "我在和你聊天。",
    "src": "./assets/panda-ai-voice-batch01-v563/PA-V563-06.mp3",
    "sha256": "75380c44e40fd4ef79cd53cffc98232a2a5c115ad310e2ee041402b412cfc422",
    "bytes": 14636
  },
  {
    "id": "PA-V563-07",
    "zh": "我今天和你练习中文。",
    "src": "./assets/panda-ai-voice-batch01-v563/PA-V563-07.mp3",
    "sha256": "00d6c6d1a94ca3e87fae4d307513b25036e562cb441633098e2e092320fb6a20",
    "bytes": 20204
  },
  {
    "id": "PA-V563-08",
    "zh": "你周末做什么？",
    "src": "./assets/panda-ai-voice-batch01-v563/PA-V563-08.mp3",
    "sha256": "288eb59f87274b4f89dc59387f34406b1944538a34e28a2f7a955a2beb2a4cd4",
    "bytes": 14252
  },
  {
    "id": "PA-V563-09",
    "zh": "你今天忙吗？",
    "src": "./assets/panda-ai-voice-batch01-v563/PA-V563-09.mp3",
    "sha256": "98c861709721414c4f599459edd68a7f8c041cf2f09a06eab7a5c446f45f1400",
    "bytes": 12716
  },
  {
    "id": "PA-V563-10",
    "zh": "我没事，谢谢你。",
    "src": "./assets/panda-ai-voice-batch01-v563/PA-V563-10.mp3",
    "sha256": "d56cf2a2a9e2fa86a01c72440c7fa8e12d61ac2b64eac9640a66d93a72c9d994",
    "bytes": 18668
  },
  {
    "id": "PA-V563-11",
    "zh": "谢谢你！我很开心！",
    "src": "./assets/panda-ai-voice-batch01-v563/PA-V563-11.mp3",
    "sha256": "d1244cc202efaa8cc56551b705195ac538d79f8eaf634f83f6542c356b173a09",
    "bytes": 24428
  },
  {
    "id": "PA-V563-12",
    "zh": "你想吃什么？",
    "src": "./assets/panda-ai-voice-batch01-v563/PA-V563-12.mp3",
    "sha256": "3be98c75d0529b303b7c67bbf5b8e8b9ba332f665070c0ebf63f2cd4bf015090",
    "bytes": 12524
  }
]);
const USER_V563_BY_ZH=new Map(PANDA_USER_V563_BATCH.map(e=>[voiceNorm(e.zh),e]));
// User-supplied November 26 recordings, one exact phrase per MP3.
export const PANDA_TRAVEL_VOICE_20261126=Object.freeze([
  {
    "id": "PA-TRAVEL-01",
    "zh": "你来选话题吧。",
    "pinyin": "Nǐ lái xuǎn huàtí ba.",
    "ru": "Выбери тему разговора.",
    "src": "./assets/panda-ai-travel-voice-20261126/PA-TRAVEL-01.mp3",
    "bytes": 10604,
    "sha256": "b4280febc96118bd5acd6adf79190f69eecec015bf0919e963879c1f5c67463f"
  },
  {
    "id": "PA-TRAVEL-02",
    "zh": "什么意思？",
    "pinyin": "Shénme yìsi?",
    "ru": "Что это значит?",
    "src": "./assets/panda-ai-travel-voice-20261126/PA-TRAVEL-02.mp3",
    "bytes": 8444,
    "sha256": "55309e82daa0b3e5f6aee91b849a544ce0307f7d8bc8ddf746ee69622c6acfbc"
  },
  {
    "id": "PA-TRAVEL-03",
    "zh": "什么时候去中国？",
    "pinyin": "Shénme shíhou qù Zhōngguó?",
    "ru": "Когда ехать в Китай?",
    "src": "./assets/panda-ai-travel-voice-20261126/PA-TRAVEL-03.mp3",
    "bytes": 12188,
    "sha256": "97b96195d62320c3e44441914fe9ef67c2de02f27c3e8930a3d4f03f56711a79"
  },
  {
    "id": "PA-TRAVEL-04",
    "zh": "我下个月去中国。",
    "pinyin": "Wǒ xià ge yuè qù Zhōngguó.",
    "ru": "Я поеду в Китай в следующем месяце.",
    "src": "./assets/panda-ai-travel-voice-20261126/PA-TRAVEL-04.mp3",
    "bytes": 12044,
    "sha256": "9907b264544294d3da374f1cc45c008a9087cc90d8b2b4871c038fb419e06b1a"
  },
  {
    "id": "PA-TRAVEL-05",
    "zh": "我打算坐飞机。",
    "pinyin": "Wǒ dǎsuàn zuò fēijī.",
    "ru": "Я собираюсь лететь на самолёте.",
    "src": "./assets/panda-ai-travel-voice-20261126/PA-TRAVEL-05.mp3",
    "bytes": 11756,
    "sha256": "caf4f3d16f3fcb8eec9078402e21095b2f6144b3c35e7d5dfc75a9b0a78497b2"
  }
]);
const TRAVEL_VOICE_BY_ZH=new Map(PANDA_TRAVEL_VOICE_20261126.map(e=>[voiceNorm(e.zh),e]));
export const PANDA_USER_20261127_BATCH=Object.freeze([
  {
    "zh": "你最喜欢什么中国菜？",
    "src": "./assets/panda-ai-voice-20261127/PA-B02-01.mp3",
    "role": "panda-ai-female",
    "bytes": 14636,
    "sha256": "cee0a43ccc9c5e8070355f6f75ddaa2ce6db14480a64e896d108bfb42e8b305a"
  },
  {
    "zh": "你想喝什么？",
    "src": "./assets/panda-ai-voice-20261127/PA-B02-02.mp3",
    "role": "panda-ai-female",
    "bytes": 9308,
    "sha256": "f103a9be358ae4a374def0aaf80249f3482e900249c519b8f0fe4f9037094114"
  },
  {
    "zh": "还要什么？",
    "src": "./assets/panda-ai-voice-20261127/PA-B02-03.mp3",
    "role": "panda-ai-female",
    "bytes": 7724,
    "sha256": "82d7133ae8abea8cff0c3693caf27dc40fe3be1e307ad3932e0829e214ffceb4"
  },
  {
    "zh": "你喜欢什么音乐？",
    "src": "./assets/panda-ai-voice-20261127/PA-B02-04.mp3",
    "role": "panda-ai-female",
    "bytes": 11756,
    "sha256": "f2c39400c4c3925b4228edfd82085955ddd8ef077dc8a90c510b62cf2505d1ce"
  },
  {
    "zh": "我喜欢轻音乐。",
    "src": "./assets/panda-ai-voice-20261127/PA-B02-05.mp3",
    "role": "panda-ai-female",
    "bytes": 11180,
    "sha256": "5adf86e2cc355a2e445f385f96149fbe8acd46416eb3b177060352041db9cd08"
  },
  {
    "zh": "你觉得这个电影怎么样？",
    "src": "./assets/panda-ai-voice-20261127/PA-B02-06.mp3",
    "role": "panda-ai-female",
    "bytes": 14204,
    "sha256": "734fb96435dc16f8d002b2edd9e47154bbab276c57e09c32ec72c893bd56fc75"
  },
  {
    "zh": "我觉得很有意思。",
    "src": "./assets/panda-ai-voice-20261127/PA-B02-07.mp3",
    "role": "panda-ai-female",
    "bytes": 11612,
    "sha256": "d32bdd3c0e674aa184272572ef3bef20a6ea48ce4eb52662fa1a038568cb6f54"
  },
  {
    "zh": "你晚上常常做什么？",
    "src": "./assets/panda-ai-voice-20261127/PA-B02-08.mp3",
    "role": "panda-ai-female",
    "bytes": 13628,
    "sha256": "9c4be7fa0d433fae0844f82c954e713832e47feecb2a4352ec8f873aa89777ab"
  },
  {
    "zh": "我晚上常常看书。",
    "src": "./assets/panda-ai-voice-20261127/PA-B02-09.mp3",
    "role": "panda-ai-female",
    "bytes": 13196,
    "sha256": "dafbf01f0d3618c2fd6f61c5dc1136590af19b0adc04f199bf16634eee545f3b"
  },
  {
    "zh": "我今天很忙。",
    "src": "./assets/panda-ai-voice-20261127/PA-B02-10.mp3",
    "role": "panda-ai-female",
    "bytes": 9884,
    "sha256": "0cc2c0b3f1cab1dee74028bc73361cb8ae9415257d6e6bbf048a93fdc762e70f"
  },
  {
    "zh": "不累。你呢？",
    "src": "./assets/panda-ai-voice-20261127/PA-B02-11.mp3",
    "role": "panda-ai-female",
    "bytes": 13772,
    "sha256": "a1a2f6d652f374885d6c17e65fb38bdfcc1076fc2826972a603ce9b59c545e22"
  },
  {
    "zh": "不用，谢谢你。",
    "src": "./assets/panda-ai-voice-20261127/PA-B02-12.mp3",
    "role": "panda-ai-female",
    "bytes": 12044,
    "sha256": "f03fbb4197eb56e0738cd661cb9bfa10c003e7b37d5596d283c33c317026ad08"
  },
  {
    "zh": "银行在哪儿？",
    "src": "./assets/panda-ai-voice-20261127/PA-B03-01.mp3",
    "role": "panda-ai-female",
    "bytes": 8876,
    "sha256": "2f102a5b66111cabc5851a3d3ad649738ede178eb6cd59fedaf52a6982225dfd"
  },
  {
    "zh": "银行在学校旁边。",
    "src": "./assets/panda-ai-voice-20261127/PA-B03-02.mp3",
    "role": "panda-ai-female",
    "bytes": 13340,
    "sha256": "977313cbe05a7293a672b661a96bb35181324d510280a5e4a4f71241e1efaa55"
  },
  {
    "zh": "公园在哪儿？",
    "src": "./assets/panda-ai-voice-20261127/PA-B03-03.mp3",
    "role": "panda-ai-female",
    "bytes": 8732,
    "sha256": "fb92db31afb31aded3859415ff49541df438b210bcceddc2d40991568f7319ef"
  },
  {
    "zh": "公园在医院后面。",
    "src": "./assets/panda-ai-voice-20261127/PA-B03-04.mp3",
    "role": "panda-ai-female",
    "bytes": 13196,
    "sha256": "07309e9531c32518427ea58fde647267ca632502ebbe6d2489a8ddd1287a4042"
  },
  {
    "zh": "你家离学校远吗？",
    "src": "./assets/panda-ai-voice-20261127/PA-B03-05.mp3",
    "role": "panda-ai-female",
    "bytes": 12332,
    "sha256": "cb5e08a904f25a1552f04bcd04f5dfd673636acd1137870c453a7bb7f4abffa0"
  },
  {
    "zh": "不远，很近。",
    "src": "./assets/panda-ai-voice-20261127/PA-B03-06.mp3",
    "role": "panda-ai-female",
    "bytes": 11324,
    "sha256": "7f81844e0f45a7774d63622dbab2bb83a51d3d70b92d4623bce2bee287eff5d0"
  },
  {
    "zh": "你怎么去上班？",
    "src": "./assets/panda-ai-voice-20261127/PA-B03-07.mp3",
    "role": "panda-ai-female",
    "bytes": 10028,
    "sha256": "acd6606b0f42f4072f7787607097552b63f0c0a16dd7c239d2b4bd568bbdb224"
  },
  {
    "zh": "你从家到公司怎么去？",
    "src": "./assets/panda-ai-voice-20261127/PA-B03-08.mp3",
    "role": "panda-ai-female",
    "bytes": 15788,
    "sha256": "ac3a62a429143480b412b23fb880b6e809b996a2c51e4f07d3fdd0d2877f3a1d"
  },
  {
    "zh": "我坐公交车。",
    "src": "./assets/panda-ai-voice-20261127/PA-B03-09.mp3",
    "role": "panda-ai-female",
    "bytes": 10028,
    "sha256": "f7eca511e097a22223ce52146bc39ba142a5b268d13b8bdca8010ce46b7222e9"
  },
  {
    "zh": "到机场需要多久？",
    "src": "./assets/panda-ai-voice-20261127/PA-B03-10.mp3",
    "role": "panda-ai-female",
    "bytes": 12764,
    "sha256": "c221e2e85896e41de08cd9af7faa8385cfb60548c2a6f05615c5b83a200286c8"
  },
  {
    "zh": "需要一个小时。",
    "src": "./assets/panda-ai-voice-20261127/PA-B03-11.mp3",
    "role": "panda-ai-female",
    "bytes": 11324,
    "sha256": "8b17deeeca0977591e2818f2c5474ce21655345c1145408a629860559aff3a18"
  },
  {
    "zh": "我坐地铁去上班。",
    "src": "./assets/panda-ai-voice-20261127/PA-B03-12.mp3",
    "role": "panda-ai-female",
    "bytes": 12476,
    "sha256": "c2497da10f18a916eb2bee29cd47a25071bdad48c266f181f0176a19f478cbcf"
  },
  {
    "zh": "你喜欢这件衣服吗？",
    "src": "./assets/panda-ai-voice-20261127/PA-B04-01.mp3",
    "role": "panda-ai-female",
    "bytes": 12332,
    "sha256": "1b75f1fe62a21f55ed1bd0667fa00c4fda400395acb60ea130689fa1fcaeb39d"
  },
  {
    "zh": "喜欢，但是太贵了。",
    "src": "./assets/panda-ai-voice-20261127/PA-B04-02.mp3",
    "role": "panda-ai-female",
    "bytes": 15068,
    "sha256": "fcaa9b75f0f524ec97ec916726e1fb99e6da6fa5881f5bfc5aec4f447055eb53"
  },
  {
    "zh": "哪个更便宜？",
    "src": "./assets/panda-ai-voice-20261127/PA-B04-03.mp3",
    "role": "panda-ai-female",
    "bytes": 9452,
    "sha256": "4118479c9aaae658b572477deae7ca14c9709586bf36f0895df0279b285d044c"
  },
  {
    "zh": "这个比那个便宜。",
    "src": "./assets/panda-ai-voice-20261127/PA-B04-04.mp3",
    "role": "panda-ai-female",
    "bytes": 11324,
    "sha256": "c11cd64bfd9e22ae2ad133cc3104f83149224e9edfd37ec55a37214417e5aa8c"
  },
  {
    "zh": "你星期六有空吗？",
    "src": "./assets/panda-ai-voice-20261127/PA-B04-05.mp3",
    "role": "panda-ai-female",
    "bytes": 11756,
    "sha256": "88d3051eb63fd85bd7f67578b12fd4dcbe6d8d06f9223181b71867b9e0b49697"
  },
  {
    "zh": "有空，我们见面吧。",
    "src": "./assets/panda-ai-voice-20261127/PA-B04-06.mp3",
    "role": "panda-ai-female",
    "bytes": 13484,
    "sha256": "a7e30ac6a019a63117cb51aef3d7ab990ec46b4bfa43244dbc37bbb0366e297a"
  },
  {
    "zh": "星期六下午三点。",
    "src": "./assets/panda-ai-voice-20261127/PA-B04-07.mp3",
    "role": "panda-ai-female",
    "bytes": 13196,
    "sha256": "bfb42e76d6cdd39f4448b2dfca3da91755babcdd844534b953a54bfc4ccfc285"
  },
  {
    "zh": "你想去公园吗？",
    "src": "./assets/panda-ai-voice-20261127/PA-B04-08.mp3",
    "role": "panda-ai-female",
    "bytes": 10316,
    "sha256": "13088afe1969e84778234c894a4468e2b69f5fba250ea34b3229f8df50c7e1c5"
  },
  {
    "zh": "好，我们一起去吧。",
    "src": "./assets/panda-ai-voice-20261127/PA-B04-09.mp3",
    "role": "panda-ai-female",
    "bytes": 13196,
    "sha256": "425f9cbb4638013938a2eefdea7b74d4e427baee43ec0c4db640c70f1198a7b4"
  },
  {
    "zh": "你昨天上班了吗？",
    "src": "./assets/panda-ai-voice-20261127/PA-B04-10.mp3",
    "role": "panda-ai-female",
    "bytes": 11036,
    "sha256": "d7f290de41108656e759944cd0ef15e52915f64422df011947d2cb1a8ef5eca6"
  },
  {
    "zh": "没有，我昨天没有上班。",
    "src": "./assets/panda-ai-voice-20261127/PA-B04-11.mp3",
    "role": "panda-ai-female",
    "bytes": 16796,
    "sha256": "a755595e357edd8303aec7e82a1a6967f39827f4470237eee17e3ee9ed594aa2"
  },
  {
    "zh": "你下个月打算做什么？",
    "src": "./assets/panda-ai-voice-20261127/PA-B04-12.mp3",
    "role": "panda-ai-female",
    "bytes": 13916,
    "sha256": "23c111771a54f8638f27fd70f3d7ad5e774273ebcb0262938a83154f941615f9"
  },
  {
    "zh": "我住在熊猫的世界里。",
    "src": "./assets/panda-ai-voice-20261127/PA-B05-01.mp3",
    "role": "panda-ai-female",
    "bytes": 14636,
    "sha256": "2bd6d1f499ea07c72a3ea68c47dc7c44368deda9748c07e8e2a7514645a03cc2"
  },
  {
    "zh": "我可以用俄语解释中文。",
    "src": "./assets/panda-ai-voice-20261127/PA-B05-02.mp3",
    "role": "panda-ai-female",
    "bytes": 16364,
    "sha256": "fcbc879c6c4fd5c0db907b5a1a06e7bd4f019a986e665a30a2db93fe9ed6acfd"
  },
  {
    "zh": "我没有孩子。",
    "src": "./assets/panda-ai-voice-20261127/PA-B05-03.mp3",
    "role": "panda-ai-female",
    "bytes": 9740,
    "sha256": "41fc8091fd63522bcb7a52c46698c436660a64d2a63db0431f38b3807de1a9a3"
  },
  {
    "zh": "我是虚拟熊猫。你爸爸呢？",
    "src": "./assets/panda-ai-voice-20261127/PA-B05-04.mp3",
    "role": "panda-ai-female",
    "bytes": 21980,
    "sha256": "61371dbbe810011766def30552aab496c0d5966409d289482e7b26dbd2305578"
  },
  {
    "zh": "我是虚拟熊猫。你妈妈呢？",
    "src": "./assets/panda-ai-voice-20261127/PA-B05-05.mp3",
    "role": "panda-ai-female",
    "bytes": 21692,
    "sha256": "2e9630996b6abc616a6185ca93864098ac8e72a5a8fb1881ed96aa8f23f58067"
  },
  {
    "zh": "没有，我是虚拟熊猫。",
    "src": "./assets/panda-ai-voice-20261127/PA-B05-06.mp3",
    "role": "panda-ai-female",
    "bytes": 16220,
    "sha256": "a5b6ca3a7226a84c2bc02d49d062b6236f61227b69330a21fede9f44283b9f2c"
  },
  {
    "zh": "有啊，我们可以做朋友。",
    "src": "./assets/panda-ai-voice-20261127/PA-B05-07.mp3",
    "role": "panda-ai-female",
    "bytes": 15788,
    "sha256": "c4bf9b708bbc1b3bf5b05055137b261d4b430f345b0950a81de4739b6bd9fcb0"
  },
  {
    "zh": "我想吃竹子。",
    "src": "./assets/panda-ai-voice-20261127/PA-B05-08.mp3",
    "role": "panda-ai-female",
    "bytes": 10604,
    "sha256": "b9dcc6d8771a5cfe160378a4e438cc871f4819bb50911e324726162240ca1b08"
  },
  {
    "zh": "不饿。你呢？",
    "src": "./assets/panda-ai-voice-20261127/PA-B05-09.mp3",
    "role": "panda-ai-female",
    "bytes": 14492,
    "sha256": "962505565800f6cdc178e879010115d73b0a853303890a73cfbc42ab5b590a18"
  },
  {
    "zh": "我不会真的做饭，但可以陪你练习。",
    "src": "./assets/panda-ai-voice-20261127/PA-B05-10.mp3",
    "role": "panda-ai-female",
    "bytes": 23708,
    "sha256": "c60eb1e4e832dce7fbd28be14d60be452e24e40c2d6c80a4bc9ffd8c7de3952a"
  },
  {
    "zh": "我是虚拟熊猫，不会真的游泳。",
    "src": "./assets/panda-ai-voice-20261127/PA-B05-11.mp3",
    "role": "panda-ai-female",
    "bytes": 21116,
    "sha256": "2dfe40ad1a19b2742a0d103f64ac937475a35b0fc0b305ba232c0711cf4f1b96"
  },
  {
    "zh": "我不知道实际天气。",
    "src": "./assets/panda-ai-voice-20261127/PA-B05-12.mp3",
    "role": "panda-ai-female",
    "bytes": 13916,
    "sha256": "028d57249dbbc785dd1fb785037555bf5de05d1919d697cd3a864ad84a7d7e5d"
  },
  {
    "zh": "我喜欢雪。",
    "src": "./assets/panda-ai-voice-20261127/PA-B06-01.mp3",
    "role": "panda-ai-female",
    "bytes": 8640,
    "sha256": "a81333d96194844d7efa0e0071b0cc7b9275579b3aab65122657c8169a0f5d21"
  },
  {
    "zh": "我喜欢紫色。",
    "src": "./assets/panda-ai-voice-20261127/PA-B06-02.mp3",
    "role": "panda-ai-female",
    "bytes": 9792,
    "sha256": "4212fa87c16e7ea69cfbd29e09714ec087c922cfa7ed224c55b2d88ef108866b"
  },
  {
    "zh": "我还没有计划。",
    "src": "./assets/panda-ai-voice-20261127/PA-B06-03.mp3",
    "role": "panda-ai-female",
    "bytes": 9936,
    "sha256": "dd7507f5c211cc21c40161c644bb1512e2072c8637285f017e0fea79f01673de"
  },
  {
    "zh": "我是虚拟熊猫，不会真的坐飞机。",
    "src": "./assets/panda-ai-voice-20261127/PA-B06-04.mp3",
    "role": "panda-ai-female",
    "bytes": 21600,
    "sha256": "1536592306f5e9408180e2346f378a48a2dff8eb520481cddb23a4cc49cdc36a"
  },
  {
    "zh": "你会用电脑吗？",
    "src": "./assets/panda-ai-voice-20261127/PA-B06-05.mp3",
    "role": "panda-ai-female",
    "bytes": 10368,
    "sha256": "30f5687365ab8755e4efb311775bd5f9791c564431cfc4f5eae44a1f20243229"
  },
  {
    "zh": "会，我会用电脑。",
    "src": "./assets/panda-ai-voice-20261127/PA-B06-06.mp3",
    "role": "panda-ai-female",
    "bytes": 12672,
    "sha256": "cc0c16659523192ca5337489305e66b22039cf8d67148e613602bef8fd66ef47"
  },
  {
    "zh": "我还要一碗汤。",
    "src": "./assets/panda-ai-voice-20261127/PA-B06-07.mp3",
    "role": "panda-ai-female",
    "bytes": 9504,
    "sha256": "5e56614e9ccb027008e891793bfedf2b9f142e26918e7b891d3553a31a273451"
  },
  {
    "zh": "我打算去上海。",
    "src": "./assets/panda-ai-voice-20261127/PA-B06-08.mp3",
    "role": "panda-ai-female",
    "bytes": 11088,
    "sha256": "712c7c7de0b698176281a1b1f515d3a1cef032b25d493b790edaf61bcbe47969"
  },
  {
    "zh": "你喜欢去公园吗？",
    "src": "./assets/panda-ai-voice-20261127/PA-B06-09.mp3",
    "role": "panda-ai-female",
    "bytes": 11232,
    "sha256": "61839c1f6dbbc27281f2b05a87d7e732c29dad1575d01dd486a31e5a21c5caa1"
  },
  {
    "zh": "我就去公园。",
    "src": "./assets/panda-ai-voice-20261127/PA-B06-10.mp3",
    "role": "panda-ai-female",
    "bytes": 9072,
    "sha256": "85328d1a30d1417657371e66846f5cbc24596d459eedbaaef45ac91f9417de8a"
  }
]);
const USER_20261127_BY_ZH=new Map(PANDA_USER_20261127_BATCH.map(e=>[voiceNorm(e.zh),e]));
export function lookupApprovedPandaVoice(text){
 const key=voiceNorm(text);if(!key)return null;
 const travel=TRAVEL_VOICE_BY_ZH.get(key);if(travel)return {src:travel.src,start:0,end:null,source:'panda-user-upload:travel-20261126'};
 const v557=XIAOXIAO_V557_BY_ZH.get(key);if(v557)return {src:v557.src,start:0,end:null,source:'panda-xiaoxiao:user-upload-v557'};
 const approvedNatural=NATURAL_V546_BY_ZH.get(key);if(approvedNatural)return {src:approvedNatural.src,start:0,end:null,source:'panda-approved-luvvoice:natural-v546'};
 const latest=NEW_XIAOXIAO_REPLIES_BY_ZH.get(key);if(latest)return {src:latest.src,start:0,end:null,source:'panda-xiaoxiao:user-upload-v520'};
 const entry=exact.get(key)||approvedCatalog.get(key);if(entry)return {src:entry.src,start:0,end:null,source:'panda-approved-luvvoice:'+(entry.batch||'hsk1-catalog-v514')};
 const contextClip=CONTEXT_BY_ZH.get(key);if(contextClip)return {src:contextClip.src,start:0,end:null,source:'panda-approved-luvvoice:context-v516'};
 const originalKey=EMBEDDED_KEYS.find(k=>voiceNorm(k)===key),src=originalKey&&globalThis.PandaGoHSK2Lesson1NativeAudioV459?.[originalKey];
 if(typeof src==='string'&&src.startsWith('data:audio/mpeg;base64,'))return {src,start:0,end:null,source:'panda-approved-luvvoice:day-v459'};
 const old=original(key);
 if(old&&OLD_ALLOWED.test(old.src))return old;
 const courseSrc=Object.hasOwn(APPROVED_HSK2,key)?APPROVED_HSK2[key]:null;
 if(courseSrc)return {src:courseSrc,start:0,end:null,source:'panda-approved-luvvoice:hsk2-20261122'};
 const supplied=USER_V563_BY_ZH.get(key);if(supplied)return {src:supplied.src,start:0,end:null,source:'panda-user-upload:batch01-v563'};
 const added=USER_20261127_BY_ZH.get(key);return added?{src:added.src,start:0,end:null,source:'panda-user-upload:20261127'}:null;
}
