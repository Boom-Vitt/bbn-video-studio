// Intro: title card with the bot, which dives at the camera into the group chat, where the boss drops a
// 92-page AI strategy at 23:47 and 47 people "acknowledge" it.
import * as THREE from 'three'
import { C, F, canvasTexture, clamp, ease, el, lerp, pulse, rng, seg } from '../kit'
import { animateMascot, mascot, mascotSVG } from '../mascot'
import type { SceneDef } from '../types'

const NAMES = ['ต้น', 'แพร', 'บีม', 'มิ้นท์', 'โอ๊ต', 'ฝน', 'กอล์ฟ', 'เจน', 'ปั้น', 'นุ่น', 'อาร์ม', 'ใบเตย', 'พีท', 'แนน', 'บอส(คนละคน)', 'จูน']
const REPLIES = ['รับทราบครับ', 'รับทราบค่ะ', 'รับทราบครับ 🙏', 'รับทราบค่ะพี่', 'รับทราบ', '👍', 'รับทราบครับผม', 'รับทราบนะคะ 🙏🙏']

export default {
  theme: 'dark',
  type: { pos: 'left', size: 82, width: 1080 },
  create({ dom, cue, root, stage }) {
    // --- title card (frame 0 is the thumbnail: fully composed from t = 0) ---
    const bot = mascot()
    bot.group.scale.setScalar(1.75)
    const anchor = new THREE.Vector3()
    const pad = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.66, 64), new THREE.MeshBasicMaterial({ color: C.yellow, transparent: true, opacity: 0.55 }))
    pad.rotation.x = -Math.PI / 2
    pad.position.y = 0.005
    bot.group.add(pad)
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({
      map: canvasTexture(256, 256, g => {
        const r = g.createRadialGradient(128, 128, 0, 128, 128, 128)
        r.addColorStop(0, 'rgba(255,225,74,0.26)'); r.addColorStop(1, 'rgba(255,225,74,0)')
        g.fillStyle = r; g.fillRect(0, 0, 256, 256)
      }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
    glow.position.set(1.55, -0.1, -1.5)
    const grid = new THREE.GridHelper(24, 48, C.rule, C.ink3)
    grid.position.y = -1.08
    ;(grid.material as THREE.Material).transparent = true
    ;(grid.material as THREE.Material).opacity = 0.55
    root.add(glow, grid, bot.group)

    const title = el('div', 'position:absolute;left:120px;top:50%;transform:translateY(-54%);width:900px', dom,
      `<div style="font:500 18px ${F.mono};letter-spacing:.2em;color:${C.yellow}">มิวสิกวิดีโอ · NOTED · 2026</div>
       <div style="font:800 168px/1.18 ${F.display};color:${C.white};margin-top:18px;letter-spacing:-.01em">รับทราบ<span style="color:${C.yellow};text-shadow:0 0 40px ${C.yellow}66">ครับ</span></div>
       <div style="display:flex;gap:26px;align-items:center;margin-top:10px">
         <span style="font:500 26px ${F.mono};color:${C.gray}">อ่านแล้ว 47 ✓✓</span>
         <span style="font:400 44px ${F.pen};color:${C.red};transform:rotate(-4deg);display:inline-block">(ไม่ได้อ่าน)</span></div>
       <div style="font:400 22px ${F.ui};color:${C.dim};margin-top:34px">เพลงนูดิสโก้สำหรับมนุษย์ออฟฟิศที่กดรับทราบโดยไม่อ่าน</div>`)
    const titleSlate = el('div', `position:absolute;left:56px;right:56px;top:36px;display:flex;justify-content:space-between;
      font:500 15px ${F.mono};letter-spacing:.14em;color:${C.gray}`, dom,
      `<span>แชทกลุ่ม · ทีม AI-FIRST 🚀 · 48 สมาชิก</span><span>น้องสรุป · ออนไลน์ 24/7</span>`)

    const bubble = el('div', `position:absolute;left:0;top:0;padding:18px 40px 22px;border:5px solid ${C.yellow};border-radius:34px;
      background:${C.ink2};box-shadow:0 0 46px ${C.yellow}55, inset 0 0 22px ${C.yellow}22;white-space:nowrap;
      font:800 70px/1.25 ${F.display};color:${C.white};transform-origin:12% 100%`, dom,
      `รับทราบครับ 🙏<div style="position:absolute;left:70px;bottom:-30px;width:0;height:0;border-left:16px solid transparent;
        border-right:22px solid transparent;border-top:30px solid ${C.yellow}"></div>`)

    const ui = el('div', 'position:absolute;inset:0;transform-origin:0 0', dom)
    el('div', `position:absolute;left:56px;right:56px;top:36px;display:flex;justify-content:space-between;
      font:500 15px ${F.mono};letter-spacing:.14em;color:${C.gray}`, ui,
      `<span>แชทกลุ่ม · ทีม AI-FIRST 🚀 · 48 สมาชิก</span><span>ศุกร์ 23:47</span>`)
    const side = el('div', `position:absolute;left:56px;top:110px;width:260px;bottom:60px;border-right:1px solid ${C.rule};
      font:400 19px/2 ${F.ui};color:${C.gray}`, ui,
      `<div style="font:500 13px ${F.mono};letter-spacing:.14em;color:${C.dim}">ห้องแชท</div>
       <div style="color:${C.white}"><span style="color:${C.yellow}">▍</span># ทีม AI-First 🚀</div>
       <div># ประกาศ</div><div># ฝ่ายกฎหมาย <span style="color:${C.dim}">(ยุบแล้ว)</span></div><div># กินข้าวไหน</div>
       <div style="font:500 13px ${F.mono};letter-spacing:.14em;color:${C.dim};margin-top:24px">ข้อความส่วนตัว</div>
       <div>● พี่บอส</div><div>● แพร</div><div style="display:flex;gap:8px;align-items:center">${mascotSVG(22)} น้องสรุป <span style="color:${C.dim}">(บอต)</span></div>`)
    const head = el('div', `position:absolute;left:120px;top:300px;display:flex;gap:16px;align-items:center;
      font:600 24px ${F.ui};color:${C.white}`, dom,
      `<div style="width:52px;height:52px;border-radius:14px;background:${C.ink3};display:grid;place-items:center;font:800 26px ${F.display};color:${C.yellow}">บ</div>
       <div>พี่บอส <span style="font:400 18px ${F.ui};color:${C.gray}">VP ฝ่ายวิสัยทัศน์ · 23:47</span></div>`)
    const typing = el('div', `position:absolute;left:120px;top:400px;padding:14px 22px;border-radius:18px;background:${C.ink3};
      font:800 30px ${F.display};color:${C.gray};letter-spacing:.2em`, dom, '•••')
    const file = el('div', `position:absolute;left:120px;top:760px;display:flex;gap:22px;align-items:center;padding:22px 30px;
      border:1px solid ${C.rule};border-radius:18px;background:${C.ink2};font:400 22px ${F.ui};color:${C.white}`, dom,
      `<div style="width:56px;height:70px;border-radius:6px;background:${C.red};display:grid;place-items:end center;
        font:600 14px ${F.mono};color:#fff;padding-bottom:8px;box-sizing:border-box">PDF</div>
       <div>แผนกลยุทธ์_AI_2027_final_v9_จริง.pdf<div style="font:400 17px ${F.mono};color:${C.gray};margin-top:6px">92 หน้า · 48.2 MB · เขียนโดย บอต</div></div>
       <div style="margin-left:18px;padding:6px 14px;border-radius:8px;background:${C.yellow};color:${C.ink};font:600 18px ${F.ui}">ด่วนมาก</div>`)
    const seen = el('div', `position:absolute;left:120px;top:900px;font:500 22px ${F.mono};color:${C.gray}`, dom)

    // reply flood column on the right; bubbles are pre-built and revealed by time
    const col = el('div', 'position:absolute;right:56px;top:0;bottom:0;width:560px;overflow:hidden', dom)
    const stack = el('div', 'position:absolute;left:0;right:0;bottom:80px;display:flex;flex-direction:column;gap:14px', col)
    const r = rng(47)
    const bubbles = Array.from({ length: 47 }, (_, i) => {
      const bot = r() < 0.4
      const b = el('div', `display:flex;gap:14px;align-items:flex-end;font:400 22px ${F.ui};color:${C.white}`, stack,
        `<div style="flex:none;width:44px;height:44px;border-radius:12px;background:${bot ? 'transparent' : C.ink3};display:grid;place-items:center;
          font:600 18px ${F.ui};color:${C.gray}">${bot ? mascotSVG(40) : NAMES[i % NAMES.length][0]}</div>
         <div><div style="font:400 15px ${F.ui};color:${C.dim};margin-bottom:4px">${NAMES[i % NAMES.length]}${bot ? ' · ตอบอัตโนมัติ' : ''}</div>
         <div style="padding:12px 20px;border-radius:18px 18px 18px 6px;background:${bot ? '#2A2614' : C.ink3}">${REPLIES[Math.floor(r() * REPLIES.length)]}</div></div>`)
      return b
    })

    return {
      update(f) {
        const [l1, l2] = f.lines
        const msgAt = l1?.start ?? f.dur * 0.2
        const fileAt = l2 ? lerp(l2.start, l2.end, 0.55) : msgAt + 4
        const floodAt = l2 ? lerp(l2.start, l2.end, 0.7) : fileAt + 1
        const t = f.t
        // title card holds, then the bot dives at the camera and we cut into the chat just before the first line
        const T1 = Math.max(0.8, msgAt - 1.15)
        const k = seg(t, T1, T1 + 0.45)
        const out = ease.in(k)
        root.visible = k < 1
        animateMascot(bot, f.beat, 1.3)
        bot.group.position.set(lerp(1.55, 0.2, out), -1.08 + out * 0.95, out * 10.6) // passes through the camera: yellow wipe
        bot.group.rotation.y = -0.32 + Math.sin(f.local * 1.3) * 0.06 + out * 0.3
        bot.group.updateMatrixWorld(true)
        stage.camera.updateMatrixWorld()
        anchor.set(0.05, 1.12, 0).applyMatrix4(bot.group.matrixWorld).project(stage.camera)
        bubble.style.transform = `translate(${(anchor.x + 1) * 960 - 90}px, ${(1 - anchor.y) * 540 - 150}px) scale(${1 + pulse(f.beat, 9) * 0.05})`
        bubble.style.opacity = String(1 - seg(t, T1, T1 + 0.12))
        ;(pad.material as THREE.MeshBasicMaterial).opacity = 0.25 + pulse(f.beat) * 0.5
        stage.camera.position.set(0, 0.15, 10 - f.local * 0.12)
        stage.camera.lookAt(0, 0, 0)
        title.style.opacity = String(1 - seg(t, T1, T1 + 0.22))
        title.style.transform = `translate(${-ease.in(seg(t, T1, T1 + 0.3)) * 160}px, -54%)`
        titleSlate.style.opacity = title.style.opacity
        // wide shot -> push in on the message as it arrives
        const z = ease.inOut(seg(t, msgAt - 1.2, msgAt))
        ui.style.transform = `translate(${-z * 360}px, ${-z * 120}px) scale(${1 + z * 0.35})`
        ui.style.opacity = String((1 - z * 0.75) * seg(t, T1 + 0.34, T1 + 0.45))
        side.style.filter = `blur(${z * 3}px)`
        head.style.opacity = String(seg(t, msgAt - 0.9, msgAt - 0.6))
        typing.style.opacity = String(seg(t, msgAt - 0.8, msgAt - 0.6) * (1 - seg(t, msgAt - 0.05, msgAt)))
        typing.textContent = '•••'.slice(0, 1 + (Math.floor(f.beat * 2) % 3))
        const fk = ease.back(seg(t, fileAt, fileAt + 0.35))
        file.style.opacity = String(clamp(fk))
        file.style.transform = `translateY(${(1 - fk) * 40}px)`
        const n = Math.round(ease.out(seg(t, floodAt, cue.end - 0.4)) * 47)
        seen.textContent = n ? `อ่านแล้ว ${n}` : ''
        seen.style.color = n === 47 ? C.yellow : C.gray
        bubbles.forEach((b, i) => {
          const at = floodAt + (i / 47) * (cue.end - 0.4 - floodAt) * ease.in(i / 47 + 0.3)
          const kk = seg(t, at, at + 0.18)
          b.style.display = kk > 0 ? 'flex' : 'none'
          b.style.opacity = String(kk)
          b.style.transform = `translateX(${(1 - ease.out(kk)) * 60}px)`
        })
      },
    }
  },
} satisfies SceneDef
