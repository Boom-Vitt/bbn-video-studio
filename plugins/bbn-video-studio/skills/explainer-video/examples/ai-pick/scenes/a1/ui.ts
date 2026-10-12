// Shared bits of the hook + outro scenes (worker A1): big DOM titles with glow + extruded depth shadow.
import { C, F, el } from '../../kit'

/** Stacked 1px offsets give the letters a solid extruded edge, then a soft drop shadow and a glow. */
const depth = (edge: string[], glow: string) =>
  [...edge.map((c, i) => `0 ${i + 1}px 0 ${c}`), '0 16px 28px rgba(0,0,0,.75)', `0 0 46px ${glow}`].join(',')
export const WHITE = depth(['#d5dbe6', '#bcc4d2', '#a3adbe', '#8c97aa', '#768196', '#616c81', '#4d576b'], 'rgba(255,255,255,.30)')
export const AMBER = depth(['#e9b02c', '#d39c22', '#bc891b', '#a57615', '#8e6410', '#78530c', '#624308'], 'rgba(255,201,60,.38)')

/** Accent span for title html: `เลือก AI ${hl('ให้ตรงงาน')}`. */
export const hl = (s: string) => `<span style="color:${C.accent};text-shadow:${AMBER}">${s}</span>`

/** Centered title in the top third (y ≈ 260–650). */
export function title3d(parent: HTMLElement, html: string, top = 280, size = 150) {
  return el('div', `position:absolute;left:30px;right:30px;top:${top}px;text-align:center;font:800 ${size}px/1.06 ${F.display};
    color:#fff;letter-spacing:-.01em;transform-origin:50% 55%;text-shadow:${WHITE}`, parent, html)
}

/** Small yellow tag above a title ("เคล็ดลับ", "ตอนหน้า"), centred. */
export function kicker(parent: HTMLElement, text: string, top: number) {
  return el('div', `position:absolute;left:50%;top:${top}px;transform-origin:50% 50%;padding:6px 26px 8px;border-radius:999px;
    background:${C.accent};color:#1a1406;font:600 40px/1.2 ${F.ui};letter-spacing:.01em;white-space:nowrap;
    box-shadow:0 6px 0 #9a6f00,0 14px 30px rgba(0,0,0,.6),0 0 36px rgba(255,201,60,.45)`, parent, text)
}
