// Global captions, documentary-reel style: the narrated line shown one short phrase at a time (Thai phrases are
// space-separated), white on the lower third; *word* marks a yellow keyword. Phrase times follow character counts.
import { C, F, ease, el, seg } from './kit'
import type { LineCue, Theme, TypeLayout } from './types'

interface Phrase { box: HTMLDivElement; at: number }

const POS: Record<TypeLayout['pos'], string> = { // 1080x1920: keep ~150px top / ~320px bottom clear for the app UI
  left: 'left:72px;top:50%;transform:translateY(-50%);text-align:left',
  center: 'left:72px;right:72px;top:50%;transform:translateY(-50%);text-align:center',
  top: 'left:72px;right:72px;top:300px;text-align:center',
  bottom: 'left:72px;right:72px;bottom:430px;text-align:center',
  right: 'right:72px;top:50%;transform:translateY(-50%);text-align:right',
}
const len = (s: string) => s.replace(/[*\s]/g, '').replace(/[ัิ-ฺ็-๎]/g, '').length // Thai marks take no time

/** Split a line into caption phrases: at spaces, short bits glued to their neighbour. */
export function phrases(text: string) {
  const out: string[] = []
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const last = out.at(-1)
    if (last !== undefined && (len(last) < 7 || len(w) < 4) && len(last) + len(w) < 24) out[out.length - 1] = `${last} ${w}`
    else out.push(w)
  }
  return out
}

export class Typo {
  private layer: HTMLDivElement
  private cache = new Map<string, Phrase[]>()
  private shown: HTMLDivElement | null = null

  constructor(overlay: HTMLElement) {
    this.layer = el('div', 'position:absolute;inset:0;z-index:5', overlay)
  }

  private build(line: LineCue, layout: TypeLayout, theme: Theme): Phrase[] {
    const size = layout.size ?? 62, color = layout.color ?? (theme === 'paper' ? C.paperInk : C.white)
    const key = layout.accent ?? (theme === 'paper' ? C.accentInk : C.accent)
    const ps = phrases(line.text), total = ps.reduce((a, p) => a + len(p), 0)
    const span = (line.end - line.start) * 0.94
    let acc = 0
    return ps.map(p => {
      const box = el('div', `position:absolute;${POS[layout.pos]};font:800 ${size}px/1.28 ${F.display};color:${color};
        text-shadow:0 3px 18px #000c,0 0 2px #000;letter-spacing:-.005em`)
      box.innerHTML = p.replace(/\*([^*]+)\*/g, `<span style="color:${key}">$1</span>`).replace(/\*/g, '')
      const at = line.start + (acc / total) * span
      acc += len(p)
      return { box, at }
    })
  }

  update(t: number, line: LineCue | undefined, next: LineCue | undefined, layout: TypeLayout | false, theme: Theme) {
    const until = Math.min((line?.end ?? 0) + 0.35, next?.start ?? Infinity)
    if (!layout || !line || t < line.start - 0.05 || t >= until) { this.hide(); return }
    const k = `${line.id}|${theme}|${JSON.stringify(layout)}`
    let ps = this.cache.get(k)
    if (!ps) { ps = this.build(line, layout, theme); this.cache.set(k, ps) }
    let i = 0
    while (i + 1 < ps.length && t >= ps[i + 1].at) i++
    const p = ps[i]
    if (this.shown !== p.box) { this.hide(); this.layer.appendChild(p.box); this.shown = p.box }
    const inK = ease.back(seg(t, p.at, p.at + 0.14)), out = ease.in(seg(t, until - 0.2, until))
    p.box.style.opacity = String(Math.min(seg(t, p.at, p.at + 0.08), 1 - out))
    p.box.style.scale = String(0.9 + 0.1 * inK)
  }

  private hide() {
    this.shown?.remove()
    this.shown = null
  }
}
