#!/usr/bin/env node
import { mkdir, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baseUrl = process.env.APP_URL || 'http://127.0.0.1:5173'
const outDir = join(root, '.artifacts', 'app-smoke')

const routes = [
  { name: 'waterfall', url: `${baseUrl}/?page=waterfall`, page: 'waterfall', scene: 'epg' },
  { name: 'schedule', url: `${baseUrl}/?page=schedule`, page: 'schedule', scene: 'ai-space' },
  { name: 'player', url: `${baseUrl}/?page=player`, page: 'player', scene: 'epg' },
  { name: 'documentary', url: `${baseUrl}/?page=documentary`, page: 'documentary', scene: 'ai-space' },
  { name: 'aism', url: `${baseUrl}/?page=aism`, page: 'aism', scene: 'ai-space' },
  { name: 'liudehua', url: `${baseUrl}/?page=liudehua`, page: 'liudehua', scene: 'ai-space' },
  { name: 'topic', url: `${baseUrl}/?page=topic`, page: 'topic', scene: 'ai-space' },
  { name: 'topic-landing', url: `${baseUrl}/?page=topic-landing`, page: 'topic-landing', scene: 'ai-space' },
  { name: 'music-home', url: `${baseUrl}/?page=music-home`, page: 'music-home', scene: 'ai-space' },
  {
    name: 'waterfall-overlay',
    url: `${baseUrl}/?page=waterfall&overlay=epg-recommendation`,
    page: 'waterfall',
    scene: 'epg',
    extraSelector: '.epg-recommendation-overlay',
  },
]

async function ensureAppReachable() {
  const response = await fetch(baseUrl).catch(() => null)
  if (!response?.ok) {
    throw new Error(`App is not reachable at ${baseUrl}. Start it with "npm run dev" first.`)
  }
}

async function main() {
  await ensureAppReachable()
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } })
  const failures = []

  page.on('pageerror', error => {
    failures.push(`pageerror: ${error.message}`)
  })

  for (const route of routes) {
    const consoleErrors = []
    const onConsole = message => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    }

    page.on('console', onConsole)
    await page.goto(route.url, { waitUntil: 'networkidle' })
    await page
      .locator(`[data-page="${route.page}"][data-scene="${route.scene}"]`)
      .first()
      .waitFor({ state: 'visible', timeout: 10000 })

    if (route.extraSelector) {
      await page.locator(route.extraSelector).first().waitFor({ state: 'visible', timeout: 10000 })
    }

    await page.screenshot({ path: join(outDir, `${route.name}.png`) })
    page.off('console', onConsole)

    if (consoleErrors.length > 0) {
      failures.push(`${route.name}: ${consoleErrors.join('\n')}`)
    }
  }

  await browser.close()

  if (failures.length > 0) {
    console.error('App smoke verification failed:\n')
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log('App smoke verification passed.')
  console.log(`Screenshots written to ${outDir}`)
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
