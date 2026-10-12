// Breakdown: "why did nobody tell me?" — the evidence board. Email, then bold red, then a giant subject line…
// and finally the boss's own "รับทราบครับ 👍", pinned dead centre and circled in red pen.
import { C, F, clamp, ease, el, lerp, rng, seg, slate } from '../kit'
import type { LineCue, SceneDef } from '../types'

const wseg = new Intl.Segmenter('th', { granularity: 'word' })
/** When the global type layer reveals the first word matching `key` (mirrors type.ts timing). */
function wordAt(l: LineCue, key: string) {
  const ws = l.text.split(/(\([^)]*\))/).filter(Boolean).flatMap(p => [...wseg.segment(p)].map(s => s.segment)).filter(s => s.trim())
  const i = Math.max(0, ws.findIndex(w => w.includes(key) || key.startsWith(w)))
  return l.start + (i / ws.length) * Math.max(0.6, (l.end - l.start) * 0.82)
}

const INK = C.paperInk, GRAY = '#77716A', STICKY = '#F6DA6A'
const SUBJECT = '‼️ อ่านด่วน: สัญญานี้ยกบริษัทให้เขา ‼️'

interface Ex { cx: number; cy: number; w: number; h: number; rot: number }
const CASE: Ex = { cx: 330, cy: 968, w: 420, h: 118, rot: -1.5 }
const A: Ex = { cx: 370, cy: 600, w: 480, h: 520, rot: -3 }
const B: Ex = { cx: 960, cy: 592, w: 500, h: 540, rot: 2 }
const Cx: Ex = { cx: 1550, cy: 604, w: 500, h: 520, rot: -1.5 }
const D: Ex = { cx: 960, cy: 690, w: 920, h: 380, rot: -2.5 }
const ALL = [CASE, A, B, Cx, D]

/** Pin point: top-centre of the (rotated) sheet. */
function pinOf(e: Ex): [number, number] {
  const d = e.h / 2 - 14, r = (e.rot * Math.PI) / 180
  return [e.cx + d * Math.sin(r), e.cy - d * Math.cos(r)]
}

const header = (where: string, date: string, subjCss = `font:600 25px ${F.ui}`, subj = 'เรื่อง: ข้อ 12.4 อันตราย') => `
  <div style="display:flex;justify-content:space-between;font:500 13px ${F.mono};letter-spacing:.1em;color:${GRAY}">
    <span>อีเมล · ${where}</span><span>หน้า 1/1</span></div>
  <div style="height:2px;background:${INK};margin:10px 0 12px"></div>
  <div style="font:400 17px/1.65 ${F.ui};color:${INK}">
    <div><span style="color:${GRAY}">จาก:</span> ฝ่ายกฎหมาย (ก่อนถูกยุบ)</div>
    <div><span style="color:${GRAY}">ถึง:</span> พี่บอส</div>
    <div><span style="color:${GRAY}">วันที่:</span> ${date}</div></div>
  <div style="color:${INK};${subjCss};margin-top:6px">${subj}</div>
  <div style="height:1px;background:#CFC8BA;margin:12px 0 14px"></div>`
const bars = (n: number, seed: number) => {
  const r = rng(seed)
  return Array.from({ length: n }, () => `<div style="height:9px;margin:9px 0;border-radius:2px;background:#E2DCCF;width:${55 + r() * 40}%"></div>`).join('')
}

