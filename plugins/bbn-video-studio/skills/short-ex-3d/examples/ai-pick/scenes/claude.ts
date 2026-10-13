// claude (17.14–24.98 s): the terracotta mark in a warm paper glow (Blender plate). On "เขียนโค้ด" glass editor panels
// with glowing, scrolling code stream in around it; on "เอกสารยาวๆ" the plate's real-paper pages vortex into the mark;
// claude-2 pops the job chips.
import * as THREE from 'three'
import type { SceneDef } from '../types'
import { bl } from '../seq'
import { ease, seg } from '../kit'
import { chip, faceCam, glassCard, orbitIn, plate, pop, type Icon } from './a2/kit'

const TERRA = '#D97757', GLOW = '#FFB08F'
// word onsets, scene-local seconds (whisper on song/vo.wav)
const T = { code: 1.2, out: 2.12, c1: 4.98, c2: 5.82, c3: 7.2 }
const C0 = new THREE.Vector3(0, 0, 1.7) // mark centre, Blender coords (blender/claude_seq.py LOGO_Z)

const ICON: Record<'code' | 'pen' | 'lens', Icon> = {
  code: g => { g.beginPath(); g.moveTo(30, 24); g.lineTo(8, 50); g.lineTo(30, 76); g.moveTo(70, 24); g.lineTo(92, 50); g.lineTo(70, 76); g.moveTo(58, 16); g.lineTo(42, 84); g.stroke() },
  pen: g => { g.beginPath(); g.moveTo(70, 12); g.lineTo(88, 30); g.lineTo(36, 82); g.lineTo(12, 88); g.lineTo(18, 64); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(60, 22); g.lineTo(78, 40); g.stroke() },
  lens: g => { g.beginPath(); g.arc(42, 42, 26, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(62, 62); g.lineTo(88, 88); g.stroke() },
}

const CODE = `export async function review(pr) {
  for (const file of pr.files) {
    if (!file.tests) flag(file.name)
  }
  return summarize(pr.diff, 4000)
}

// keep it simple: one pass, no globals
function summarize(doc, size) {
  const parts = split(doc, size)
  return parts.map(p => read(p)).join("\\n")
}

class Parser {
  constructor(src) { this.src = src; this.i = 0 }
  next() { return this.src[this.i++] }
  peek() { return this.src[this.i] }
}

const plan = await think(task, { steps: 12 })
for (const step of plan) await run(step)
if (tests.pass) ship("v2.1")
// TODO: handle the empty case
export default { review, summarize }`.split('\n')
const KW = /\b(export|async|function|for|const|of|if|return|class|constructor|await|default|this)\b/

/** Syntax-coloured code with a soft glow, tall enough to scroll. */
function codeCanvas(seed: number) {
  const W = 600, LH = 46, rows = 36, c = document.createElement('canvas')
  c.width = W; c.height = rows * LH
  const g = c.getContext('2d')!
  g.font = `500 31px 'IBM Plex Mono', monospace`; g.textBaseline = 'middle'
  for (let r = 0; r < rows; r++) {
    const line = CODE[(r + seed * 7) % CODE.length], y = r * LH + LH / 2
    g.shadowBlur = 0; g.fillStyle = '#5E544E'; g.fillText(String(r + 1).padStart(2, ' '), 8, y)
    let x = 64
    for (const tok of line.split(/(\s+|[(){}[\].,;:=>!"])/)) {
      if (!tok) continue
      const col = line.trim().startsWith('//') ? '#8E837B' : KW.test(tok) ? '#FF9C78' : /^["\d]/.test(tok) ? '#F3D39A' : '#E9DFD7'
      g.fillStyle = col; g.shadowColor = col; g.shadowBlur = col === '#FF9C78' ? 10 : 4
      g.fillText(tok, x, y); x += g.measureText(tok).width
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace; tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 8
  return tex
}

/** Glass editor window: title bar dots + scrolling code. */
function panel(seed: number) {
  const w = 0.96, h = 1.3
  const card = glassCard(w, h, 0.07, TERRA, GLOW, g => {
    const s = 400
    for (const [i, col] of ['#FF6B5E', '#F2C14E', '#5FC27E'].entries()) { g.fillStyle = col; g.beginPath(); g.arc(28 + i * 26, 26, 8, 0, Math.PI * 2); g.fill() }
    g.font = `500 20px 'IBM Plex Mono', monospace`; g.fillStyle = '#9C8F86'; g.textBaseline = 'middle'
    g.fillText(['review.ts', 'parser.ts', 'plan.ts'][seed % 3], 112, 26)
    g.fillStyle = 'rgba(255,176,143,.25)'; g.fillRect(0, 52, w * s, 2)
  })
  const tex = codeCanvas(seed)
  const vw = w - 0.08, vh = h - 0.2
  tex.repeat.set(1, (600 * vh) / vw / tex.image.height)
  const code = new THREE.Mesh(new THREE.PlaneGeometry(vw, vh), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }))
  code.position.set(0, -0.08, 0.1)
  card.add(code)
  return { card, tex }
}

const def: SceneDef = {
  theme: 'dark',
  create({ stage, root }) {
    const pl = plate(stage, root, 'claude', 237, 'claude')
    const cam = stage.camera

    // เขียนโค้ด: three editor panels stream in around the mark, code scrolling inside
    const panels = [
      { ...panel(0), slot: [-0.74, -2.6, 0.5] as const, from: 1.6, t0: T.code - 0.1, yaw: 0.3, speed: 0.11 },
      { ...panel(1), slot: [1.22, -2.0, -0.5] as const, from: 1.4, t0: T.code + 0.06, yaw: -0.3, speed: 0.15 },
      { ...panel(2), slot: [0.62, 1.4, 1.5] as const, from: 2.0, t0: T.code + 0.22, yaw: -0.1, speed: 0.09 },
    ]
    for (const p of panels) root.add(p.card)

    // เหมาะกับ...: job chips (same grammar as the chatgpt scene)
    const chips = [
      { o: chip('โปรแกรมเมอร์', ICON.code, GLOW, TERRA), slot: [-0.55, -0.6, 1.84] as const, t0: T.c1 - 0.08, yaw: 0.2 },
      { o: chip('นักเขียน', ICON.pen, GLOW, TERRA), slot: [0.7, -0.6, 1.28] as const, t0: T.c2 - 0.08, yaw: -0.18 },
      { o: chip('คิดละเอียด', ICON.lens, GLOW, TERRA), slot: [0.0, -0.7, -1.42] as const, t0: T.c3 - 0.1, yaw: 0.12 },
    ]
    for (const c of chips) root.add(c.o)

    return {
      prepare: f => pl.prepare(f.local),
      update(f) {
        const t = f.local
        pl.set(t)

        panels.forEach((p, i) => {
          const eIn = ease.out(seg(t, p.t0, p.t0 + 0.55)), eOut = ease.in(seg(t, T.out + i * 0.06, T.out + 0.4 + i * 0.06))
          p.card.visible = eIn > 0 && eOut < 1
          if (!p.card.visible) return
          const [sx, sy, sz] = p.slot
          const drift: [number, number, number] = [sx - 0.15 * (t - p.t0), sy, sz + 0.04 * Math.sin(t * 1.6 + i * 2)]
          p.card.position.copy(eOut > 0 ? orbitIn(C0, drift, 1 - eOut, -p.from, 2.4) : orbitIn(C0, drift, eIn, p.from))
          p.card.scale.setScalar(0.4 + 0.6 * eIn)
          faceCam(p.card, cam, p.yaw + (1 - eIn) * -1.1 + eOut * 0.9, 0.03 * Math.sin(t + i))
          p.tex.offset.y = 1 - p.tex.repeat.y - (t - p.t0) * p.speed * (1 + 2.5 * (1 - eIn))
        })

        chips.forEach((c, i) => {
          const s = pop(t, c.t0)
          c.o.visible = s > 0
          if (!s) return
          const [sx, sy, sz] = c.slot
          c.o.position.copy(bl(C0.x + sx, C0.y + sy, C0.z + sz + 0.04 * Math.sin(t * 1.5 + i * 1.7)))
          c.o.scale.setScalar(s)
          faceCam(c.o, cam, c.yaw * Math.cos(t * 0.8 + i), (1 - Math.min(1, s)) * 0.3)
          ;((c.o.children[1] as THREE.Mesh).material as THREE.ShaderMaterial).uniforms.uK.value = 1.6 + 4 * Math.exp(-(t - c.t0) * 5)
        })
      },
      dispose: () => pl.dispose(),
    }
  },
}
export default def
