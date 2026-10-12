import { C, F, clamp, ease, el, pulse, seg, slate } from '../kit'
import { mascotSVG } from '../mascot'
import type { SceneDef } from '../types'

const NAMES = ['ต้น', 'แพร', 'บีม', 'มิ้นท์', 'โอ๊ต', 'ฝน', 'พี่บอส']

export default {
  theme: 'dark',
  type: { pos: 'bottom', size: 76, width: 1680 },
  create({ dom, cue }) {
    slate(dom, '04 / ประชุมวันจันทร์', 'MONDAY SYNC / AUTO-ATTEND')
    el('div', `position:absolute;left:120px;top:112px;font:800 48px ${F.display};color:${C.white}`, dom, 'ห้องประชุม · แผน AI 2027')
    const count = el('div', `position:absolute;right:120px;top:128px;font:500 27px ${F.mono};color:${C.yellow}`, dom, 'บอต 7 · มนุษย์ 0')
    const grid = el('div', 'position:absolute;left:120px;top:210px;width:1680px;height:480px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,1fr);gap:18px;transform-origin:0 50%', dom)
    const avatars: HTMLDivElement[] = []
    const tiles = Array.from({ length: 8 }, (_, i) => {
      const tile = el('div', `position:relative;overflow:hidden;border:1px solid ${C.rule};border-radius:12px;background:${C.ink2}`, grid)
      if (i === 7) {
        el('div', `position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font:400 24px ${F.ui};color:${C.dim}`, tile,
          '<span style="font-size:42px">◌</span><span>รอผู้เข้าร่วม…</span>')
      } else {
        el('div', `position:absolute;left:16px;top:14px;font:500 11px ${F.mono};letter-spacing:.13em;color:${C.gray}`, tile, `AUTO-NOTE / 0${i + 1}`)
        el('div', `position:absolute;right:16px;top:12px;font:500 12px ${F.mono};color:${C.yellow}`, tile, '● REC')
        const avatar = el('div', 'position:absolute;left:50%;top:48%;transform:translate(-50%,-50%)', tile, mascotSVG(116))
        avatars.push(avatar)
        el('div', `position:absolute;left:16px;right:16px;bottom:15px;font:600 18px ${F.ui};color:${C.white};white-space:nowrap`, tile, `AI จดโน้ตของ ${NAMES[i]}`)
      }
      return tile
    })
    const toolbar = el('div', `position:absolute;left:120px;right:120px;top:720px;border-top:1px solid ${C.rule};padding-top:18px;display:flex;justify-content:space-between;font:400 16px ${F.mono};color:${C.gray}`, dom,
      '<span>ไมค์ปิดทั้งหมด · บันทึกอัตโนมัติ 7 สำเนา</span><span>ผู้จัดประชุม: น้องสรุป</span>')
    const poll = el('div', `position:absolute;left:1190px;top:230px;width:610px;height:430px;padding:32px 36px;box-sizing:border-box;border:1px solid ${C.yellow};border-radius:12px;background:${C.ink2};color:${C.white}`, dom)
    el('div', `font:500 13px ${F.mono};letter-spacing:.18em;color:${C.yellow}`, poll, 'LIVE POLL / NO HUMAN INPUT')
    el('div', `margin-top:18px;font:800 40px ${F.display}`, poll, 'อนุมัติแผน AI 2027?')
    const score = el('div', `margin-top:24px;font:500 69px ${F.mono};color:${C.yellow}`, poll)
    const votes = el('div', 'display:flex;gap:12px;margin-top:20px', poll)
    const ticks = NAMES.map(() => el('div', `width:59px;height:48px;border:1px solid ${C.rule};border-radius:6px;display:grid;place-items:center;font:600 27px ${F.ui};color:${C.dim}`, votes, '·'))
    const bar = el('div', `margin-top:26px;height:5px;background:${C.yellow};transform-origin:0 50%`, poll)
    const stamp = el('div', `position:absolute;left:1203px;top:619px;padding:14px 22px;border:4px solid ${C.yellow};background:${C.ink};font:800 40px ${F.display};white-space:nowrap;color:${C.yellow};transform-origin:50% 50%`, dom, 'ผ่านเป็นเอกฉันท์')

    return {
      update(f) {
        const enter = ease.out(seg(f.p, 0, .05))
        const second = f.lines[1]
        const pollStart = second?.start ?? cue.start + f.dur / 2
        const pollDuration = second ? second.end - second.start : f.dur / 2
        const reveal = ease.inOut(seg(f.t, pollStart, pollStart + pollDuration * .08))
        grid.style.opacity = String(enter)
        grid.style.width = `${1680 - reveal * 656}px`
        grid.style.transform = `translateY(${(1 - enter) * 28}px)`
        toolbar.style.opacity = String(enter)
        poll.style.opacity = String(reveal)
        poll.style.transform = `translateX(${(1 - reveal) * 70}px)`
        const beats = Math.max(0, (f.t - pollStart) * (f.t > 0 ? f.beat / f.t : 2))
        const voted = Math.min(7, Math.floor(beats))
        score.textContent = `${voted}/7 ${voted === 7 ? '✓' : ''}`
        ticks.forEach((tick, i) => {
          const yes = i < voted
          tick.textContent = yes ? '✓' : '·'
          tick.style.color = yes ? C.ink : C.dim
          tick.style.background = yes ? C.yellow : 'transparent'
          tick.style.borderColor = yes ? C.yellow : C.rule
          tick.style.transform = `scale(${yes ? 1 + pulse(beats - i) * .06 : 1})`
        })
        bar.style.transform = `scaleX(${voted / 7})`
        const approval = ease.back(clamp((beats - 7) / .35))
        stamp.style.opacity = String(clamp(approval))
        stamp.style.transform = `rotate(-7deg) scale(${.7 + approval * .3})`
        count.style.transform = `scale(${1 + pulse(f.beat) * .012})`
        avatars.forEach(avatar => { avatar.style.transform = `translate(-50%,-50%) translateY(${-Math.sin(f.beat % 1 * Math.PI) * 9}px) scaleY(${1 - pulse(f.beat) * .025})` })
        tiles.forEach((tile, i) => { tile.style.borderColor = i < voted && reveal > 0 ? '#756831' : C.rule })
      },
    }
  },
} satisfies SceneDef
