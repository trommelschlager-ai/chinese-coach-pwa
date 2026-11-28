// PANDA LIFE: isolated, curated, deterministic practice; no live AI or tone scoring.
const SCENARIOS=[
  {
    "id": "introduction",
    "lesson": 1,
    "title": "Знакомство",
    "role": "Собеседник",
    "source": "hsk2-about-me.html",
    "turns": [
      {
        "prompt": {
          "zh": "你来自哪里？",
          "py": "Nǐ láizì nǎlǐ?",
          "ru": "Откуда ты родом?",
          "audio": "./assets/hsk2-about-me/voice-luvvoice-20261120/about13.mp3"
        },
        "answers": [
          {
            "zh": "我来自俄罗斯。",
            "py": "Wǒ láizì Éluósī.",
            "ru": "Я родом из России.",
            "audio": "./assets/hsk2-about-me/voice-luvvoice-20261120/about08.mp3"
          },
          {
            "zh": "我来自中国。",
            "py": "Wǒ láizì Zhōngguó.",
            "ru": "Я родом из Китая.",
            "audio": "./assets/hsk2-about-me/voice-luvvoice-20261120/about14.mp3"
          }
        ]
      },
      {
        "prompt": {
          "zh": "你现在住在哪里？",
          "py": "Nǐ xiànzài zhù zài nǎlǐ?",
          "ru": "Где ты сейчас живёшь?",
          "audio": "./assets/hsk2-about-me/voice-luvvoice-20261120/about15.mp3"
        },
        "answers": [
          {
            "zh": "我现在住在莫斯科。",
            "py": "Wǒ xiànzài zhù zài Mòsīkē.",
            "ru": "Сейчас я живу в Москве.",
            "audio": "./assets/hsk2-about-me/voice-luvvoice-20261120/about09.mp3"
          },
          {
            "zh": "我现在住在北京。",
            "py": "Wǒ xiànzài zhù zài Běijīng.",
            "ru": "Сейчас я живу в Пекине.",
            "audio": "./assets/hsk2-about-me/voice-luvvoice-20261120/about16.mp3"
          }
        ]
      },
      {
        "prompt": {
          "zh": "你的爱好是什么？",
          "py": "Nǐ de àihào shì shénme?",
          "ru": "Какое у тебя хобби?",
          "audio": "./assets/hsk2-about-me/voice-luvvoice-20261120/about17.mp3"
        },
        "answers": [
          {
            "zh": "我的爱好是听音乐。",
            "py": "Wǒ de àihào shì tīng yīnyuè.",
            "ru": "Моё хобби — слушать музыку.",
            "audio": "./assets/hsk2-about-me/voice-luvvoice-20261120/about11.mp3"
          },
          {
            "zh": "我的爱好是运动。",
            "py": "Wǒ de àihào shì yùndòng.",
            "ru": "Моё хобби — спорт.",
            "audio": "./assets/hsk2-about-me/voice-luvvoice-20261120/about18.mp3"
          }
        ]
      }
    ]
  },
  {
    "id": "shopping",
    "lesson": 8,
    "title": "В магазине",
    "role": "Продавец",
    "source": "hsk2-lesson8-shop-preview.html",
    "turns": [
      {
        "prompt": {
          "zh": "你想买什么？",
          "py": "Nǐ xiǎng mǎi shénme?",
          "ru": "Что ты хочешь купить?",
          "audio": "./assets/hsk2-lesson8-voice/l8_17.mp3"
        },
        "answers": [
          {
            "zh": "我想买一件衣服。",
            "py": "Wǒ xiǎng mǎi yí jiàn yīfu.",
            "ru": "Хочу купить одну вещь из одежды.",
            "audio": "./assets/hsk2-lesson8-voice/l8_16.mp3"
          },
          {
            "zh": "我想看看。",
            "py": "Wǒ xiǎng kànkan.",
            "ru": "Хочу посмотреть.",
            "audio": "./assets/hsk2-lesson8-voice/l8_18.mp3"
          },
          {
            "zh": "我想买一件红色的衣服。",
            "py": "Wǒ xiǎng mǎi yí jiàn hóngsè de yīfu.",
            "ru": "Хочу купить красную вещь.",
            "audio": "./assets/hsk2-lesson8-voice/l8_19.mp3"
          }
        ]
      },
      {
        "prompt": {
          "zh": "你喜欢什么颜色？",
          "py": "Nǐ xǐhuan shénme yánsè?",
          "ru": "Какой цвет тебе нравится?",
          "audio": "./assets/hsk2-lesson8-voice/l8_20.mp3"
        },
        "answers": [
          {
            "zh": "我喜欢红色。",
            "py": "Wǒ xǐhuan hóngsè.",
            "ru": "Мне нравится красный.",
            "audio": "./assets/hsk2-lesson8-voice/l8_21.mp3"
          },
          {
            "zh": "我喜欢蓝色。",
            "py": "Wǒ xǐhuan lánsè.",
            "ru": "Мне нравится синий.",
            "audio": "./assets/hsk2-lesson8-voice/l8_22.mp3"
          },
          {
            "zh": "我喜欢这个颜色。",
            "py": "Wǒ xǐhuan zhège yánsè.",
            "ru": "Мне нравится этот цвет.",
            "audio": "./assets/hsk2-lesson8-voice/l8_14.mp3"
          }
        ]
      },
      {
        "prompt": {
          "zh": "这件衣服怎么样？",
          "py": "Zhè jiàn yīfu zěnmeyàng?",
          "ru": "Как тебе эта вещь?",
          "audio": "./assets/hsk2-lesson8-voice/l8_23.mp3"
        },
        "answers": [
          {
            "zh": "很好看！",
            "py": "Hěn hǎokàn!",
            "ru": "Очень красивая!",
            "audio": "./assets/hsk2-lesson8-voice/l8_24.mp3"
          },
          {
            "zh": "这个太贵了。",
            "py": "Zhège tài guì le.",
            "ru": "Это слишком дорого.",
            "audio": "./assets/hsk2-lesson8-voice/l8_13.mp3"
          },
          {
            "zh": "我可以试穿吗？",
            "py": "Wǒ kěyǐ shìchuān ma?",
            "ru": "Можно примерить?",
            "audio": "./assets/hsk2-lesson8-voice/l8_15.mp3"
          }
        ]
      }
    ]
  }
];
function normalizeLife(s){return String(s??"").normalize("NFC").replace(/[\p{P}\s]/gu,"");}

