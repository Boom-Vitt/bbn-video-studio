import * as THREE from 'three'

export const C = {
  ink: '#050A16', ink2: '#0B1426', ink3: '#14213A', rule: '#22324F', // deep-sea navy
  white: '#F4F6FA', gray: '#8A97B0', dim: '#4A5874',
  accent: '#FFC93C', // Monday yellow (สีวันจันทร์): titles, keywords, packet tiles; scenes use C.accent, not a named hue
  accentInk: '#B07A00', // the accent on light backgrounds
  accentDim: '#3A2E08', // accent-tinted panel fill on dark
  light: '#7FE3FF', // the light inside the fibre + the ms clock
  rose: '#FF4F7B', // mom's rose
  yellow: '#FFE14A', blue: '#5B8CFF', red: '#FF4D52', pink: '#FF8FB1',
  paper: '#F2EDE2', paper2: '#E6DFCF', paperInk: '#1C1B1F', bloodBg: '#14060A',
}
export const F = {
  // single quotes: these get interpolated into style="..." attributes
  display: "'Kanit', sans-serif",
  ui: "'IBM Plex Sans Thai', sans-serif",
  mono: "'IBM Plex Mono', 'IBM Plex Sans Thai', monospace",
  pen: "'Sriracha', cursive",
}

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x
/** 0..1 progress of x through [a, b], clamped. */
export const seg = (x: number, a: number, b: number) => clamp((x - a) / (b - a))
export const ease = {
  out: (x: number) => 1 - (1 - x) ** 3,
  in: (x: number) => x ** 3,
  inOut: (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
  back: (x: number) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2,
  elastic: (x: number) => (x === 0 || x === 1 ? x : 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
}
/** Deterministic PRNG (mulberry32). Never use Math.random in scenes. */
export function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
/** Beat pulse: 1 on the beat decaying to 0 before the next. */
export const pulse = (beat: number, sharp = 6) => Math.exp(-sharp * (((beat % 1) + 1) % 1))

/** Create a DOM element with inline styles (no CSS transitions/animations: render is frame-stepped). */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: Partial<CSSStyleDeclaration> | string, parent?: HTMLElement, html?: string) {
  const e = document.createElement(tag)
  if (typeof css === 'string') e.style.cssText = css
  else Object.assign(e.style, css)
  if (html !== undefined) e.innerHTML = html
  parent?.appendChild(e)
  return e
}

/** Text (or any 2D drawing) baked into a texture for use on planes/sprites in 3D. */
export function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  draw(c.getContext('2d')!)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** Plane mesh showing a canvas texture, sized in world units (height `hWorld`). */
export function canvasPlane(w: number, h: number, hWorld: number, draw: (g: CanvasRenderingContext2D) => void) {
  const mat = new THREE.MeshBasicMaterial({ map: canvasTexture(w, h, draw), transparent: true, depthWrite: false })
  return new THREE.Mesh(new THREE.PlaneGeometry((hWorld * w) / h, hWorld), mat)
}

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.roundRect(x, y, w, h, r)
}

/** Dispose every geometry/material/texture under an object. */
export function disposeDeep(o: THREE.Object3D) {
  o.traverse(n => {
    const m = n as THREE.Mesh
    m.geometry?.dispose()
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
    for (const mat of mats) {
      for (const v of Object.values(mat)) if (v instanceof THREE.Texture && !v.userData.shared) v.dispose() // shared = preloaded, reused by later scenes
      mat.dispose()
    }
  })
}

/** Top HUD strip in mono caps, like a broadcast/slate overlay. Sits just below the ~150px TikTok top UI. */
export function slate(parent: HTMLElement, left: string, right: string, color: string = C.gray) {
  return el('div', `position:absolute;left:56px;right:56px;top:158px;display:flex;justify-content:space-between;
    font:500 15px ${F.mono};letter-spacing:.14em;text-transform:uppercase;color:${color}`, parent,
    `<span>${left}</span><span>${right}</span>`)
}

