export type ChatIntentPage =
  | 'waterfall'
  | 'aism'
  | 'documentary'
  | 'liudehua'
  | 'music-home'
  | 'schedule'
  | 'topic'
  | 'topic-landing'

interface ChatIntentDefinition {
  id: string
  label: string
  page: ChatIntentPage
  pageLabel: string
  examples: readonly string[]
  patterns: readonly RegExp[]
  reply: string
}

// Keep narrow, explicit intents ahead of the general find-a-title branch.
export const CHAT_INTENTS = [
  {
    id: 'liudehua',
    label: '人物介绍',
    page: 'liudehua',
    pageLabel: '刘德华人物专题页',
    examples: ['给我介绍刘德华', '打开人物专题', '华仔是谁'],
    patterns: [
      /刘德华|andy\s*lau|华仔|介绍.*(刘德华|华仔|andy)|(刘德华|华仔|andy).*(介绍|是谁|生平|资料)|人物专题/i,
    ],
    reply:
      '刘德华（Andy Lau），1961 年 9 月 27 日生于香港，籍贯广东江门，是华语影坛与乐坛具有标志性人物，集演员、歌手、制片人及公益人等多重身份。',
  },
  {
    id: 'topicLanding',
    label: '话题空间默认页',
    page: 'topic-landing',
    pageLabel: '话题空间默认页',
    examples: ['打开话题空间默认页', '展示完整话题页', '话题页首页'],
    patterns: [
      /(话题空间|话题页).*(默认|首页|全量|完整|展示形式)|打开.*(话题空间|话题页).*(默认|首页|全量|完整)|全量.*(话题空间|话题页)/i,
    ],
    reply:
      '已经为您打开话题空间默认页，继续为您汇总观看历史、热门视频、片单与新闻脉络。',
  },
  {
    id: 'musicHome',
    label: '音乐首页',
    page: 'music-home',
    pageLabel: '我的音乐页',
    examples: ['打开音乐首页', '我要听歌', '推荐歌单'],
    patterns: [
      /音乐首页|打开.*音乐|进入.*音乐|tv\s*音乐|听歌|我要听|播放.*(音乐|歌曲|歌单)|推荐.*(音乐|歌曲|歌单)|歌手电台|家庭\s*k\s*歌|k歌/i,
    ],
    reply:
      '已经为您打开 TV 音乐首页，可以浏览每日推荐、歌手电台、家庭 K 歌和客厅热播榜。',
  },
  {
    id: 'schedule',
    label: '节目单',
    page: 'schedule',
    pageLabel: 'CCTV-1 节目单页',
    examples: ['今晚 CCTV 有什么节目', '打开节目单', '央视直播表'],
    patterns: [
      /节目单|直播表|播出表|今晚.*节目|今天.*节目|时间表|时刻表|央视|cctv|频道节目|节目时间/i,
    ],
    reply: '已经为您打开节目单。',
  },
  {
    id: 'documentary',
    label: '动物纪录片找片',
    page: 'documentary',
    pageLabel: '动物纪录片筛选页',
    examples: ['找动物纪录片', '动物世界', '推荐纪录片'],
    patterns: [
      /找.*纪录片|搜.*纪录片|推荐.*纪录片|纪录片|动物世界|动物纪录|野生动物|海洋世界|雨林秘境|鸟类迁徙|生命微观/i,
    ],
    reply: '已经为您打开动物纪录片筛选页。',
  },
  {
    id: 'movieSearch',
    label: '影视找片',
    page: 'aism',
    pageLabel: 'AI 空间找片页',
    examples: ['我想看龙之家族', '帮我找电影', 'AI 空间首页'],
    patterns: [
      /龙之家族|house\s*of\s*the\s*dragon|权力的游戏|game\s*of\s*thrones|我想看.*龙族|我要看.*龙族/i,
      /(ai\s*空间|ai空间).*(首页|主页|找片|电影)|打开.*(ai\s*空间|ai空间)/i,
      /找片|找电影|找剧|搜索.*(片|电影|剧)|帮我找.*(片|电影|剧)|推荐.*(片|电影|剧)|有什么.*(片|电影|剧)/i,
      /我想看|我要看/i,
    ],
    reply: '已经为您打开 AI 空间找片页，先为您展示《龙之家族》相关内容。',
  },
  {
    id: 'topic',
    label: '话题推荐',
    page: 'topic',
    pageLabel: '话题推荐页',
    examples: ['打开话题页', '进入专题空间', 'topic page'],
    patterns: [/打开.*(话题|专题)(页|空间)?|话题(页|空间)|专题(页|空间)|topic\s*page/i],
    reply:
      '为您推荐近期热门内容：《知否知否应是绿肥红瘦》、《狙击蝴蝶》、何润东《灵鹿奇缘》等热门剧集与综艺。',
  },
  {
    id: 'epgHome',
    label: 'EPG 首页',
    page: 'waterfall',
    pageLabel: '传统 EPG 瀑布流首页',
    examples: ['回到首页', '打开 EPG 首页', '传统首页'],
    patterns: [
      /^(打开|回到|返回).*(首页|主页)$/i,
      /(epg|传统|电视|瀑布流).*(首页|主页)|打开.*(epg|传统epg|瀑布流)/i,
    ],
    reply: '已经为您回到 EPG 首页。',
  },
] as const satisfies readonly ChatIntentDefinition[]

export type ChatIntentId = (typeof CHAT_INTENTS)[number]['id']
export type ChatIntent = ChatIntentId | null

const FALLBACK_REPLY =
  '我可以帮您找片、打开节目单、听音乐，或介绍人物。试试说「我想看龙之家族」「找动物纪录片」「打开话题页」或「给我介绍刘德华」。'

export function classifyChatIntent(text: string): ChatIntent {
  return (
    CHAT_INTENTS.find(intent =>
      intent.patterns.some(pattern => pattern.test(text)),
    )?.id ?? null
  )
}

export function pageForChatIntent(intentId: ChatIntentId): ChatIntentPage {
  return getChatIntent(intentId).page
}

export function replyForChatIntent(intentId: ChatIntent): string {
  return intentId ? getChatIntent(intentId).reply : FALLBACK_REPLY
}

function getChatIntent(intentId: ChatIntentId) {
  const definition = CHAT_INTENTS.find(intent => intent.id === intentId)
  if (!definition) throw new Error(`Unknown chat intent: ${intentId}`)
  return definition
}
