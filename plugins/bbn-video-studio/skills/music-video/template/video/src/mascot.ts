// "น้องสรุป" (Nong Sarup), the summariser bot: a pixel speech bubble with eyes and legs.
// One pixel map, two renderers: voxels for three.js, SVG for DOM avatars.
import * as THREE from 'three'
import { C } from './kit'

const MAP = [
  '..########..',
  '.##########.',
  '############',
  '###oo##oo###',
  '###oo##oo###',
  '############',
  '.##########.',
  '..###.#..#..',
  '..##..#..#..',
  '..#.........',
]

export interface Mascot { group: THREE.Group; body: THREE.Group; eyes: THREE.Mesh[] }

/** Voxel mascot ~1.2 units wide, origin at its feet centre. */
export function mascot(color: string = C.accent, px = 0.1): Mascot {
  const group = new THREE.Group(), body = new THREE.Group()
  const box = new THREE.BoxGeometry(px * 0.96, px * 0.96, px * 1.6)
  const skin = new THREE.MeshStandardMaterial({ color, roughness: 0.55, emissive: color, emissiveIntensity: 0.12 })
  const ink = new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.3 })
  const spark = new THREE.MeshStandardMaterial({ color: C.yellow, emissive: C.yellow, emissiveIntensity: 0.35 }) // '*' pixels
  const eyes: THREE.Mesh[] = []
  MAP.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return
    const m = new THREE.Mesh(box, ch === 'o' ? ink : ch === '*' ? spark : skin)
    m.position.set((x - 5.5) * px, (MAP.length - 1 - y) * px, ch === 'o' ? px * 0.05 : 0)
    if (ch === 'o') eyes.push(m)
    body.add(m)
  }))
  group.add(body)
  return { group, body, eyes }
}

/** Idle animation: hop on the beat, blink every ~4 beats. Call per frame. */
export function animateMascot(m: Mascot, beat: number, energy = 1) {
  const ph = ((beat % 1) + 1) % 1
  m.body.position.y = Math.max(0, Math.sin(ph * Math.PI)) * 0.06 * energy
  m.body.scale.y = 1 - Math.exp(-10 * ph) * 0.08 * energy
  const blink = beat % 4 > 3.85
  for (const e of m.eyes) e.scale.y = blink ? 0.15 : 1
}

/** Inline SVG of the mascot for DOM UIs (chat avatars, cards). */
export function mascotSVG(size = 48, color: string = C.accent) {
  const cells = MAP.flatMap((row, y) => [...row].map((ch, x) =>
    ch === '.' ? '' : `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${ch === 'o' ? C.ink : ch === '*' ? C.yellow : color}"/>`)).join('')
  return `<svg width="${size}" height="${(size * MAP.length) / 12}" viewBox="0 0 12 ${MAP.length}" shape-rendering="crispEdges">${cells}</svg>`
}
