# Intent Routing

`src/chat/intents.ts` is the source of truth for text intent matching, reply copy,
and the page opened by `App`.

## Available DUI text intents

| Intent | Page | Example utterances | Notes |
| --- | --- | --- | --- |
| `movieSearch` | `AISpaceMovie` / `aism` | `我想看龙之家族`, `帮我找电影`, `AI 空间首页` | General title search and AI movie search. |
| `documentary` | `DocumentaryAI` / `documentary` | `找动物纪录片`, `动物世界`, `推荐纪录片` | Kept specific to the animal documentary filter page. |
| `schedule` | `ProgramSchedule` / `schedule` | `今晚 CCTV 有什么节目`, `打开节目单` | Channel schedule and broadcast timing queries. |
| `liudehua` | `LiuDehua` / `liudehua` | `给我介绍刘德华`, `人物专题` | Person introduction queries land on the person topic page. |
| `topic` | `Topic` / `topic` | `打开话题页`, `进入专题空间` | Opens the topic recommendation screen. |
| `topicLanding` | `TopicLanding` / `topic-landing` | `打开话题空间默认页`, `话题页首页` | Opens the full topic landing layout. |
| `musicHome` | `MusicHome` / `music-home` | `打开音乐首页`, `我要听歌` | Opens the music home screen. |
| `epgHome` | `WaterfallHome` / `waterfall` | `回到首页`, `打开 EPG 首页` | Returns to the traditional EPG waterfall home. |

## Routing rules

- Matching is ordered from narrow to broad so person, topic, schedule, and
  documentary phrases are not swallowed by generic find-a-title language.
- `我想看龙之家族` now resolves to `movieSearch` and opens `AISpaceMovie`.
  It must not resolve to the animal documentary filter page.
- Selecting media cards with click or Enter still opens `PlayerDemo`; that flow
  is interaction-driven and is not a DUI text intent.
