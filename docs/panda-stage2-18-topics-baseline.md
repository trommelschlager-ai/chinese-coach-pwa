# Stage 2 coverage baseline — 18 planned topics

54 selected inputs, three per topic. Direct source-level probe; no audio or full UI coverage asserted. The natural module is only one of the established routes. Human review must check reply appropriateness, not just non-null. Do not train on every future evaluation example.

- input: 54
- oldNatural: 28
- semantic: 15
- newReply: 13
- reviewedMetadata: 5
- neither: 16

## Priority

- Приветствия: 你好
- Приветствия: 你今天好吗？
- Настроение и эмоции: 我今天很开心。
- Хобби: 我对音乐感兴趣。
- Погода: 明天会下雨吗？
- Погода: 虽然今天很冷，但是我想出去。
- Покупки: 你觉得这个菜贵吗？
- Покупки: 我想买一件衣服。
- Путешествия: 我打算去北京。
- Транспорт: 我从北京到上海。
- Дружба: 我想认识新朋友。
- Дружба: 我和朋友一起吃饭。
- Отношения: 我喜欢和你聊天。
- Отношения: 我想和你一起学中文。
- Прошедшие события: 我去过中国。
- Мнения и предпочтения: 你想喝茶还是咖啡？

Start by adding grammar for 对…感兴趣, 还是/或者, 过 and 从…到… as compositional rules; retain past/future and subject distinctions. No added deployment or live integration.
