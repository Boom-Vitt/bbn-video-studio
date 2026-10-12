import * as THREE from 'three'
import { C, F, clamp, el, pulse, seg, slate } from '../kit'
import { animateMascot, mascot, mascotSVG } from '../mascot'
import type { SceneDef } from '../types'

export default {
  theme: 'dark',
  type: { pos: 'left', size: 90, width: 850 },
  create({ root, dom, stage }) {
    slate(dom, 'FINAL CHORUS / 01 · BOT → BOT', 'HUMANS IN THE LOOP : 0')
    const tunnel = el('div', 'position:absolute;left:1010px;top:145px;width:850px;height:735px;overflow:hidden', dom)
    const levels = Array.from({ length: 8 }, (_, i) => {
      const window = el('div', `position:absolute;width:720px;height:520px;box-sizing:border-box;transform-origin:0 0;
        border:2px solid ${C.yellow};border-radius:14px;background:${C.ink2};box-shadow:0 0 32px ${C.yellow}12`, tunnel)
      el('div', `height:58px;padding:0 24px;display:flex;align-items:center;justify-content:space-between;
        border-bottom:1px solid ${C.rule};font:500 16px ${F.mono};color:${C.gray}`, window,
        '<span>● ● ● &nbsp; # บอตอ่านให้บอต</span><span>↗</span>')
      el('div', `position:absolute;left:28px;top:88px;display:flex;gap:12px;align-items:center;font:600 20px ${F.ui};color:${C.white}`, window,
        `${mascotSVG(30)} <span>น้องสรุป <span style="color:${C.gray};font-size:15px">· บอต</span></span>`)
      el('div', 'position:absolute;left:40px;top:234px', window, mascotSVG(140))
      el('div', `position:absolute;left:34px;top:380px;font:600 24px ${F.ui};color:${C.yellow}`, window, 'กำลังอ่าน…')
      el('div', `position:absolute;left:34px;bottom:22px;font:400 13px ${F.mono};color:${C.dim}`, window, 'SOURCE: BOT / READER: BOT')
      return { window, index: i - 1 }
    })
    const depth = el('div', `position:absolute;left:1070px;top:920px;font:500 19px ${F.mono};letter-spacing:.1em;color:${C.gray}`, dom)
    el('div', `position:absolute;left:120px;bottom:88px;font:500 17px ${F.mono};letter-spacing:.12em;color:${C.dim}`, dom, 'INPUT = OUTPUT = INPUT')

    const loop = new THREE.Group()
    loop.position.set(2.85, 0.02, 0)
    root.add(loop)
    const curve = new THREE.EllipseCurve(0, 0, 1.65, 1.32, 0, Math.PI * 2, false, 0)
    const track = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)),
      new THREE.LineBasicMaterial({ color: C.yellow, transparent: true, opacity: 0.4 }))
    track.position.z = -0.3
    loop.add(track)
    const labels = ['เขียน', 'ย่อ', 'ตอบ', 'โหวต'].map((word, i) => {
      const angle = Math.PI * 0.75 - i * Math.PI / 2
      const bot = mascot(C.yellow, 0.065)
      bot.group.position.set(Math.cos(angle) * 1.75, Math.sin(angle) * 1.55 - 0.25, 0)
      bot.group.rotation.y = -0.18 + i * 0.12
      loop.add(bot.group)
      const label = el('div', `position:absolute;text-align:center;width:150px;font:600 30px ${F.ui};color:${C.gray}`, dom, word)
      return { bot, label, angle }
    })
    const papers = Array.from({ length: 4 }, () => {
      const paper = new THREE.Group()
      paper.add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.36, 0.035), new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.5 })))
      for (let i = 0; i < 3; i++) {
        const rule = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.012), new THREE.MeshBasicMaterial({ color: C.dim }))
        rule.position.set(0, 0.08 - i * 0.06, 0.02)
        paper.add(rule)
      }
      loop.add(paper)
      return paper
    })
    const center = el('div', `position:absolute;left:1300px;top:488px;width:300px;text-align:center;
      font:500 14px ${F.mono};letter-spacing:.15em;color:${C.dim}`, dom,
      `AUTOMATED WORKFLOW<div style="font:800 44px ${F.display};letter-spacing:0;color:${C.white};margin-top:8px">คน 0</div>`)
    const projected = new THREE.Vector3()
    return {
      update(f) {
        const second = f.lines[1]
        const conveyor = f.t >= (second?.start ?? (f.t - f.local + f.dur / 2))
        tunnel.style.display = conveyor ? 'none' : 'block'
        loop.visible = conveyor
        center.style.display = conveyor ? 'block' : 'none'
        const bps = f.t > 0 ? f.beat / f.t : 2
        const origin = (f.lines[0]?.start ?? f.t - f.local) * bps
        const bars = Math.max(0, (f.beat - origin) / 4)
        const phase = bars % 1
        levels.forEach(({ window, index }) => {
          const s = 0.48 ** (index - phase)
          window.style.transform = `translate(${430 * (1 - s)}px,${310 * (1 - s)}px) scale(${s})`
        })
        const progress = second ? seg(f.t, second.start, second.end) : clamp((f.p - 0.5) * 2)
        const turns = Math.max(0, (f.beat - (second?.start ?? f.t - f.local + f.dur / 2) * bps) / 8) + progress * progress * 2
        depth.textContent = conveyor ? `LOOP RATE · ${(1 + progress * 5).toFixed(1)}× / READERS 0` : `RECURSION DEPTH · ${String(Math.floor(bars) + 1).padStart(3, '0')} / ∞`
        labels.forEach(({ bot, label, angle }, i) => {
          animateMascot(bot, f.beat + i / 4, 0.7 + progress)
          projected.set(loop.position.x + bot.group.position.x, loop.position.y + bot.group.position.y - 0.22, 0).project(stage.camera)
          label.style.display = conveyor ? 'block' : 'none'
          const x = (projected.x + 1) * 960
          const y = (1 - projected.y) * 540
          label.style.left = `${x - 75}px`
          label.style.top = `${y}px`
          label.style.color = Math.floor((turns % 1) * 4) === i ? C.yellow : C.gray
          const paper = papers[i]
          const a = angle - turns * Math.PI * 2
          paper.position.set(Math.cos(a) * 1.65, Math.sin(a) * 1.32, 0.3)
          paper.rotation.z = Math.sin(a) * 0.18
          paper.scale.setScalar(1 + pulse(f.beat) * 0.08)
        })
      },
    }
  },
} satisfies SceneDef
