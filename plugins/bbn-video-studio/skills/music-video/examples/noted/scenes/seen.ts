// Post-chorus call-and-response: "read" receipts stamp in on the beat, the eye never opened,
// and red pen keeps pointing at the global layer's "(ไม่ได้อ่าน)".
import * as THREE from 'three'
import { C, F, canvasTexture, clamp, ease, el, lerp, pulse, rng, seg, slate } from '../kit'
import type { LineCue, SceneDef, TypeLayout } from '../types'

const TYPE: TypeLayout = { pos: 'center', size: 136, width: 1700 }
const COLS = 40, ROWS = 22, GAP = 0.42
// stamp slots (centre x, y, rotation°), kept out of the lyric band and the eye
const SLOTS: [number, number, number][] = [[330, 235, -9], [1590, 250, 7], [300, 830, 5], [1630, 840, -6], [700, 345, 4],
  [1240, 350, -5], [760, 780, -3], [1180, 790, 8], [520, 975, -7], [1400, 985, 6]]
const PER_LINE = [4, 3, 3]
const NOTES = ['จริงๆ นะ', 'อีกแล้ว', 'ทุกคนเลย']
const CHECKS = (c: string, w = 64) => `<svg width="${w}" height="${(w * 40) / 64}" viewBox="0 0 64 40" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 22 L15 33 L38 8"/><path d="M26 26 L33 33 L58 8"/></svg>`

const segmenter = new Intl.Segmenter('th', { granularity: 'word' })

/** Where (and when) the global type layer puts this line's pen words: mirrors type.ts layout in a hidden clone. */
function measurePen(line: LineCue, host: HTMLElement) {
  const size = TYPE.size!, W = TYPE.width!
  const box = el('div', `position:absolute;left:0;top:0;visibility:hidden;width:${W}px;text-align:center;
    font:800 ${size}px/1.32 ${F.display};letter-spacing:-.01em;word-break:normal;line-break:auto`, host)
  const pieces: { text: string; pen: boolean }[] = []
  for (const part of line.text.split(/(\([^)]*\))/).filter(Boolean))
    for (const s of segmenter.segment(part)) pieces.push({ text: s.segment, pen: part.startsWith('(') })
  const n = pieces.filter(p => p.text.trim()).length
  let i = 0, firstPen = -1
  const pens: HTMLElement[] = []
  for (const p of pieces) {
    if (!p.text.trim()) { box.append(p.text); continue }
    if (p.pen && firstPen < 0) firstPen = i
    i++
    const s = el('span', p.pen ? `display:inline-block;font:400 ${size * 0.62}px/1.3 ${F.pen}` : 'display:inline-block', box)
    s.textContent = p.text
    if (p.pen) pens.push(s)
  }
  const ox = 960 - W / 2, oy = 540 - box.offsetHeight / 2
  const x0 = Math.min(...pens.map(s => s.offsetLeft)) + ox, x1 = Math.max(...pens.map(s => s.offsetLeft + s.offsetWidth)) + ox
  const y0 = Math.min(...pens.map(s => s.offsetTop)) + oy, y1 = Math.max(...pens.map(s => s.offsetTop + s.offsetHeight)) + oy
  box.remove()
  const at = line.start + (Math.max(0, firstPen) / n) * Math.max(0.6, (line.end - line.start) * 0.82)
  return { x0, x1, y0, y1, at }
}

