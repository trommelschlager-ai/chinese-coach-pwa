/* Owner-approved Street-only package. No system or cross-role fallback. */
(function(root){'use strict';
const clips=[["哈喽！聊两句？","male","01.mp3"],["哈喽！","male","02.mp3"],["嗨！","male","03.mp3"],["早啊！","male","04.mp3"],["最近怎么样？","male","05.mp3"],["还行吧。","male","06.mp3"],["挺好的！","male","07.mp3"],["你呢？","male","08.mp3"],["拜拜！","male","09.mp3"],["没事！","male","10.mp3"],["还行吧，你呢？","male","11.mp3"],["改天聊！","male","12.mp3"],["哈喽！最近怎么样？","male","13.mp3"],["那就好！","male","14.mp3"],["诗","male","15.mp3"],["十","male","16.mp3"],["始","male","17.mp3"],["是","male","18.mp3"],["最近忙啥呢？","male","19.mp3"],["怎么称呼你？","male","20.mp3"],["我有点忙。","male","21.mp3"],["你晚上有什么计划？","male","22.mp3"],["我们聊聊吧！","male","23.mp3"],["你好！","male","24.mp3"],["你今天怎么样？","male","25.mp3"],["你晚上做什么？","male","26.mp3"],["没关系，我们慢慢来。","male","27.mp3"],["你学中文吗？","male","28.mp3"],["你做什么工作？","male","29.mp3"],["你住在哪里？","male","30.mp3"],["你吃饭了吗？","male","31.mp3"],["不客气！","male","32.mp3"],["你想聊什么？","male","33.mp3"],["你早上做什么？","male","34.mp3"],["你上午做什么？","male","35.mp3"],["你中午做什么？","male","36.mp3"],["你下午做什么？","male","37.mp3"],["你回家以后做什么？","male","38.mp3"],["你叫什么呀？","male","39.mp3"],["我叫小明，你呢？","male","40.mp3"],["你哪儿人啊？","male","41.mp3"],["我从俄罗斯来的。","female","42.mp3"],["你也学中文啊？","male","43.mp3"],["对啊，刚学。","female","44.mp3"],["我也是！","male","45.mp3"],["真的假的？","female","46.mp3"],["加个微信？","male","47.mp3"],["行啊！","female","48.mp3"],["哈喽！你叫什么呀？","male","49.mp3"],["我叫安娜，你呢？","female","50.mp3"],["我叫小明。你哪儿人啊？","male","51.mp3"],["真的！加个微信？","male","52.mp3"],["你真棒！","male","53.mp3"],["你为什么想学中文？","male","54.mp3"],["你打算什么时候去？","male","55.mp3"],["凑合吧。","male","56.mp3"],["老样子。","male","57.mp3"],["先走啦！","male","58.mp3"],["回头聊！","male","59.mp3"],["叫我小明就行。","male","60.mp3"],["哪儿的呀？","male","61.mp3"],["刚来没多久。","male","62.mp3"],["我刚入门。","male","63.mp3"],["这么巧！","male","64.mp3"],["我扫你吧。","male","65.mp3"],["有空约。","male","66.mp3"],["回头联系。","female","67.mp3"],["好久不见！","male","68.mp3"],["没啥。","male","69.mp3"]];
const normalize=t=>String(t??'').normalize('NFC').replace(/[\s\p{P}]/gu,'');
const batches=/* street-audio-batches */{
  "lesson3-20261127": {
    "lesson": 3,
    "archive": "street_lesson3_27_review.zip",
    "originals": [
      {
        "file": "luvvoice.com-20261127-5UUA1M.mp3",
        "src": "./audio-source/panda-street/lesson3-20261127/luvvoice.com-20261127-5UUA1M.mp3",
        "sha256": "ff86dcd727fe7dbdf2334493ea4fd4d318e7f84c27a343f19764eb9a32ee55c9",
        "bytes": 111888,
        "seconds": 18.648
      },
      {
        "file": "luvvoice.com-20261127-mtXX0r.mp3",
        "src": "./audio-source/panda-street/lesson3-20261127/luvvoice.com-20261127-mtXX0r.mp3",
        "sha256": "8d9e12823e217ecc0c6281146ae12d7f6bad153d71ba4f2d9cf428e8a60d0b6b",
        "bytes": 118368,
        "seconds": 19.728
      },
      {
        "file": "luvvoice.com-20261127-iON8eo.mp3",
        "src": "./audio-source/panda-street/lesson3-20261127/luvvoice.com-20261127-iON8eo.mp3",
        "sha256": "cce638835d66dcc382dd3764fd2f4f0b125c080b8565cfb04e39e5872af5b1df",
        "bytes": 125856,
        "seconds": 20.976
      }
    ],
    "clips": [
      {
        "file": "01.mp3",
        "hanzi": "你去哪儿呀？",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/01.mp3",
        "sha256": "823f8c2753292003afb8f1bcdcaf205084f60b9973c596839cc8b0dc56880ba0",
        "bytes": 10412,
        "seconds": 1.296,
        "original": "luvvoice.com-20261127-5UUA1M.mp3",
        "start": 0.094333,
        "end": 1.3197079999999999,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "02.mp3",
        "hanzi": "你在干嘛呢？",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/02.mp3",
        "sha256": "038a12db1a3b349842c9880b4fb31c02e4ec579859b576554da0fe962719e034",
        "bytes": 11372,
        "seconds": 1.416,
        "original": "luvvoice.com-20261127-5UUA1M.mp3",
        "start": 1.849542,
        "end": 3.2106250000000003,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "03.mp3",
        "hanzi": "我们走吧！",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/03.mp3",
        "sha256": "7b87d017a81d89d5ea5a3c054c5c27503bba0493fe3851845d7ccb1e192a8dd5",
        "bytes": 10220,
        "seconds": 1.272,
        "original": "luvvoice.com-20261127-5UUA1M.mp3",
        "start": 3.718042,
        "end": 4.924417,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "04.mp3",
        "hanzi": "很简单嘛！",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/04.mp3",
        "sha256": "df75c341c0415ab4465e8fefbc1bc166110f3dfd86d509cb1641818166a16e6d",
        "bytes": 10796,
        "seconds": 1.344,
        "original": "luvvoice.com-20261127-5UUA1M.mp3",
        "start": 5.440708,
        "end": 6.731417,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "05.mp3",
        "hanzi": "别生气嘛！",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/05.mp3",
        "sha256": "b48216eb0bd11d774313f7214e4fb50245f6c00f51797b9aae5b5a78c893e13e",
        "bytes": 10604,
        "seconds": 1.32,
        "original": "luvvoice.com-20261127-5UUA1M.mp3",
        "start": 7.257125,
        "end": 8.521417,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "06.mp3",
        "hanzi": "哦，我知道了。",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/06.mp3",
        "sha256": "3c261deb5b7b11a90a9241489dfef5c392cf738290b71360662e22e9b4ba10f8",
        "bytes": 15596,
        "seconds": 1.944,
        "original": "luvvoice.com-20261127-5UUA1M.mp3",
        "start": 9.035499999999999,
        "end": 10.920042,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "07.mp3",
        "hanzi": "哦，原来是这样。",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/07.mp3",
        "sha256": "4c5ac93ec7ffa8d8de470a7ab2d7fa04fd469e6296a54641a94c8d225c47d9f4",
        "bytes": 16940,
        "seconds": 2.112,
        "original": "luvvoice.com-20261127-5UUA1M.mp3",
        "start": 11.436667,
        "end": 13.485458,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "08.mp3",
        "hanzi": "嗯，我知道了。",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/08.mp3",
        "sha256": "2247180a109dde7778af74432e76995c0473899367ee2eaade283255a44bd73e",
        "bytes": 15404,
        "seconds": 1.92,
        "original": "luvvoice.com-20261127-5UUA1M.mp3",
        "start": 14.023499999999999,
        "end": 15.873208,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "09.mp3",
        "hanzi": "嗯，好。",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/09.mp3",
        "sha256": "34cae26d61551441be7967ac6e526943af3de3adedc537e9998dcb3f19c73ddd",
        "bytes": 10988,
        "seconds": 1.368,
        "original": "luvvoice.com-20261127-5UUA1M.mp3",
        "start": 16.384875,
        "end": 17.694917,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "10.mp3",
        "hanzi": "那我们走吧！",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/10.mp3",
        "sha256": "5110cf0dbbceb572f9850452159fa43d870adec025d76246a7608ba517638dfc",
        "bytes": 11756,
        "seconds": 1.464,
        "original": "luvvoice.com-20261127-mtXX0r.mp3",
        "start": 0.156292,
        "end": 1.5605419999999999,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "11.mp3",
        "hanzi": "那就走呗。",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/11.mp3",
        "sha256": "5c1872258274e9aa17c3ede5dcc27c6aa0a87e1d35cae79ee178b2987ca4f381",
        "bytes": 9836,
        "seconds": 1.224,
        "original": "luvvoice.com-20261127-mtXX0r.mp3",
        "start": 2.052708,
        "end": 3.221,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "12.mp3",
        "hanzi": "不知道就问呗。",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/12.mp3",
        "sha256": "f6d6301e37719828e18b5395361f79951e6f1f2818c32240e12ec177cc45de17",
        "bytes": 13484,
        "seconds": 1.68,
        "original": "luvvoice.com-20261127-mtXX0r.mp3",
        "start": 3.7065,
        "end": 5.33275,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "13.mp3",
        "hanzi": "我回来啦！",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/13.mp3",
        "sha256": "3992fe03eceedf9b9a32214071a9c48a205751a9fc90cbdd048dbc37d71dcfe1",
        "bytes": 9836,
        "seconds": 1.224,
        "original": "luvvoice.com-20261127-mtXX0r.mp3",
        "start": 5.870458,
        "end": 7.041125,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "14.mp3",
        "hanzi": "哎，你去哪儿？",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/14.mp3",
        "sha256": "3330c01f89967bf4957045b4b8750d478c43dc4e3b30ed7d690bb857e5766937",
        "bytes": 13868,
        "seconds": 1.728,
        "original": "luvvoice.com-20261127-mtXX0r.mp3",
        "start": 7.571083,
        "end": 9.244917000000001,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "15.mp3",
        "hanzi": "哎，等一下！",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/15.mp3",
        "sha256": "e91a4bdf457033f05033c13c70f018b6acf27a4e7fe884014918fe9be1eb6bc4",
        "bytes": 12908,
        "seconds": 1.608,
        "original": "luvvoice.com-20261127-mtXX0r.mp3",
        "start": 9.746792,
        "end": 11.294125,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "16.mp3",
        "hanzi": "哈哈，太好笑了！",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/16.mp3",
        "sha256": "9c742a58d733496d2976cea4c83cd5ce675fabac3cca38add86663009cefb7b4",
        "bytes": 17324,
        "seconds": 2.16,
        "original": "luvvoice.com-20261127-mtXX0r.mp3",
        "start": 11.793292,
        "end": 13.889,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "17.mp3",
        "hanzi": "哈哈，你真有意思！",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/17.mp3",
        "sha256": "f69d9e73580d6d97338ee482febb5295280c1cd16b29ffe632bc032b5a57ccd5",
        "bytes": 19628,
        "seconds": 2.448,
        "original": "luvvoice.com-20261127-mtXX0r.mp3",
        "start": 14.420957999999999,
        "end": 16.813542,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "18.mp3",
        "hanzi": "你今天忙吗？",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/18.mp3",
        "sha256": "b80d0c4a5959540067e2ac928ec2a19e9e571fc8f5f937e6a94e7f4a2ff6c020",
        "bytes": 12332,
        "seconds": 1.536,
        "original": "luvvoice.com-20261127-mtXX0r.mp3",
        "start": 17.302500000000002,
        "end": 18.778,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "19.mp3",
        "hanzi": "不太忙，你呢？",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/19.mp3",
        "sha256": "31657ec24ce1eadc81e8085f052d23e86c09465d51867ea75e65f68d54900ed0",
        "bytes": 14828,
        "seconds": 1.848,
        "original": "luvvoice.com-20261127-iON8eo.mp3",
        "start": 0.10325000000000001,
        "end": 1.890833,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "20.mp3",
        "hanzi": "我也不忙。那我们走吧！",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/20.mp3",
        "sha256": "bb31c6efb7677450e84c381adfa32ffa4177c7baad2d1ffc23f26ca44525dc82",
        "bytes": 22412,
        "seconds": 3.144,
        "original": "luvvoice.com-20261127-iON8eo.mp3",
        "start": 2.402333,
        "end": 5.488667,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "21.mp3",
        "hanzi": "好呀！",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/21.mp3",
        "sha256": "d4accae5fea098cb55d7e4171a4408e2cd3e4ac376e5d4cfd73bc2c3ab4522c9",
        "bytes": 6956,
        "seconds": 0.864,
        "original": "luvvoice.com-20261127-iON8eo.mp3",
        "start": 6.016333,
        "end": 6.808542,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "22.mp3",
        "hanzi": "这个怎么用啊？",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/22.mp3",
        "sha256": "e92aae392a8fd8e3b7e1ecff5ae4aebff173b55ebf3c4a4274ad0a8210aedec9",
        "bytes": 11180,
        "seconds": 1.392,
        "original": "luvvoice.com-20261127-iON8eo.mp3",
        "start": 7.321542,
        "end": 8.656542,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "23.mp3",
        "hanzi": "很简单嘛，我教你。",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/23.mp3",
        "sha256": "9144c247a52a9bb048a995a6687269fd666689c87f83255310bee7664fd59761",
        "bytes": 19244,
        "seconds": 2.4,
        "original": "luvvoice.com-20261127-iON8eo.mp3",
        "start": 9.188708,
        "end": 11.532417,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "24.mp3",
        "hanzi": "哎，你去哪儿呀？",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/24.mp3",
        "sha256": "491e673582823f8614bca54fc554276d0803ef50457975faa575cb4d772122a6",
        "bytes": 14636,
        "seconds": 1.824,
        "original": "luvvoice.com-20261127-iON8eo.mp3",
        "start": 12.075292,
        "end": 13.849458,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "25.mp3",
        "hanzi": "我要回家啦！",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/25.mp3",
        "sha256": "4d3f85a4f4fbc677b66ae8d279247a7a97a61e739689d5f45c845cc6392b9b7c",
        "bytes": 11180,
        "seconds": 1.392,
        "original": "luvvoice.com-20261127-iON8eo.mp3",
        "start": 14.376999999999999,
        "end": 15.705625,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "26.mp3",
        "hanzi": "那就明天见呗。",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/26.mp3",
        "sha256": "1c7fb2065bbf82d4e380911495c2c0919148ddb13aaf1a83e5d335b654a9e807",
        "bytes": 13868,
        "seconds": 1.728,
        "original": "luvvoice.com-20261127-iON8eo.mp3",
        "start": 16.213333000000002,
        "end": 17.874625,
        "sourceReview": "provisional; text and tones not verified"
      },
      {
        "file": "27.mp3",
        "hanzi": "哈哈，好呀！",
        "role": "male",
        "src": "./assets/panda-street-audio/lesson3-20261127/27.mp3",
        "sha256": "3d84bc8c7fc367a222d0a2a756c598ba9161860d799e820c3c4eb6d50659f4f9",
        "bytes": 13292,
        "seconds": 1.656,
        "original": "luvvoice.com-20261127-iON8eo.mp3",
        "start": 18.4175,
        "end": 20.0095,
        "sourceReview": "provisional; text and tones not verified"
      }
    ]
  }
}/* end street-audio-batches */;
const map=new Map(clips.map(([hanzi,role,file])=>[role+':'+normalize(hanzi),Object.freeze({hanzi,role,src:'./assets/panda-street-voice-v20261125/'+file})]));
for(const batch of Object.values(batches)){
 for(const clip of batch.clips){
  const key=clip.role+':'+normalize(clip.hanzi);
  if(!map.has(key))map.set(key,Object.freeze(clip));
 }
}
root.PandaStreetVoiceV20261125=Object.freeze({lookup:(text,role='male')=>map.get(role+':'+normalize(text))||null,byText:text=>map.get('male:'+normalize(text))||map.get('female:'+normalize(text))||null});
})(globalThis);
