export type AppPageId =
  | 'waterfall'
  | 'schedule'
  | 'player'
  | 'documentary'
  | 'aism'
  | 'liudehua'
  | 'topic'
  | 'topic-landing'
  | 'music-home'
  | 'music-player'
  | 'music-album-detail'
  | 'music-mood-station'
  | 'weather'

export type AppScene = 'epg' | 'ai-space'
export type PageDuiMode = 'none' | 'epg-dock' | 'page-dui'

export interface PageDefinition {
  id: AppPageId
  label: string
  scene: AppScene
  defaultFocusKey?: string
  epgDockReturnFocusKey?: string
  duiMode: PageDuiMode
  opensPlayerOnSelect: boolean
  componentProfile: string
  entryIntentIds: readonly string[]
}

/**
 * Single source of truth for page-level behavior.
 *
 * Add every new page here first. This keeps scene skinning, DUI behavior,
 * default focus, and intent entry points from drifting across files.
 */
export const PAGE_REGISTRY = {
  waterfall: {
    id: 'waterfall',
    label: '传统 EPG 瀑布流首页',
    scene: 'epg',
    defaultFocusKey: 'tab-0',
    epgDockReturnFocusKey: 'row2-promo',
    duiMode: 'epg-dock',
    opensPlayerOnSelect: true,
    componentProfile: 'epg-waterfall',
    entryIntentIds: ['epgHome'],
  },
  schedule: {
    id: 'schedule',
    label: 'CCTV-1 节目单页',
    scene: 'ai-space',
    defaultFocusKey: 'schedule-card-0-0',
    duiMode: 'page-dui',
    opensPlayerOnSelect: true,
    componentProfile: 'ai-schedule',
    entryIntentIds: ['schedule'],
  },
  player: {
    id: 'player',
    label: '播放器页',
    scene: 'epg',
    defaultFocusKey: 'player-action-fullscreen',
    duiMode: 'page-dui',
    opensPlayerOnSelect: false,
    componentProfile: 'epg-player',
    entryIntentIds: [],
  },
  documentary: {
    id: 'documentary',
    label: '动物纪录片筛选页',
    scene: 'ai-space',
    defaultFocusKey: 'filter-clear',
    duiMode: 'page-dui',
    opensPlayerOnSelect: true,
    componentProfile: 'ai-documentary',
    entryIntentIds: ['documentary'],
  },
  aism: {
    id: 'aism',
    label: 'AI 空间找片页',
    scene: 'ai-space',
    defaultFocusKey: 'rec-1',
    duiMode: 'page-dui',
    opensPlayerOnSelect: true,
    componentProfile: 'ai-search',
    entryIntentIds: ['aiSpaceHome', 'movieSearch'],
  },
  liudehua: {
    id: 'liudehua',
    label: '刘德华人物专题页',
    scene: 'ai-space',
    defaultFocusKey: 'film-0-0',
    duiMode: 'page-dui',
    opensPlayerOnSelect: true,
    componentProfile: 'ai-person-topic',
    entryIntentIds: ['liudehua'],
  },
  topic: {
    id: 'topic',
    label: '话题推荐页',
    scene: 'ai-space',
    defaultFocusKey: 'topic-r0c0',
    duiMode: 'page-dui',
    opensPlayerOnSelect: true,
    componentProfile: 'ai-topic',
    entryIntentIds: ['topic'],
  },
  'topic-landing': {
    id: 'topic-landing',
    label: '话题空间默认页',
    scene: 'ai-space',
    defaultFocusKey: 'topic-landing-history',
    duiMode: 'page-dui',
    opensPlayerOnSelect: true,
    componentProfile: 'ai-topic-landing',
    entryIntentIds: ['topicLanding'],
  },
  'music-home': {
    id: 'music-home',
    label: '音乐首页',
    scene: 'ai-space',
    defaultFocusKey: 'music-hero-play',
    duiMode: 'page-dui',
    opensPlayerOnSelect: true,
    componentProfile: 'ai-music',
    entryIntentIds: ['musicHome'],
  },
  'music-player': {
    id: 'music-player',
    label: '音乐播放器页',
    scene: 'ai-space',
    defaultFocusKey: 'mplayer-play',
    duiMode: 'page-dui',
    opensPlayerOnSelect: false,
    componentProfile: 'ai-music',
    entryIntentIds: [],
  },
  'music-album-detail': {
    id: 'music-album-detail',
    label: '专辑详情页',
    scene: 'ai-space',
    defaultFocusKey: 'album-play-all',
    duiMode: 'page-dui',
    opensPlayerOnSelect: false,
    componentProfile: 'ai-music',
    entryIntentIds: [],
  },
  'music-mood-station': {
    id: 'music-mood-station',
    label: '心情电台页',
    scene: 'ai-space',
    defaultFocusKey: 'station-play',
    duiMode: 'page-dui',
    opensPlayerOnSelect: false,
    componentProfile: 'ai-music',
    entryIntentIds: [],
  },
  weather: {
    id: 'weather',
    label: '天气页',
    scene: 'ai-space',
    defaultFocusKey: 'weather-hourly-0',
    duiMode: 'page-dui',
    opensPlayerOnSelect: false,
    componentProfile: 'ai-search',
    entryIntentIds: ['weather'],
  },
} as const satisfies Record<AppPageId, PageDefinition>

export function getPageDefinition(pageId: AppPageId): PageDefinition {
  return PAGE_REGISTRY[pageId]
}

export function getPageScene(pageId: AppPageId): AppScene {
  return PAGE_REGISTRY[pageId].scene
}
