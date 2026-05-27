import type { AppPageId } from './pageRegistry'
import type { AppOverlayId } from './appLocation'

export interface TvDemoDebugApi {
  getState: () => {
    page: AppPageId
    overlay: AppOverlayId | null
  }
  getFocusKey: () => string
  setPage: (page: AppPageId) => void
  setOverlay: (overlay: AppOverlayId | null) => void
  setFocus: (focusKey: string) => void
}

declare global {
  interface Window {
    __tvDemo?: TvDemoDebugApi
  }
}

export {}
