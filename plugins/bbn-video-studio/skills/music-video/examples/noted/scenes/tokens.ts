import * as THREE from 'three'
import { C, F, canvasPlane, ease, el, pulse, seg, slate } from '../kit'
import type { SceneDef } from '../types'

export default {
  theme: 'dark',
  type: { pos: 'left', size: 86, width: 830 },
  create({ root, dom }) {
    slate(dom, '05 / TOKEN ECONOMY · นี่คือก้าวหน้า', 'SPEND / UNLIMITED', C.gray)
    el('div', `position:absolute;left:120px;top:180px;font:500 16px ${F.mono};letter-spacing:.14em;color:${C.dim}`, dom, 'EXPENSE ↑ / UNDERSTANDING ↓')
    const chart = new THREE.Group(); root.add(chart)
    const bars = Array.from({ length: 7 }, (_, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: i === 6 ? C.yellow : C.ink3, emissive: i === 6 ? C.yellow : C.blue, emissiveIntensity: i === 6 ? 0.28 : 0.05, roughness: 0.4, metalness: 0.2 })
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1, 0.45), mat)
      bar.position.x = 0.85 + i * 0.61; bar.position.z = 0.1; chart.add(bar); return bar
    })
    for (let i = 0; i < 5; i++) {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.7, -2 + i * 0.62, -0.3), new THREE.Vector3(4.85, -2 + i * 0.62, -0.3)]), new THREE.LineBasicMaterial({ color: C.rule }))
      chart.add(line)
    }
    const growth = el('div', `position:absolute;left:1070px;top:145px;width:510px;padding:22px 28px;border:1px solid ${C.rule};background:${C.ink2};color:${C.white};font:600 34px ${F.ui}`, dom,
      `<div style="font:500 15px ${F.mono};letter-spacing:.12em;color:${C.gray};margin-bottom:14px">พี่บอส / SLIDE 01</div>ความก้าวหน้า 📈<div style="font:800 84px/1.2 ${F.display};color:${C.yellow}">+4,700%</div>`)
    const ceiling = el('div', `position:absolute;right:66px;top:85px;color:${C.yellow};font:500 15px ${F.mono};letter-spacing:.1em;writing-mode:vertical-rl`, dom, '↑ ABOVE ALL LIMITS')
    const ticks = el('div', `position:absolute;left:1040px;top:920px;width:720px;display:flex;justify-content:space-between;font:400 16px ${F.mono};color:${C.gray}`, dom, '<span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span style="color:' + C.yellow + '">TODAY</span>')
    const money = el('div', `position:absolute;left:1050px;top:795px;font:500 68px ${F.mono};letter-spacing:-.04em;color:${C.yellow}`, dom)
    const label = el('div', `position:absolute;left:1050px;top:890px;font:500 15px ${F.mono};letter-spacing:.12em;color:${C.gray}`, dom, 'TOKEN SPEND / THB / THIS MONTH')
    const document = new THREE.Group()
    document.position.set(2.8, -0.05, 0.5); root.add(document)
    const sheet = canvasPlane(780, 1030, 4.1, g => {
      g.fillStyle = C.paper; g.fillRect(0, 0, 780, 1030)
      g.strokeStyle = C.paper2; g.lineWidth = 3; g.strokeRect(30, 30, 720, 970)
      g.fillStyle = C.paperInk; g.font = `500 23px ${F.mono}`; g.fillText('OMNIMIND CO., LTD.', 65, 95)
      g.font = `600 46px ${F.ui}`; g.fillText('สัญญาที่ลงนามเมื่อวาน', 65, 172)
      g.fillStyle = '#8B867C'; g.font = `400 22px ${F.mono}`; g.fillText('DOCUMENT / 300 PAGES / SIGNED', 65, 222)
      g.fillStyle = C.paperInk
      for (let row = 0; row < 10; row++) {
        g.fillRect(65, 285 + row * 48, 570 - (row % 3) * 64, 22)
        if (row % 2 === 0) g.fillRect(652 - (row % 3) * 64, 285 + row * 48, 48, 22)
      }
      g.strokeStyle = '#B8AE9B'; g.beginPath(); g.moveTo(65, 840); g.lineTo(710, 840); g.stroke()
      g.fillStyle = C.paperInk; g.font = `400 40px ${F.pen}`; g.fillText('ลงชื่อ: พี่บอส ✓', 65, 914)
      g.fillStyle = '#8B867C'; g.font = `400 22px ${F.ui}`; g.fillText('ลงนามด้วยนิ้วโป้ง · ไม่ได้เปิดอ่าน', 65, 963)
    })
    sheet.material.color.set('#C8C8C8')
    document.add(sheet)
    const questions = el('div', `position:absolute;left:1200px;top:430px;font:800 164px ${F.display};letter-spacing:.08em;color:${C.red};text-shadow:0 0 28px ${C.red}22`, dom, '???')
    const unknown = el('div', `position:absolute;left:1090px;top:140px;width:670px;font:500 20px ${F.mono};letter-spacing:.08em;color:${C.gray};border-bottom:1px solid ${C.rule};padding-bottom:18px`, dom, 'SIGNED YESTERDAY / CONTENT UNKNOWN')
    return {
      update(f) {
        const first = f.lines[0], second = f.lines[1]
        const p = first ? seg(f.t, first.start, first.end) : seg(f.p, 0, 0.5)
        const q = second ? seg(f.t, second.start, second.end) : seg(f.p, 0.5, 1)
        const k = ease.inOut(seg(p, 0, 0.8))
        bars.forEach((bar, i) => {
          const h = (0.25 + i * 0.16 + (i === 6 ? k * 6.3 : k * i * 0.23)) * (0.97 + pulse(f.beat + i * 0.04) * 0.03)
          bar.scale.y = h; bar.position.y = -2 + h / 2
        })
        chart.visible = q === 0
        growth.style.opacity = q > 0 ? '0' : '1'
        growth.style.transform = `rotate(${-1 + pulse(f.beat) * 0.35}deg)`
        ceiling.style.opacity = q > 0 ? '0' : String(seg(p, 0.3, 0.5))
        ticks.style.opacity = q > 0 ? '0' : '1'
        money.textContent = `฿${Math.round(18900 + k * 888300).toLocaleString('en-US')}`
        money.style.fontSize = q > 0 ? '26px' : '68px'
        money.style.top = q > 0 ? '960px' : '795px'
        label.style.top = q > 0 ? '971px' : '890px'
        label.style.left = q > 0 ? '1290px' : '1050px'
        document.visible = q > 0
        document.rotation.set(0.04, -0.13, -0.03 + Math.sin(f.beat * Math.PI / 2) * 0.025)
        document.position.y = -0.05 + Math.sin(f.beat * Math.PI / 2) * 0.07
        document.scale.setScalar(0.9 + ease.out(seg(q, 0, 0.12)) * 0.1)
        questions.style.opacity = String(seg(q, 0.13, 0.25))
        questions.style.transform = `rotate(${Math.sin(f.beat * Math.PI / 2) * 3}deg) scale(${1 + pulse(f.beat) * 0.035})`
        unknown.style.opacity = q > 0 ? '1' : '0'
      },
    }
  },
} satisfies SceneDef
