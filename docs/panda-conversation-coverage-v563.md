# Panda AI v563 — independent question audit

This measures only the natural-statement module, not the entire browser dispatcher. Unmatched questions may have another route and are candidates for browser QA, not proven failures. Matrix checks routing/metadata, not acoustic tones or complete semantic quality.

- 288 routine combinations returned question + translation + pinyin + reply in JS.
- First meeting vs already introduced: both passed in JS.
- Independent topic sample:

- Знакомство: 7/10. Unmatched: 你住在哪儿、你会说中文吗、你会说俄语吗
- Семья: 4/8. Unmatched: 你爸爸做什么工作、你妈妈多大了、你结婚了吗、你有朋友吗
- Работа: 5/8. Unmatched: 你每天几点上班、你今天忙不忙、你什么时候下班
- Еда: 2/8. Unmatched: 你想吃什么、你喜欢喝咖啡吗、你吃早饭了吗、你饿了吗、你会做饭吗、你喜欢中国菜吗
- День и время: 3/8. Unmatched: 你昨天做了什么、你今天做了什么、你周末做什么、你现在在做什么、你什么时候有空
- Хобби: 2/8. Unmatched: 你喜欢看书吗、你喜欢听什么音乐、你喜欢跑步吗、你喜欢看电影吗、你会游泳吗、你周末喜欢做什么
- Погода: 2/6. Unmatched: 你那里冷吗、今天下雨吗、你喜欢冬天吗、你觉得今天热吗
- Покупки: 1/6. Unmatched: 这个多少钱、可以便宜一点吗、你想买什么、有别的颜色吗、你喜欢什么颜色
- Поездки: 1/6. Unmatched: 你想去哪儿、你怎么去上班、你喜欢旅行吗、你什么时候去北京、你坐飞机吗
- Здоровье: 0/6. Unmatched: 你身体好吗、你怎么了、你生病了吗、你累不累、你今天感觉怎么样、你需要休息吗

Next: run the unmatched corpus through the live browser dispatcher, check reply semantics and exact MP3 playback, and expand reviewed intents. The established affection reply has no confirmed exact audio yet.
