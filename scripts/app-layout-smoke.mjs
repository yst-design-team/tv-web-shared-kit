#!/usr/bin/env node
import { mkdir, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baseUrl = process.env.APP_URL || 'http://127.0.0.1:5173'
const outDir = join(root, '.artifacts', 'app-layout-smoke')

const cases = [
  {
    name: 'schedule-last-row-bottom-gap',
    url: `${baseUrl}/?page=schedule`,
    focusKey: 'schedule-card-1-0',
    focusedSelector: '.schedule__grid-viewport .fr[data-focused]',
    viewportSelector: '.schedule__grid-viewport',
    minBottomGap: 51,
  },
  {
    name: 'documentary-last-row-bottom-gap',
    url: `${baseUrl}/?page=documentary`,
    focusKey: 'doc-card-2-0',
    focusedSelector: '.docai__grid-viewport .fr[data-focused]',
    viewportSelector: '.docai__grid-viewport',
    minBottomGap: 51,
  },
  {
    name: 'overlay-right-edge-visibility',
    url: `${baseUrl}/?page=waterfall&overlay=epg-recommendation`,
    focusKey: 'epg-recommendation-card-3',
    focusedSelector: '.epg-recommendation-overlay__grid .fr[data-focused]',
    viewportSelector: '.epg-recommendation-overlay__grid',
    maxRightOverflow: 18,
  },
  {
    name: 'topic-landing-last-item-bottom-gap',
    url: `${baseUrl}/?page=topic-landing`,
    focusKey: 'topic-landing-timeline-vertical',
    focusedSelector: '.topic-landing__gui-window [data-focused]',
    viewportSelector: '.topic-landing__gui-window',
    minBottomGap: 51,
  },
  {
    name: 'music-last-row-bottom-gap',
    url: `${baseUrl}/?page=music-home`,
    focusKey: 'music-scene-2',
    focusedSelector: '.music-home__gui [data-focused]',
    viewportSelector: '.music-home__gui',
    minBottomGap: 51,
  },
]

async function ensureAppReachable() {
  const response = await fetch(baseUrl).catch(() => null)
  if (!response?.ok) {
    throw new Error(`App is not reachable at ${baseUrl}. Start it with "npm run dev" first.`)
  }
}

async function waitForFocus(page, focusKey) {
  await page.waitForFunction(
    expectedKey => window.__tvDemo?.getFocusKey?.() === expectedKey,
    focusKey,
    { timeout: 10000 },
  )
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
      await page.evaluate(key => window.__tvDemo?.setFocus?.(key), testCase.focusKey)
      await waitForFocus(page, testCase.focusKey)
      await page.waitForTimeout(520)

      const measurement = await page.evaluate(({ focusedSelector, viewportSelector }) => {
        const focused = document.querySelector(focusedSelector)
        const viewport = document.querySelector(viewportSelector)
        if (!focused) throw new Error(`focused selector not found: ${focusedSelector}`)
        if (!viewport) throw new Error(`viewport selector not found: ${viewportSelector}`)

        const focusRect = focused.getBoundingClientRect()
        const viewportRect = viewport.getBoundingClientRect()
        return {
          focus: {
            left: focusRect.left,
            top: focusRect.top,
            right: focusRect.right,
            bottom: focusRect.bottom,
            width: focusRect.width,
            height: focusRect.height,
          },
          viewport: {
            left: viewportRect.left,
            top: viewportRect.top,
            right: viewportRect.right,
            bottom: viewportRect.bottom,
            width: viewportRect.width,
            height: viewportRect.height,
          },
        }
      }, {
        focusedSelector: testCase.focusedSelector,
        viewportSelector: testCase.viewportSelector,
      })

      if (testCase.minBottomGap !== undefined) {
        const gap = measurement.viewport.bottom - measurement.focus.bottom
        if (gap < testCase.minBottomGap) {
          throw new Error(`bottom gap ${gap.toFixed(2)}px < required ${testCase.minBottomGap}px`)
        }
      }

      if (testCase.maxRightOverflow !== undefined) {
        const overflow = measurement.focus.right - measurement.viewport.right
        if (overflow > testCase.maxRightOverflow) {
          throw new Error(
            `right overflow ${overflow.toFixed(2)}px > allowed ${testCase.maxRightOverflow}px`,
          )
        }
      }

      await page.screenshot({ path: join(outDir, `${testCase.name}.png`) })
    } catch (error) {
      failures.push(
        `${testCase.name}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  await browser.close()

  if (failures.length > 0) {
    console.error('App layout verification failed:\n')
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log('App layout verification passed.')
  console.log(`Screenshots written to ${outDir}`)
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
