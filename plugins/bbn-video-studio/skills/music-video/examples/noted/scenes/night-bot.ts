import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { C, F, ease, el, pulse, rng, seg, slate } from '../kit'
import { mascotSVG } from '../mascot'
import type { SceneDef } from '../types'

const ghostSVG = `<svg width="52" height="60" viewBox="0 0 52 60"><path d="M7 54V26a19 19 0 0 1 38 0v28l-7-6-6 6-6-6-6 6-6-6z" fill="${C.gray}" opacity=".5"/><rect x="17" y="25" width="4" height="7" fill="${C.ink}"/><rect x="32" y="25" width="4" height="7" fill="${C.ink}"/></svg>`

export default {
  theme: 'dark',
  type: { pos: 'left', size: 86, width: 830 },
  create({ root, dom }) {
    slate(dom, '04 / NIGHT SHIFT · ตอบแทนทุกคน', 'AUTO-REPLY / ALWAYS ON', C.gray)
    el('div', `position:absolute;left:120px;top:180px;font:500 16px ${F.mono};letter-spacing:.14em;color:${C.dim}`, dom, 'HUMANS OFFLINE / BOT ONLINE')
    const light = new THREE.PointLight(C.blue, 4, 8)
    light.position.set(3, 0, 2); root.add(light)
    const phone = new THREE.Group()
    phone.position.set(2.75, -0.72, -0.1); root.add(phone)
    const body = new THREE.Mesh(new RoundedBoxGeometry(4.35, 3.45, 0.23, 4, 0.18), new THREE.MeshStandardMaterial({ color: C.ink3, metalness: 0.65, roughness: 0.4 }))
    phone.add(body)
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.12, 3.2), new THREE.MeshBasicMaterial({ color: '#101C31' }))
    screen.position.z = 0.13; phone.add(screen)
    const random = rng(300)
    const stars = Array.from({ length: 32 }, () => {
      const star = new THREE.Mesh(new THREE.SphereGeometry(0.009, 5, 4), new THREE.MeshBasicMaterial({ color: C.blue, transparent: true }))
      star.position.set(0.9 + random() * 4.25, 0.5 + random() * 2.2, -0.4)
      root.add(star); return star
    })
    const clock = el('div', `position:absolute;left:1090px;top:128px;font:400 172px/1 ${F.mono};letter-spacing:-.07em;color:${C.white}`, dom, '03<span style="color:' + C.blue + '">:</span>00')
    const colon = clock.querySelector('span')!
    el('div', `position:absolute;left:1100px;top:327px;font:500 16px ${F.mono};letter-spacing:.16em;color:${C.blue}`, dom, '03:00 AM / ยังตื่นอยู่')
    const inbox = el('div', 'position:absolute;left:1085px;top:430px;width:660px', dom)
    el('div', `display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid ${C.rule};padding-bottom:18px;color:${C.white};font:600 23px ${F.ui}`, inbox,
      `<span>แชทกลุ่ม · ทีม AI-First</span><span style="font:500 15px ${F.mono};color:${C.blue}">● ONLINE</span>`)
    const rows = Array.from({ length: 3 }, (_, i) => el('div', `display:flex;align-items:center;gap:18px;margin-top:20px;color:${C.white};font:400 29px ${F.ui}`, inbox,
      `<div style="width:58px;display:grid;place-items:center">${mascotSVG(50)}</div><div style="flex:1"><div style="font:400 16px ${F.ui};color:${C.gray};margin-bottom:7px">น้องสรุป · ตอบแทน${['แพร', 'บีม', 'มิ้นท์'][i]}</div><div style="border-radius:0 16px 16px 16px;background:#263045;padding:12px 20px">รับทราบครับ<span style="float:right;font:400 15px ${F.mono};color:${C.gray};padding-top:12px">03:00</span></div></div>`))
    const ghost = el('div', `position:absolute;left:1085px;top:525px;width:660px;color:${C.gray};font:400 27px ${F.ui}`, dom,
      `<div style="display:flex;align-items:center;gap:18px">${ghostSVG}<div>ต้น · ลาออกแล้ว (2025)<div style="font:400 16px ${F.ui};margin-top:3px;color:${C.dim}">บัญชีปิดแล้ว · บอตยังทำงาน</div></div></div><div style="margin:22px 0 0 76px;padding:18px 24px;border:1px dashed ${C.gray};border-radius:0 18px 18px 18px;background:${C.ink2};color:${C.white}">รับทราบครับ<span style="float:right;font:400 15px ${F.mono};color:${C.gray};padding-top:10px">03:00</span></div><div style="margin:20px 0 0 76px;font:400 24px ${F.pen};color:${C.blue}">ลาออกจากงาน แต่ไม่เคยออกจากกลุ่ม</div>`)
    const calendar = el('div', `position:absolute;left:1085px;top:846px;width:660px;display:flex;gap:8px`, dom)
    const nights = Array.from({ length: 7 }, (_, i) => el('div', `flex:1;text-align:center;padding:10px 0;border:1px solid ${C.rule};border-radius:7px;background:${C.ink2};font:400 15px ${F.mono};color:${C.gray}`, calendar,
      `<div>${String(12 + i).padStart(2, '0')} OCT</div><div style="font:600 30px ${F.ui};color:${C.yellow}">✓</div><div style="font-size:12px">03:00</div>`))
    const note = el('div', `position:absolute;left:1085px;top:971px;font:500 15px ${F.mono};letter-spacing:.12em;color:${C.blue}`, dom, '7 NIGHTS / 7 ACKNOWLEDGEMENTS / 0 HUMANS')
    return {
      update(f) {
        const first = f.lines[0], second = f.lines[1]
        const p = first ? seg(f.t, first.start, first.end) : seg(f.p, 0, 0.5)
        const q = second ? seg(f.t, second.start, second.end) : seg(f.p, 0.5, 1)
        colon.style.opacity = String(0.4 + pulse(f.beat) * 0.6)
        rows.forEach((row, i) => {
          const k = seg(p, 0.08 + i * 0.19, 0.18 + i * 0.19)
          row.style.opacity = q > 0 ? '0' : String(k)
          row.style.transform = `translateY(${(1 - ease.out(k)) * 25}px)`
        })
        ghost.style.opacity = String(seg(q, 0, 0.13))
        ghost.style.transform = `translateY(${Math.sin(f.beat * Math.PI / 2) * 4}px)`
        calendar.style.opacity = String(seg(q, 0.15, 0.25))
        nights.forEach((night, i) => {
          night.style.opacity = String(0.2 + seg(q, 0.2 + i * 0.07, 0.26 + i * 0.07) * 0.8)
          night.style.transform = `translateY(${-pulse(f.beat + i * 0.12) * 3}px)`
        })
        note.style.opacity = String(seg(q, 0.72, 0.85))
        stars.forEach((star, i) => { star.material.opacity = 0.2 + pulse(f.beat + i / 32, 3) * 0.5 })
        light.intensity = 3 + pulse(f.beat) * 1.5
      },
    }
  },
} satisfies SceneDef
