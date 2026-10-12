// Brand logos as 3D models: blender/logos.py extrudes the official SVG marks (ref/logos/*.svg, fetched per story,
// never shipped with the template) into video/public/logos/<id>.glb. Empty by default; add one entry per brand the
// story shows, e.g. claude: { name: 'Claude', color: '#D97757', glow: '#FFB08F' }.
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export type Brand = string
export const BRAND: Record<Brand, { name: string; color: string; glow: string }> = {}

const MODELS: Partial<Record<Brand, THREE.Object3D>> = {}
export async function loadLogos() {
  const loader = new GLTFLoader()
  await Promise.all((Object.keys(BRAND) as Brand[]).map(async b => {
    const g = await loader.loadAsync(`/logos/${b}.glb`)
    g.scene.traverse(o => { const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined; if (m) m.userData.shared = true })
    MODELS[b] = g.scene
  }))
  const m = await loader.loadAsync('/mascot/mascot.glb')
  m.scene.traverse(o => { const mt = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined; if (mt) mt.userData.shared = true })
  MASCOT = m.scene
}
let MASCOT: THREE.Object3D | null = null

/** A fresh copy of the hero chat bubble "น้องข้อความ" (blender/mascot.py): 2.5 wide x 1.84 tall incl. tail, facing +z,
 *  origin = body centre. Animate via getObjectByName: 'eye_l' / 'eye_r' (scale.y -> 0.1 = blink), 'smile', 'blush_l' /
 *  'blush_r', 'body', 'tail'. Materials are shared: clone them before changing. */
export function mascot() {
  return MASCOT!.clone(true)
}

/** A fresh copy of a logo (2 units tall, facing +z, centred). Materials are shared: clone them before changing. */
export function logo(b: Brand) {
  const o = MODELS[b]!.clone(true)
  o.userData.brand = b
  return o
}
