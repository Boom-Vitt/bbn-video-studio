// Bridge: Friday 16:59, OmniMind's letter arrives — clause 12.4(ข) — then the building, desk, plant and old sedan
// get tagged "ของเรา ✓" one by one and float off into the dark.
import * as THREE from 'three'
import { C, F, canvasTexture, clamp, ease, el, lerp, pulse, rng, seg, slate } from '../kit'
import type { LineCue, SceneDef } from '../types'

const wseg = new Intl.Segmenter('th', { granularity: 'word' })
/** When the global type layer reveals the first word matching `key` (mirrors type.ts timing). */
function wordAt(l: LineCue, key: string) {
  const ws = l.text.split(/(\([^)]*\))/).filter(Boolean).flatMap(p => [...wseg.segment(p)].map(s => s.segment)).filter(s => s.trim())
  const i = Math.max(0, ws.findIndex(w => w.includes(key) || key.startsWith(w)))
  return l.start + (i / ws.length) * Math.max(0.6, (l.end - l.start) * 0.82)
}

const std = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.7, flatShading: true, ...extra })
function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  return m
}

const LIGHT = '#C3C8D3', MID = '#8A91A0', DARK = '#3A404E'

function building() {
  const g = new THREE.Group()
  const r = rng(12)
  const win = canvasTexture(256, 512, c => {
    c.fillStyle = '#9097A6'; c.fillRect(0, 0, 256, 512)
    for (let y = 0; y < 11; y++) for (let x = 0; x < 5; x++) {
      c.fillStyle = r() < 0.18 ? '#FFE9A8' : '#2A2F3B'
      c.fillRect(18 + x * 46, 20 + y * 44, 30, 26)
    }
  })
  const side = std('#ffffff', { map: win }), top = std(MID)
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.85, 0.75), [side, side, top, top, side, side]))
  g.children[0].position.y = 0.925
  g.add(box(0.55, 0.12, 0.45, std(DARK), 0, 1.91), box(0.03, 0.3, 0.03, std(MID), 0.15, 2.12))
  g.add(box(0.3, 0.32, 0.04, std(DARK), 0, 0.16, 0.38)) // door
  return g
}

function desk() {
  const g = new THREE.Group(), wood = std(LIGHT), dark = std(DARK)
  g.add(box(1.2, 0.07, 0.6, wood, 0, 0.62))
  for (const [x, z] of [[-0.54, -0.24], [0.54, -0.24], [-0.54, 0.24], [0.54, 0.24]]) g.add(box(0.06, 0.6, 0.06, dark, x, 0.3, z))
  g.add(box(0.36, 0.42, 0.5, std(MID), 0.36, 0.38, 0)) // drawer block
  g.add(box(0.56, 0.34, 0.04, dark, -0.12, 0.98, -0.12), box(0.05, 0.16, 0.05, dark, -0.12, 0.73, -0.12))
  g.add(box(0.5, 0.28, 0.01, std('#5B8CFF', { emissive: '#5B8CFF', emissiveIntensity: 0.5 }), -0.12, 0.98, -0.095))
  g.add(box(0.12, 0.14, 0.12, wood, 0.32, 0.73, 0.1)) // mug
  return g
}

function plant() {
  const g = new THREE.Group()
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.17, 0.38, 7), std('#B9806A'))
  pot.position.y = 0.19
  g.add(pot, box(0.42, 0.04, 0.42, std(DARK), 0, 0.39))
  const leaf = std('#9DB394')
  const r = rng(7)
  for (let i = 0; i < 9; i++) {
    const h = 0.55 + r() * 0.5
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.07, h, 4), leaf)
    const a = (i / 9) * Math.PI * 2, tilt = 0.15 + r() * 0.35
    m.position.set(Math.cos(a) * 0.06, 0.4 + h / 2 - 0.05, Math.sin(a) * 0.06)
    m.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt)
    g.add(m)
  }
  return g
}

