import './WeatherHourlyItem.css'

export type WeatherHourlyItemState = 'default' | 'focus'

export interface WeatherHourlyItemProps {
  time: string
  icon: string
  temp: string
  state?: WeatherHourlyItemState
}

export function WeatherHourlyItem({ time, icon, temp, state = 'default' }: WeatherHourlyItemProps) {
  return (
    <div className="weather-hourly-item" data-state={state}>
      <span className="weather-hourly-item__time">{time}</span>
      <span className="weather-hourly-item__icon">{icon}</span>
      <span className="weather-hourly-item__temp">{temp}</span>
    </div>
  )
}
