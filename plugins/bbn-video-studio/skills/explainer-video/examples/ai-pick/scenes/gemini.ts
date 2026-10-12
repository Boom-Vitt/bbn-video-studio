// gemini (24.98–35.65 s): the Gemini sparkle in a cool blue/purple studio. The Blender plate (blender/gemini_seq.py)
// carries the mark, the frosted Gmail/Docs/Drive tiles on light beams, the web globe and its search sweep; three.js adds
// four-point glints that flare as the web cards land, drifting motes, and the two job chips on gemini-2.
import * as THREE from 'three'
import type { SceneDef } from '../types'
import { bl } from '../seq'
import { rng } from '../kit'
import { chip, faceCam, plate, pop, type Icon } from './a2/kit'

const BLUE = '#8FB0FF', VIOLET = '#B9A2FF'
const GRAD = ['#4796E3', '#9177C7', '#CA6673'].map(c => new THREE.Color(c)) // the mark's own gradient stops
const S = new THREE.Vector3(0, 0, 1.55) // sparkle centre, Blender coords (gemini_seq.py S)
// scene-local seconds (whisper on song/vo.wav); card arrivals = gemini_seq.py T_CARD + 0.48
const T = { c1: 7.36, c2: 9.98, hits: [5.93, 6.13, 6.33, 6.53, 6.73, 6.93] }

const ICON: Record<'office' | 'research', Icon> = {
  office: g => { // briefcase
    g.beginPath(); g.roundRect(10, 32, 80, 56, 10); g.stroke()
    g.beginPath(); g.roundRect(35, 14, 30, 18, 6); g.stroke()
    g.beginPath(); g.moveTo(10, 58); g.lineTo(90, 58); g.stroke()
  },
  research: g => { // magnifier
    g.beginPath(); g.arc(42, 42, 27, 0, Math.PI * 2); g.stroke()
    g.beginPath(); g.moveTo(62, 62); g.lineTo(88, 88); g.stroke()
  },
}

const pointsVS = `attribute float aSeed; attribute vec3 aColor; uniform float uTime, uBoost, uPx, uKind;
  varying float vA; varying vec3 vC;
  void main() {
    vec3 p = position;
    if (uKind > 0.5) p += vec3(sin(uTime * 0.21 + aSeed * 31.0), cos(uTime * 0.17 + aSeed * 17.0), sin(uTime * 0.13 + aSeed * 9.0)) * 0.35;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float tw = uKind > 0.5 ? 0.35 + 0.25 * sin(uTime * 0.8 + aSeed * 50.0)
                           : pow(0.5 + 0.5 * sin(uTime * (1.4 + aSeed * 2.6) + aSeed * 40.0), 6.0) * (0.9 + uBoost);
    vA = tw; vC = aColor;
    gl_PointSize = uPx * (0.45 + aSeed) * (0.7 + 0.6 * min(tw, 1.0)) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`
const pointsFS = `uniform float uKind; varying float vA; varying vec3 vC;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float a;
    if (uKind > 0.5) a = exp(-dot(p, p) * 4.0) * 0.5;
    else a = max(0.0, 1.0 - abs(p.x) * 9.0) * (1.0 - abs(p.y)) + max(0.0, 1.0 - abs(p.y) * 9.0) * (1.0 - abs(p.x)) + exp(-dot(p, p) * 22.0);
    a *= vA;
    gl_FragColor = vec4(vC * a, a);
  }`

/** Additive point field: 'glint' = four-point twinkles, 'mote' = soft drifting dust. */
function field(pos: THREE.Vector3[], colors: THREE.Color[], seeds: number[], px: number, kind: 0 | 1) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos.flatMap(p => [p.x, p.y, p.z]), 3))
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(colors.flatMap(c => [c.r, c.g, c.b]), 3))
  g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBoost: { value: 0 }, uPx: { value: px }, uKind: { value: kind } },
    vertexShader: pointsVS, fragmentShader: pointsFS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const pts = new THREE.Points(g, m)
  pts.frustumCulled = false
  return { pts, u: m.uniforms }
}

const def: SceneDef = {
  theme: 'dark',
  create({ stage, root }) {
    const pl = plate(stage, root, 'gemini', 321, 'gemini')
    const cam = stage.camera
    const r = rng(25)

    // glints around the sparkle (the occluder hides the ones behind it), coloured along the mark's gradient
    const gp: THREE.Vector3[] = [], gc: THREE.Color[] = [], gs: number[] = []
    for (let i = 0; i < 64; i++) {
      const a = r() * Math.PI * 2, rad = 1.15 + r() * 1.1, k = r()
      gp.push(bl(S.x + rad * Math.cos(a), S.y - 0.9 + r() * 1.4, S.z + rad * Math.sin(a) * 1.1))
      gc.push(k < 0.5 ? GRAD[0].clone().lerp(GRAD[1], k * 2) : GRAD[1].clone().lerp(GRAD[2], k * 2 - 1).lerp(new THREE.Color('#ffffff'), 0.35))
      gs.push(r())
    }
    const glints = field(gp, gc, gs, 560, 0)
    // motes drifting through the haze of the whole set
    const mp: THREE.Vector3[] = [], mc: THREE.Color[] = [], ms: number[] = []
    for (let i = 0; i < 320; i++) {
      mp.push(bl(-5 + r() * 10, -5 + r() * 12, 0.2 + r() * 6.5))
      mc.push(new THREE.Color('#9DB6FF').lerp(new THREE.Color('#C9A8FF'), r()))
      ms.push(r())
    }
    const motes = field(mp, mc, ms, 70, 1)
    root.add(glints.pts, motes.pts)

    // gemini-2 job chips, in front of the mark below it (slots solved for the 3/4 camera of gemini_seq.py)
    const chips = [
      { o: chip('คนทำงานออฟฟิศ', ICON.office, BLUE), at: bl(0.07, -1.83, 0.55), t0: T.c1 - 0.08, yaw: 0.16 },
      { o: chip('สายรีเสิร์ช', ICON.research, VIOLET), at: bl(1.73, -1.29, 0.42), t0: T.c2 - 0.1, yaw: -0.14 },
    ]
    for (const c of chips) { c.o.visible = false; root.add(c.o) }

    return {
      prepare: f => pl.prepare(f.local),
      update(f) {
        const t = f.local
        pl.set(t)
        const hit = T.hits.reduce((a, h) => a + (t >= h ? Math.exp(-(t - h) / 0.18) : 0), 0)
        glints.u.uTime.value = motes.u.uTime.value = t
        glints.u.uBoost.value = 1.6 * hit
        chips.forEach((c, i) => {
          const s = pop(t, c.t0)
          c.o.visible = s > 0
          if (!c.o.visible) return
          c.o.position.copy(c.at).add(new THREE.Vector3(0, 0.04 * Math.sin(t * 1.5 + i), 0))
          c.o.scale.setScalar(0.7 * s)
          faceCam(c.o, cam, c.yaw * Math.cos(t * 0.8 + i), (1 - Math.min(1, s)) * 0.3)
        })
      },
      dispose: () => pl.dispose(),
    }
  },
}
export default def
