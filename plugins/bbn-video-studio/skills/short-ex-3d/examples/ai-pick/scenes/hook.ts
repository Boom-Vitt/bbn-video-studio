// hook (0–7.53 s): title shot of the three logos (Blender plate: blender/hook_seq.py), each pulses on its name;
// hook-2: ChatGPT and Claude slide apart as the camera pushes in to the "40 วิ" countdown ring through light streaks,
// then a whip lands on ChatGPT for the hard cut.
import * as THREE from 'three'
import { Sequence, applyCam, bl, type CamTrack } from '../seq'
import { canvasTexture, ease, seg } from '../kit'
import { hl, title3d } from './a1/ui'
import type { SceneDef } from '../types'

const N = 227 // frames in public/hook/seq
const RING = bl(-1.125, 2.47, 0.9) // just in front of the ring's glass disc (hook_seq.py RING)
const RING_ON = 124 / 30, FORTY = 5.12, WHIP = 7.03 // ring appears, "40" is spoken, whip starts

export default {
  theme: 'deep',
  type: { pos: 'bottom' },
  create({ stage, root, dom }) {
    const seq = new Sequence('/hook/seq', N)
    stage.backdrop = seq.texture
    let track: CamTrack | null = null
    const ready = fetch('/hook/cam.json').then(r => r.json()).then((t: CamTrack) => { track = t })

    const title = title3d(dom, `เลือก AI<br>${hl('ให้ตรงงาน')}`, 196, 146)

    // countdown digits in the ring: 40 on "40 วิ", then ticks 39, 38 (redrawn only when the number changes)
    let shown = -1
    const tex = canvasTexture(512, 512, () => {})
    const draw = (n: number) => {
      const g = (tex.image as HTMLCanvasElement).getContext('2d')!
      g.clearRect(0, 0, 512, 512)
      g.textAlign = 'center'
      g.lineJoin = 'round'
      for (const [txt, font, y] of [[String(n), "800 262px 'Kanit'", 318], ['วิ', "500 112px 'Kanit'", 448]] as const) {
        g.font = font
        g.strokeStyle = 'rgba(10,6,2,.9)'; g.lineWidth = 14
        g.strokeText(txt, 256, y)
        g.fillStyle = '#FFF1D6'
        g.fillText(txt, 256, y)
      }
      tex.needsUpdate = true
      shown = n
    }
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.08), mat)
    label.position.copy(RING)
    root.add(label)

    return {
      async prepare(f) { await ready; await seq.prepare(f.local) },
      update(f) {
        seq.set(f.local)
        if (track) applyCam(track, f.local, stage.camera)
        const t = f.local

        // title: already on screen at frame 0, flies past the camera as hook-2 pushes in
        const out = ease.in(seg(t, 4.11, 4.62))
        title.style.opacity = String(1 - out)
        title.style.transform = `scale(${1 + 0.012 * t + 0.9 * out})`
        title.style.filter = out > 0 ? `blur(${(out * 14).toFixed(2)}px)` : ''

        // "40 วิ" inside the ring: pops in with it, pops again on "40", gone before the whip smears the plate
        const k = ease.back(seg(t, RING_ON, RING_ON + 0.5))
        const flare = t >= FORTY - 0.06 ? Math.exp(-5 * Math.max(0, t - FORTY)) : 0
        label.visible = t >= RING_ON && t < WHIP + 0.2
        label.scale.setScalar((0.3 + 0.7 * k) * (1 + 0.1 * flare))
        mat.color.setScalar(0.8) // near the bloom threshold (0.72 linear): the numerals keep their shape, the "40" beat is a scale pop
        const n = 40 - Math.max(0, Math.floor(t - FORTY))
        if (n !== shown) draw(n)
        mat.opacity = Math.min(seg(t, RING_ON, RING_ON + 0.2), 1 - seg(t, WHIP, WHIP + 0.18))
      },
      dispose() { seq.dispose() },
    }
  },
} satisfies SceneDef
