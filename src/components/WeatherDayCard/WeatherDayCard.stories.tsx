import type { Meta, StoryObj } from '@storybook/react'
import { WeatherDayCard } from './WeatherDayCard'

const meta: Meta<typeof WeatherDayCard> = {
  title: 'Components/WeatherDayCard',
  component: WeatherDayCard,
  parameters: { backgrounds: { default: 'dark' } },
}
export default meta

type Story = StoryObj<typeof WeatherDayCard>

export const Default: Story = {
  args: { day: '周二', icon: '☀', high: '25°', low: '14°', state: 'default' },
}

export const Focused: Story = {
  args: { day: '周二', icon: '☀', high: '25°', low: '14°', state: 'focus' },
}

export const Rainy: Story = {
  args: { day: '周四', icon: '🌧', high: '18°', low: '12°', state: 'default' },
}

// disabled 不适用：天气卡片无禁用态（只读展示）
// selected 不适用：天气卡片无选中态
