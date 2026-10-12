// chatgpt (7.53–17.14 s): the white ceramic mark in clean white/mint studio light (Blender plate), then its abilities
// orbit in as glass objects on the words — chat bubbles, a generated picture blooming in, a live voice ring — and job
// chips pop in on chatgpt-2 while the camera arcs around.
import * as THREE from 'three'
import type { SceneDef } from '../types'
import { bl } from '../seq'
import { clamp, ease, rng, seg } from '../kit'
import { chip, faceCam, glassCard, orbitIn, plate, pop, type Icon } from './a2/kit'
import { VOICE_CHATGPT } from './a2/voice'

const MINT = '#7CF2C9', WHITE = '#EAF7F2'
// word onsets, scene-local seconds (whisper on song/vo.wav)
const T = { ask: 2.72, img: 3.58, voice: 4.64, out: 5.6, c1: 6.32, c2: 6.92, c3: 8.62 }
const C0 = new THREE.Vector3(0, 0, 1.7) // mark centre, Blender coords (blender/chatgpt_seq.py LOGO_Z)

const ICON: Record<'content' | 'marketing' | 'assistant', Icon> = {
  content: g => { g.beginPath(); g.roundRect(8, 18, 84, 64, 14); g.stroke(); g.beginPath(); g.moveTo(41, 35); g.lineTo(65, 50); g.lineTo(41, 65); g.closePath(); g.fill() },
  marketing: g => { for (const [x, h] of [[12, 34], [40, 54], [68, 78]]) { g.beginPath(); g.roundRect(x, 90 - h, 20, h, 5); g.fill() } },
  assistant: g => { for (const [x, y] of [[10, 10], [56, 10], [10, 56], [56, 56]]) { g.beginPath(); g.roundRect(x, y, 34, 34, 9); g.fill() } },
}

/** The "generated picture": a dreamy mint-dusk landscape with a lake reflection. */
function art(g: CanvasRenderingContext2D, w: number, h: number) {
  const r = rng(11), hz = h * 0.64
  const sky = g.createLinearGradient(0, 0, 0, hz)
  sky.addColorStop(0, '#0C2F3E'); sky.addColorStop(0.55, '#33A88E'); sky.addColorStop(1, '#FFD6A8')
  g.fillStyle = sky; g.fillRect(0, 0, w, h)
  const sx = w * 0.63, sy = hz * 0.68
  const glow = g.createRadialGradient(sx, sy, 0, sx, sy, w * 0.42)
  glow.addColorStop(0, 'rgba(255,244,220,1)'); glow.addColorStop(0.12, 'rgba(255,224,180,.65)'); glow.addColorStop(1, 'rgba(255,200,150,0)')
  g.fillStyle = glow; g.fillRect(0, 0, w, hz)
  g.fillStyle = '#FFF6E4'; g.beginPath(); g.arc(sx, sy, w * 0.055, 0, Math.PI * 2); g.fill()
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * r()})`; g.fillRect(r() * w, r() * hz * 0.4, 2, 2) }
  for (const [col, base, amp] of [['#2C7E74', 0.62, 0.16], ['#1A5559', 0.78, 0.12], ['#0F3640', 0.92, 0.09]] as const) {
    const f1 = 0.006 + r() * 0.006, f2 = 0.02 + r() * 0.02, p1 = r() * 9, p2 = r() * 9
    g.fillStyle = col; g.beginPath(); g.moveTo(0, hz)
    for (let x = 0; x <= w; x += 6) g.lineTo(x, hz * base - hz * amp * (Math.sin(x * f1 + p1) + 0.45 * Math.sin(x * f2 + p2) + 0.6))
    g.lineTo(w, hz); g.closePath(); g.fill()
  }
  g.save(); g.globalAlpha = 0.5; g.translate(0, hz * 2); g.scale(1, -1); g.drawImage(g.canvas, 0, 0, w, hz, 0, 0, w, hz); g.restore()
  g.fillStyle = 'rgba(4,22,30,.45)'; g.fillRect(0, hz, w, h - hz)
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,230,200,${0.15 + 0.3 * r()})`; g.fillRect(sx - 60 + r() * 120 - (i % 5) * 8, hz + 6 + i * 6, 30 + r() * 70, 2) }
}

const lines = (g: CanvasRenderingContext2D, x: number, y: number, ws: number[], col: string) => {
  g.fillStyle = col
  ws.forEach((w, i) => { g.beginPath(); g.roundRect(x, y + i * 44, w, 20, 10); g.fill() })
}

const def: SceneDef = {
  theme: 'dark',
  create({ stage, root }) {
    const pl = plate(stage, root, 'chatgpt', 290, 'chatgpt')
    const cam = stage.camera

    // ถามได้ทุกเรื่อง: three chat bubbles orbit in
    const ask = glassCard(0.94, 0.58, 0.21, MINT, WHITE, g => {
      g.font = `800 150px Kanit`; g.fillStyle = MINT; g.textBaseline = 'middle'; g.fillText('?', 34, 128)
      lines(g, 130, 66, [190, 140, 170], 'rgba(196,224,214,.85)')
    }, true)
    const reply = glassCard(0.96, 0.58, 0.21, WHITE, MINT, g => lines(g, 44, 50, [290, 250, 300, 180], 'rgba(196,224,214,.85)'), true)
    const typing = glassCard(0.68, 0.37, 0.18, MINT, MINT, undefined, true)
    const dots = [0, 1, 2].map(i => {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(MINT).multiplyScalar(1.4), toneMapped: false }))
      d.position.set((i - 1) * 0.17, 0, 0.1); typing.add(d); return d
    })
    // สร้างรูป: framed generated picture blooming in
    const frame = glassCard(1.62, 1.18, 0.1, WHITE, WHITE)
    const W = 840, H = 600
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; art(cv.getContext('2d')!, W, H)
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace
    const picMat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, uP: { value: 0 }, uEdge: { value: new THREE.Color(MINT) } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D map; uniform float uP; uniform vec3 uEdge; varying vec2 vUv;
        float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
        void main() {
          float r = length((vUv - 0.5) * vec2(1.4, 1.0)) + 0.2 * n(vUv * 8.0), front = uP * 1.3;
          float a = smoothstep(front, front - 0.05, r), edge = smoothstep(0.08, 0.0, abs(r - front)) * (1.0 - step(0.999, uP));
          gl_FragColor = vec4(texture2D(map, vUv).rgb * a + uEdge * edge * 2.4, max(a, edge));
        }`,
      transparent: true, depthWrite: false,
    })
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 1.04), picMat)
    pic.position.z = 0.095; frame.add(pic)

    const items = [ // slot = offset from the mark centre (Blender x, y, z), from = orbit swoop (radians)
      { o: ask, slot: [-1.05, -0.35, 1.62] as const, from: -2.8, t0: T.ask - 0.1, yaw: 0.22 },
      { o: reply, slot: [1.45, -0.3, 0.38] as const, from: 2.4, t0: T.ask + 0.16, yaw: -0.28 },
      { o: typing, slot: [-1.38, -0.3, -0.5] as const, from: -2.6, t0: T.ask + 0.36, yaw: 0.25 },
      { o: frame, slot: [0.92, -0.2, 1.72] as const, from: 2.9, t0: T.img - 0.12, yaw: -0.2 },
    ]
    for (const it of items) root.add(it.o)

    // คุยด้วยเสียง: a ring of glowing bars around the mark driven by the narration's real envelope
    const NB = 96, R = 1.3
    const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.026, 1, 0.026).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ toneMapped: false }), NB)
    const col = new THREE.Color()
    for (let k = 0; k < NB; k++) bars.setColorAt(k, col.set(MINT).lerp(new THREE.Color('#ffffff'), 0.5 + 0.5 * Math.sin(k * 0.26)).multiplyScalar(1.15))
    const base = new THREE.Mesh(new THREE.TorusGeometry(R - 0.02, 0.006, 8, 180), new THREE.MeshBasicMaterial({ color: new THREE.Color(MINT).multiplyScalar(1.1), toneMapped: false }))
    const ring = new THREE.Group(); ring.add(bars, base); root.add(ring)
    const dummy = new THREE.Object3D()

    // เหมาะกับสาย...: job chips
    const chips = [
      { o: chip('คอนเทนต์', ICON.content, MINT), slot: [-0.55, -0.6, 1.84] as const, t0: T.c1 - 0.08, yaw: 0.2 },
      { o: chip('การตลาด', ICON.marketing, MINT), slot: [0.7, -0.6, 1.28] as const, t0: T.c2 - 0.08, yaw: -0.18 },
      { o: chip('ผู้ช่วยทำทุกอย่าง', ICON.assistant, MINT), slot: [0.0, -0.7, -1.3] as const, t0: T.c3 - 0.1, yaw: 0.12 },
    ]
    for (const c of chips) root.add(c.o)

    return {
      prepare: f => pl.prepare(f.local),
      update(f) {
        const t = f.local
        pl.set(t)

        items.forEach((it, i) => {
          const eIn = ease.out(seg(t, it.t0, it.t0 + 0.62)), eOut = ease.in(seg(t, T.out + i * 0.05, T.out + 0.42 + i * 0.05))
          it.o.visible = eIn > 0 && eOut < 1
          if (!it.o.visible) return
          const [sx, sy, sz] = it.slot
          const bob: [number, number, number] = [sx, sy, sz + 0.05 * Math.sin(t * 1.7 + i * 2)]
          it.o.position.copy(eOut > 0 ? orbitIn(C0, bob, 1 - eOut, -it.from) : orbitIn(C0, bob, eIn, it.from))
          it.o.scale.setScalar((0.35 + 0.65 * eIn) * (1 - 0.6 * eOut))
          faceCam(it.o, cam, it.yaw * (0.6 + 0.4 * Math.sin(t * 0.9 + i)) + (1 - eIn) * 1.2, 0.04 * Math.sin(t * 1.3 + i))
        })
        dots.forEach((d, i) => d.scale.setScalar(0.7 + 0.5 * Math.max(0, Math.sin(t * 9 - i * 1.1))))
        picMat.uniforms.uP.value = ease.inOut(seg(t, T.img + 0.05, T.img + 0.8))

        // voice ring: sweeps on at "คุยด้วยเสียง", settles to a faint pulse once the chips arrive
        ring.visible = t > T.voice - 0.06
        if (ring.visible) {
          ring.position.copy(pl.occ.position); ring.quaternion.copy(pl.occ.quaternion)
          const fi = Math.round(t * 30), at = (k: number) => VOICE_CHATGPT[clamp(fi + k, 0, VOICE_CHATGPT.length - 1)]
          const v = (at(-1) + 2 * at(0) + at(1)) / 4
          const sweep = seg(t, T.voice - 0.06, T.voice + 0.4), calm = 1 - 0.72 * seg(t, T.out, T.out + 0.5)
          for (let k = 0; k < NB; k++) {
            const a = (k / NB) * Math.PI * 2 + Math.PI / 2 - t * 0.35
            const spec = 0.5 + 0.5 * Math.sin(k * 0.71 + fi * 0.83) * Math.sin(k * 0.29 - fi * 0.37 + 1.3)
            const grow = clamp((sweep - k / NB) * 6)
            dummy.position.set(R * Math.cos(a), R * Math.sin(a), 0)
            dummy.rotation.set(0, 0, a - Math.PI / 2)
            dummy.scale.set(1, Math.max(1e-3, (0.035 + 0.32 * v * (0.3 + 0.7 * spec)) * grow * calm), 1)
            dummy.updateMatrix(); bars.setMatrixAt(k, dummy.matrix)
          }
          bars.instanceMatrix.needsUpdate = true
          base.scale.setScalar(0.85 + 0.15 * sweep)
        }

        chips.forEach((c, i) => {
          const s = pop(t, c.t0)
          c.o.visible = s > 0
          if (!s) return
          const [sx, sy, sz] = c.slot
          c.o.position.copy(bl(C0.x + sx, C0.y + sy, C0.z + sz + 0.04 * Math.sin(t * 1.5 + i * 1.7)))
          c.o.scale.setScalar(s)
          faceCam(c.o, cam, c.yaw * Math.cos(t * 0.8 + i), (1 - Math.min(1, s)) * 0.3)
          const rimMat = (c.o.children[1] as THREE.Mesh).material as THREE.ShaderMaterial
          rimMat.uniforms.uK.value = 1.6 + 4 * Math.exp(-(t - c.t0) * 5)
        })
      },
      dispose: () => pl.dispose(),
    }
  },
}
export default def
