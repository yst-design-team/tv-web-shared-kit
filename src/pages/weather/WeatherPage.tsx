import { useEffect, useState } from 'react'
import { Focusable, FocusSection, setFocus } from '../../focus'
import { WeatherHourlyItem } from '../../components/WeatherHourlyItem'
import { WeatherDayCard } from '../../components/WeatherDayCard'
import {
  weatherPageCurrent,
  weatherPageDetails,
  weatherPageHourly,
  weatherPageDays,
  weatherPageDUIMessages,
  weatherPageCities,
} from './mockData'
import './WeatherPage.css'

const PAGE_ID = 'weather'

export function WeatherPage() {
  const [hourlyOffset, setHourlyOffset] = useState(0)
  const [dayOffset, setDayOffset] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState(weatherPageDUIMessages)

  useEffect(() => {
    setFocus(`${PAGE_ID}-hourly-0`)
  }, [])

  const HOURLY_ITEM_W = 96 + 12 // width + gap
  const HOURLY_VIEWPORT = 900
  const HOURLY_MAX_OFFSET = Math.max(0, weatherPageHourly.length * HOURLY_ITEM_W - HOURLY_VIEWPORT)

  const DAY_ITEM_W = 120 + 12
  const DAY_VIEWPORT = 900
  const DAY_MAX_OFFSET = Math.max(0, weatherPageDays.length * DAY_ITEM_W - DAY_VIEWPORT)

  function handleHourlyFocus(idx: number) {
    const target = idx * HOURLY_ITEM_W - HOURLY_VIEWPORT / 2 + HOURLY_ITEM_W / 2
    setHourlyOffset(Math.min(Math.max(0, target), HOURLY_MAX_OFFSET))
  }

  function handleDayFocus(idx: number) {
    const target = idx * DAY_ITEM_W - DAY_VIEWPORT / 2 + DAY_ITEM_W / 2
    setDayOffset(Math.min(Math.max(0, target), DAY_MAX_OFFSET))
  }

  function handleSend() {
    if (!inputValue.trim()) return
    setMessages(prev => [
      ...prev,
      { id: `msg-u-${Date.now()}`, role: 'user', text: inputValue.trim() },
      { id: `msg-a-${Date.now()}`, role: 'assistant', text: '好的，已为你查询相关天气信息，请稍候。' },
    ])
    setInputValue('')
  }

  return (
    <div className="weather-page" data-page={PAGE_ID} data-scene="ai-space">
      {/* background overlay */}
      <div className="weather-page__bg" style={{ backgroundImage: `url(${weatherPageCurrent.bgImage})` }} />
      <div className="weather-page__scrim" />

      <div className="weather-page__layout">
        {/* ── Left panel ── */}
        <div className="weather-page__left">
          {/* City tabs */}
          <FocusSection focusKey={`${PAGE_ID}-cities`}>
            <div className="weather-page__city-tabs">
              {weatherPageCities.map((city, idx) => (
                <Focusable key={city} focusKey={`${PAGE_ID}-city-${idx}`}>
                  {({ focused }: { focused: boolean }) => (
                    <button
                      className="weather-page__city-tab"
                      data-state={idx === 0 ? 'selected' : focused ? 'focus' : 'default'}
                    >
                      {city}
                    </button>
                  )}
                </Focusable>
              ))}
            </div>
          </FocusSection>

          {/* Current weather hero */}
          <div className="weather-page__hero">
            <div className="weather-page__hero-left">
              <div className="weather-page__temp">{weatherPageCurrent.temp}</div>
              <div className="weather-page__condition">
                <span className="weather-page__condition-icon">{weatherPageCurrent.icon}</span>
                <span className="weather-page__condition-label">{weatherPageCurrent.condition}</span>
              </div>
              <div className="weather-page__feels-like">{weatherPageCurrent.feelsLike}</div>
            </div>
            <div className="weather-page__hero-right">
              <div className="weather-page__city-name">{weatherPageCurrent.city}</div>
              <div className="weather-page__date">{weatherPageCurrent.date}</div>
              <div className="weather-page__time">{weatherPageCurrent.time}</div>
            </div>
          </div>

          {/* Weather details */}
          <div className="weather-page__details">
            {weatherPageDetails.map(item => (
              <div key={item.label} className="weather-page__detail-item">
                <span className="weather-page__detail-label">{item.label}</span>
                <span className="weather-page__detail-value">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Hourly forecast rail */}
          <div className="weather-page__section-title">逐小时预报</div>
          <div className="weather-page__rail-viewport">
            <FocusSection focusKey={`${PAGE_ID}-hourly-section`}>
              <div
                className="weather-page__rail"
                style={{ transform: `translateX(-${hourlyOffset}px)` }}
              >
                {weatherPageHourly.map((item, idx) => (
                  <Focusable
                    key={item.id}
                    focusKey={`${PAGE_ID}-hourly-${idx}`}
                    onFocus={() => handleHourlyFocus(idx)}
                  >
                    {({ focused }: { focused: boolean }) => (
                      <WeatherHourlyItem
                        time={item.time}
                        icon={item.icon}
                        temp={item.temp}
                        state={focused ? 'focus' : 'default'}
                      />
                    )}
                  </Focusable>
                ))}
              </div>
            </FocusSection>
          </div>

          {/* 7-day forecast */}
          <div className="weather-page__section-title">未来 7 天</div>
          <div className="weather-page__rail-viewport">
            <FocusSection focusKey={`${PAGE_ID}-days-section`}>
              <div
                className="weather-page__rail"
                style={{ transform: `translateX(-${dayOffset}px)` }}
              >
                {weatherPageDays.map((item, idx) => (
                  <Focusable
                    key={item.id}
                    focusKey={`${PAGE_ID}-day-${idx}`}
                    onFocus={() => handleDayFocus(idx)}
                  >
                    {({ focused }: { focused: boolean }) => (
                      <WeatherDayCard
                        day={item.day}
                        icon={item.icon}
                        high={item.high}
                        low={item.low}
                        state={focused ? 'focus' : 'default'}
                      />
                    )}
                  </Focusable>
                ))}
              </div>
            </FocusSection>
          </div>
        </div>

        {/* ── Right DUI panel ── */}
        <div className="weather-page__dui">
          <div className="weather-page__dui-messages">
            {messages.map(msg => (
              <div
                key={msg.id}
                className="weather-page__dui-bubble"
                data-role={msg.role}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="weather-page__dui-input-row">
            <Focusable focusKey={`${PAGE_ID}-dui-input`}>
              {({ focused }: { focused: boolean }) => (
                <div className="weather-page__dui-input-wrap" data-state={focused ? 'focus' : 'default'}>
                  <input
                    className="weather-page__dui-input"
                    placeholder="问问天气助手…"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        e.stopPropagation()
                        handleSend()
                      }
                      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                        e.stopPropagation()
                      }
                    }}
                  />
                  <Focusable focusKey={`${PAGE_ID}-dui-send`}>
                    {({ focused: btnFocused }: { focused: boolean }) => (
                      <button
                        className="weather-page__dui-send"
                        data-state={btnFocused ? 'focus' : 'default'}
                        onClick={handleSend}
                      >
                        发送
                      </button>
                    )}
                  </Focusable>
                </div>
              )}
            </Focusable>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeatherPage
