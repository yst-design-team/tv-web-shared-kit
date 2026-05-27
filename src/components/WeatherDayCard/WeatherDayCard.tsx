import './WeatherDayCard.css'

export type WeatherDayCardState = 'default' | 'focus'

export interface WeatherDayCardProps {
  day: string
  icon: string
  high: string
  low: string
  state?: WeatherDayCardState
}

export function WeatherDayCard({ day, icon, high, low, state = 'default' }: WeatherDayCardProps) {
  return (
    <div className="weather-day-card" data-state={state}>
      <span className="weather-day-card__day">{day}</span>
      <span className="weather-day-card__icon">{icon}</span>
      <div className="weather-day-card__range">
        <span className="weather-day-card__high">{high}</span>
        <span className="weather-day-card__sep">/</span>
        <span className="weather-day-card__low">{low}</span>
      </div>
    </div>
  )
}
