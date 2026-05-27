#!/usr/bin/env node
import { mkdir, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baseUrl = process.env.STORYBOOK_URL || 'http://127.0.0.1:6006'
const outDir = join(root, '.artifacts', 'storybook-smoke')

const stories = [
  {
    id: 'components-mediacard--scene-regression-matrix',
    waitFor: '.mc[data-scene="epg"]',
  },
  {
    id: 'components-mediacard--traditional-epg-poster',
    waitFor: '.mc[data-scene="epg"][data-type="直播"]',
  },
  {
    id: 'components-textbutton--multiline-prompts',
    waitFor: '.tb[data-size="XS"]',
  },
  {
    id: 'components-textbutton--player-scene',
    waitFor: '.tb[data-scene="player"]',
  },
  {
    id: 'components-assistantinput--all-states',
    waitFor: '.ai-input[data-state="filled"]',
  },
  {
    id: 'components-duibubble--traditional-epg-reply',
    waitFor: '.dui[data-scene="epg"][data-state="reply"]',
  },
]

async function ensureStorybookReachable() {
  const response = await fetch(baseUrl).catch(() => null)
  if (!response?.ok) {
    throw new Error(
      `Storybook is not reachable at ${baseUrl}. Start it with "npm run storybook" first.`,
    )
  }
}

async function main() {
  await ensureStorybookReachable()
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  const failures = []

  page.on('pageerror', error => {
    failures.push(`pageerror: ${error.message}`)
  })

  for (const story of stories) {
    const consoleErrors = []
    const onConsole = message => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    }

    page.on('console', onConsole)
    const storyUrl = `${baseUrl}/iframe.html?id=${story.id}&viewMode=story`
    await page.goto(storyUrl, { waitUntil: 'networkidle' })
    await page.locator(story.waitFor).first().waitFor({ state: 'visible', timeout: 10000 })
    await page.screenshot({ path: join(outDir, `${story.id}.png`) })
    page.off('console', onConsole)

    if (consoleErrors.length > 0) {
      failures.push(`${story.id}: ${consoleErrors.join('\n')}`)
    }
  }

  await browser.close()

  if (failures.length > 0) {
    console.error('Storybook smoke verification failed:\n')
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log('Storybook smoke verification passed.')
  console.log(`Screenshots written to ${outDir}`)
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
