import '@fontsource/kanit/500.css'
import '@fontsource/kanit/800.css'
import '@fontsource/ibm-plex-sans-thai/400.css'
import '@fontsource/ibm-plex-sans-thai/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/sriracha/400.css'
import * as THREE from 'three'
import { Stage, W, H } from './stage'
import { Typo } from './type'
import { C, disposeDeep, el, seg, slate } from './kit'
import type { Cues, Frame, LineCue, SceneCue, SceneCtx, SceneDef, SceneInstance } from './types'

declare global { interface Window { __ready: Promise<number>; __seek(t: number): void } }

const defs: Record<string, SceneDef> = Object.fromEntries(
  Object.entries(import.meta.glob<SceneDef>('./scenes/*.ts', { eager: true, import: 'default' }))
    .map(([path, def]) => [path.split('/').pop()!.replace(/\.ts$/, ''), def]))

const placeholder: SceneDef = {
  theme: 'dark',
  type: { pos: 'center' },
  create: ({ dom, cue }) => { slate(dom, `scene · ${cue.scene}`, 'todo', C.dim); return { update() {} } },
}

const frame = document.getElementById('frame')!
const stage = new Stage(frame)
const typo = new Typo(stage.overlay)
const params = new URLSearchParams(location.search)
const renderMode = params.has('render')

let cues: Cues
let lineById: Map<string, LineCue>
let active: { cue: SceneCue; def: SceneDef; ctx: SceneCtx; inst: SceneInstance } | null = null

function fit() {
  const s = Math.min(innerWidth / W, innerHeight / H)
  frame.style.transform = `scale(${s}) translate(-50%, -50%)`
}

function enter(cue: SceneCue) {
  if (active) {
    active.inst.dispose?.()
    stage.scene.remove(active.ctx.root)
    disposeDeep(active.ctx.root)
    active.ctx.dom.remove()
  }
  const def = defs[cue.scene] ?? placeholder
  const root = new THREE.Group()
  stage.scene.add(root)
  stage.resetCamera()
  stage.setTheme(def.theme)
  const dom = el('div', 'position:absolute;inset:0;overflow:hidden', stage.overlay)
  stage.overlay.prepend(dom) // below the typography layer
  const variant = cues.scenes.filter(s => s.scene === cue.scene).indexOf(cue)
  const ctx: SceneCtx = { stage, root, dom, cue, variant }
  active = { cue, def, ctx, inst: def.create(ctx) }
}

function draw(t: number) {
  const cue = cues.scenes.find(s => t >= s.start && t < s.end) ?? cues.scenes[cues.scenes.length - 1]
  if (active?.cue !== cue) enter(cue)
  const lines = cue.lines.map(id => lineById.get(id)!)
  let li = -1
  lines.forEach((l, i) => { if (t >= l.start) li = i })
  const f: Frame = {
    t, local: t - cue.start, dur: cue.end - cue.start, p: seg(t, cue.start, cue.end),
    beat: ((t - (cues.offset ?? 0)) * cues.bpm) / 60, lines, li, lp: li < 0 ? 0 : seg(t, lines[li].start, lines[li].end),
  }
  stage.setTheme(active!.def.theme)
  active!.inst.update(f)
  const all = cues.lines, gi = li < 0 ? -1 : all.indexOf(lines[li])
  typo.update(t, lines[li], all[gi + 1], active!.def.type ?? { pos: 'left' }, stage.theme)
  stage.render()
  if (!renderMode) document.getElementById('hud')!.textContent = `${t.toFixed(2)}s  ${cue.scene}  ${lines[li]?.id ?? ''}`
}

async function boot() {
  cues = await (await fetch('/cues.json')).json()
  lineById = new Map(cues.lines.map(l => [l.id, l]))
  await Promise.all(['500 40px Kanit', '800 40px Kanit', `400 20px "IBM Plex Sans Thai"`, `600 20px "IBM Plex Sans Thai"`,
    `400 20px "IBM Plex Mono"`, `500 20px "IBM Plex Mono"`, '400 40px Sriracha'].map(f => document.fonts.load(f, 'รับทราบ Aa1')))
  fit(); addEventListener('resize', fit)
  window.__seek = draw
  if (renderMode) return cues.duration

  // interactive preview: ?t=12  ?scene=meeting[&v=1] loops one scene; space play/pause, arrows ±5s
  const loop = params.get('scene') ? cues.scenes.filter(s => s.scene === params.get('scene'))[Number(params.get('v') ?? 0)] : null
  const audio = new Audio('/song.mp3')
  const hasAudio = await fetch('/song.mp3', { method: 'HEAD' }).then(r => r.ok && r.headers.get('content-type')?.startsWith('audio')).catch(() => false)
  let t0 = Number(params.get('t') ?? loop?.start ?? 0), playing = false, wall = 0
  const now = () => (hasAudio ? audio.currentTime : playing ? t0 + (performance.now() - wall) / 1000 : t0)
  const setT = (t: number) => { t0 = t; wall = performance.now(); if (hasAudio) audio.currentTime = t }
  setT(t0)
  addEventListener('keydown', e => {
    if (e.code === 'Space') { playing = !playing; setT(now()); if (hasAudio) playing ? audio.play() : audio.pause() }
    if (e.code === 'ArrowRight') setT(now() + 5)
    if (e.code === 'ArrowLeft') setT(Math.max(0, now() - 5))
  })
  const tick = () => {
    let t = now()
    if (loop && t >= loop.end) { setT(loop.start); t = loop.start }
    draw(Math.min(t, cues.duration - 1e-3))
    requestAnimationFrame(tick)
  }
  tick()
  return cues.duration
}

window.__ready = boot()
