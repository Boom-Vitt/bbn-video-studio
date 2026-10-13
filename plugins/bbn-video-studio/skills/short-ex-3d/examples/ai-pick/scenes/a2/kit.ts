// Shared pieces for the chatgpt + claude scenes: the Blender plate (frames + camera + mark transform), a depth-only
// copy of the mark so three.js objects pass behind the rendered one, frosted glass, fresnel rims and job chips.
import * as THREE from 'three'
import { Sequence, applyCam, bl, type CamTrack } from '../../seq'
import { studioEnv, type Stage } from '../../stage'
import { logo, type Brand } from '../../props'
import { F, canvasTexture, clamp } from '../../kit'

interface Track extends CamTrack { logo: number[][] } // + the mark's Blender world transform per frame

const AXIS = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
const AXIS_INV = AXIS.clone().invert()
const q = new THREE.Quaternion()

/** Blender plate for public/<dir>/: backdrop frames, matched camera and an invisible occluder on the mark. */
export function plate(stage: Stage, root: THREE.Group, dir: string, count: number, brand: Brand) {
  const seq = new Sequence(`/${dir}/seq`, count)
  let track: Track | null = null
  const ready = fetch(`/${dir}/cam.json`).then(r => r.json()).then(j => { track = j })
  stage.backdrop = seq.texture
  const occ = logo(brand)
  const hide = new THREE.MeshBasicMaterial({ colorWrite: false })
  occ.traverse(o => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = hide })
  occ.renderOrder = -1
  root.add(occ)
  return {
    seq, occ,
    async prepare(local: number) { await ready; await seq.prepare(local) },
    set(local: number) {
      seq.set(local)
      if (!track) return
      applyCam(track, local, stage.camera)
      const [x, y, z, qw, qx, qy, qz] = track.logo[Math.max(0, Math.min(track.logo.length - 1, Math.round(local * track.fps)))]
      occ.position.copy(bl(x, y, z))
      occ.quaternion.copy(AXIS).multiply(q.set(qx, qy, qz, qw)).multiply(AXIS_INV)
      occ.updateMatrixWorld()
    },
    dispose() { seq.dispose() },
  }
}

/** Frosted glass (refracts the Blender plate behind it). */
export function glass(tint: string, o: THREE.MeshPhysicalMaterialParameters = {}) {
  return new THREE.MeshPhysicalMaterial({
    // no clearcoat: a near-mirror coat turns the stage's punctual lights into pin highlights the shared bloom blows up
    color: '#ffffff', roughness: 0.2, transmission: 1, thickness: 0.35, ior: 1.45,
    envMap: studioEnv, envMapIntensity: 0.32, attenuationColor: tint, attenuationDistance: 1.2, specularIntensity: 0.7, ...o,
  })
}

/** View-dependent edge light on any mesh geometry (additive, blooms). */
export function rim(geo: THREE.BufferGeometry, color: string, k = 1.6, power = 2.6) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uK: { value: k }, uP: { value: power } },
    vertexShader: `varying vec3 vN, vV; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uC; uniform float uK, uP; varying vec3 vN, vV;
      void main() { float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uP); gl_FragColor = vec4(uC * f * uK, 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  })
  return new THREE.Mesh(geo, m)
}

/** Rounded-rect slab (optionally with a speech-bubble tail), centred, `depth` thick. r = h/2 makes a pill. */
export function slab(w: number, h: number, r: number, depth = 0.1, tail = false) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2
  s.moveTo(x + r, y)
  if (tail) { s.lineTo(x + r + 0.06, y); s.lineTo(x + r - 0.1, y - 0.2); s.lineTo(x + r + 0.28, y) }
  s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 5, curveSegments: 28 })
  g.translate(0, 0, -depth / 2)
  return g
}

/** A flat label/drawing on the front face of a slab (unlit, so it reads on any backdrop). */
export function face(wPx: number, hPx: number, hWorld: number, draw: (g: CanvasRenderingContext2D) => void, z = 0.09) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry((hWorld * wPx) / hPx, hWorld),
    new THREE.MeshBasicMaterial({ map: canvasTexture(wPx, hPx, draw), transparent: true, depthWrite: false, toneMapped: false }))
  m.position.z = z
  return m
}

/** Glass slab + rim + front drawing, as one group. */
export function glassCard(w: number, h: number, r: number, tint: string, rimColor: string, draw?: (g: CanvasRenderingContext2D) => void, tail = false) {
  const g = new THREE.Group()
  const geo = slab(w, h, r, 0.1, tail)
  g.add(new THREE.Mesh(geo, glass(tint)), rim(geo, rimColor))
  if (draw) g.add(face(Math.round(w * 400), Math.round(h * 400), h, draw))
  return g
}

export type Icon = (g: CanvasRenderingContext2D) => void // drawn in a 100x100 box, stroke/fill already set

/** Job chip: glass pill, icon in a glowing disc, Thai label. ~0.46 units tall. */
export function chip(label: string, icon: Icon, accent: string, rimColor = accent) {
  const H = 0.46, S = 400, font = `500 ${Math.round(H * S * 0.5)}px ${F.display}`
  const meas = document.createElement('canvas').getContext('2d')!
  meas.font = font
  const tw = meas.measureText(label).width / S
  const W = H * 1.12 + tw + H * 0.55
  const card = glassCard(W, H, H / 2, accent, rimColor, g => {
    const h = H * S, cx = h / 2 + 4
    g.fillStyle = accent; g.shadowColor = accent; g.shadowBlur = 18
    g.beginPath(); g.arc(cx, h / 2, h * 0.36, 0, Math.PI * 2); g.fill()
    g.shadowBlur = 0
    g.save(); g.translate(cx - h * 0.21, h / 2 - h * 0.21); g.scale((h * 0.42) / 100, (h * 0.42) / 100)
    g.strokeStyle = g.fillStyle = '#0B1210'; g.lineWidth = 9; g.lineCap = g.lineJoin = 'round'
    icon(g); g.restore()
    g.font = font; g.fillStyle = '#D3DDD9'; g.textBaseline = 'middle' // kept under the bloom threshold so Thai stays crisp
    g.fillText(label, h * 1.06, h / 2 + h * 0.03)
  })
  card.userData.width = W
  return card
}

/** Pop-in scale for chips/cards: 0 before t0, overshoots to 1 over `d` seconds. */
export function pop(t: number, t0: number, d = 0.38) {
  const x = clamp((t - t0) / d)
  return x <= 0 ? 0 : 1 + 2.4 * (x - 1) ** 3 + 1.4 * (x - 1) ** 2
}

/** Orbit-in placement around a mark centre (Blender coords): swoops from `from` radians around + farther out to the slot. */
export function orbitIn(center: THREE.Vector3, slot: [number, number, number], e: number, from: number, out = 1.8) {
  const [sx, sy, sz] = slot
  const r = Math.hypot(sx, sy), phi = Math.atan2(sx, -sy)
  const p = phi + from * (1 - e), rr = r + out * (1 - e)
  return bl(center.x + rr * Math.sin(p), center.y - rr * Math.cos(p), center.z + sz + 0.5 * (1 - e))
}

/** Billboard: face the camera, with an optional extra tilt. */
export function faceCam(o: THREE.Object3D, cam: THREE.Camera, yaw = 0, roll = 0) {
  o.quaternion.copy(cam.quaternion)
  if (yaw) o.rotateY(yaw)
  if (roll) o.rotateZ(roll)
}
