import type { ReactNode } from 'react'
import type { AppScene } from './pageRegistry'
import { appSceneContext } from './appSceneContext'

export interface AppSceneProviderProps {
  scene: AppScene
  children: ReactNode
}

export function AppSceneProvider({ scene, children }: AppSceneProviderProps) {
  return <appSceneContext.Provider value={scene}>{children}</appSceneContext.Provider>
}