function sedan() {
  const g = new THREE.Group(), paint = std(LIGHT), dark = std(DARK), glass = std('#2B3140', { roughness: 0.2 })
  g.add(box(1.5, 0.26, 0.64, paint, 0, 0.3), box(0.78, 0.25, 0.58, glass, -0.08, 0.555), box(0.84, 0.04, 0.6, paint, -0.08, 0.69))
  g.add(box(1.56, 0.06, 0.66, dark, 0, 0.18)) // bumper line
  const wheel = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 10)
  for (const [x, z] of [[-0.48, 0.32], [0.48, 0.32], [-0.48, -0.32], [0.48, -0.32]]) {
    const w = new THREE.Mesh(wheel, dark)
    w.rotation.x = Math.PI / 2
    w.position.set(x, 0.15, z)
    g.add(w)
  }
  const head = std('#FFE9A8', { emissive: '#FFE9A8', emissiveIntensity: 0.9 }), tail = std(C.red, { emissive: C.red, emissiveIntensity: 0.9 })
  g.add(box(0.03, 0.07, 0.14, head, 0.75, 0.33, 0.2), box(0.03, 0.07, 0.14, head, 0.75, 0.33, -0.2))
  g.add(box(0.03, 0.06, 0.12, tail, -0.75, 0.35, 0.22), box(0.03, 0.06, 0.12, tail, -0.75, 0.35, -0.22))
  return g
}

const PROPS = [
  { make: building, x: -2.9, key: 'ตึก', label: 'A-001 · อาคารสำนักงาน 9 ชั้น' },
  { make: desk, x: -0.95, key: 'โต๊ะ', label: 'A-114 · โต๊ะพี่บอส' },
  { make: plant, x: 0.9, key: 'ต้น', label: 'A-207 · ต้นไม้ (ไม่มีใครรดน้ำ)' },
  { make: sedan, x: 2.8, key: 'รถ', label: 'A-301 · รถเก๋งปี 2003' },
]
const FLOOR = -0.85

