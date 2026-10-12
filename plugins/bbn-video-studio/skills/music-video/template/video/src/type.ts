// Global kinetic typography: the sung line, revealed word by word (Thai segmented with Intl.Segmenter).
// Parenthesised backing vocals render as red-pen annotations.
import { C, F, clamp, ease, el, seg } from './kit'
import type { LineCue, Theme, TypeLayout } from './types'

interface Word { span: HTMLSpanElement; at: number; pen: boolean }
interface Built { box: HTMLDivElement; words: Word[] }

const segmenter = new Intl.Segmenter('th', { granularity: 'word' })
// loanwords ICU's Thai dictionary splits mid-word (e.g. บอต -> บอ|ต...); kept whole
const KEEP = /(บอต|เอไอ|โทเคน|เฟิร์สต์|ไลน์|อีเมล|ออฟฟิศ|เบนซ์|สัมมนา|รับทราบ)/
const thaiWords = (s: string) => s.split(KEEP).flatMap((c, i) => (i % 2 ? [c] : [...segmenter.segment(c)].map(x => x.segment)))
const DEFAULT_COLOR: Record<Theme, string> = { dark: C.white, paper: C.paperInk, red: C.white }
const DEFAULT_ACCENT: Record<Theme, string> = { dark: C.accent, paper: C.red, red: C.red }

const POS: Record<TypeLayout['pos'], string> = {
  left: 'left:120px;top:50%;transform:translateY(-50%);text-align:left',
  center: 'left:50%;top:50%;transform:translate(-50%,-50%);text-align:center',
  top: 'left:120px;top:130px;text-align:left',
  bottom: 'left:120px;bottom:120px;text-align:left',
  right: 'right:120px;top:50%;transform:translateY(-50%);text-align:right',
}

export class Typo {
  private layer: HTMLDivElement
  private cache = new Map<string, Built>()
  private shown: Built | null = null

  constructor(overlay: HTMLElement) {
    this.layer = el('div', 'position:absolute;inset:0;z-index:5', overlay)
  }

  private build(line: LineCue, layout: TypeLayout): Built {
    const size = layout.size ?? 96
    const box = el('div', `position:absolute;${POS[layout.pos]};width:${layout.width ?? 1100}px;
      font:800 ${size}px/1.32 ${F.display};letter-spacing:-.01em;word-break:normal;line-break:auto`)
    // split "main (backing)" parts
    const parts = line.text.split(/(\([^)]*\))/).filter(Boolean)
    const pieces: { text: string; pen: boolean }[] = []
    for (const part of parts) {
      const pen = part.startsWith('(')
      for (const w of thaiWords(part)) if (w) pieces.push({ text: w, pen })
    }
    // glue brackets to their words so a lone "(" never wraps at a line end
    for (let j = pieces.length - 1; j >= 0; j--) {
      if (pieces[j].text === '(' && pieces[j + 1]) { pieces[j + 1].text = '(' + pieces[j + 1].text; pieces.splice(j, 1) }
      else if (pieces[j].text === ')' && j > 0) { pieces[j - 1].text += ')'; pieces.splice(j, 1) }
    }
    const words: Word[] = []
    const n = pieces.filter(p => p.text.trim()).length
    let i = 0
    const span = Math.max(0.6, (line.end - line.start) * 0.82)
    for (const p of pieces) {
      if (!p.text.trim()) { box.append(p.text); continue }
      const s = el('span', p.pen
        ? `display:inline-block;font:400 ${size * 0.62}px/1.3 ${F.pen};color:${C.red};transform-origin:50% 60%`
        : 'display:inline-block;transform-origin:50% 70%', box)
      s.textContent = p.text
      words.push({ span: s, at: line.start + (i++ / n) * span, pen: p.pen })
    }
    return { box, words }
  }

  update(t: number, line: LineCue | undefined, next: LineCue | undefined, layout: TypeLayout | false, theme: Theme) {
    const visible = layout && line && t >= line.start - 0.05 && t < Math.min(line.end + 0.35, next?.start ?? Infinity)
    if (!visible) { this.hide(); return }
    const key = `${line.id}|${JSON.stringify(layout)}`
    let b = this.cache.get(key)
    if (!b) { b = this.build(line, layout); this.cache.set(key, b) }
    if (this.shown !== b) { this.hide(); this.layer.appendChild(b.box); this.shown = b }

    const color = layout.color ?? DEFAULT_COLOR[theme], accent = layout.accent ?? DEFAULT_ACCENT[theme]
    const out = ease.in(seg(t, line.end + 0.1, line.end + 0.35))
    b.box.style.opacity = String(1 - out)
    b.words.forEach((w, i) => {
      const nextAt = b!.words[i + 1]?.at ?? line.end
      const k = seg(t, w.at, w.at + 0.16)
      const active = t >= w.at && t < nextAt
      w.span.style.opacity = String(clamp(k * 1.4))
      const pop = w.pen ? ease.elastic(k) : ease.back(k)
      w.span.style.transform = `translateY(${(1 - pop) * 26}px) scale(${0.86 + 0.14 * pop}) rotate(${w.pen ? -4 : 0}deg)`
      if (!w.pen) {
        w.span.style.color = active ? accent : color
        w.span.style.textShadow = active && theme !== 'paper' ? `0 0 28px ${accent}66` : 'none'
      }
    })
  }

  private hide() {
    this.shown?.box.remove()
    this.shown = null
  }
}
