import { useContext } from 'react'
import type { AppScene } from './pageRegistry'
import { appSceneContext } from './appSceneContext'

export function useAppScene(): AppScene {
  return useContext(appSceneContext)
}
