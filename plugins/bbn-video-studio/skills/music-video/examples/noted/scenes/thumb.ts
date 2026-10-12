import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { C, F, canvasPlane, ease, el, pulse, seg, slate } from '../kit'
import type { SceneDef } from '../types'

export default {
  theme: 'dark',
  type: { pos: 'left', size: 86, width: 820 },
  create({ root, dom }) {
    slate(dom, '03 / SIGNATURE · ระหว่างรอกาแฟ', 'OMNIMIND / E-SIGN', C.gray)
    el('div', `position:absolute;left:120px;top:180px;font:500 16px ${F.mono};letter-spacing:.14em;color:${C.dim}`, dom, 'ONE THUMB / THREE HUNDRED PAGES')
    const phone = new THREE.Group()
    phone.position.set(2.25, 0.05, 0)
    phone.rotation.set(0.04, -0.16, -0.06); root.add(phone)
    const body = new THREE.Mesh(new RoundedBoxGeometry(2.3, 3.65, 0.21, 4, 0.18), new THREE.MeshStandardMaterial({ color: C.ink3, metalness: 0.65, roughness: 0.28 }))
    phone.add(body)
    const screen = canvasPlane(650, 1000, 3.38, g => {
      g.fillStyle = C.ink2; g.beginPath(); g.roundRect(0, 0, 650, 1000, 35); g.fill()
      g.fillStyle = C.gray; g.font = `500 25px ${F.mono}`; g.fillText('OMNIMIND / E-SIGN', 45, 100)
      g.fillStyle = C.white; g.font = `600 48px ${F.ui}`; g.fillText('ลงนามสัญญา', 45, 210)
      g.font = `400 34px ${F.ui}`; g.fillText('OmniMind · 300 หน้า', 45, 270)
      g.strokeStyle = C.rule; g.lineWidth = 2
      for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(45, 345 + i * 35); g.lineTo(605 - (i % 3) * 65, 345 + i * 35); g.stroke() }
      g.fillStyle = C.yellow; g.beginPath(); g.roundRect(45, 745, 560, 135, 20); g.fill()
      g.fillStyle = C.ink; g.font = `600 38px ${F.ui}`; g.textAlign = 'center'; g.fillText('แตะเพื่อลงนาม', 325, 825)
      g.fillStyle = C.gray; g.font = `400 24px ${F.ui}`; g.fillText('ไม่จำเป็นต้องเปิดอ่าน', 325, 950)
    })
    screen.material.color.set('#C8C8C8')
    screen.renderOrder = 1
    screen.position.z = 0.12; phone.add(screen)
    const signed = canvasPlane(600, 145, 0.49, g => {
      g.fillStyle = C.yellow; g.beginPath(); g.roundRect(0, 0, 600, 145, 22); g.fill()
      g.fillStyle = C.ink; g.font = `600 44px ${F.ui}`; g.textAlign = 'center'; g.fillText('ลงนามแล้ว ✓', 300, 92)
    })
    signed.material.color.set('#C8C8C8')
    signed.renderOrder = 2
    signed.position.set(0, -1.08, 0.2); phone.add(signed)
    const thumb = new THREE.Group()
    const flesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.7, 8, 16), new THREE.MeshStandardMaterial({ color: '#EBC498', roughness: 0.75 }))
    flesh.rotation.z = -0.7; thumb.add(flesh)
    const print = canvasPlane(260, 320, 0.56, g => {
      g.strokeStyle = '#94744E'; g.lineWidth = 4
      for (let i = 1; i < 10; i++) {
        g.beginPath(); g.ellipse(130, 170, i * 11, i * 14, 0.1, 0.25, Math.PI * 1.92); g.stroke()
      }
    })
    print.renderOrder = 3
    print.position.set(0, 0.05, 0.27); thumb.add(print)
    phone.add(thumb)
    const coffee = new THREE.Group()
    coffee.position.set(4.35, -0.85, 0.2); coffee.rotation.x = 0.1; root.add(coffee)
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.31, 0.95, 40), new THREE.MeshStandardMaterial({ color: C.paper2, roughness: 0.4 }))
    coffee.add(cup)
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.035, 40), new THREE.MeshStandardMaterial({ color: '#30221B', roughness: 0.35 }))
    liquid.position.y = 0.485; coffee.add(liquid)
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.405, 0.03, 8, 40), new THREE.MeshStandardMaterial({ color: C.paper }))
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.49; coffee.add(rim)
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 8, 24), new THREE.MeshStandardMaterial({ color: C.paper2 }))
    handle.position.set(0.45, 0.02, 0); coffee.add(handle)
    const steam = Array.from({ length: 8 }, (_, i) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: C.white, transparent: true, opacity: 0.2, depthWrite: false }))
      coffee.add(puff); return puff
    })
    const ticket = el('div', `position:absolute;right:74px;top:795px;width:320px;padding:18px 22px;background:${C.paper};transform:rotate(5deg);font:600 26px ${F.ui};color:${C.paperInk};border-bottom:5px dotted ${C.ink}`, dom,
      `<div style="font:500 14px ${F.mono};letter-spacing:.1em;margin-bottom:8px">ORDER / 047</div>อเมริกาโน่เย็น ×1<div style="font:400 18px ${F.ui};margin-top:8px">รอรับที่เคาน์เตอร์</div>`)
    const review = el('div', `position:absolute;left:1080px;top:125px;width:650px;padding:22px 28px;border:1px solid ${C.rule};background:${C.ink2};font:600 32px/1.6 ${F.ui};color:${C.white}`, dom,
      `<span style="color:${C.gray}">ผู้ตรวจทาน:</span> —<br><span style="color:${C.gray}">ผู้คัดค้าน:</span> <span style="color:${C.yellow}">0</span><span style="float:right;color:${C.red};font:400 27px ${F.pen}">ใครดูแล?</span>`)
    const seats = new THREE.Group(); root.add(seats)
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshStandardMaterial({ color: C.dim, roughness: 0.8 })
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.07, 0.4), mat), back = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.43, 0.07), mat)
      seat.position.set(1.25 + i * 0.75, -2.2, 0.1); back.position.set(seat.position.x, -1.98, -0.08)
      seats.add(seat, back)
      for (const x of [-0.17, 0.17]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.4, 0.035), mat)
        leg.position.set(seat.position.x + x, -2.4, 0.1); seats.add(leg)
      }
    }
    const weed = new THREE.Group(), twig = new THREE.LineBasicMaterial({ color: '#9D855B' })
    for (let i = 0; i < 9; i++) {
      const points = Array.from({ length: 33 }, (_, j) => {
        const a = j / 32 * Math.PI * 2, r = 0.24 + Math.sin(j * 2.3 + i) * 0.035
        return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, Math.sin(a * 3 + i) * 0.08)
      })
      const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), twig)
      ring.rotation.set(i * 0.48, i * 0.76, i); weed.add(ring)
    }
    root.add(weed)
    return {
      update(f) {
        const first = f.lines[0], second = f.lines[1]
        const p = first ? seg(f.t, first.start, first.end) : seg(f.p, 0, 0.5)
        const q = second ? seg(f.t, second.start, second.end) : seg(f.p, 0.5, 1)
        const press = ease.inOut(seg(p, 0.15, 0.4)), retreat = ease.out(seg(p, 0.55, 0.8))
        thumb.position.set(0.48 - press * 0.4 + retreat * 0.9, -0.75 - press * 0.25, 0.75 - press * 0.4)
        thumb.scale.setScalar(1 - retreat * 0.2)
        thumb.visible = p < 0.9 && q === 0
        signed.visible = p > 0.4
        signed.scale.setScalar(0.98 + pulse(f.beat) * 0.02)
        phone.position.y = 0.05 - ease.out(seg(q, 0, 0.2)) * 0.25
        phone.rotation.z = -0.06 + Math.sin(f.beat * Math.PI) * 0.008
        steam.forEach((puff, i) => {
          const h = (f.beat * 0.18 + i / steam.length) % 1
          puff.position.set(Math.sin(h * 5 + i) * 0.15, 0.6 + h * 0.8, 0)
          const size = 0.5 + h * 1.4
          puff.scale.set(size * 0.6, size * 1.7, size * 0.6)
          puff.material.opacity = Math.sin(h * Math.PI) * 0.08
        })
        review.style.opacity = String(seg(q, 0, 0.12))
        review.style.transform = `translateY(${(1 - ease.out(seg(q, 0, 0.16))) * -30}px)`
        seats.visible = q > 0
        weed.visible = q > 0
        weed.position.set(0.8 + q * 4.6, -2.5 + Math.abs(Math.sin(q * Math.PI * 5)) * 0.07, 0.5)
        weed.rotation.z = -q * 16
        ticket.style.transform = `rotate(${5 + pulse(f.beat) * 0.5}deg)`
      },
    }
  },
} satisfies SceneDef
