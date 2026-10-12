import { C, F, clamp, ease, el, rng, seg, slate } from '../kit'
import { mascotSVG } from '../mascot'
import type { SceneDef } from '../types'

const NAMES = ['ต้น', 'แพร', 'บีม', 'มิ้นท์', 'โอ๊ต', 'ฝน', 'กอล์ฟ', 'เจน', 'ปั้น', 'นุ่น', 'อาร์ม', 'ใบเตย']

export default {
  theme: 'dark',
  type: { pos: 'left', size: 82, width: 1080 },
  create({ dom, cue }) {
    const chat = el('div', 'position:absolute;inset:0', dom)
    slate(chat, 'แชทกลุ่ม · ทีม AI-FIRST 🚀 · 48 สมาชิก', 'ศุกร์ 00:00')
    el('div', `position:absolute;left:56px;right:56px;top:96px;height:1px;background:${C.rule}`, chat)
    el('div', `position:absolute;left:120px;top:124px;font:400 19px ${F.ui};color:${C.dim}`, chat,
      `<span style="color:${C.yellow}">▍</span> # ทีม AI-First 🚀 <span style="margin-left:32px"># ประกาศ</span><span style="margin-left:32px"># ฝ่ายกฎหมาย (ยุบแล้ว)</span>`)
    const boss = el('div', `position:absolute;left:120px;top:280px;display:flex;gap:16px;align-items:center;
      font:600 24px ${F.ui};color:${C.white}`, chat,
      `<div style="width:52px;height:52px;border-radius:14px;background:${C.ink3};display:grid;place-items:center;font:800 26px ${F.display};color:${C.yellow}">บ</div>
       <div>พี่บอส <span style="font:400 18px ${F.ui};color:${C.gray}">VP ฝ่ายวิสัยทัศน์ · 00:00</span></div>`)
    const request = el('div', `position:absolute;left:120px;top:195px;font:400 24px ${F.ui};color:${C.gray}`, chat,
      'พี่บอส: ใครสรุปเพลงนี้ให้พี่หน่อย')
    const bot = el('div', `position:absolute;left:120px;top:280px;display:flex;gap:16px;align-items:center;
      font:600 24px ${F.ui};color:${C.yellow}`, chat,
      `${mascotSVG(52)}<div>น้องสรุป <span style="font:400 18px ${F.ui};color:${C.gray}">บอต · ตอบอัตโนมัติ</span></div>`)
    const typing = el('div', `position:absolute;left:120px;top:770px;padding:12px 22px;border-radius:18px;background:${C.ink3};
      font:800 28px ${F.display};letter-spacing:.2em;color:${C.gray}`, chat, '•••')
    const seen = el('div', `position:absolute;left:120px;top:908px;font:500 22px ${F.mono};color:${C.yellow}`, chat)
    const column = el('div', 'position:absolute;right:56px;top:165px;bottom:70px;width:510px;overflow:hidden', chat)
    const stack = el('div', 'position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:14px', column)
    const random = rng(47)
    const replies = Array.from({ length: 47 }, (_, i) => {
      const isBot = random() < 0.5
      return el('div', `display:flex;gap:14px;align-items:flex-end;color:${C.white};font:400 22px ${F.ui}`, stack,
        `<div style="flex:none;width:44px;height:44px;border-radius:12px;background:${isBot ? 'transparent' : C.ink3};display:grid;place-items:center;color:${C.gray}">${isBot ? mascotSVG(40) : NAMES[i % NAMES.length][0]}</div>
         <div><div style="font:400 15px ${F.ui};color:${C.dim};margin-bottom:4px">${NAMES[i % NAMES.length]}${isBot ? ' · ตอบอัตโนมัติ' : ''}</div>
         <div style="padding:12px 20px;border-radius:18px 18px 18px 6px;background:${isBot ? '#2A2614' : C.ink3}">รับทราบครับ</div></div>`)
    })

    const credits = el('div', `position:absolute;inset:0;background:${C.ink}`, dom)
    slate(credits, 'DOCUMENT / SONG SUMMARY · FINAL', 'STATUS : ACKNOWLEDGED')
    const page = el('div', `position:absolute;left:150px;top:146px;width:1620px;height:800px;box-sizing:border-box;
      padding:48px 60px;background:${C.ink2};border:1px solid ${C.rule};box-shadow:12px 12px 0 ${C.ink3}`, credits)
    el('div', `display:flex;justify-content:space-between;font:500 16px ${F.mono};letter-spacing:.1em;color:${C.gray}`, page,
      `<span style="color:${C.yellow}">NOTED / 001</span><span>1 PAGE · 1 READER</span>`)
    el('div', `font:800 60px/1.25 ${F.display};color:${C.white};margin:28px 0 32px;letter-spacing:-.02em`, page,
      'รับทราบครับ (Noted) — มิวสิกวิดีโอ')
    const rows = [
      'เพลง: phaya (AI)',
      'ภาพเคลื่อนไหว: Claude Opus 5.5 · TypeScript + three.js',
      'สรุปโดย: น้องสรุป (อ่านไป 0 หน้า)',
      'ผู้อ่านจริง: 1 คน',
    ]
    rows.forEach((text, i) => {
      el('div', `display:flex;align-items:center;gap:30px;height:84px;border-top:1px solid ${C.rule};font:400 32px ${F.ui};color:${C.white}`, page,
        `<span style="font:400 14px ${F.mono};color:${C.dim}">0${i + 1}</span><span>${text}</span>`)
    })
    el('div', `position:absolute;left:60px;bottom:58px;display:flex;align-items:center;gap:18px;font:400 20px ${F.ui};color:${C.gray}`, page,
      `${mascotSVG(44)} <span>ขอบคุณที่อ่านจนจบครับ</span>`)
    const button = el('div', `position:absolute;right:60px;bottom:48px;min-width:260px;padding:18px 42px;box-sizing:border-box;
      text-align:center;border-radius:8px;background:${C.yellow};box-shadow:0 7px 0 #A18C21;font:800 36px ${F.display};color:${C.ink}`, page, 'รับทราบ')
    const footer = el('div', `position:absolute;left:150px;right:150px;bottom:65px;display:flex;justify-content:space-between;
      font:500 16px ${F.mono};letter-spacing:.1em;color:${C.dim}`, credits, '<span>END OF DOCUMENT</span><span>อ่านแล้ว 1</span>')

    return {
      update(f) {
        const [first, last] = f.lines
        const replyAt = last?.start ?? cue.start + f.dur * 0.5
        const lastEnd = last?.end ?? first?.end ?? cue.end - 6.5
        const endCardAt = Math.max(lastEnd + 0.5, cue.end - 6)
        const endCard = f.t >= endCardAt
        chat.style.display = endCard ? 'none' : 'block'
        credits.style.display = endCard ? 'block' : 'none'
        const response = seg(f.t, replyAt, replyAt + 0.25)
        boss.style.opacity = String(1 - response)
        bot.style.opacity = String(response)
        request.style.opacity = String(response * 0.65)
        typing.style.opacity = String(seg(f.t, replyAt - 0.75, replyAt - 0.5) * (1 - response))
        typing.textContent = '•••'.slice(0, 1 + Math.floor(f.beat * 2) % 3)
        const floodAt = replyAt + (lastEnd - replyAt) * 0.22
        const floodEnd = Math.max(floodAt + 0.2, lastEnd - 0.5)
        const n = Math.round(ease.out(seg(f.t, floodAt, floodEnd)) * 47)
        seen.textContent = n ? 'อ่านแล้ว 47' : ''
        replies.forEach((bubble, i) => {
          const at = floodAt + (i / 47) * (floodEnd - floodAt)
          const k = seg(f.t, at, at + 0.16)
          bubble.style.display = k > 0 ? 'flex' : 'none'
          bubble.style.opacity = String(k)
          bubble.style.transform = `translateX(${(1 - ease.out(k)) * 50}px)`
        })
        const bps = f.t > 0 ? f.beat / f.t : 2
        const lastDownbeat = (Math.ceil(cue.end * bps / 4) - 1) * 4
        const press = endCard ? clamp((f.beat - lastDownbeat) * 8) : 0
        button.style.transform = `translateY(${press * 7}px)`
        button.style.boxShadow = `0 ${7 * (1 - press)}px 0 #A18C21`
        footer.style.color = press > 0 ? C.gray : C.dim
      },
    }
  },
} satisfies SceneDef
