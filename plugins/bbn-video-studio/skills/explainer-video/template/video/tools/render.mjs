// Frame-stepped renderer: headless Chrome seeks the timeline frame by frame, ffmpeg encodes.
//   node tools/render.mjs --still 31.5 [--out still.png]
//   node tools/render.mjs [--from 0] [--to <end>] [--fps 30] [--jobs 4] [--out out/video.mp4]
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createServer } from 'vite'
import puppeteer from 'puppeteer-core'

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d }
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const root = resolve(import.meta.dirname, '..')

const server = await createServer({ root, logLevel: 'error', server: { port: 0, hmr: false } }) // no live reload: workers write sibling scenes while others capture
await server.listen()
const url = `${server.resolvedUrls.local[0]}?render`
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
  args: ['--hide-scrollbars', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] })

async function page() {
  const p = await browser.newPage()
  await p.setViewport({ width: 1080, height: 1920 })
  p.on('pageerror', e => console.error('pageerror:', e.message))
  p.on('console', m => m.type() === 'error' && console.error('console:', m.text()))
  await p.goto(url, { waitUntil: 'networkidle0' })
  const duration = await p.evaluate(() => window.__ready)
  // the first capture after load can miss the DOM layer; take one throwaway shot
  await p.evaluate(() => window.__seek(0))
  await p.screenshot({ type: 'jpeg', optimizeForSpeed: true })
  return { p, duration }
}
const shot = async (p, t, type = 'jpeg') => {
  await p.evaluate(t => window.__seek(t), t)
  return p.screenshot({ type, ...(type === 'jpeg' ? { quality: 92 } : {}), optimizeForSpeed: true })
}
const run = (cmd, args, input) => new Promise((ok, fail) => {
  const c = spawn(cmd, args, { stdio: [input ? 'pipe' : 'ignore', 'ignore', 'inherit'] })
  c.on('exit', code => (code ? fail(new Error(`${cmd} exited ${code}`)) : ok()))
  if (input) input(c.stdin)
})

try {
  const still = arg('still')
  if (still !== undefined) {
    const out = resolve(arg('out', `out/still_${still}.png`))
    mkdirSync(dirname(out), { recursive: true })
    const { p } = await page()
    writeFileSync(out, await shot(p, Number(still), 'png'))
    console.log(out)
  } else {
    const fps = Number(arg('fps', 30)), jobs = Number(arg('jobs', 4))
    const out = resolve(arg('out', 'out/video.mp4'))
    const tmp = resolve(dirname(out), '.chunks'); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true })
    const first = await page()
    const from = Number(arg('from', 0)), to = Number(arg('to', first.duration))
    const total = Math.round((to - from) * fps), per = Math.ceil(total / jobs)
    let done = 0
    const chunk = async (j, pg) => {
      const a = j * per, b = Math.min(total, a + per)
      if (a >= b) return null
      const file = `${tmp}/c${j}.mp4`
      const { p } = pg ?? (await page())
      await run('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', file], async stdin => {
        for (let i = a; i < b; i++) {
          if (!stdin.write(await shot(p, from + i / fps))) await new Promise(r => stdin.once('drain', r))
          if (++done % 150 === 0) console.log(`${done}/${total} frames`)
        }
        stdin.end()
      })
      return file
    }
    const files = (await Promise.all(Array.from({ length: jobs }, (_, j) => chunk(j, j === 0 ? first : null)))).filter(Boolean)
    writeFileSync(`${tmp}/list.txt`, files.map(f => `file '${f}'`).join('\n'))
    const song = resolve(root, 'public/song.mp3')
    await run('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${tmp}/list.txt`,
      ...(existsSync(song) ? ['-ss', String(from), '-t', String(to - from), '-i', song, '-c:a', 'aac', '-b:a', '256k'] : []),
      '-c:v', 'copy', '-movflags', '+faststart', out])
    rmSync(tmp, { recursive: true, force: true })
    console.log(out)
  }
} finally {
  await browser.close()
  await server.close()
}
