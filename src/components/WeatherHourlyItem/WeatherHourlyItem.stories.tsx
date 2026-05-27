import type { Meta, StoryObj } from '@storybook/react'
import { WeatherHourlyItem } from './WeatherHourlyItem'

const meta: Meta<typeof WeatherHourlyItem> = {
  title: 'Components/WeatherHourlyItem',
  component: WeatherHourlyItem,
  parameters: { backgrounds: { default: 'dark' } },
}
export default meta

type Story = StoryObj<typeof WeatherHourlyItem>

export const Default: Story = {
  args: { time: '14:00', icon: '☀', temp: '23°', state: 'default' },
}

export const Focused: Story = {
  args: { time: '14:00', icon: '☀', temp: '23°', state: 'focus' },
}

export const Rainy: Story = {
  args: { time: '18:00', icon: '🌧', temp: '19°', state: 'default' },
}

export const Cloudy: Story = {
  args: { time: '20:00', icon: '⛅', temp: '17°', state: 'default' },
}
