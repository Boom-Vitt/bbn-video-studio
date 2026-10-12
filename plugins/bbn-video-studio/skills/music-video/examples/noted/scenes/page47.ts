// Pre-chorus: page 47 of 92 hides one tiny clause. A lens finds it (nobody else did), then "noted" bubbles bury it.
import * as THREE from 'three'
import { C, F, canvasPlane, canvasTexture, clamp, ease, el, lerp, rng, roundRect, seg, slate } from '../kit'
import type { SceneDef } from '../types'

const PW = 1024, PH = 1448 // page canvas px
const PHW = 4.6, PWW = (PHW * PW) / PH // page size in world units
const PAGE_X = 2.25 // page centre (world x); the lyric owns the left half
const ZOOM = 7, LENS_R = 1.45 // lens magnification, radius (world)
const BAND = 120, DS = 5 // supersampled band around the fine print: ±BAND page px at DS x resolution
const FINE = ['ข้อ 12.4(ข) ผู้ให้บริการมีสิทธิ์ใน', 'ทรัพย์สินทั้งหมดของบริษัท']
const FILLER = ['เพื่อขับเคลื่อนองค์กรสู่ความเป็นเลิศด้านเอไอ', 'ทั้งนี้ให้เป็นไปตามแนวทางที่คณะกรรมการกำหนด', 'โดยบูรณาการเชิงกลยุทธ์อย่างยั่งยืน',
  'ภายใต้กรอบธรรมาภิบาลข้อมูล', 'ผู้ใช้บริการตกลงและยอมรับเงื่อนไข', 'โดยไม่จำกัดเฉพาะกรณีดังกล่าว', 'เพื่อสร้างซินเนอร์จีข้ามสายงาน',
  'และยกระดับประสบการณ์ของผู้มีส่วนได้ส่วนเสีย', 'ตามที่ระบุไว้ในภาคผนวกที่เกี่ยวข้อง', 'อันเป็นส่วนหนึ่งของสัญญาฉบับนี้', 'ในทุกมิติของการดำเนินงาน']
const REPLIES = ['รับทราบครับ', 'รับทราบค่ะ', 'รับทราบครับ 🙏', '👍', 'รับทราบ', 'รับทราบครับผม', 'รับทราบค่ะพี่ 🙏']

