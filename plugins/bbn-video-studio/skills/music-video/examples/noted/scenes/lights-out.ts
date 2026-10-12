import * as THREE from 'three'
import { C, F, el, rng, seg, slate } from '../kit'
import { animateMascot, mascot } from '../mascot'
import type { SceneDef } from '../types'

export default {
  theme: 'dark',
  type: { pos: 'left', size: 88, width: 880 },
  create({ root, dom, stage }) {
    slate(dom, 'FINAL CHORUS / 02 · AFTER HOURS', 'OFFICE OCCUPANCY : 0')
    const stars = rng(203)
    for (let i = 0; i < 22; i++) {
      el('div', `position:absolute;left:${1030 + stars() * 800}px;top:${100 + stars() * 700}px;width:2px;height:2px;
        background:${C.gray};opacity:${0.12 + stars() * 0.25}`, dom)
    }
    const tower = new THREE.Group()
    tower.position.set(2.95, -0.07, 0)
    tower.rotation.y = -0.24
    root.add(tower)
    const shell = new THREE.Mesh(new THREE.BoxGeometry(2.7, 4.6, 1.05),
      new THREE.MeshStandardMaterial({ color: C.ink2, roughness: 0.85, metalness: 0.25 }))
    tower.add(shell)
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(shell.geometry), new THREE.LineBasicMaterial({ color: C.dim }))
    tower.add(outline)
    const windows: { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>; floor: number; bot: boolean }[] = []
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 6; col++) {
        const bot = row === 5 && col === 3
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.29), new THREE.MeshBasicMaterial({ color: C.yellow }))
        mesh.position.set(-1.08 + col * 0.43, 1.93 - row * 0.53, 0.531)
        tower.add(mesh)
        windows.push({ mesh, floor: row, bot })
      }
      for (let col = 0; col < 2; col++) {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.29), new THREE.MeshBasicMaterial({ color: C.yellow }))
        mesh.position.set(1.356, 1.93 - row * 0.53, -0.24 + col * 0.45)
        mesh.rotation.y = Math.PI / 2
        tower.add(mesh)
        windows.push({ mesh, floor: row, bot: false })
      }
    }
    const bot = mascot(C.yellow, 0.015)
    bot.group.position.set(0.21, -0.8, 0.57)
    tower.add(bot.group)
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.12, 1.4), new THREE.MeshStandardMaterial({ color: C.ink3, roughness: 0.8 }))
    ledge.position.y = -2.36
    tower.add(ledge)
    const antenna = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.48, 0.035), new THREE.MeshBasicMaterial({ color: C.dim }))
    antenna.position.set(0.78, 2.53, 0)
    tower.add(antenna)
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: C.red }))
    dot.position.copy(antenna.position).y += 0.24
    tower.add(dot)
    el('div', `position:absolute;left:120px;top:805px;font:500 20px ${F.mono};color:${C.gray};letter-spacing:.05em`, dom,
      `<div style="font:800 78px/1.15 ${F.display};letter-spacing:-.02em;color:${C.yellow}">1,000,000 <span style="font-size:32px;color:${C.white}">หน้า</span></div>
       <div style="margin-top:16px">ผู้อ่าน <span style="color:${C.white}">0</span> &nbsp;·&nbsp; คนในออฟฟิศ <span style="color:${C.white}">0</span></div>`)
    const status = el('div', `position:absolute;left:1190px;top:977px;width:620px;font:500 17px ${F.mono};color:${C.gray};display:flex;justify-content:space-between`, dom)
    const callout = el('div', `position:absolute;padding:8px 14px;border:1px solid ${C.yellow};background:${C.ink};
      font:600 18px ${F.ui};color:${C.yellow};white-space:nowrap`, dom, 'น้องสรุป · ยังออนไลน์')
    const point = new THREE.Vector3()
    return {
      update(f) {
        const shutdown = f.lines[1]
        const chant = f.lines[2]
        const bps = f.t > 0 ? f.beat / f.t : 2
        const start = Math.ceil((shutdown?.start ?? f.t - f.local + f.dur / 3) * bps)
        const finish = Math.floor((shutdown?.end ?? f.t - f.local + f.dur * 2 / 3) * bps)
        const floorsOff = Math.floor(seg(f.beat, start, Math.max(start + 1, finish)) * 8)
        let glow = 1
        if (chant && f.t >= chant.start) {
          glow = 0
          for (let i = 0; i < 3; i++) {
            const at = Math.ceil((chant.start + (chant.end - chant.start) * i / 3) * bps)
            const d = f.beat - at
            if (d >= 0 && d < 1.35) glow = Math.max(glow, Math.exp(-2.6 * d))
          }
        }
        windows.forEach(({ mesh, floor, bot: isBot }) => {
          const on = isBot ? glow : floor >= floorsOff ? 1 : 0
          mesh.material.color.set(on > 0 ? (isBot ? C.yellow : '#80743E') : '#1B202C')
          if (isBot) mesh.material.color.multiplyScalar(0.07 + on * 0.93)
        })
        bot.group.visible = floorsOff === 8 && glow > 0.12
        animateMascot(bot, f.beat, 0.3)
        status.innerHTML = `<span>OFFICE / ${String(8 - floorsOff).padStart(2, '0')} FLOORS LIT</span><span style="color:${floorsOff === 8 ? C.yellow : C.gray}">BOT / ${glow > 0.12 ? 'ONLINE' : '…'}</span>`
        tower.updateMatrixWorld(true)
        point.set(0.21, -0.72, 0.57).applyMatrix4(tower.matrixWorld).project(stage.camera)
        callout.style.left = `${(point.x + 1) * 960 - 286}px`
        callout.style.top = `${(1 - point.y) * 540 + 25}px`
        callout.style.opacity = floorsOff === 8 ? String(0.6 + glow * 0.4) : '0'
        dot.material.color.set(f.beat % 4 < 0.3 ? C.red : C.ink3)
      },
    }
  },
} satisfies SceneDef