export default {
  theme: 'paper',
  type: { pos: 'top', size: 88, width: 1500 },
  create({ dom, cue }) {
    // cork, baked once into a tile (deterministic speckle)
    const cv = document.createElement('canvas')
    cv.width = cv.height = 256
    const g = cv.getContext('2d')!, r = rng(124)
    g.fillStyle = '#C39A6B'; g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 3200; i++) {
      g.fillStyle = r() < 0.55 ? `rgba(96,58,26,${0.18 + r() * 0.3})` : `rgba(245,214,165,${0.2 + r() * 0.3})`
      const s = 1 + r() * 2.4
      g.fillRect(r() * 256, r() * 256, s, s * (0.6 + r() * 0.8))
    }
    el('div', `position:absolute;inset:0;background:#C39A6B url(${cv.toDataURL()})`, dom)
    el('div', 'position:absolute;inset:0;background:radial-gradient(ellipse at 50% 58%, transparent 50%, rgba(70,40,15,.5))', dom)
    slate(dom, 'หลักฐาน · แฟ้มคดีข้อ 12.4 · ห้องประชุมเล็ก', 'ศุกร์ 17:05', '#3B2614')
    // paper strip the sung line sits on (static: the type layer doesn't shake)
    const strip = el('div', `position:absolute;left:64px;right:64px;top:102px;height:172px;background:#FBF8F1;transform:rotate(-.3deg);
      box-shadow:0 12px 22px rgba(60,35,10,.3)`, dom)
    for (const side of ['left:-18px', 'right:-18px']) el('div', `position:absolute;${side};top:-10px;width:96px;height:38px;background:rgba(236,226,196,.82);
      transform:rotate(${side.startsWith('l') ? -8 : 7}deg);box-shadow:0 1px 2px #0002`, strip)
    const count = el('div', `position:absolute;right:40px;top:22px;font:500 14px ${F.mono};letter-spacing:.16em;color:${GRAY}`, strip)

    // everything pinned lives on `wall` (gets the impact shake / slow push)
    const wall = el('div', 'position:absolute;inset:0;transform-origin:50% 62%', dom)
    const place = (e: Ex, css: string, html: string) => el('div', `position:absolute;left:${e.cx - e.w / 2}px;top:${e.cy - e.h / 2}px;
      width:${e.w}px;height:${e.h}px;box-sizing:border-box;${css}`, wall, html)
    const paper = `background:#FBF8F1;padding:30px 32px;box-shadow:0 3px 0 #0001, 0 18px 30px rgba(60,35,10,.35);overflow:hidden`
    const slots = [A, B, Cx].map((e, i) => place(e, `border:2px dashed rgba(59,38,20,.45);border-radius:6px;transform:rotate(${e.rot}deg)`,
      `<div style="position:absolute;left:0;right:0;top:46%;text-align:center;font:500 16px ${F.mono};letter-spacing:.18em;color:rgba(59,38,20,.6)">
        หลักฐาน ${'กขค'[i]} · รอ</div>`))

    const caseCard = place(CASE, `background:#FBF8F1;padding:22px 26px;box-shadow:0 10px 20px rgba(60,35,10,.3);
      background-image:repeating-linear-gradient(transparent 0 33px, #9CC3E655 33px 34px)`,
      `<div style="font:500 14px ${F.mono};letter-spacing:.14em;color:${C.red}">แฟ้มคดี #12.4</div>
       <div style="font:600 22px/1.5 ${F.ui};color:${INK};margin-top:6px">ใครไม่บอกพี่? · หลักฐาน 3 ฉบับ</div>`)
    const exA = place(A, paper, header('กล่องขาเข้า', 'อังคาร 09:12') +
      `<div style="font:400 18px/1.65 ${F.ui};color:${INK}">เรียนพี่บอส<br>สัญญาข้อ 12.4(ข) ระบุว่าทรัพย์สินทั้งหมดของบริษัทจะโอนให้ผู้ขาย
       รบกวนอย่าเพิ่งเซ็นนะครับ</div>${bars(4, 1)}
       <div style="font:400 16px ${F.ui};color:${GRAY}">ด้วยความเคารพ · ฝ่ายกฎหมาย</div>`)
    const exB = place(B, paper, header('ส่งซ้ำ ครั้งที่ 2', 'พุธ 10:30', `font:600 27px ${F.ui};color:${C.red}`) +
      `<div style="font:600 29px/1.5 ${F.ui};color:${C.red}">ข้อ 12.4(ข) = ทรัพย์สินทั้งหมดของบริษัท โอนให้ผู้ขาย<br>อย่าเซ็น!!</div>${bars(3, 2)}`)
    const exC = place(Cx, paper, header('ส่งซ้ำ ครั้งที่ 3', 'พฤหัส 08:00', `font:500 15px ${F.mono};color:${GRAY};letter-spacing:.1em`, 'เรื่อง:') +
      `<div style="font:800 64px/1.12 ${F.display};color:${INK};letter-spacing:-.01em;margin-top:-6px">${SUBJECT}</div>`)
    const exs = [caseCard, exA, exB, exC]

    const stick = (e: Ex, dx: number, dy: number, rot: number, html: string, w = 196) => el('div', `position:absolute;left:${e.cx + dx}px;top:${e.cy + dy}px;
      width:${w}px;box-sizing:border-box;padding:16px 16px 18px;background:${STICKY};box-shadow:0 8px 14px rgba(60,35,10,.3);
      font:400 27px/1.2 ${F.pen};color:${C.red};text-align:center;transform-origin:50% 0;opacity:0;--r:${rot}deg`, wall, html)
    const notes = [
      stick(A, 70, 150, 5, 'ส่งแล้ว ✓<br>เปิดอ่าน ✗'),
      stick(B, 90, 170, -4, 'ครั้งที่ 2<br>เปิดอ่าน ✗'),
      stick(Cx, 70, 200, 4, 'ครั้งที่ 3!!<br>เปิดอ่าน ✗'),
    ]

    // red thread + push-pins (SVG over the paper)
    const pins = ALL.map(pinOf)
    const thread = el('div', 'position:absolute;inset:0;pointer-events:none', wall,
      `<svg width="1920" height="1080" style="position:absolute;inset:0;overflow:visible">
        <defs><radialGradient id="ev-pin" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FF9A9D"/><stop offset=".45" stop-color="${C.red}"/>
          <stop offset="1" stop-color="#9B1820"/></radialGradient></defs>
        ${pins.slice(2).map(([x, y], i) => {
          const [x0, y0] = pins[i + 1]
          return `<path class="th" d="M${x0} ${y0} Q${(x0 + x) / 2} ${Math.max(y0, y) + 45} ${x} ${y}" fill="none" stroke="#C3141C" stroke-width="3"
            pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`
        }).join('')}
        ${pins.slice(0, 4).map(([x, y]) => `<g class="pin" transform="translate(${x} ${y})" opacity="0"><g class="pk">
          <ellipse cx="5" cy="9" rx="13" ry="7" fill="rgba(50,25,5,.35)"/><circle r="13" fill="url(#ev-pin)"/></g></g>`).join('')}
      </svg>`)
    const ths = [...thread.querySelectorAll('.th')] as SVGPathElement[]
    const pinEls = [...thread.querySelectorAll('.pin')] as SVGGElement[]

    // finale: the boss's reply, pinned centre on top of everything
    const dim = el('div', `position:absolute;inset:-40px;background:rgba(242,237,226,.55);opacity:0`, wall)
    const exD = place(D, `${paper};padding:26px 34px;overflow:visible`, `
      <div style="display:flex;justify-content:space-between;font:500 13px ${F.mono};letter-spacing:.1em;color:${GRAY}">
        <span>แชท · ตอบกลับอีเมล</span><span>พฤหัส 08:00:04</span></div>
      <div style="margin:12px 0 14px;padding:4px 0 4px 14px;border-left:4px solid #CFC8BA;font:400 17px ${F.ui};color:${GRAY};
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">ตอบกลับ: ${SUBJECT}</div>
      <div style="display:flex;gap:18px;align-items:flex-start">
        <div style="flex:none;width:62px;height:62px;border-radius:16px;background:${C.ink};display:grid;place-items:center;
          font:800 30px ${F.display};color:${C.yellow}">บ</div>
        <div><div style="font:600 21px ${F.ui};color:${INK};margin-bottom:6px">พี่บอส <span style="font:400 16px ${F.ui};color:${GRAY}">VP ฝ่ายวิสัยทัศน์</span></div>
          <div class="bub" style="position:relative;display:inline-block;padding:10px 34px 14px;border-radius:26px 26px 26px 8px;background:#E8E2D4;
            font:800 100px/1.12 ${F.display};color:${INK};white-space:nowrap">รับทราบครับ 👍</div></div>
      </div>
      <div style="margin-top:14px;font:500 14px ${F.mono};letter-spacing:.08em;color:${GRAY}">อ่านแล้ว · ตอบภายใน 4 วินาที · ไฟล์แนบ: ไม่ได้เปิด</div>
      <svg width="28" height="34" viewBox="0 0 28 34" style="position:absolute;left:${D.w / 2 - 14}px;top:8px;overflow:visible">
        <ellipse cx="19" cy="22" rx="13" ry="7" fill="rgba(50,25,5,.35)"/><circle cx="14" cy="14" r="14" fill="url(#ev-pin)"/></svg>`)
    const circle = el('div', 'position:absolute;left:-7%;top:-8%;width:114%;height:122%;pointer-events:none', exD.querySelector('.bub') as HTMLElement,
      `<svg viewBox="0 0 400 140" preserveAspectRatio="none" style="width:100%;height:100%;overflow:visible">
        <path d="M330 18 C 250 -6, 70 -2, 22 40 C -14 74, 50 132, 200 134 C 340 136, 410 96, 380 46 C 364 20, 320 8, 280 10"
          fill="none" stroke="${C.red}" stroke-width="6" vector-effect="non-scaling-stroke" stroke-linecap="round"
          pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>`).querySelector('path') as SVGPathElement
    const arrow = el('div', 'position:absolute;inset:0;pointer-events:none', wall,
      `<svg width="1920" height="1080" style="position:absolute;inset:0;overflow:visible"><path d="M1560 930 C 1500 900, 1420 860, 1338 800
        M1338 800 l 30 -4 M1338 800 l 12 27" fill="none" stroke="${C.red}" stroke-width="5" stroke-linecap="round"
        pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>`).querySelector('path') as SVGPathElement
    const finalNote = stick({ cx: 1560, cy: 880, w: 0, h: 0, rot: 0 }, 0, 0, -5, '4 วินาที<br>ไม่ได้เปิดอ่าน', 250)
    finalNote.style.fontSize = '34px'

    const enter = (e: HTMLElement, x: Ex, k: number) => {
      e.style.display = k > 0 ? 'block' : 'none'
      e.style.opacity = String(clamp(k * 3))
      e.style.transform = `translateY(${(1 - ease.out(k)) * -60}px) rotate(${x.rot + (1 - k) * 7}deg) scale(${1.14 - 0.14 * ease.out(k)})`
    }

    return {
      update(f) {
        const t = f.t, L = f.lines
        const at = (i: number, k: number) => L[i]?.start ?? lerp(cue.start, cue.end, k)
        const tD = L[4] ? wordAt(L[4], 'รับ') : lerp(cue.start, cue.end, 0.9)
        const times = [at(0, 0.02), at(1, 0.2), at(2, 0.39), at(3, 0.58), tD]

        // impact shake from the latest pin + slow push-in
        const last = Math.max(...times.filter(x => x <= t), -1e9)
        const sh = Math.exp(-11 * (t - last)) * (last > -1e9 ? 1 : 0)
        wall.style.transform = `translate(${Math.sin((t - last) * 70) * 6 * sh}px, ${Math.cos((t - last) * 55) * 4 * sh}px) scale(${1 + 0.03 * f.p + 0.012 * sh})`

        exs.forEach((e, i) => enter(e, ALL[i], seg(t, times[i], times[i] + 0.2)))
        enter(exD, D, seg(t, tD, tD + 0.2))
        slots.forEach((s, i) => (s.style.opacity = String(seg(t, cue.start, cue.start + 0.3) * (t >= times[i + 1] + 0.1 ? 0 : 1))))
        pinEls.forEach((p, i) => {
          const k = seg(t, times[i] + 0.14, times[i] + 0.26)
          p.setAttribute('opacity', String(k))
          p.firstElementChild!.setAttribute('transform', `scale(${0.4 + 0.6 * ease.back(k)})`)
        })
        ths.forEach((p, i) => (p.style.strokeDashoffset = String(1 - ease.inOut(seg(t, times[i + 2] + 0.1, times[i + 2] + 0.45)))))
        count.textContent = `คำให้การ · ${Math.max(1, f.li + 1)}/5`
        notes.forEach((n, i) => {
          const k = seg(t, times[i + 1] + 0.5, times[i + 1] + 0.7)
          n.style.opacity = String(k)
          n.style.transform = `rotate(var(--r)) scale(${0.6 + 0.4 * ease.back(k)})`
        })
        dim.style.opacity = String(L[4] ? seg(t, L[4].start, L[4].start + 0.4) : seg(t, tD - 0.4, tD))
        circle.style.strokeDashoffset = String(1 - ease.out(seg(t, tD + 0.3, tD + 0.75)))
        arrow.style.strokeDashoffset = String(1 - ease.out(seg(t, tD + 0.7, tD + 0.95)))
        const kn = seg(t, tD + 0.85, tD + 1.05)
        finalNote.style.opacity = String(kn)
        finalNote.style.transform = `rotate(var(--r)) scale(${0.6 + 0.4 * ease.back(kn)})`
      },
    }
  },
} satisfies SceneDef