/** Lays out and draws page 47; returns where the fine print sits (page px). Same call draws the hi-res band. */
function drawPage(g: CanvasRenderingContext2D) {
  const r = rng(4712), L = 112, R = PW - 104
  g.fillStyle = '#FFFDF8'; g.fillRect(0, 0, PW, PH)
  g.fillStyle = '#8C8578'; g.font = `500 13px ${F.mono}`
  g.fillText('แผนกลยุทธ์_AI_2027_final_v9_จริง.pdf', L, 70)
  g.textAlign = 'right'; g.fillText('ลับเฉพาะ · ห้ามส่งต่อ', R, 70); g.textAlign = 'left'
  g.fillStyle = '#D8D0BF'; g.fillRect(L, 86, R - L, 1)
  g.fillStyle = C.paperInk; g.font = `800 46px ${F.display}`; g.fillText('ภาคผนวก ง', L, 158)
  g.fillStyle = '#6E685C'; g.font = `400 20px ${F.ui}`; g.fillText('ข้อตกลงการใช้บริการระบบสรุปอัตโนมัติ · OmniMind Co., Ltd.', L, 198)
  g.fillStyle = '#D8D0BF'; g.fillRect(L, 226, R - L, 1)
  let y = 284
  /** Filler paragraph; returns the x where its (partial) last line ends. */
  const para = (lines: number, x = L, last = 0.4 + r() * 0.4) => {
    g.fillStyle = '#4A463F'; g.font = `400 15px ${F.ui}`
    let end = x
    for (let i = 0; i < lines; i++) {
      let s = '', w = 0
      for (;;) {
        const p = FILLER[Math.floor(r() * FILLER.length)] + ' ', pw = g.measureText(p).width
        if (w + pw > R - x) break
        s += p; w += pw
      }
      if (i === lines - 1) s = s.slice(0, Math.floor(s.length * last)).trimEnd()
      g.fillText(s, x, y)
      end = x + g.measureText(s).width
      y += 26
    }
    return end
  }
  const head = (s: string) => { g.fillStyle = C.paperInk; g.font = `600 17px ${F.ui}`; g.fillText(s, L, y); y += 30 }
  head('ข้อ 12.1 ขอบเขตของบริการ'); para(4); y += 14
  head('ข้อ 12.2 การประมวลผลข้อมูล'); para(3); y += 14
  head('ข้อ 12.3 ค่าตอบแทนและโทเคน'); para(4); y += 14
  head('ข้อ 12.4 การโอนสิทธิ์'); g.fillStyle = '#4A463F'; g.font = `400 15px ${F.ui}`; g.fillText('(ก)', L, y)
  // the tiny line rides at the end of (ก)'s last line, two rows of 7px text inside one 15px line
  const fx = para(3, L + 30, 0.42) + 10, fy = y - 26 - 7
  g.fillStyle = '#4A463F'; g.font = `400 7px ${F.ui}`
  FINE.forEach((s, i) => g.fillText(s, fx, fy + i * 9))
  const fw = Math.max(...FINE.map(s => g.measureText(s).width))
  y += 14
  head('ข้อ 12.5 การบอกเลิกสัญญา'); para(3); y += 14
  head('ข้อ 12.6 เบ็ดเตล็ด'); para(4)
  g.fillStyle = '#D8D0BF'; g.fillRect(L, PH - 104, R - L, 1)
  g.fillStyle = C.paperInk; g.font = `800 34px ${F.display}`; g.textAlign = 'right'; g.fillText('หน้า 47', PW / 2 + 22, PH - 52)
  g.fillStyle = '#8C8578'; g.font = `500 22px ${F.mono}`; g.textAlign = 'left'; g.fillText('/ 92', PW / 2 + 34, PH - 54)
  return { x: fx + fw / 2, y: fy + 1, w: fw }
}

/** Chat bubble texture plane, world height h; returns mesh + world width. */
function bubble(text: string, bg: string, fg: string, h: number) {
  const m = document.createElement('canvas').getContext('2d')!
  m.font = `600 46px ${F.ui}`
  const w = Math.ceil(m.measureText(text).width) + 120, H = 150
  const mesh = canvasPlane(w, H, h, g => {
    g.shadowColor = 'rgba(40,30,10,.28)'; g.shadowBlur = 18; g.shadowOffsetY = 8
    g.fillStyle = bg; roundRect(g, 20, 16, w - 40, H - 44, 44); g.fill()
    g.shadowColor = 'transparent'
    g.fillStyle = fg; g.font = `600 46px ${F.ui}`; g.textBaseline = 'middle'; g.fillText(text, 60, 16 + (H - 44) / 2 + 2)
  })
  return { mesh, w: (h * (w - 40)) / H }
}

const pageX = (px: number) => (px / PW - 0.5) * PWW
const pageY = (py: number) => (0.5 - py / PH) * PHW

