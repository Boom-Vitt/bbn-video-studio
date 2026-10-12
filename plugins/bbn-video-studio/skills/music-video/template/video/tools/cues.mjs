// Build public/cues.json from song/lyrics.txt + song/scenes.json.
// Timing: a 120 BPM bar grid (placeholder), or --align <whisper.json> once the real song exists.
import { readFileSync, writeFileSync } from 'node:fs'
const root = new URL('../../', import.meta.url).pathname
const BPM = 120, BAR = 240 / BPM
// bars per section (grid mode only); lines are spread evenly across their section
const BARS = { intro: 8, verse: 16, prechorus: 4, chorus: 16, postchorus: 4, bridge: 12, breakdown: 8, finalchorus: 12, outro: 10 }

export function parseLyrics(src) {
  const lines = [], seen = {}
  let section = null, n = 0
  for (const raw of src.split('\n')) {
    const s = raw.trim()
    if (!s) continue
    const tag = s.match(/^\[(.+?)\]$/)
    if (tag) {
      const slug = tag[1].split(' - ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
      seen[slug] = (seen[slug] ?? 0) + 1
      section = seen[slug] > 1 ? `${slug}${seen[slug]}` : slug
      n = 0
      continue
    }
    lines.push({ id: `${section}-${++n}`, section, text: s })
  }
  return lines
}

function gridTimes(lines) {
  const sections = [...new Set(lines.map(l => l.section))]
  let t = 0
  for (const sec of sections) {
    const ls = lines.filter(l => l.section === sec)
    const bars = BARS[sec.replace(/\d+$/, '')] ?? ls.length * 2
    const span = (bars * BAR) / ls.length
    ls.forEach((l, i) => { l.start = +(t + i * span).toFixed(3); l.end = +(t + (i + 1) * span - 0.25).toFixed(3) })
    t += bars * BAR
  }
  return t
}

export function buildScenes(lines, map, duration) {
  const at = id => {
    const l = lines.find(l => l.id === id)
    if (!l) throw new Error(`scenes.json: unknown line id ${id}`)
    return l
  }
  const starts = map.map((m, i) => (i === 0 ? 0 : Math.max(0, at(m.from).start - 0.25)))
  return map.map((m, i) => {
    const start = starts[i], end = i + 1 < map.length ? starts[i + 1] : duration
    return { scene: m.scene, start: +start.toFixed(3), end: +end.toFixed(3),
      lines: lines.filter(l => l.start >= start && l.start < end).map(l => l.id) }
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const lines = parseLyrics(readFileSync(root + 'song/lyrics.txt', 'utf8'))
  const map = JSON.parse(readFileSync(root + 'song/scenes.json', 'utf8'))
  const alignIdx = process.argv.indexOf('--align')
  let duration, bpm = BPM, offset = 0
  if (alignIdx > 0) {
    // {duration, lines:[{id,start,end}]} produced by tools/align.py
    const a = JSON.parse(readFileSync(process.argv[alignIdx + 1], 'utf8'))
    for (const l of lines) Object.assign(l, a.lines.find(x => x.id === l.id) ?? {})
    duration = a.duration; bpm = a.bpm ?? BPM; offset = a.offset ?? 0
  } else duration = gridTimes(lines)
  duration = Math.max(duration, lines.at(-1).end + 7) // always leave room for the end card
  const scenes = buildScenes(lines, map, duration)
  writeFileSync(root + 'video/public/cues.json', JSON.stringify({ bpm, offset, duration, lines, scenes }, null, 1))
  console.log(`cues: ${lines.length} lines, ${scenes.length} scenes, ${duration.toFixed(1)}s`)
}
