import * as THREE from 'three'
import { C, F, clamp, ease, el, lerp, pulse, seg, slate } from '../kit'
import type { SceneDef } from '../types'

export default {
  theme: 'dark',
  type: { pos: 'bottom', size: 76, width: 1680 },
  create({ root, dom, cue }) {
    slate(dom, '03 / บีบวิสัยทัศน์ให้สั้นลง', 'EXECUTIVE SUMMARY / MINIMUM EFFORT')
    const steps = el('div', `position:absolute;left:120px;right:120px;top:140px;display:flex;align-items:center;gap:42px;font:600 35px ${F.ui};color:${C.dim}`, dom)
    const labels = ['92 หน้า', '3 ข้อ', '1 บรรทัด', '🚀'].map((text, i) => {
      if (i) el('span', `font:400 30px ${F.mono};color:${C.dim}`, steps, '→')
      return el('span', 'white-space:nowrap', steps, text)
    })
    el('div', `position:absolute;left:120px;top:265px;font:500 15px ${F.mono};letter-spacing:.14em;color:${C.gray}`, dom, 'HYDRAULIC SUMMARY PRESS')
    const readout = el('div', `position:absolute;left:120px;top:303px;font:500 44px ${F.mono};color:${C.yellow}`, dom)
    const aside = el('div', `position:absolute;left:120px;top:375px;width:260px;font:400 23px/1.6 ${F.pen};color:${C.gray}`, dom)

    const press = new THREE.Group()
    press.position.set(-1.15, -.25, 0); press.rotation.y = -.16; root.add(press)
    const steel = new THREE.MeshStandardMaterial({ color: C.rule, metalness: .25, roughness: .5 })
    const pistonMat = new THREE.MeshStandardMaterial({ color: C.gray, metalness: .35, roughness: .25 })
    const box = (w: number, h: number, d: number, x: number, y: number, material = steel) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
      m.position.set(x, y, 0); press.add(m); return m
    }
    box(2.7, .22, 1.3, 0, -.95)
    for (const x of [-1.2, 1.2]) box(.15, 2.7, .55, x, .47)
    box(2.7, .36, 1, 0, 1.88)
    const piston = box(.19, 1.05, .19, 0, 1.18, pistonMat)
    const plate = box(2.12, .23, 1.1, 0, .77)
    for (let i = 0; i < 9; i++) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(.16, .23), new THREE.MeshBasicMaterial({ color: new THREE.Color(i % 2 ? C.ink : C.yellow).multiplyScalar(.5) }))
      stripe.position.set(-.96 + i * .24, 0, .557); plate.add(stripe)
    }
    const stack = new THREE.Group()
    stack.position.y = -.82; press.add(stack)
    const paper = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.paper2).multiplyScalar(.45) })
    const sheetGeometry = new THREE.BoxGeometry(1.48, .01, 1)
    for (let i = 0; i < 92; i++) {
      const sheet = new THREE.Mesh(sheetGeometry, paper)
      sheet.position.set(Math.sin(i * 2.7) * .025, .013 * i, Math.cos(i * 1.2) * .018); stack.add(sheet)
    }

    const output = el('div', `position:absolute;left:1130px;top:285px;width:610px;height:380px;border:1px solid ${C.rule};border-radius:12px;background:${C.ink2};box-sizing:border-box;padding:34px 42px;color:${C.white}`, dom)
    el('div', `font:500 14px ${F.mono};letter-spacing:.13em;color:${C.gray};padding-bottom:23px;border-bottom:1px solid ${C.rule}`, output, 'OUTPUT / FOR THE BOSS')
    const bullets = el('div', `margin-top:34px;display:flex;flex-direction:column;gap:25px;font:600 29px ${F.ui}`, output,
      `<div><span style="color:${C.yellow}">01</span> ใช้ AI ทุกฝ่าย</div><div><span style="color:${C.yellow}">02</span> ให้บอตคิดแทน</div><div><span style="color:${C.yellow}">03</span> ปีหน้าค่อยว่ากัน</div>`)
    const line = el('div', `position:absolute;left:42px;right:42px;top:164px;font:800 45px ${F.display};white-space:nowrap;color:${C.yellow}`, output, 'ให้ AI จัดการทุกอย่าง')
    const foot = el('div', `position:absolute;left:1130px;top:699px;font:400 22px ${F.pen};color:${C.gray}`, dom)

    const rocket = new THREE.Group()
    root.add(rocket)
    const hullMat = new THREE.MeshStandardMaterial({ color: C.paper, metalness: .4, roughness: .35 })
    const redMat = new THREE.MeshStandardMaterial({ color: C.red, roughness: .45 })
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, 1.05, 8), hullMat)
    rocket.add(body)
    const nose = new THREE.Mesh(new THREE.ConeGeometry(.25, .48, 8), redMat)
    nose.position.y = .76; rocket.add(nose)
    const port = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .035, 16), new THREE.MeshStandardMaterial({ color: C.blue, emissive: C.blue, emissiveIntensity: .35, metalness: .7, roughness: .2 }))
    port.rotation.x = Math.PI / 2; port.position.set(0, .15, .25); rocket.add(port)
    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(.18, .48, 3), redMat)
      const angle = i * Math.PI * 2 / 3
      fin.position.set(Math.sin(angle) * .28, -.43, Math.cos(angle) * .28)
      fin.rotation.y = angle; fin.rotation.z = Math.PI; rocket.add(fin)
    }
    const flame = new THREE.Mesh(new THREE.ConeGeometry(.2, .9, 7), new THREE.MeshBasicMaterial({ color: C.yellow }))
    flame.position.y = -.93; flame.rotation.z = Math.PI; rocket.add(flame)
    const launch = el('div', `position:absolute;left:1170px;top:335px;font:800 62px ${F.display};color:${C.yellow}`, dom, 'ส่งวิสัยทัศน์แล้ว')

    return {
      update(f) {
        const li = Math.max(0, f.li)
        const current = f.lines[li]
        const lp = current ? seg(f.t, current.start, current.end) : f.p
        const crush = ease.inOut(seg(lp, .04, .31))
        const stage = li === 0 ? (lp < .31 ? 0 : 1) : li === 1 ? 2 : 3
        labels.forEach((label, i) => { label.style.color = i === stage ? C.yellow : i < stage ? C.white : C.dim })
        readout.textContent = ['092 → 003', '092 → 003', '003 → 001', '001 → 🚀'][stage]
        aside.textContent = ['บอสขอ “สั้นกว่านี้”', 'สามข้อ… ยังยาวไป', 'หนึ่งบรรทัด… ยังขี้เกียจ', 'วิสัยทัศน์เหลือเท่านี้'][stage]
        press.visible = li < 2
        press.scale.setScalar(li === 1 ? .86 : 1)
        plate.position.y = .77 - (li === 0 ? crush : 1) * 1.45
        piston.position.y = 1.18 - (li === 0 ? crush : 1) * .72
        piston.scale.y = 1 + (li === 0 ? crush : 1) * 1.37
        stack.scale.y = li === 0 ? lerp(1, .075, crush) : .075
        const reveal = li === 0 ? ease.out(seg(lp, .31, .43)) : 1
        output.style.opacity = String(li < 2 ? reveal : 0)
        output.style.transform = `translateY(${(1 - reveal) * 40}px) scale(${li === 1 ? 1 - seg(lp, 0, .16) * .08 : 1})`
        bullets.style.display = li === 0 ? 'flex' : 'none'
        line.style.display = li === 1 ? 'block' : 'none'
        foot.textContent = li === 0 ? '92 หน้า ถูกบีบจนเหลือ 3 ข้อ' : li === 1 ? 'โอเคครับ… สรุปได้อีก' : 'ข้อมูลหายไป 99.9% · ความมั่นใจเท่าเดิม'
        foot.style.left = li >= 2 ? '120px' : '1130px'
        rocket.visible = li >= 2
        const lift = li >= 2 ? ease.in(seg(lp, .55, 1)) : 0
        const pop = li >= 2 ? ease.back(seg(lp, 0, .13)) : 0
        rocket.position.set(1.9 + lift * 2.6, .28 + lift * 4.8, .2)
        rocket.rotation.set(.04, -.12, -.18 - lift * .25)
        rocket.scale.setScalar(clamp(pop) * 1.25)
        flame.scale.y = .45 + pulse(f.beat) * .5 + lift * 1.2
        launch.style.opacity = String(li >= 2 ? seg(lp, .79, .9) : 0)
        launch.style.transform = `rotate(-5deg) scale(${1 + pulse(f.beat) * .025})`
      },
    }
  },
} satisfies SceneDef
