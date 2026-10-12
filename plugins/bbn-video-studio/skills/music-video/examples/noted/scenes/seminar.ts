import * as THREE from 'three'
import { C, F, canvasPlane, clamp, ease, el, lerp, pulse, rng, seg, slate } from '../kit'
import { mascotSVG } from '../mascot'
import type { SceneDef } from '../types'

const DEPARTMENTS = ['การเงิน', 'บุคคล', 'กฎหมาย', 'การตลาด', 'ไอที', 'บัญชี']

export default {
  theme: 'dark',
  type: { pos: 'left', size: 78, width: 840 },
  create({ root, dom, cue }) {
    slate(dom, '01 / วิสัยทัศน์หลังสัมมนา', 'AI SUMMIT BKK · 2026')
    el('div', `position:absolute;left:120px;top:150px;font:500 16px ${F.mono};letter-spacing:.2em;color:${C.gray}`, dom, 'NEXT YEAR / SAME COMPANY')
    const title = el('div', `position:absolute;left:120px;top:195px;font:800 88px ${F.display};color:${C.yellow};letter-spacing:-.03em`, dom, 'AI-FIRST')
    const note = el('div', `position:absolute;left:120px;bottom:110px;font:400 23px ${F.pen};color:${C.gray}`, dom, 'ความมั่นใจ 100% · รายละเอียดค่อยว่ากัน')

    const badge = new THREE.Group()
    root.add(badge)
    const shell = new THREE.Mesh(new THREE.BoxGeometry(2.35, 3.1, .12), new THREE.MeshStandardMaterial({ color: C.ink3, metalness: .6, roughness: .25 }))
    badge.add(shell)
    const face = canvasPlane(750, 1000, 2.96, g => {
      g.fillStyle = C.paper; g.fillRect(0, 0, 750, 1000)
      g.fillStyle = C.yellow; g.fillRect(0, 0, 750, 225)
      g.fillStyle = C.ink; g.font = `800 84px ${F.display}`; g.fillText('AI SUMMIT', 48, 104)
      g.font = `500 35px ${F.mono}`; g.fillText('BKK 2026', 52, 166)
      g.fillStyle = C.ink; g.font = `800 154px ${F.display}`; g.fillText('VIP', 48, 450)
      g.font = `800 94px ${F.display}`; g.fillText('พี่บอส', 48, 620)
      g.fillStyle = C.gray; g.font = `400 28px ${F.ui}`; g.fillText('ฝ่ายวิสัยทัศน์ · กลับมาแล้ว', 52, 688)
      g.fillStyle = C.rule; g.fillRect(50, 746, 650, 2)
      for (let i = 0; i < 69; i++) g.fillRect(52 + i * 9.3, 795, i % 4 === 0 ? 5 : 2, 92)
      g.font = `500 22px ${F.mono}`; g.fillText('ALL ACCESS / ALL DEPARTMENTS', 52, 946)
    })
    // Keep printed areas below the bloom threshold; sparkles carry the glow.
    face.material.color.setRGB(.45, .45, .45)
    face.position.z = .071
    badge.add(face)
    const clip = new THREE.Mesh(new THREE.BoxGeometry(.32, .24, .15), new THREE.MeshStandardMaterial({ color: C.gray, metalness: .85, roughness: .15 }))
    clip.position.y = 1.64; badge.add(clip)
    for (const side of [-1, 1]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(.13, 2.2, .04), new THREE.MeshStandardMaterial({ color: C.yellow, roughness: .8, metalness: .2 }))
      strap.position.set(side * .28, 2.57, -.03); strap.rotation.z = side * -.24; badge.add(strap)
    }
    const random = rng(2026)
    const sparks = Array.from({ length: 26 }, () => {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(.025 + random() * .022), new THREE.MeshBasicMaterial({ color: C.yellow }))
      const phase = random() * Math.PI * 2, radius = 1.5 + random() * .6
      root.add(m)
      return { m, phase, radius, y: random() * 3.8 - 1.7 }
    })

    const chart = el('div', `position:absolute;left:1010px;top:166px;width:790px;height:650px`, dom)
    el('div', `position:absolute;left:295px;top:0;width:200px;padding:12px 0;text-align:center;border:1px solid ${C.yellow};font:600 23px ${F.ui};color:${C.yellow}`, chart, 'พี่บอส · วิสัยทัศน์')
    el('div', `position:absolute;left:395px;top:57px;height:62px;border-left:1px solid ${C.rule}`, chart)
    el('div', `position:absolute;left:186px;right:186px;top:119px;border-top:1px solid ${C.rule}`, chart)
    for (const x of [186, 604]) el('div', `position:absolute;left:${x}px;top:119px;height:41px;border-left:1px solid ${C.rule}`, chart)
    const cards = DEPARTMENTS.map((name, i) => {
      const card = el('div', `position:absolute;left:${i % 2 * 418}px;top:${160 + Math.floor(i / 2) * 170}px;width:372px;height:146px;perspective:900px`, chart)
      const flip = el('div', 'position:absolute;inset:0;transform-style:preserve-3d', card)
      el('div', `position:absolute;inset:0;backface-visibility:hidden;border:1px solid ${C.rule};border-radius:10px;background:${C.ink2};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:${C.white};font:600 36px ${F.ui}`, flip,
        `<span>${name}</span><span style="font:400 13px ${F.mono};color:${C.gray}">DEPARTMENT / 0${i + 1}</span>`)
      el('div', `position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg);border:1px solid ${C.yellow};border-radius:10px;background:#262315;display:flex;align-items:center;justify-content:center;gap:22px;color:${C.yellow};font:600 22px ${F.ui}`, flip,
        `${mascotSVG(82)}<div>${name}<div style="font:400 16px ${F.ui};color:${C.gray};margin-top:8px">น้องสรุปจัดการแล้ว</div></div>`)
      return flip
    })
    const tally = el('div', `position:absolute;right:120px;bottom:110px;font:500 17px ${F.mono};color:${C.yellow}`, dom)

    return {
      update(f) {
        const first = f.lines[0], second = f.lines[1]
        const enter = ease.out(seg(f.t, cue.start, first ? lerp(first.start, first.end, .16) : cue.start + f.dur * .15))
        const chartStart = second?.start ?? cue.start + f.dur * .5
        const swap = seg(f.t, chartStart, chartStart + (second ? second.end - second.start : f.dur / 2) * .06)
        badge.visible = swap < 1
        badge.position.set(2.42 + (1 - enter) * 2, .45 + (1 - enter) * 2, 0)
        badge.rotation.set(.07, Math.sin(f.beat * Math.PI / 2) * .16, Math.sin(f.beat * Math.PI) * .07 + (1 - enter) * -.55)
        badge.scale.setScalar(1 - swap * .2)
        title.style.transform = `translateY(${(1 - enter) * 35}px) scale(${1 + pulse(f.beat) * .014})`
        note.style.opacity = String(1 - swap)
        chart.style.opacity = String(swap)
        chart.style.transform = `translateX(${(1 - ease.out(swap)) * 90}px)`
        const beats = Math.max(0, (f.t - chartStart) * (f.t > 0 ? f.beat / f.t : 2))
        let count = 0
        cards.forEach((card, i) => {
          const flip = clamp((beats - i) / .65)
          card.style.transform = `rotateY(${ease.inOut(flip) * 180}deg)`
          if (flip === 1) count++
        })
        tally.textContent = `AI COVERAGE / ${count} OF 6`
        tally.style.opacity = String(swap)
        sparks.forEach(({ m, phase, radius, y }) => {
          m.visible = swap < 1
          m.position.set(2.42 + Math.cos(phase + f.beat * .08) * radius, .45 + y + Math.sin(f.beat * .35 + phase) * .15, .25)
          m.rotation.z = f.beat + phase
          m.scale.setScalar(enter * (1 - swap) * (.5 + .9 * Math.max(0, Math.sin(f.beat * Math.PI + phase))))
        })
      },
    }
  },
} satisfies SceneDef