function getLife(id){const s=SCENARIOS.find(x=>x.id===id);if(!s)throw new RangeError("Unknown scenario");return s;}

function availableLife(completedLessons){if(!Array.isArray(completedLessons))throw new TypeError("Completed lesson IDs required");return SCENARIOS.filter(s=>completedLessons.includes(s.lesson)).map(s=>({id:s.id,title:s.title,lesson:s.lesson,turns:s.turns.length}));}

function startLife(id,completedLessons){if(!availableLife(completedLessons).some(s=>s.id===id))throw new Error("LESSON_LOCKED");return {id,index:0,results:[],done:false};}

function lifeTurn(state){const s=getLife(state.id);if(!Number.isInteger(state.index)||state.index<0||state.index>s.turns.length)throw new Error("Invalid index");return s.turns[state.index]??null;}

function submitLife(state,{text,method}={}){const turn=lifeTurn(state);if(!turn||state.done)throw new Error("SCENARIO_COMPLETE");if(!["choice","typed","recognition"].includes(method))throw new TypeError("Invalid input method");if(typeof text!=="string"||!normalizeLife(text)||[...text].length>160)throw new Error("EMPTY_OR_INVALID_ANSWER");const match=turn.answers.find(a=>normalizeLife(a.zh)===normalizeLife(text));if(!match)return {state,status:"unassessed",message:"Ответ не совпал с учебными вариантами. Это не означает ошибку. Попробуй пример или повтори запись.",toneAssessment:null};const results=[...state.results,{index:state.index,answer:match.zh,method,assessed:"text-match",toneAssessment:null}];const index=state.index+1;return {state:{id:state.id,index,results,done:index===getLife(state.id).turns.length},status:"accepted",toneAssessment:null};}
export {availableLife,startLife,lifeTurn,submitLife};