export default {
  theme: 'red',
  type: { pos: 'bottom', size: 84, width: 1700 },
  create({ dom, root, stage, cue }) {
    const cam = stage.camera
    const flash = el('div', `position:absolute;inset:0;background:${C.red};opacity:0;z-index:9`, dom)
    const top = slate(dom, 'แจ้งเตือน · INCIDENT #0012 · ระดับ: วิกฤต', 'ศุกร์ 16:59', C.red)
    const topR = top.lastElementChild as HTMLSpanElement

    // ---- red digital clock (line 1), shrinks to a corner timestamp (line 2)
    const clock = el('div', `position:absolute;left:120px;top:250px;transform-origin:0 0;color:${C.red}`, dom)
    el('div', `font:500 34px ${F.ui};letter-spacing:.06em;color:${C.red};margin-bottom:-8px`, clock, 'ศุกร์')
    const digits = el('div', `position:relative;font:500 230px/1 ${F.mono};letter-spacing:-.02em`, clock,
      `<span style="position:absolute;left:0;top:0;color:#3A0F16">88:88</span>
       <span style="position:relative;text-shadow:0 0 22px ${C.red},0 0 60px ${C.red}88">16<span class="c">:</span>59</span>`)
    const colon = digits.querySelector('.c') as HTMLSpanElement
    const secs = el('div', `font:500 30px ${F.mono};letter-spacing:.14em;color:${C.red};opacity:.8;margin-top:10px`, clock)
    const notes = el('div', `position:absolute;left:120px;top:300px;width:440px;font:400 17px/2.1 ${F.mono};color:#B9646C;
      letter-spacing:.04em;opacity:0`, dom,
      `<div style="border-top:1px solid #4A1820">ได้รับ ········· ศุกร์ 16:59:59</div>
       <div style="border-top:1px solid #4A1820">ผู้ส่ง ········· OmniMind Co., Ltd.</div>
       <div style="border-top:1px solid #4A1820">อ้างอิง ········ สัญญา หน้า 47</div>
       <div style="border-top:1px solid #4A1820">ผู้รับทราบ ···· 47 คน</div>
       <div style="border-top:1px solid #4A1820;border-bottom:1px solid #4A1820;color:${C.red}">สถานะ ········· มีผลทันที</div>`)

    // ---- envelope (flap-side view), flies in and opens. Children stacked by z-index, no shared 3D context.
    const EW = 640, EH = 400, EX = 940, EY = 250
    const env = el('div', `position:absolute;left:${EX}px;top:${EY}px;width:${EW}px;height:${EH}px`, dom)
    const back = el('div', `position:absolute;inset:0;background:#D8CDB6;border-radius:6px;z-index:0;
      box-shadow:0 40px 80px #000a`, env)
    const LW = 900, LH = 620, LS = 0.58, LX0 = (EW - LW * LS) / 2, LY0 = 18
    const letter = el('div', `position:absolute;left:${LX0}px;top:${LY0}px;width:${LW}px;height:${LH}px;transform-origin:0 0;
      background:${C.paper};border-radius:4px;box-sizing:border-box;padding:46px 58px;color:${C.paperInk};z-index:2;
      box-shadow:0 30px 70px #000c;font:400 22px/1.6 ${F.ui}`, env,
      `<div style="display:flex;justify-content:space-between;align-items:center">
         <div style="display:flex;gap:14px;align-items:center;font:500 30px ${F.display}">
           <svg width="40" height="40" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="9" fill="${C.paperInk}"/>
           <circle cx="20" cy="20" r="9" fill="none" stroke="${C.paper}" stroke-width="4"/><circle cx="20" cy="20" r="2.6" fill="${C.red}"/></svg>
           OmniMind Co., Ltd.</div>
         <div style="font:400 15px ${F.mono};color:#6B6660;text-align:right;line-height:1.5">เลขที่ OM/2027-0412<br>ศุกร์ · 16:59</div>
       </div>
       <div style="height:2px;background:${C.paperInk};margin:20px 0 22px"></div>
       <div style="font:600 22px ${F.ui}">เรื่อง&nbsp; การโอนกรรมสิทธิ์ทรัพย์สิน</div>
       <div style="margin:4px 0 22px">เรียน&nbsp; ผู้บริหาร บริษัทท่าน (ทุกท่าน)</div>
       <div style="font:600 37px/1.55 ${F.ui};letter-spacing:-.005em">ตามสัญญา<span class="cl" style="position:relative;white-space:nowrap">ข้อ 12.4(ข)</span>
         ทรัพย์สินทั้งหมดของบริษัทท่านโอนเป็นของเรา <span class="now" style="position:relative;display:inline-block;line-height:1.15;color:${C.red};white-space:nowrap">มีผลทันที</span></div>
       <div style="margin-top:26px;font:400 17px/1.6 ${F.mono};color:#7A746C">* อ้างอิงสัญญา หน้า 47 บรรทัดที่ 3 (ขนาดตัวอักษร 4pt)<br>
         * ท่านได้ตอบ “รับทราบครับ” แล้ว ขอบคุณครับ 🙏</div>
       <div style="position:absolute;left:58px;bottom:40px;display:flex;align-items:flex-end;gap:22px">
         <div>ขอแสดงความนับถือ<div style="font:400 15px ${F.mono};color:#7A746C">ฝ่ายกฎหมาย OmniMind (ร่างโดย AI)</div></div>
         <svg width="170" height="60" viewBox="0 0 170 60"><path d="M4 44 C 20 6, 30 6, 34 40 S 52 52, 60 22 S 80 4, 88 38 S 110 50, 124 20 L 166 30"
           fill="none" stroke="${C.paperInk}" stroke-width="2.4" stroke-linecap="round"/></svg>
       </div>`)
    const pocket = el('div', `position:absolute;inset:0;z-index:3`, env,
      `<svg width="${EW}" height="${EH}" viewBox="0 0 ${EW} ${EH}" style="position:absolute;inset:0">
         <path d="M0 6 L${EW / 2} ${EH * 0.6} L${EW} 6 L${EW} ${EH - 6} Q${EW} ${EH} ${EW - 6} ${EH} L6 ${EH} Q0 ${EH} 0 ${EH - 6} Z" fill="#EAE2D0"/>
         <path d="M0 ${EH} L${EW * 0.42} ${EH * 0.5} M${EW} ${EH} L${EW * 0.58} ${EH * 0.5}" stroke="#CFC4AC" stroke-width="2"/>
       </svg>
       <div style="position:absolute;left:34px;bottom:30px;font:400 17px/1.55 ${F.mono};color:#5E5850">
         จาก&nbsp; OmniMind Co., Ltd.<br>ถึง&nbsp;&nbsp; ผู้บริหาร บริษัทท่าน</div>
       <div style="position:absolute;right:30px;bottom:30px;padding:6px 14px;border:3px solid ${C.red};color:${C.red};
         font:800 26px ${F.display};transform:rotate(-4deg)">ด่วนที่สุด</div>`)
    const flap = el('div', `position:absolute;left:0;top:0;width:${EW}px;height:${EH * 0.62}px;transform-origin:50% 0;z-index:4`, env,
      `<svg width="${EW}" height="${EH * 0.62}" viewBox="0 0 ${EW} ${EH * 0.62}" style="position:absolute;inset:0;overflow:visible">
         <path class="fl" d="M0 4 Q0 0 6 0 L${EW - 6} 0 Q${EW} 0 ${EW} 4 L${EW / 2 + 14} ${EH * 0.6} Q${EW / 2} ${EH * 0.62} ${EW / 2 - 14} ${EH * 0.6} Z" fill="#E1D7C2"/>
       </svg>
       <div class="seal" style="position:absolute;left:${EW / 2 - 34}px;top:${EH * 0.62 - 86}px;width:68px;height:68px;border-radius:50%;
         background:${C.red};display:grid;place-items:center;font:500 20px ${F.mono};color:#fff;box-shadow:0 3px 0 #9b1f26">OM</div>`)
    const flapPath = flap.querySelector('.fl') as SVGPathElement
    const seal = flap.querySelector('.seal') as HTMLDivElement

    // red pen on the letter: circle around the clause, underline under "มีผลทันที", margin note
    const penCss = `position:absolute;overflow:visible;pointer-events:none`
    const pen = (host: string, css: string, vb: string, d: string) => el('div', `position:absolute;${css}`, letter.querySelector(host) as HTMLElement,
      `<svg viewBox="${vb}" preserveAspectRatio="none" style="width:100%;height:100%;overflow:visible"><path d="${d}" fill="none" stroke="${C.red}"
        stroke-width="4" vector-effect="non-scaling-stroke" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>`)
    const circ = pen('.cl', 'left:-9%;top:-14%;width:118%;height:128%', '0 0 230 72',
      'M200 12 C 150 -6, 30 -4, 10 22 C -6 46, 60 66, 130 62 C 210 58, 236 30, 196 8')
    const under = pen('.now', 'left:-3%;top:88%;width:106%;height:16px', '0 0 190 20', 'M2 8 C 50 2, 120 14, 186 5 M10 17 C 70 11, 130 19, 176 13')
    const penPaths = [circ, under].map(d => d.querySelector('path') as SVGPathElement)
    const margin = el('div', `position:absolute;right:46px;bottom:46px;font:400 34px/1.15 ${F.pen};color:${C.red};
      transform-origin:100% 100%;opacity:0;text-align:right`, letter, 'หน้า 47 ไง!<br><span style="font-size:23px">(ตัวเล็กที่ไม่มีใครอ่าน)</span>')

    // ---- 3D: drifting red dust (whole scene) + four low-poly assets (line 3)
    const N = 160, dr = rng(1204), base = new Float32Array(N * 3), pos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) base.set([(dr() - 0.5) * 12, (dr() - 0.5) * 7, -6 + dr() * 7], i * 3)
    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    root.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: C.red, size: 0.035, transparent: true, opacity: 0.7, depthWrite: false })))

    const world = new THREE.Group()
    root.add(world)
    const grid = new THREE.GridHelper(14, 28, '#5A1A22', '#2A0C12')
    grid.position.y = FLOOR
    world.add(grid)
    const rim = new THREE.DirectionalLight(C.red, 3.2)
    rim.position.set(-3, 2, -5)
    world.add(rim)
    const tagLayer = el('div', 'position:absolute;inset:0', dom)
    const props = PROPS.map((p, i) => {
      const g = p.make()
      g.position.set(p.x, FLOOR, 0)
      g.rotation.y = [-0.35, 0.45, 0.2, -0.55][i]
      world.add(g)
      const bb = new THREE.Box3().setFromObject(g)
      const anchor = new THREE.Object3D()
      anchor.position.set(0, bb.max.y - FLOOR + 0.05, 0)
      g.add(anchor)
      // empty footprint left behind
      const fp = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(bb.max.x - bb.min.x + 0.1, bb.max.z - bb.min.z + 0.1)),
        new THREE.LineBasicMaterial({ color: C.red, transparent: true, opacity: 0 }))
      fp.rotation.x = -Math.PI / 2
      fp.position.set((bb.max.x + bb.min.x) / 2, FLOOR + 0.005, (bb.max.z + bb.min.z) / 2)
      world.add(fp)
      const foot = new THREE.Object3D()
      foot.position.set(p.x, FLOOR - 0.12, 0.4)
      world.add(foot)
      const tag = el('div', `position:absolute;left:0;top:0;transform-origin:50% 100%;display:flex;flex-direction:column;align-items:center`, tagLayer,
        `<div style="padding:8px 18px 10px 30px;position:relative;background:${C.red};color:#fff;border-radius:6px 14px 14px 6px;
           font:800 32px/1.1 ${F.display};white-space:nowrap;box-shadow:0 0 30px ${C.red}aa">
           <span style="position:absolute;left:10px;top:50%;width:10px;height:10px;margin-top:-5px;border-radius:50%;background:${C.bloodBg}"></span>ของเรา ✓</div>
         <div style="width:2px;height:34px;background:${C.red}"></div>`)
      const label = el('div', `position:absolute;left:0;top:0;transform:translateX(-50%);font:500 15px ${F.mono};letter-spacing:.08em;
        color:#B9646C;white-space:nowrap;text-align:center`, tagLayer, p.label)
      return { g, anchor, fp, foot, tag, label, key: p.key, rot: g.rotation.y }
    })

    const v = new THREE.Vector3()
    const screen = (o: THREE.Object3D) => { o.getWorldPosition(v).project(cam); return [(v.x + 1) * 960, (1 - v.y) * 540] }

    return {
      update(f) {
        const t = f.t, [l1, l2, l3] = f.lines
        const tA = l1?.start ?? cue.start + 0.25
        const tB = l2?.start ?? lerp(cue.start, cue.end, 0.35)
        const tC = l3?.start ?? lerp(cue.start, cue.end, 0.68)
        const inC = t >= tC
        flash.style.opacity = String(0.55 * (1 - seg(t, tC, tC + 0.18)) * (t >= tC ? 1 : 0))

        // dust drifts upward, wraps
        for (let i = 0; i < N; i++) {
          const y = base[i * 3 + 1] + f.t * (0.08 + (i % 5) * 0.02)
          pos.set([base[i * 3] + Math.sin(f.t * 0.3 + i) * 0.1, ((((y + 3.5) % 7) + 7) % 7) - 3.5, base[i * 3 + 2]], i * 3)
        }
        dustGeo.attributes.position.needsUpdate = true

        // clock
        const kb = ease.inOut(seg(t, tB, tB + 0.5))
        clock.style.display = inC ? 'none' : 'block'
        clock.style.transform = `translate(0, ${lerp(0, -140, kb)}px) scale(${lerp(1, 0.38, kb)})`
        colon.style.opacity = f.beat % 1 < 0.5 ? '1' : '0.2'
        const s = Math.min(59, 53 + Math.floor(seg(t, cue.start, tB) * 7))
        secs.textContent = `วินาที :${s}  ·  ก่อนเลิกงาน ${60 - s} วิ`
        secs.style.opacity = String(0.8 * (1 - kb))
        notes.style.opacity = String(inC ? 0 : seg(t, tB + 0.6, tB + 1.1))
        notes.style.transform = `translateX(${(1 - ease.out(seg(t, tB + 0.6, tB + 1.1))) * -30}px)`
        topR.textContent = inC ? 'ศุกร์ 17:00 · โอนแล้ว' : `ศุกร์ 16:59:${s}`

        // envelope flight: lands on "จดหมาย"
        const tLand = l1 ? wordAt(l1, 'จดหมาย') : tA + 2
        const kf = seg(t, tLand - 0.75, tLand)
        const fly = ease.out(kf), wob = Math.sin(kf * Math.PI) * 18
        const k1 = ease.inOut(seg(t, tB, tB + 0.35)) // flap
        const k2 = ease.inOut(seg(t, tB + 0.3, tB + 0.8)) // letter slides out
        const k3 = ease.inOut(seg(t, tB + 0.8, tB + 1.3)) // letter takes over, envelope drops
        env.style.display = inC || kf <= 0 ? 'none' : 'block'
        const settle = Math.sin(f.beat * Math.PI) * 4 * (1 - k1)
        env.style.transform = `translate(${(1 - fly) * 1100}px, ${(1 - fly) * -380 + wob + settle * 0.5}px) rotate(${lerp(28, -3, fly) + 3 * k1}deg) scale(${lerp(0.55, 1, fly)})`
        const ang = k1 * 178
        flap.style.transform = `perspective(1400px) rotateX(${ang}deg)`
        flap.style.zIndex = ang > 90 ? '1' : '4'
        flapPath.setAttribute('fill', ang > 90 ? '#C9BEA6' : '#E1D7C2')
        seal.style.opacity = ang > 70 ? '0' : '1'
        for (const e of [back, pocket, flap]) { e.style.opacity = String(1 - k3); e.style.translate = `0 ${ease.in(k3) * 700}px` }
        // letter: inside (scaled) → out above pocket → full size at its final page position
        letter.style.zIndex = k2 >= 1 ? '5' : '2'
        const fx = 700 - EX - LX0, fy = 110 - EY - LY0
        const lx = lerp(0, fx, k3), ly = lerp(-k2 * LH * LS * 0.92, fy, k3), ls = lerp(LS, 1, k3)
        letter.style.transform = `translate(${lx}px, ${ly}px) scale(${ls}) rotate(${lerp(0, 1.2, k3)}deg)`
        // pen marks keyed to the sung words
        const tCl = l2 ? wordAt(l2, 'สิบ') : tB + 1.4, tNow = l2 ? wordAt(l2, 'ของ') : tB + 2.6
        penPaths[0].style.strokeDashoffset = String(1 - ease.out(seg(t, Math.max(tCl, tB + 1.3), Math.max(tCl, tB + 1.3) + 0.45)))
        penPaths[1].style.strokeDashoffset = String(1 - ease.out(seg(t, tNow, tNow + 0.35)))
        const km = seg(t, tNow + 0.4, tNow + 0.65)
        margin.style.opacity = String(km)
        margin.style.transform = `rotate(-6deg) scale(${0.8 + 0.2 * ease.back(km)})`

        // line 3: the assets
        world.visible = inC
        tagLayer.style.display = inC ? 'block' : 'none'
        if (!inC) { stage.resetCamera(); return } // seeks can jump back from line 3
        const kc = seg(t, tC, f.lines[2]?.end ?? cue.end)
        cam.position.set(lerp(-0.35, 0.35, kc), 0.55 + kc * 0.2, lerp(8.4, 7.8, kc))
        cam.lookAt(0, 0.05, 0)
        cam.updateMatrixWorld()
        props.forEach((p, i) => {
          const ta = l3 ? wordAt(l3, p.key) : tC + 0.5 + i * 0.6
          const kt = seg(t, ta, ta + 0.22)
          const rise = ease.in(seg(t, ta + 0.45, ta + 2.2))
          p.g.position.y = FLOOR + rise * 6 + (kt > 0 && rise === 0 ? pulse(f.beat, 8) * 0.03 : 0)
          p.g.rotation.y = p.rot + rise * 0.8
          p.g.rotation.z = Math.sin(i * 2.1) * rise * 0.25
          ;(p.fp.material as THREE.LineBasicMaterial).opacity = seg(t, ta + 0.5, ta + 0.9) * 0.9
          const [x, y] = screen(p.anchor)
          p.tag.style.display = kt > 0 ? 'flex' : 'none'
          p.tag.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${0.6 + 0.4 * ease.back(kt)}) rotate(${(1 - kt) * -14 + Math.sin(i) * 3}deg)`
          p.tag.style.opacity = String(clamp(kt * 2) * (1 - seg(rise, 0.75, 1)))
          const [fx2, fy2] = screen(p.foot)
          p.label.style.transform = `translate(${fx2}px, ${fy2}px) translateX(-50%)`
          p.label.style.color = rise > 0 ? C.red : '#B9646C'
          p.label.textContent = rise > 0.05 ? `${PROPS[i].label.split(' · ')[0]} · โอนแล้ว → OmniMind` : PROPS[i].label
        })
      },
    }
  },
} satisfies SceneDef