/** Hand-drawn red-pen marks for line i pointing at the pen rect. */
function penMarks(i: number, r: { x0: number; x1: number; y0: number; y1: number }) {
  const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2, w = r.x1 - r.x0, h = r.y1 - r.y0
  const arrow = (x0: number, y0: number, x1: number, y1: number, bend: number) => {
    const mx = (x0 + x1) / 2 - (y1 - y0) * bend, my = (y0 + y1) / 2 + (x1 - x0) * bend
    const a = Math.atan2(y1 - my, x1 - mx), L = 26
    return [`M${x0} ${y0} Q${mx} ${my} ${x1} ${y1}`,
      `M${x1 - L * Math.cos(a - 0.5)} ${y1 - L * Math.sin(a - 0.5)} L${x1} ${y1} L${x1 - L * Math.cos(a + 0.5)} ${y1 - L * Math.sin(a + 0.5)}`]
  }
  const loop = (k: number) => { // loose double ellipse around the words
    let d = ''
    for (let s = 0; s <= 64; s++) {
      const th = -2.6 + (s / 64) * Math.PI * 2.25, rr = 1 + 0.025 * Math.sin(s * 0.5)
      d += `${s ? 'L' : 'M'}${(cx + Math.cos(th) * (w / 2 + 22) * rr * k).toFixed(1)} ${(cy + Math.sin(th) * (h / 2 + 18) * rr * k).toFixed(1)}`
    }
    return d
  }
  if (i === 0) return { d: arrow(r.x1 + 170, r.y0 - 120, r.x1 - 6, r.y0 + 8, 0.25), note: [r.x1 + 120, r.y0 - 165] }
  if (i === 1) return { d: [loop(1), ...arrow(r.x1 + 210, r.y0 - 20, r.x1 + 34, cy - 4, 0.3)], note: [r.x1 + 120, r.y0 - 100] }
  return {
    d: [`M${r.x0 - 8} ${r.y1 - 4} Q${cx} ${r.y1 + 10} ${r.x1 + 14} ${r.y1 - 8}`, `M${r.x0 + 20} ${r.y1 + 12} Q${cx} ${r.y1 + 22} ${r.x1 - 10} ${r.y1 + 8}`,
      ...arrow(Math.min(r.x1 + 110, 1820), r.y0 - 120, r.x1 - 10, r.y0 + 6, 0.25)],
    note: [Math.min(r.x1 + 40, 1640), r.y0 - 200],
  }
}

