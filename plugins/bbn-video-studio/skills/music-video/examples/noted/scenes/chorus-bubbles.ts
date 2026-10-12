// Chorus A, the hero shot: a vortex of "noted" bubbles punches toward camera on every kick.
// Line 2 pages fly through unread, line 3 the read receipt + hearts, line 4 every bubble forgets what it said.
import * as THREE from 'three'
import { C, F, canvasTexture, clamp, ease, el, lerp, pulse, rng, roundRect, seg, slate } from '../kit'
import type { SceneDef } from '../types'

const TEXTS = ['รับทราบครับ', 'รับทราบค่ะ', '🙏', '👍', 'รับทราบ', 'รับทราบครับ 🙏', 'รับทราบค่ะพี่', '🙏🙏']
const N = 170, L = 64, NEAR = 8.6 // bubble count, tunnel length, depth where bubbles vanish
const H = 0.56 // bubble height (world)
const PAGES = 34

type Style = { bg: string; fg: string; stroke?: string }

/** One bubble in three states (said / blank / "?"), same canvas size so meshes can swap maps. */
function bubbleSet(text: string, s: Style) {
  const m = document.createElement('canvas').getContext('2d')!
  m.font = `600 64px ${F.ui}`
  const w = Math.max(220, Math.ceil(m.measureText(text).width) + 120), h = 170
  const make = (state: 0 | 1 | 2) => canvasTexture(w, h, g => {
    g.fillStyle = s.bg; roundRect(g, 8, 8, w - 16, h - 40, 60); g.fill()
    g.beginPath(); g.moveTo(44, h - 36); g.lineTo(30, h - 6); g.lineTo(84, h - 36); g.fill()
    if (s.stroke) { g.strokeStyle = s.stroke; g.lineWidth = 6; roundRect(g, 8, 8, w - 16, h - 40, 60); g.stroke() }
    g.fillStyle = s.fg; g.textBaseline = 'middle'; g.textAlign = 'center'
    if (state === 0) { g.font = `600 64px ${F.ui}`; g.fillText(text, w / 2, 8 + (h - 48) / 2 + 4) }
    if (state === 1) { g.globalAlpha = 0.35; g.fillRect(56, (h - 40) / 2 - 2, w - 112, 12); g.globalAlpha = 1 }
    if (state === 2) { g.font = `800 92px ${F.display}`; g.fillText('?', w / 2, 8 + (h - 48) / 2 + 6) }
  })
  return { tex: [make(0), make(1), make(2)], aspect: w / h }
}

function pageTex(n: number, total: number) {
  return canvasTexture(300, 400, g => {
    g.fillStyle = '#CFC8B8'; g.fillRect(0, 0, 300, 400)
    g.fillStyle = '#A7A090'
    const r = rng(n)
    for (let y = 92; y < 360; y += 18) g.fillRect(28, y, 244 * (0.55 + r() * 0.45), 7)
    g.fillStyle = C.ink; g.font = `800 46px ${F.display}`; g.fillText(String(n), 26, 66)
    g.font = `500 18px ${F.mono}`; g.fillStyle = '#6B6558'; g.fillText(`/ ${total}`, 30 + g.measureText(String(n)).width * 2.6, 64)
  })
}

const HEART = `<svg viewBox="0 0 24 22" width="100%" height="100%"><path fill="currentColor" d="M12 21.6 10.3 20C4.2 14.5 0 10.8 0 6.3 0 2.7 2.8 0 6.4 0c2 0 4 .9 5.6 2.4C13.6.9 15.6 0 17.6 0 21.2 0 24 2.7 24 6.3c0 4.5-4.2 8.2-10.3 13.7z"/></svg>`

