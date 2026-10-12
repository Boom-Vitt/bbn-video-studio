import * as THREE from 'three'
import { C, F, canvasPlane, canvasTexture, ease, el, pulse, seg, slate } from '../kit'
import { animateMascot, mascot } from '../mascot'
import type { SceneDef } from '../types'

export default {
  theme: 'dark',
  type: { pos: 'left', size: 86, width: 830 },
  create({ root, dom }) {
    slate(dom, '02 / LEGAL · ฝ่ายกฎหมาย', 'HUMAN REVIEW / 0', C.gray)
    el('div', `position:absolute;left:120px;top:180px;font:500 16px ${F.mono};letter-spacing:.15em;color:${C.dim}`, dom, 'DEPARTMENT STATUS / REPLACED')
    const sign = el('div', `position:absolute;left:1090px;top:150px;width:650px;padding:28px 32px;border:1px solid ${C.rule};background:${C.ink2};color:${C.white};font:800 54px ${F.display}`, dom,
      `<span style="text-decoration:line-through;text-decoration-color:${C.red};text-decoration-thickness:5px">ฝ่ายกฎหมาย</span><span style="display:inline-block;margin-left:28px;padding:0 22px;transform:rotate(-8deg);background:${C.yellow};color:${C.ink}">บอต</span><div style="font:400 17px ${F.mono};color:${C.gray};margin-top:12px">4 POSITIONS → 1 SUMMARISER</div>`)
    const books = new THREE.Group()
    books.position.set(2.9, -0.65, 0)
    root.add(books)
    const titles = ['กฎหมายแพ่ง', 'กฎหมายบริษัท', 'สัญญา / 300 หน้า']
    titles.forEach((title, i) => {
      const book = new THREE.Mesh(new THREE.BoxGeometry(1.5 + i * 0.08, 0.19, 0.65), new THREE.MeshStandardMaterial({ color: i === 1 ? C.ink3 : C.paper2, roughness: 0.8 }))
      book.position.y = i * 0.21
      book.rotation.y = (i - 1) * 0.08
      books.add(book)
      const spine = canvasPlane(600, 70, 0.15, g => {
        g.fillStyle = i === 1 ? C.white : C.paperInk
        g.font = `600 32px ${F.ui}`
        g.textAlign = 'center'; g.fillText(title, 300, 47)
      })
      spine.position.set(0, i * 0.21, 0.34)
      books.add(spine)
    })
    const bot = mascot()
    bot.group.position.set(2.9, -0.12, 0.18)
    bot.group.rotation.y = -0.12
    root.add(bot.group)
    const chairs = new THREE.Group()
    root.add(chairs)
    for (let i = 0; i < 4; i++) {
      const chair = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: C.ink3, roughness: 0.7 })
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.09, 0.5), mat)
      seat.position.y = 0.32; chair.add(seat)
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.6, 0.09), mat)
      back.position.set(0, 0.65, -0.23); chair.add(back)
      for (const x of [-0.22, 0.22]) for (const z of [-0.19, 0.19]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.4, 0.045), mat)
        leg.position.set(x, 0.1, z); chair.add(leg)
      }
      chair.position.set(1.25 + i * 1.08, -2.1, 0.1)
      chair.rotation.y = -0.28; chairs.add(chair)
    }
    const empty = el('div', `position:absolute;left:1110px;top:965px;font:400 19px ${F.mono};letter-spacing:.1em;color:${C.gray}`, dom, '○ EMPTY &nbsp; ○ EMPTY &nbsp; ○ EMPTY &nbsp; ○ EMPTY')
    const text = canvasTexture(1200, 1600, g => {
      g.fillStyle = C.paper; g.fillRect(0, 0, 1200, 1600)
      g.fillStyle = C.paperInk; g.font = `400 22px ${F.ui}`
      for (let row = 0; row < 48; row++) g.fillText(`${String(row + 1).padStart(3, '0')}  คู่สัญญาตกลงตามเงื่อนไขและข้อกำหนด OmniMind Co., Ltd.`, 28, 42 + row * 32)
    })
    const contract = new THREE.Group()
    contract.position.set(3.45, 0.25, -0.25)
    contract.rotation.z = -0.13
    root.add(contract)
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 2.7, 64, 1, true), new THREE.MeshStandardMaterial({ map: text, side: THREE.DoubleSide, roughness: 0.85 }))
    contract.add(cylinder)
    for (const y of [-1.35, 1.35]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.015, 6, 64), new THREE.MeshBasicMaterial({ color: C.yellow }))
      rim.rotation.x = Math.PI / 2; rim.position.y = y; contract.add(rim)
    }
    const speed = Array.from({ length: 8 }, (_, i) => el('div', `position:absolute;left:${1120 + (i % 3) * 40}px;top:${390 + i * 32}px;width:${80 + (i % 4) * 36}px;height:2px;background:${C.yellow};transform-origin:right`, dom))
    const page = el('div', `position:absolute;right:95px;top:320px;font:500 19px ${F.mono};color:${C.yellow}`, dom)
    const summary = el('div', `position:absolute;left:1080px;top:705px;width:660px;padding:24px 28px;border:1px solid ${C.yellow};border-radius:12px;background:${C.ink2};color:${C.white};font:600 30px/1.55 ${F.ui};box-shadow:0 0 40px ${C.yellow}18`, dom,
      `<div style="font:500 15px ${F.mono};letter-spacing:.12em;color:${C.yellow};margin-bottom:10px">AI SUMMARY / 300 PAGES</div>สรุป: สัญญามาตรฐาน<br>ปกติธรรมดา ✅ ไม่มีอะไรน่าห่วง`)
    return {
      update(f) {
        const second = f.lines[1], p = second ? seg(f.t, second.start, second.end) : seg(f.p, 0.5, 1)
        const reading = p > 0 && p < 0.52, reveal = ease.back(seg(p, 0.48, 0.62))
        const move = ease.inOut(seg(p, 0, 0.18))
        sign.style.opacity = String(1 - move)
        sign.style.transform = `translateY(${-move * 50}px)`
        books.position.x = 2.9 - move * 1.5
        books.position.y = -0.65 - move * 0.15
        bot.group.position.set(books.position.x, -0.12 - move * 0.15, 0.18)
        bot.group.rotation.y = -0.12 + (reading ? -0.28 : 0)
        animateMascot(bot, f.beat, reading ? 1.4 : 0.3)
        chairs.visible = p === 0
        empty.style.opacity = p === 0 ? '1' : '0'
        contract.visible = p > 0
        cylinder.rotation.y = -p * Math.PI * 22
        contract.scale.setScalar(0.8 + move * 0.2)
        page.style.opacity = p > 0 ? '1' : '0'
        page.textContent = `${Math.min(300, Math.ceil(seg(p, 0, 0.5) * 300))} / 300 หน้า`
        speed.forEach((s, i) => {
          s.style.opacity = reading ? String((0.3 + pulse(f.beat + i / 8)) * (1 - seg(p, 0.4, 0.52))) : '0'
          s.style.transform = `translateX(${-((f.beat * 120 + i * 23) % 100)}px) scaleX(${1 + pulse(f.beat + i / 8)})`
        })
        summary.style.opacity = String(seg(p, 0.48, 0.55))
        summary.style.transform = `translateY(${(1 - reveal) * 35}px) scale(${0.96 + reveal * 0.04})`
      },
    }
  },
} satisfies SceneDef
