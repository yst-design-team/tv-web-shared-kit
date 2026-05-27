import { PAGE_REGISTRY, type AppPageId } from './pageRegistry'

export type AppOverlayId = 'epg-recommendation'

export interface AppLocationState {
  page: AppPageId
  overlay: AppOverlayId | null
}

const FALLBACK_PAGE: AppPageId = 'waterfall'

function isAppPageId(value: string | null): value is AppPageId {
  return !!value && value in PAGE_REGISTRY
}

function normalizeOverlay(page: AppPageId, overlay: string | null): AppOverlayId | null {
  if (page !== 'waterfall') return null
  return overlay === 'epg-recommendation' ? overlay : null
}

export function readAppLocationState(search = window.location.search): AppLocationState {
  const params = new URLSearchParams(search)
  const pageParam = params.get('page')
  const page = isAppPageId(pageParam) ? pageParam : FALLBACK_PAGE
  const overlay = normalizeOverlay(page, params.get('overlay'))
  return { page, overlay }
}

export function writeAppLocationState(state: AppLocationState) {
  const url = new URL(window.location.href)
  url.searchParams.set('page', state.page)

  if (state.overlay) url.searchParams.set('overlay', state.overlay)
  else url.searchParams.delete('overlay')

  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
}
