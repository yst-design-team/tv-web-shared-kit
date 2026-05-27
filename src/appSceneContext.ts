import { createContext } from 'react'
import type { AppScene } from './pageRegistry'

export const appSceneContext = createContext<AppScene>('ai-space')
