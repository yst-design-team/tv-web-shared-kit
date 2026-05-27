import { pickImage } from '../../mocks/imagePool'

export interface WeatherHourlyData {
  id: string
  time: string
  icon: string
  temp: string
}

export interface WeatherDayData {
  id: string
  day: string
  icon: string
  high: string
  low: string
}

export interface WeatherDetailItem {
  label: string
  value: string
}

export interface WeatherDUIMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export const weatherPageCurrent = {
  city: '北京',
  date: '2026年5月26日 周二',
  time: '14:32',
  temp: '23°',
  condition: '晴',
  icon: '☀',
  feelsLike: '体感 21°',
  bgImage: pickImage('abstract-mood', 'weather-bg-beijing', [1920, 1080]),
}

export const weatherPageDetails: WeatherDetailItem[] = [
  { label: '风向', value: '东南风 3级' },
  { label: '湿度', value: '45%' },
  { label: '紫外线', value: '强' },
  { label: '能见度', value: '15 km' },
  { label: '气压', value: '1012 hPa' },
  { label: '降水概率', value: '5%' },
]

export const weatherPageHourly: WeatherHourlyData[] = [
  { id: 'h-0', time: '现在', icon: '☀', temp: '23°' },
  { id: 'h-1', time: '15:00', icon: '☀', temp: '24°' },
  { id: 'h-2', time: '16:00', icon: '⛅', temp: '24°' },
  { id: 'h-3', time: '17:00', icon: '⛅', temp: '22°' },
  { id: 'h-4', time: '18:00', icon: '⛅', temp: '20°' },
  { id: 'h-5', time: '19:00', icon: '🌥', temp: '18°' },
  { id: 'h-6', time: '20:00', icon: '🌥', temp: '17°' },
  { id: 'h-7', time: '21:00', icon: '☁', temp: '16°' },
  { id: 'h-8', time: '22:00', icon: '☁', temp: '15°' },
  { id: 'h-9', time: '23:00', icon: '☁', temp: '14°' },
  { id: 'h-10', time: '00:00', icon: '🌙', temp: '13°' },
  { id: 'h-11', time: '01:00', icon: '🌙', temp: '12°' },
]

export const weatherPageDays: WeatherDayData[] = [
  { id: 'd-0', day: '今天', icon: '☀', high: '25°', low: '13°' },
  { id: 'd-1', day: '周三', icon: '⛅', high: '22°', low: '12°' },
  { id: 'd-2', day: '周四', icon: '🌧', high: '18°', low: '11°' },
  { id: 'd-3', day: '周五', icon: '🌧', high: '16°', low: '10°' },
  { id: 'd-4', day: '周六', icon: '⛅', high: '20°', low: '11°' },
  { id: 'd-5', day: '周日', icon: '☀', high: '24°', low: '13°' },
  { id: 'd-6', day: '下周一', icon: '☀', high: '26°', low: '14°' },
]

export const weatherPageDUIMessages: WeatherDUIMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    text: '北京今天晴，最高 25°，适合外出。明后两天有雨，出行记得带伞。',
  },
]

export const weatherPageCities = ['北京', '上海', '广州', '成都', '西安']