export default {
  theme: 'dark',
  type: { pos: 'center', size: 128, width: 1500 },
  create({ stage, root, dom, variant }) {
    const cam = stage.camera
    const v1 = variant > 0, total = v1 ? 300 : 92
    const STYLES: Style[] = v1
      ? [{ bg: '#1C2B57', fg: '#DCE6FF' }, { bg: '#1C2B57', fg: '#DCE6FF' }, { bg: '#2F4FA8', fg: C.white }, { bg: C.ink, fg: C.blue, stroke: C.blue }, { bg: C.ink, fg: C.blue, stroke: C.blue }]
      : [{ bg: C.ink3, fg: '#C9CFDB' }, { bg: C.ink3, fg: '#C9CFDB' }, { bg: C.ink3, fg: '#C9CFDB' }, { bg: '#C9AC2C', fg: C.ink }, { bg: C.ink, fg: C.yellow, stroke: C.yellow }, { bg: C.ink, fg: C.yellow, stroke: C.yellow }]
    const sets = TEXTS.flatMap(t => STYLES.map(s => bubbleSet(t, s)))
    const r = rng(v1 ? 300 : 92)

    const bubbles = Array.from({ length: N }, () => {
      const set = sets[Math.floor(r() * sets.length)]
      const mat = new THREE.MeshBasicMaterial({ map: set.tex[0], transparent: true, depthWrite: false })
      const m = new THREE.Mesh(new THREE.PlaneGeometry(H * set.aspect, H), mat)
      root.add(m)
      return { m, mat, set, th: r() * Math.PI * 2, rad: 2.3 + r() * 2.2, z0: r() * L, tilt: (r() - 0.5) * 0.5, h: r(), state: 0 }
    })
    const pages = Array.from({ length: PAGES }, (_, j) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6),
        new THREE.MeshBasicMaterial({ map: pageTex(Math.max(1, Math.round(((j + 1) / PAGES) * total)), total), transparent: true, depthWrite: false }))
      root.add(m)
      return { m, th: r() * Math.PI * 2, rad: 2.6 + r() * 1.4, spin: (r() - 0.5) * 4 }
    })

    // DOM: slate, centre vignette for the lyric, bottom HUD that changes per line
    slate(dom, v1 ? 'Chorus 2 · รับทราบครับ' : 'Chorus · รับทราบครับ', v1 ? `สามร้อยหน้า · ${total} pages` : `เก้าสิบสองหน้า · ${total} pages`)
    el('div', `position:absolute;inset:0;background:radial-gradient(ellipse 52% 40% at 50% 50%, ${C.ink}F0 0%, ${C.ink}C0 45%, ${C.ink}00 100%)`, dom)
    const acc = v1 ? C.blue : C.yellow
    el('div', `position:absolute;left:0;right:0;bottom:0;height:340px;background:linear-gradient(to top, ${C.ink}E6, ${C.ink}00)`, dom)
    const hud = el('div', `position:absolute;left:0;right:0;bottom:64px;height:150px;display:flex;justify-content:center;align-items:flex-end;gap:56px;
      font:500 22px ${F.mono};letter-spacing:.08em;color:${C.gray}`, dom)
    const hudRow = (html: string) => el('div', 'position:absolute;inset:0;display:flex;justify-content:center;align-items:flex-end;gap:48px', hud, html)
    const big = (id: string, c: string) => `<span data-k="${id}" style="font:800 112px/0.9 ${F.display};color:${c};letter-spacing:-.02em">0</span>`
    const h1 = hudRow(`<div>ตอบแล้ว ${big('n1', C.white)} <span>คน</span></div>`)
    const h2 = hudRow(`<div>หน้า ${big('n2', C.white)} <span>/ ${total}</span></div><div style="width:1px;height:110px;background:${C.rule}"></div>
      <div>อ่าน ${big('n2b', acc)} <span>คำ</span></div>`)
    const h3 = hudRow(`<div data-k="rr" style="display:flex;align-items:flex-end;gap:22px;padding:14px 34px 18px;border:3px solid ${acc};border-radius:26px;
      box-shadow:0 0 40px ${acc}55, inset 0 0 30px ${acc}22">
      <span style="font:800 112px/0.9 ${F.display};color:${acc}">อ่านแล้ว 47</span>
      <svg width="104" height="64" viewBox="0 0 104 64" fill="none" stroke="${acc}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px">
        <path d="M4 34 L22 52 L60 12"/><path d="M36 42 L46 52 L86 12"/></svg></div>`)
    const h4 = hudRow(`<div>สิ่งที่รับทราบ <span data-k="q" style="display:inline-block;font:800 112px/0.9 ${F.display};color:${acc}">???</span></div>`)
    const q = (row: HTMLElement, k: string) => row.querySelector(`[data-k="${k}"]`) as HTMLElement
    const [n1, n2, n2b, rr, qm] = [q(h1, 'n1'), q(h2, 'n2'), q(h2, 'n2b'), q(h3, 'rr'), q(h4, 'q')]
    const rows = [h1, h2, h3, h4]
    const hearts = Array.from({ length: 48 }, (_, i) => {
      const hr = rng(1000 + i)
      const e = el('div', `position:absolute;left:0;top:0;width:44px;height:40px;color:${i % 3 ? C.pink : C.red};filter:drop-shadow(0 0 12px ${C.pink}88)`, dom, HEART)
      return { e, ang: -Math.PI / 2 + (hr() - 0.5) * 2.6, sp: 260 + hr() * 420, sz: 0.6 + hr() * 0.9, slot: Math.floor(i / 12) }
    })

    return {
      update(f) {
        const t = f.t, b = f.beat, bps = f.t > 0 ? f.beat / f.t : 2
        const st = (i: number) => f.lines[i]?.start ?? (f.t - f.local) + 0.25 + i * 4
        const en = (i: number) => f.lines[i]?.end ?? st(i) + 3.75
        const li = Math.max(0, f.li)

        // tunnel travel: steady drift + a lurch forward on every kick
        const step = (x: number) => Math.floor(x) + ease.out(x % 1)
        const travel = (x: number) => 0.9 * x + 1.7 * step(x)
        const T = travel(b), kick = pulse(b, 5)
        const spin = (v1 ? -1 : 1) * b * 0.045
        cam.rotation.z = Math.sin(b * Math.PI * 0.25) * 0.04 + kick * 0.012 * (Math.floor(b) % 2 ? 1 : -1)
        cam.position.z = 10 - kick * 0.25

        // line 4: bubbles forget what they said (said -> blank -> "?")
        const fq = seg(t, st(3) - 0.05, lerp(st(3), en(3), 0.75))
        for (const o of bubbles) {
          const z = -L + ((o.z0 + T) % L) + NEAR - 0.6
          const th = o.th + spin + z * 0.012
          o.m.position.set(Math.cos(th) * o.rad * 1.65, Math.sin(th) * o.rad, z)
          o.m.rotation.set(Math.sin(th) * 0.4, -Math.cos(th) * 0.4, o.tilt + Math.sin(b * 0.5 + o.th) * 0.08)
          o.m.scale.setScalar(1 + kick * 0.22)
          o.mat.opacity = 0.92 * seg(z, -44, -24) * (1 - seg(z, NEAR - 2.2, NEAR - 0.6))
          const s = fq <= o.h * 0.75 ? 0 : fq < o.h * 0.75 + 0.22 ? 1 : 2
          if (s !== o.state) { o.state = s; o.mat.map = o.set.tex[s]; o.mat.needsUpdate = true }
        }

        // line 2: unread pages stream through the vortex
        const pa = st(1), pe = en(1)
        pages.forEach((p, j) => {
          const born = lerp(pa - 1.2, pe - 1.0, j / PAGES), bb = born * bps
          const z = -26 + (T - travel(bb)) * 1.1
          p.m.visible = t >= born && t < st(2) && z < NEAR - 0.5
          if (!p.m.visible) return
          const th = p.th - spin * 2
          p.m.position.set(Math.cos(th) * p.rad * 1.5, Math.sin(th) * p.rad, z)
          p.m.rotation.set(Math.sin(z * 0.3 + j) * 0.6, z * 0.12 * p.spin, z * 0.05 * p.spin)
          ;(p.m.material as THREE.MeshBasicMaterial).opacity = 0.9 * seg(z, -26, -18)
        })

        // bottom HUD: one row per line, hard cut on the line start
        rows.forEach((row, i) => { row.style.display = i === li ? 'flex' : 'none' })
        const pop = ease.back(seg(t, st(li), st(li) + 0.3))
        hud.style.transform = `scale(${0.9 + 0.1 * pop})`
        hud.style.opacity = String(clamp(pop) * (1 - seg(t, en(li) + 0.05, en(li) + 0.25)))
        n1.textContent = String(Math.round(ease.out(seg(t, st(0), en(0) - 0.6)) * 47))
        n2.textContent = String(Math.max(1, Math.round(ease.inOut(seg(t, st(1), en(1) - 0.5)) * total)))
        n2b.textContent = '0'
        n2b.style.transform = `scale(${1 + kick * 0.25})`
        rr.style.transform = `scale(${lerp(1.5, 1, ease.out(seg(t, st(2), st(2) + 0.25))) + kick * 0.05}) rotate(${-2 + kick}deg)`
        qm.style.transform = `rotate(${Math.sin(b * Math.PI) * 10}deg) scale(${1 + kick * 0.3})`

        // line 3: hearts burst from the receipt on every beat
        const on3 = li === 2 && t < en(2) + 0.2
        const beat0 = Math.floor(b)
        for (const hrt of hearts) {
          const age = b - (beat0 - hrt.slot)
          const k = age / 2.2
          const show = on3 && k < 1 && (beat0 - hrt.slot) / bps >= st(2) - 0.01
          hrt.e.style.display = show ? 'block' : 'none'
          if (!show) continue
          const d = ease.out(clamp(k * 1.6)) * hrt.sp
          const x = 960 + Math.cos(hrt.ang) * d * 1.6, y = 900 + Math.sin(hrt.ang) * d + k * k * 120
          hrt.e.style.transform = `translate(${x - 22}px, ${y - 20}px) scale(${hrt.sz * (0.4 + ease.back(clamp(k * 5)) * 0.6)})`
          hrt.e.style.opacity = String(1 - seg(k, 0.55, 1))
        }
      },
    }
  },
} satisfies SceneDef
