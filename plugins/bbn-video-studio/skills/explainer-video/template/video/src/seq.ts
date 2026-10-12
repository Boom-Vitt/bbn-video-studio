// Blender-rendered animated backgrounds: a JPG frame sequence (public/<dir>/f_0000.jpg ...) plus the Blender camera
// per frame, so three.js objects can sit inside the rendered world. Frame index = round(local seconds * fps).
import * as THREE from 'three'

export interface CamTrack { fps: number; fovY: number; frames: number[][] } // frames[i] = [x,y,z, qw,qx,qy,qz] Blender world

export class Sequence {
  readonly texture = new THREE.Texture()
  private cache = new Map<number, Promise<ImageBitmap>>()
  private shown = -1

  /** dir: public path ('/hook/seq'), count: number of frames, fps of the render (30). */
  constructor(readonly dir: string, readonly count: number, readonly fps = 30) {
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.userData.shared = true // the Sequence owns it; disposed in dispose()
  }

  index(local: number) { return Math.max(0, Math.min(this.count - 1, Math.round(local * this.fps))) }

  private load(i: number) {
    let p = this.cache.get(i)
    if (!p) {
      p = fetch(`${this.dir}/f_${String(i).padStart(4, '0')}.jpg`).then(r => r.blob()).then(b => createImageBitmap(b, { imageOrientation: 'flipY' }))
      this.cache.set(i, p)
      for (const k of this.cache.keys()) if (Math.abs(k - i) > 6) { this.cache.get(k)!.then(b => b.close()); this.cache.delete(k) }
    }
    return p
  }

  /** Await before update() when rendering: loads the exact frame for `local` seconds (and prefetches the next ones). */
  async prepare(local: number) {
    const i = this.index(local)
    for (let k = 1; k <= 3; k++) if (i + k < this.count) void this.load(i + k)
    const bmp = await this.load(i)
    if (this.shown !== i) { this.texture.image = bmp; this.texture.needsUpdate = true; this.shown = i }
  }

  /** Preview-safe: shows the frame if it is already loaded, otherwise keeps the last one and starts loading. */
  set(local: number) { void this.prepare(local) }

  dispose() {
    for (const p of this.cache.values()) p.then(b => b.close())
    this.cache.clear()
    this.texture.dispose()
  }
}

const AXIS = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2) // Blender Z-up -> three Y-up

/** Put a three.js camera exactly where the Blender camera was at `local` seconds (same fps as the sequence). */
export function applyCam(track: CamTrack, local: number, cam: THREE.PerspectiveCamera) {
  const i = Math.max(0, Math.min(track.frames.length - 1, Math.round(local * track.fps)))
  const [x, y, z, qw, qx, qy, qz] = track.frames[i]
  cam.position.set(x, z, -y)
  cam.quaternion.copy(AXIS).multiply(new THREE.Quaternion(qx, qy, qz, qw))
  cam.fov = track.fovY
  cam.updateProjectionMatrix()
  cam.updateMatrixWorld()
}

/** Blender world point (x, y, z) -> three.js world. */
export const bl = (x: number, y: number, z: number) => new THREE.Vector3(x, z, -y)