export default {
  theme: 'paper',
  type: { pos: 'left', size: 80, width: 800 },
  create({ stage, root, dom }) {
    const cam = stage.camera
    const page = new THREE.Group()
    root.add(page)
    const layer = (m: THREE.Object3D, order: number) => { m.renderOrder = order; return m }

    // soft shadow + sheet
    const shadow = canvasPlane(600, 820, PHW * 1.12, g => {
      g.shadowColor = 'rgba(60,45,20,.35)'; g.shadowBlur = 40; g.fillStyle = 'rgba(60,45,20,.25)'; g.fillRect(52, 52, 496, 716)
    })
    shadow.position.set(0.12, -0.16, -0.02)
    let fine = { x: 0, y: 0, w: 0 }
    const sheet = canvasPlane(PW, PH, PHW, g => { fine = drawPage(g) })
    page.add(layer(shadow, 0), layer(sheet, 1))

    // magnifier: a disc showing a supersampled copy of the band around the fine print, UV-cropped per frame
    const B0 = fine.y - BAND, BH = BAND * 2
    const band = canvasTexture(PW * DS, BH * DS, g => { g.scale(DS, DS); g.translate(0, -B0); drawPage(g) })
    const lens = new THREE.Group()
    const glass = new THREE.Mesh(new THREE.CircleGeometry(LENS_R, 96), new THREE.MeshBasicMaterial({ map: band }))
    const rim = new THREE.Mesh(new THREE.TorusGeometry(LENS_R + 0.05, 0.075, 16, 96), new THREE.MeshStandardMaterial({ color: C.paperInk, roughness: 0.35, metalness: 0.4 }))
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.6, 24), new THREE.MeshStandardMaterial({ color: C.red, roughness: 0.5 }))
    handle.position.set(Math.cos(-0.8) * (LENS_R + 0.85), Math.sin(-0.8) * (LENS_R + 0.85), 0)
    handle.rotation.z = -0.8 + Math.PI / 2
    const glare = canvasPlane(512, 512, LENS_R * 2, g => {
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 14; g.lineCap = 'round'
      g.beginPath(); g.arc(256, 256, 214, Math.PI * 1.08, Math.PI * 1.42); g.stroke()
      g.lineWidth = 6; g.beginPath(); g.arc(256, 256, 214, Math.PI * 1.5, Math.PI * 1.56); g.stroke()
    })
    glare.position.z = 0.02
    const lshadow = canvasPlane(256, 256, LENS_R * 2.5, g => {
      const gr = g.createRadialGradient(128, 128, 60, 128, 128, 128)
      gr.addColorStop(0, 'rgba(50,35,10,.30)'); gr.addColorStop(1, 'rgba(50,35,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256)
    })
    const glassG = new THREE.Group()
    glassG.position.z = 0.32
    glassG.add(layer(glass, 4), layer(rim, 4), layer(handle, 4), layer(glare, 5))
    lens.add(layer(lshadow, 3), glassG)
    page.add(lens)

    // scroll-depth strip: everyone read page 1, nobody reached 47
    const SH = 1448, py = (p: number) => 40 + ((p - 1) / 91) * (SH - 80)
    const strip = canvasPlane(120, SH, PHW, g => {
      g.fillStyle = '#D8D0BF'; g.fillRect(66, py(1), 3, py(92) - py(1))
      g.fillStyle = 'rgba(255,77,82,.25)'
      g.beginPath(); g.moveTo(72, py(1)); g.lineTo(118, py(1)); g.bezierCurveTo(84, py(1.8), 76, py(2.6), 72, py(4)); g.closePath(); g.fill()
      g.fillStyle = C.paperInk; roundRect(g, 60, py(1), 15, 54, 7); g.fill()
      g.font = `500 22px ${F.mono}`; g.fillStyle = '#8C8578'; g.textAlign = 'right'
      for (const p of [1, 20, 40, 60, 80, 92]) { g.fillRect(60, py(p), 14, 2); if (Math.abs(p - 47) > 5) g.fillText(String(p), 52, py(p) + 8) }
      g.fillStyle = C.red; g.fillRect(50, py(47) - 2, 40, 4)
      g.font = `600 26px ${F.mono}`; g.fillText('47', 44, py(47) + 9)
    })
    strip.position.set(PWW / 2 + 0.36, 0, 0)
    page.add(layer(strip, 1))

    // falling "noted" bubbles (line 2), kept right of the lyric column
    const r = rng(52)
    const PALETTE: [string, string][] = [['#FFFFFF', C.paperInk], ['#FFFFFF', C.paperInk], [C.yellow, C.paperInk], [C.paperInk, C.white]]
    const minX = (1000 - 960) / 171 - PAGE_X, maxX = (1880 - 960) / 171 - PAGE_X
    const bubbles = Array.from({ length: 64 }, (_, i) => {
      const [bg, fg] = PALETTE[Math.floor(r() * PALETTE.length)]
      const { mesh, w } = bubble(REPLIES[Math.floor(r() * REPLIES.length)], bg, fg, 0.6)
      const x = lerp(minX + w / 2, maxX - w / 2, r()), y = lerp(-PHW * 0.55, PHW * 0.42, i < 8 ? 0.35 + r() * 0.3 : r())
      page.add(layer(mesh, 10 + i))
      return { m: mesh, x, y, rot: (r() - 0.5) * 0.7, z: 0.5 + i * 0.012, at: Math.pow(i / 64, 0.85) }
    })

    // DOM: slate, scroll label, hairline tag, red pen (all projected from page space each frame)
    slate(dom, 'Pre-chorus · หน้า 47 / 92', 'ภาคผนวก ง · ตัวพิมพ์เล็ก', '#8C8578')
    const scrollLbl = el('div', `position:absolute;left:0;top:0;font:500 14px/1.4 ${F.mono};color:#8C8578;white-space:nowrap`, dom,
      `ผู้อ่านที่เลื่อนมาถึง<div style="font:800 58px/1 ${F.display};color:${C.red};margin-top:2px">0%</div>`)
    const tag = el('div', 'position:absolute;left:0;top:0;width:300px;height:120px', dom,
      `<svg width="300" height="120" style="position:absolute;inset:0" fill="none" stroke="${C.paperInk}" stroke-width="1.5">
         <path d="M300 120 L 236 56 L 0 56"/><circle cx="300" cy="120" r="4" fill="${C.paperInk}"/></svg>
       <div style="position:absolute;left:0;top:12px;font:500 15px ${F.mono};color:${C.paperInk};letter-spacing:.06em;white-space:nowrap">ข้อ 12.4(ข)</div>
       <div style="position:absolute;left:0;top:64px;font:500 13px ${F.mono};color:#8C8578;letter-spacing:.06em;white-space:nowrap">ตัวอักษร 4PT · ขยาย ×700%</div>`)
    const pen = el('div', 'position:absolute;left:0;top:0;width:560px;height:240px', dom,
      `<svg width="560" height="240" viewBox='0 0 560 240' fill="none" stroke="${C.red}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;inset:0">
        <path d="M330 196 C 420 200, 500 150, 548 22"/><path d="M516 46 L 548 18 L 556 60"/></svg>
       <div style="position:absolute;left:0;top:150px;font:400 64px/1 ${F.pen};color:${C.red};transform:rotate(-5deg);white-space:nowrap">ไม่มีใครอ่าน</div>`)
    // red-pen double underline under the magnified clause (drawn in screen space, anchored inside the glass)
    const ul = el('div', 'position:absolute;inset:0', dom,
      `<svg width="1920" height="1080" fill="none" stroke="${C.red}" stroke-width="5" stroke-linecap="round"><path/><path/></svg>`)
    const ulPaths = [...ul.querySelectorAll('path')]
    const penPaths = [...pen.querySelectorAll('path')].map(p => ({ p, len: p.getTotalLength() }))
    const penWord = pen.lastElementChild as HTMLElement

    const v = new THREE.Vector3()
    const toScreen = (x: number, y: number, z = 0) => {
      v.set(x, y, z); page.localToWorld(v); v.project(cam)
      return [(v.x + 1) * 960, (1 - v.y) * 540]
    }

    const inGlass = (px: number, py: number, lx: number, ly: number) => {
      const k = (ZOOM * PHW) / PH
      v.set((px - lx) * k, -(py - ly) * k, 0.01); glassG.localToWorld(v); v.project(cam)
      return [(v.x + 1) * 960, (1 - v.y) * 540]
    }

    return {
      update(f) {
        const [l1, l2] = f.lines
        const a1 = l1?.start ?? f.t - f.local + 0.25, e1 = l1?.end ?? a1 + 3.75
        const a2 = l2?.start ?? e1 + 0.25, e2 = l2?.end ?? a2 + 3.75
        const t = f.t, at = (x: number) => lerp(a1, e1, x)

        // slow drift + a push toward the clause once the lens lands
        const push = ease.inOut(seg(t, at(0.35), e1))
        cam.position.set(lerp(-0.5, 0.35, f.p), lerp(0.3, -0.15, f.p), 10 - push * 0.8)
        cam.lookAt(cam.position.x * 0.4 + push * 0.25, cam.position.y * 0.3 - push * 0.1, 0)
        page.position.set(PAGE_X, 0.05, 0)
        page.rotation.set(lerp(-0.07, 0.03, f.p), lerp(-0.32, -0.2, f.p), lerp(0.025, -0.01, f.p))

        // lens: pops in at the start of (ก)'s row, reads along it, settles on the tiny line
        const pop = ease.back(seg(t, a1 - 0.25, a1 + 0.2))
        const k = ease.inOut(seg(t, a1 - 0.1, at(0.55)))
        const lx = lerp(250, fine.x, k) + Math.sin(k * Math.PI) * 60, ly = fine.y - 18 - Math.sin(k * Math.PI * 2) * 30
        lens.position.set(pageX(lx), pageY(ly), 0)
        lens.scale.setScalar(Math.max(0.001, pop))
        lens.rotation.set(Math.sin(k * Math.PI) * 0.06, -Math.sin(k * Math.PI) * 0.05, 0)
        const side = (2 * LENS_R * (PH / PHW)) / ZOOM
        const uw = side / PW, vh = side / BH
        band.repeat.set(uw, vh)
        band.offset.set(lx / PW - uw / 2, 1 - (ly - B0) / BH - vh / 2)

        // bubbles fall and pile up on line 2
        const span = (e2 - a2) * 0.92
        for (const b of bubbles) {
          const t0 = a2 + b.at * span, kk = seg(t, t0, t0 + 0.32)
          b.m.visible = kk > 0
          if (!b.m.visible) continue
          const land = seg(t, t0 + 0.32, t0 + 0.5)
          b.m.position.set(b.x, b.y + 4.5 * (1 - kk) ** 2, b.z)
          b.m.rotation.z = b.rot + (1 - kk) * 0.5
          b.m.scale.set(1 + Math.sin(land * Math.PI) * 0.06, 1 - Math.sin(land * Math.PI) * 0.08, 1)
        }

        // annotations ride the page
        root.updateMatrixWorld(true); cam.updateMatrixWorld()
        const bury = seg(t, a2 + 0.1, a2 + 1.1)
        const [sx, sy] = toScreen(PWW / 2 + 0.6, pageY((py(47) / SH) * PH))
        scrollLbl.style.transform = `translate(${sx}px, ${sy - 22}px)`
        scrollLbl.style.opacity = String(seg(t, at(0.15), at(0.3)) * (1 - bury))
        const d = LENS_R * 0.74
        const [tx, ty] = toScreen(pageX(lx) - d, pageY(ly) + d, 0.32)
        tag.style.transform = `translate(${tx - 300}px, ${ty - 120}px)`
        tag.style.opacity = String(seg(t, at(0.56), at(0.64)) * (1 - bury))
        const [px, pyy] = toScreen(pageX(lx) - d, pageY(ly) - d, 0.32)
        pen.style.transform = `translate(${px - 556}px, ${pyy - 18}px)`
        const draw = ease.out(seg(t, at(0.62), at(0.8)))
        penPaths.forEach(({ p, len }, i) => {
          const kk = clamp(draw * 2 - i)
          p.style.strokeDasharray = `${len}`; p.style.strokeDashoffset = `${len * (1 - kk)}`
        })
        const w = ease.elastic(seg(t, at(0.6), at(0.72)))
        penWord.style.opacity = String(clamp(w * 2))
        penWord.style.transform = `rotate(-5deg) scale(${0.8 + 0.2 * w})`
        pen.style.opacity = String(1 - bury)
        const x0 = fine.x - fine.w / 2 - 3, x1 = fine.x + fine.w / 2 + 4, ud = ease.out(seg(t, at(0.66), at(0.82)))
        ulPaths.forEach((p, i) => {
          const [ax, ay] = inGlass(x0 + i * 6, fine.y + 12 + i * 2.6, lx, ly), [bx, by] = inGlass(x1 - i * 10, fine.y + 11 + i * 2.6, lx, ly)
          p.setAttribute('d', `M${ax} ${ay} Q${(ax + bx) / 2} ${(ay + by) / 2 + 8 - i * 12} ${bx} ${by}`)
          const len = p.getTotalLength(), kk = clamp(ud * 2 - i)
          p.style.strokeDasharray = `${len}`; p.style.strokeDashoffset = `${len * (1 - kk)}`
        })
        ul.style.opacity = String(1 - bury)
      },
    }
  },
} satisfies SceneDef
