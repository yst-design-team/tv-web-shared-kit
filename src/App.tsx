import { useEffect, useState } from 'react'
import './App.css'
import { ChatProvider, pageForChatIntent, type ChatIntentPage } from './chat'
import { EpgDuiDock } from './components/EpgDuiDock'
import { Stage } from './components/Stage'
import { AISpaceMovie } from './pages/AISpaceMovie'
import { DocumentaryAI } from './pages/DocumentaryAI'
import { LiuDehua } from './pages/LiuDehua'
import { MusicAlbumDetail } from './pages/MusicAlbumDetail'
import { MusicHome } from './pages/MusicHome'
import { MusicMoodStation } from './pages/MusicMoodStation'
import { MusicPlayer } from './pages/MusicPlayer'
import { PlayerDemo } from './pages/PlayerDemo'
import { ProgramSchedule } from './pages/ProgramSchedule'
import { Topic } from './pages/Topic'
import { TopicLanding } from './pages/TopicLanding'
import { WaterfallHome } from './pages/WaterfallHome'
import { WeatherPage } from './pages/weather'
import { initFocusEngine } from './focus'

type Page =
  | ChatIntentPage
  | 'player'
  | 'music-player'
  | 'music-album-detail'
  | 'music-mood-station'
  | 'weather'

function App() {
  const [page, setPage] = useState<Page>('waterfall')
  const [previousPage, setPreviousPage] = useState<Page>('waterfall')
  const [selectedAlbumKey, setSelectedAlbumKey] = useState<string>('mplayer-track-0')
  const [selectedMoodKey, setSelectedMoodKey] = useState<string>('music-mood-0')
  const isEpgPage = page === 'waterfall'
  const epgReturnFocusKey = page === 'waterfall' ? 'row2-promo' : null

  useEffect(() => {
    initFocusEngine()
  }, [])

  useEffect(() => {
    const openPlayer = () => {
      setPreviousPage(current => (page === 'player' ? current : page))
      setPage('player')
    }

    const videoCardSelector = '.mc, .cpo, .rsc, .poster-card, .banner-card, .promo-card, .watch-history-card__poster'
    const isVideoCard = (target: Element | null) =>
      !!target && (target.closest(videoCardSelector) || target.querySelector(videoCardSelector))

    const getFocusedVideoCard = () => {
      const focusedNodes = document.querySelectorAll('[data-focused]')
      return Array.from(focusedNodes).find(node => isVideoCard(node))
    }

    const onClick = (event: MouseEvent) => {
      if (!isVideoCard(event.target as Element | null)) return
      openPlayer()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return
      if (!getFocusedVideoCard()) return
      event.preventDefault()
      openPlayer()
    }

    window.addEventListener('click', onClick)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [page])

  const returnFromPlayer = () => setPage(previousPage)

  return (
    <ChatProvider
      onIntent={intent => setPage(pageForChatIntent(intent))}
    >
      <Stage background="#0f1115">
        {page === 'waterfall' && <WaterfallHome />}
        {page === 'schedule' && <ProgramSchedule />}
        {page === 'player' && <PlayerDemo onBack={returnFromPlayer} />}
        {page === 'documentary' && <DocumentaryAI />}
        {page === 'aism' && (
          <AISpaceMovie
            onPromptPress={key => {
              if (key === 'prompt-1') setPage('liudehua')
              if (key === 'prompt-2') setPage('topic')
            }}
          />
        )}
        {page === 'liudehua' && (
          <LiuDehua
            onBack={() => setPage('aism')}
            onPromptPress={key => {
              if (key === 'prompt-1') setPage('aism')
              if (key === 'prompt-2') setPage('topic')
            }}
          />
        )}
        {page === 'topic' && <Topic onBack={() => setPage('aism')} />}
        {page === 'topic-landing' && <TopicLanding onBack={() => setPage('aism')} />}
        {page === 'music-home' && (
          <MusicHome
            onPlay={() => setPage('music-player')}
            onOpenStation={key => { setSelectedMoodKey(key); setPage('music-mood-station') }}
          />
        )}
        {page === 'music-player' && (
          <MusicPlayer
            onBack={() => setPage('music-home')}
            onSelectAlbum={key => { setSelectedAlbumKey(key); setPage('music-album-detail') }}
          />
        )}
        {page === 'music-album-detail' && (
          <MusicAlbumDetail
            albumKey={selectedAlbumKey}
            onBack={() => setPage('music-player')}
          />
        )}
        {page === 'music-mood-station' && (
          <MusicMoodStation
            key={selectedMoodKey}
            moodKey={selectedMoodKey}
            onBack={() => setPage('music-home')}
          />
        )}
        {page === 'weather' && <WeatherPage />}
        {isEpgPage && epgReturnFocusKey && <EpgDuiDock returnFocusKey={epgReturnFocusKey} />}
      </Stage>
    </ChatProvider>
  )
}

export default App
