#!/usr/bin/env node
import { mkdir, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baseUrl = process.env.APP_URL || 'http://127.0.0.1:5173'
const outDir = join(root, '.artifacts', 'app-focus-smoke')

const cases = [
  {
    name: 'waterfall-default-focus',
    url: `${baseUrl}/?page=waterfall`,
    expected: 'tab-0',
  },
  {
    name: 'schedule-default-focus',
    url: `${baseUrl}/?page=schedule`,
    expected: 'schedule-card-0-0',
  },
  {
    name: 'schedule-cross-to-dui',
    url: `${baseUrl}/?page=schedule`,
    expected: 'schedule-reply-like',
    keys: ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight'],
  },
  {
    name: 'documentary-default-focus',
    url: `${baseUrl}/?page=documentary`,
    expected: 'doc-card-0-0',
  },
  {
    name: 'documentary-cross-to-dui',
    url: `${baseUrl}/?page=documentary`,
    expected: 'doc-reply-like',
    keys: ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight'],
  },
  {
    name: 'player-default-focus',
    url: `${baseUrl}/?page=player`,
    expected: 'player-action-fullscreen',
  },
  {
    name: 'player-progress-navigation',
    url: `${baseUrl}/?page=player`,
    expected: 'player-progress',
    keys: ['ArrowDown'],
  },
  {
    name: 'overlay-default-focus',
    url: `${baseUrl}/?page=waterfall&overlay=epg-recommendation`,
    expected: 'epg-recommendation-card-0',
  },
  {
    name: 'overlay-cross-to-dui',
    url: `${baseUrl}/?page=waterfall&overlay=epg-recommendation`,
    expected: 'epg-dui-panel-input',
    keys: ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight'],
  },
  {
    name: 'aism-default-focus',
    url: `${baseUrl}/?page=aism`,
    expected: 'rec-1',
  },
  {
    name: 'aism-cross-to-dui',
    url: `${baseUrl}/?page=aism`,
    initialFocus: 'rec-5',
    expected: 'reply-like',
    keys: ['ArrowRight'],
  },
  {
    name: 'liudehua-default-focus',
    url: `${baseUrl}/?page=liudehua`,
    expected: 'film-0-0',
  },
  {
    name: 'liudehua-cross-to-dui',
    url: `${baseUrl}/?page=liudehua`,
    initialFocus: 'film-0-3',
    expected: 'reply-like',
    keys: ['ArrowRight'],
  },
  {
    name: 'topic-default-focus',
    url: `${baseUrl}/?page=topic`,
    expected: 'topic-r0c0',
  },
  {
    name: 'topic-cross-to-dui',
    url: `${baseUrl}/?page=topic`,
    initialFocus: 'topic-r0c1',
    expected: 'reply-like',
    keys: ['ArrowRight'],
  },
  {
    name: 'topic-landing-default-focus',
    url: `${baseUrl}/?page=topic-landing`,
    expected: 'topic-landing-history',
  },
  {
    name: 'topic-landing-cross-to-dui',
    url: `${baseUrl}/?page=topic-landing`,
    initialFocus: 'topic-landing-video-wide',
    expected: 'topic-landing-reply-like',
    keys: ['ArrowRight'],
  },
  {
    name: 'topic-landing-prompt-to-input',
    url: `${baseUrl}/?page=topic-landing`,
    initialFocus: 'topic-landing-prompt-3',
    expected: 'topic-landing-input',
    keys: ['ArrowDown'],
  },
  {
    name: 'topic-landing-landscape-index-memory',
    url: `${baseUrl}/?page=topic-landing`,
    initialFocus: 'topic-landing-playlist-landscape',
    expected: 'topic-landing-playlist-landscape',
    keys: ['ArrowRight', 'ArrowRight', 'ArrowLeft'],
    childIndexSelector: '.topic-landing__item--playlist-landscape .playlist-topic-row__cards',
    expectedChildIndex: 1,
  },
  {
    name: 'topic-landing-portrait-index-memory',
    url: `${baseUrl}/?page=topic-landing`,
    initialFocus: 'topic-landing-playlist-portrait',
    expected: 'topic-landing-playlist-portrait',
    keys: ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowLeft'],
    childIndexSelector: '.topic-landing__item--playlist-portrait .playlist-topic-row__cards',
    expectedChildIndex: 2,
  },
  {
    name: 'music-default-focus',
    url: `${baseUrl}/?page=music-home`,
    expected: 'music-history-card',
  },
  {
    name: 'music-cross-to-dui',
    url: `${baseUrl}/?page=music-home`,
    initialFocus: 'music-scene-2',
    expected: 'music-reply-like',
    keys: ['ArrowRight'],
  },
]

async function ensureAppReachable() {
  const response = await fetch(baseUrl).catch(() => null)
  if (!response?.ok) {
    throw new Error(`App is not reachable at ${baseUrl}. Start it with "npm run dev" first.`)
  }
}

async function waitForFocus(page, expected) {
  await page.waitForFunction(
    expectedKey => window.__tvDemo?.getFocusKey?.() === expectedKey,
    expected,
    { timeout: 10000 },
  )
}

async function waitForAnyFocus(page) {
  await page.waitForFunction(
    () => Boolean(window.__tvDemo?.getFocusKey?.()),
    undefined,
    { timeout: 10000 },
  )
}

async function currentFocusKey(page) {
  return page.evaluate(() => window.__tvDemo?.getFocusKey?.() ?? '')
}

async function currentFocusedChildIndex(page, selector) {
  return page.evaluate(containerSelector => {
    const container = document.querySelector(containerSelector)
    if (!container) throw new Error(`container selector not found: ${containerSelector}`)
    const children = Array.from(container.children)
    return children.findIndex(child => {
      if (child instanceof HTMLElement && child.dataset.focused !== undefined) return true
      return Boolean(child.querySelector('[data-focused]'))
    })
  }, selector)
}

async function main() {
  await ensureAppReachable()
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  const failures = []

  for (const testCase of cases) {
    await page.goto(testCase.url, { waitUntil: 'networkidle' })

    try {
      await waitForAnyFocus(page)

      if (testCase.initialFocus) {
        await page.evaluate(key => window.__tvDemo?.setFocus?.(key), testCase.initialFocus)
        await waitForFocus(page, testCase.initialFocus)
        await page.waitForTimeout(80)
      }

      for (const key of testCase.keys ?? []) {
        await page.keyboard.press(key)
        await page.waitForTimeout(80)
      }

      await waitForFocus(page, testCase.expected)

      if (testCase.childIndexSelector) {
        const actualIndex = await currentFocusedChildIndex(page, testCase.childIndexSelector)
        if (actualIndex !== testCase.expectedChildIndex) {
          throw new Error(
            `expected child index ${testCase.expectedChildIndex}, got ${actualIndex}`,
          )
        }
      }

      await page.screenshot({ path: join(outDir, `${testCase.name}.png`) })
    } catch (error) {
      const actual = await currentFocusKey(page).catch(() => '(unavailable)')
      failures.push(
        `${testCase.name}: expected focus "${testCase.expected}", got "${actual}". ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  await browser.close()

  if (failures.length > 0) {
    console.error('App focus verification failed:\n')
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log('App focus verification passed.')
  console.log(`Screenshots written to ${outDir}`)
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