export default {
  theme: 'dark',
  type: TYPE,
  create({ stage, root, dom }) {
    const cam = stage.camera

    // wall of tiny read receipts; a ripple of yellow runs out from the centre on every beat
    const tex = canvasTexture(128, 64, g => {
      g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'
      g.beginPath(); g.moveTo(14, 34); g.lineTo(32, 50); g.lineTo(66, 14); g.stroke()
      g.beginPath(); g.moveTo(52, 40); g.lineTo(62, 50); g.lineTo(100, 14); g.stroke()
    })
    const grid = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.3, 0.15), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }), COLS * ROWS)
    const mtx = new THREE.Matrix4(), col = new THREE.Color(), dim = new THREE.Color(C.rule), hot = new THREE.Color(C.yellow)
    const dist: number[] = []
    for (let i = 0; i < COLS * ROWS; i++) {
      const x = (i % COLS) - (COLS - 1) / 2, y = Math.floor(i / COLS) - (ROWS - 1) / 2
      mtx.makeTranslation(x * GAP, y * GAP, 0)
      grid.setMatrixAt(i, mtx); grid.setColorAt(i, dim)
      dist.push(Math.hypot(x, y * 1.6))
    }
    grid.position.z = -4
    root.add(grid)

    // DOM: slate, vignette, sleeping eye, stamps, red pen layer
    slate(dom, 'Post-chorus · อ่านแล้ว', 'อ่านแล้ว 47 · อ่านจริง 0')
    el('div', `position:absolute;inset:0;background:radial-gradient(ellipse 48% 24% at 50% 50%, ${C.ink}F2 0%, ${C.ink}B0 55%, ${C.ink}00 100%)`, dom)
    const eye = el('div', 'position:absolute;left:770px;top:96px;width:380px;height:200px', dom,
      `<svg width="380" height="160" viewBox="0 0 380 160" fill="none" stroke="${C.white}" stroke-width="8" stroke-linecap="round">
        <path d="M30 60 Q190 150 350 60"/><path d="M78 92 L58 124"/><path d="M134 110 L124 146"/><path d="M190 115 L190 152"/><path d="M246 110 L256 146"/><path d="M302 92 L322 124"/></svg>`)
    const zs = [0, 1, 2].map(k => el('div', `position:absolute;left:0;top:0;font:800 ${34 + k * 14}px ${F.display};color:${C.gray}`, eye, 'z'))
    const r = rng(88)
    const stamps = SLOTS.map(([x, y, rot]) => {
      const e = el('div', `position:absolute;left:${x}px;top:${y}px;display:flex;align-items:center;gap:14px;padding:8px 26px 12px;
        border:5px solid ${C.yellow};border-radius:16px;font:800 62px/1.1 ${F.display};color:${C.yellow};white-space:nowrap;
        box-shadow:0 0 30px ${C.yellow}44, inset 0 0 18px ${C.yellow}22;text-shadow:0 0 18px ${C.yellow}66`, dom,
        `อ่านแล้ว ${CHECKS(C.yellow, 70)}`)
      return { e, rot: rot + (r() - 0.5) * 3 }
    })
    const svg = el('div', 'position:absolute;inset:0', dom,
      `<svg width="1920" height="1080" fill="none" stroke="${C.red}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></svg>`)
    const host = svg.firstElementChild!
    const marks = new Map<string, { g: SVGGElement; paths: { p: SVGPathElement; len: number }[]; note: HTMLElement; at: number }>()

    return {
      update(f) {
        const t = f.t, b = f.beat, bps = f.t > 0 ? f.beat / f.t : 2, kick = pulse(b, 7)
        const li = f.li

        // receipts wall ripple + slow drift
        for (let i = 0; i < COLS * ROWS; i++) {
          const w = pulse(Math.max(0, b - dist[i] * 0.045), 4) * (1 - seg(dist[i], 4, 22) * 0.6)
          grid.setColorAt(i, col.copy(dim).lerp(hot, w * 0.75))
        }
        grid.instanceColor!.needsUpdate = true
        grid.rotation.set(-0.12 + f.p * 0.06, Math.sin(f.local * 0.3) * 0.08, 0)
        cam.position.set(Math.sin(b * 7.3) * kick * 0.04, Math.cos(b * 5.1) * kick * 0.04, 10 - f.p * 0.6)

        // stamps: one per beat from each line's start, accumulating
        let slot = 0
        f.lines.forEach((line, i) => {
          const b0 = Math.ceil(line.start * bps - 1e-6)
          for (let k = 0; k < PER_LINE[i] && slot < stamps.length; k++, slot++) {
            const s = stamps[slot], tb = (b0 + k) / bps
            const kk = seg(t, tb, tb + 0.1)
            s.e.style.display = kk > 0 ? 'flex' : 'none'
            if (kk <= 0) continue
            const settle = seg(t, tb + 0.1, tb + 0.3)
            s.e.style.opacity = String(kk)
            s.e.style.transform = `translate(-50%,-50%) rotate(${s.rot}deg) scale(${lerp(2.1, 1, ease.out(kk)) + Math.sin(settle * Math.PI) * 0.05})`
          }
        })

        // sleeping eye: breathing + drifting z's
        eye.style.transform = `scale(${1 + Math.sin(f.local * 2.4) * 0.025})`
        zs.forEach((z, k) => {
          const ph = (f.local * 0.45 + k / 3) % 1
          z.style.transform = `translate(${330 + ph * 80 + k * 8}px, ${-20 - ph * 100}px)`
          z.style.opacity = String(Math.sin(ph * Math.PI))
        })

        // red pen: measured once per line, drawn on as the pen words appear
        const line = f.lines[li]
        if (line && !marks.has(line.id)) {
          const m = measurePen(line, dom), { d, note } = penMarks(li, m)
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
          host.appendChild(g)
          const paths = (Array.isArray(d) ? d : [d]).map(dd => {
            const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            p.setAttribute('d', dd); g.appendChild(p)
            return { p, len: p.getTotalLength() }
          })
          const nt = el('div', `position:absolute;left:${note[0]}px;top:${note[1]}px;font:400 50px ${F.pen};color:${C.red};white-space:nowrap`, svg, NOTES[li])
          marks.set(line.id, { g, paths, note: nt, at: m.at })
        }
        marks.forEach((m, id) => {
          const on = id === line?.id && t < line.end + 0.35
          m.g.style.display = on ? 'inline' : 'none'
          m.note.style.display = on ? 'block' : 'none'
          if (!on) return
          const k = ease.out(seg(t, m.at + 0.05, m.at + 0.5))
          m.paths.forEach(({ p, len }, i) => {
            const kk = clamp(k * m.paths.length - i * 0.8)
            p.style.strokeDasharray = `${len}`; p.style.strokeDashoffset = `${len * (1 - kk)}`
          })
          const nk = ease.elastic(seg(t, m.at + 0.3, m.at + 0.7))
          m.note.style.opacity = String(clamp(nk * 2))
          m.note.style.transform = `rotate(-6deg) scale(${0.7 + 0.3 * nk})`
        })
      },
    }
  },
} satisfies SceneDef
