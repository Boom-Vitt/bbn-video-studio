// outro (35.65–44.87 s): the three logos as a team (Blender plate: blender/outro_seq.py) with lines of light to their
// job chips ("ไม่ต้องเลือกตัวเดียว"); outro-2 cranes up to a prompt box typing "เขียนพรอมต์…", a 3D ×2 bursts, and the
// end card holds a red glass "กดติดตาม" button that a cursor taps at 7.0 s.
import * as THREE from 'three'
import { Sequence, applyCam, bl, type CamTrack } from '../seq'
import { C, canvasTexture, ease, lerp, rng, seg } from '../kit'
import { studioEnv } from '../stage'
import { BRAND, type Brand } from '../props'
import { hl, kicker, title3d } from './a1/ui'
import type { SceneDef } from '../types'

const N = 278 // frames in public/outro/seq
type V3 = [number, number, number] // Blender world
const LOGO: Record<Brand, V3> = { chatgpt: [0, 0.45, 2.27], claude: [-1.25, 0, 0.12], gemini: [1.25, 0, 0.12] }
const CHIP_W = 1.62, CHIP_H = 0.5
const CHIPS: { b: Brand; text: string; icon: string; at: V3; t: number }[] = [ // pop as each logo flares (outro_seq.py)
  { b: 'chatgpt', text: 'คอนเทนต์', icon: '🎬', at: [-1.96, -0.6, 2.93], t: 0.55 },
  { b: 'chatgpt', text: 'การตลาด', icon: '📣', at: [1.96, -0.6, 2.93], t: 0.65 },
  { b: 'claude', text: 'เขียนโค้ด', icon: '💻', at: [-1.96, -0.6, 2.27], t: 1.05 },
  { b: 'claude', text: 'งานเขียน', icon: '✍️', at: [-1.96, -0.6, 1.61], t: 1.15 },
  { b: 'gemini', text: 'ออฟฟิศ', icon: '📧', at: [1.96, -0.6, 2.27], t: 1.55 },
  { b: 'gemini', text: 'รีเสิร์ช', icon: '🔎', at: [1.96, -0.6, 1.61], t: 1.65 },
]
const TEAM = 2.37 // "ใช้ให้ตรงงาน": every line flares
const CAM1 = bl(0, -17.4, 1.3), CAM2 = bl(0, -11.6, 6.38) // Blender camera on the team shot / end card (chips + button face it)
const BOX: V3 = [0, 0.2, 6.3] // prompt box front face
const X2: V3 = [1.15, 0.0, 6.8], X2_T = 187 / 30 // the Blender ×2 pops here on "เท่าตัว"
const BTN: V3 = [0, -1.4, 5.36], BTN_T = 6.4, TAP = 7.0
const TYPE_A = 3.92, TYPE_B = 4.75 // "สอนเขียนพรอมต์"
const TYPED = ['เ', 'ขี', 'ย', 'น', 'พ', 'ร', 'อ', 'ม', 'ต์', '…'] // grapheme clusters: marks never split from their base

const v = (p: V3) => bl(p[0], p[1], p[2])

function pill(w: number, h: number, depth: number, mat: THREE.Material, bevel = 0.025) {
  const r = h / 2, s = new THREE.Shape()
  s.moveTo(-w / 2 + r, -r)
  s.lineTo(w / 2 - r, -r)
  s.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false)
  s.lineTo(-w / 2 + r, r)
  s.absarc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false)
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 32 })
  g.translate(0, 0, -depth / 2)
  return new THREE.Mesh(g, mat)
}

/** A canvas-textured plane that can be redrawn (typed text); 0.66 keeps white text under the bloom threshold (0.72). */
function board(w: number, h: number, wWorld: number, draw: (g: CanvasRenderingContext2D) => void) {
  const tex = canvasTexture(w, h, draw)
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: new THREE.Color(0.66, 0.66, 0.66) })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(wWorld, (wWorld * h) / w), mat)
  const redraw = (fn: (g: CanvasRenderingContext2D) => void) => {
    const g = (tex.image as HTMLCanvasElement).getContext('2d')!
    g.clearRect(0, 0, w, h); fn(g); tex.needsUpdate = true
  }
  return { mesh, mat, redraw }
}

const BEAM_VS = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'
const BEAM_FS = `uniform vec3 uColor; uniform float uProg, uTime, uBoost; varying vec2 vUv;
  void main() {
    float x = vUv.x;
    if (x > uProg) discard;
    float head = smoothstep(uProg - 0.22, uProg, x) * (1.0 - step(0.999, uProg));
    float pulse = exp(-pow((fract(uTime * 0.7) - x) * 7.0, 2.0));
    gl_FragColor = vec4(uColor * (0.75 + 0.9 * head + 0.6 * pulse + uBoost), 1.0);
  }`
const SPARK_VS = `attribute vec3 dir; attribute float spd, sz; attribute vec3 col; uniform float uT; varying float vA; varying vec3 vC;
  void main() {
    vec3 p = position + dir * spd * (1.0 - exp(-3.2 * uT));
    vA = clamp(1.0 - uT / 1.1, 0.0, 1.0); vA *= vA; vC = col;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = sz * (320.0 / -mv.z) * (0.5 + 0.5 * vA);
    gl_Position = projectionMatrix * mv;
  }`
const SPARK_FS = `varying float vA; varying vec3 vC;
  void main() { float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)); a *= a * vA; gl_FragColor = vec4(vC * a * 2.2, a); }`

export default {
  theme: 'deep',
  type: { pos: 'bottom' },
  create({ stage, root, dom }) {
    const seq = new Sequence('/outro/seq', N)
    stage.backdrop = seq.texture
    stage.scene.environment = studioEnv // glass chips + button reflections (reset on the next cut)
    let track: CamTrack | null = null
    const ready = fetch('/outro/cam.json').then(r => r.json()).then((t: CamTrack) => { track = t })

    // ---- outro-1: the team, lines of light to job chips
    const team = new THREE.Group()
    root.add(team)
    const beams: THREE.ShaderMaterial[] = []
    const chips = CHIPS.map((c, i) => {
      const glow = new THREE.Color(BRAND[c.b].glow)
      const g = new THREE.Group()
      g.position.copy(v(c.at))
      g.lookAt(CAM1)
      // the stage lights sum to ~3.6x on a lit surface, so lit colours stay very dark and brightness comes from emissive
      const body = pill(CHIP_W, CHIP_H, 0.06, new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#05070b').lerp(glow, 0.04), roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05,
        transparent: true, opacity: 0.9, emissive: glow, emissiveIntensity: 0.07, envMapIntensity: 0.5,
      }))
      const halo = pill(CHIP_W + 0.06, CHIP_H + 0.06, 0.01, new THREE.MeshBasicMaterial({
        color: glow.clone().multiplyScalar(0.55), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false,
      }), 0.005)
      halo.position.z = -0.05
      const label = board(512, 158, CHIP_W, g2 => {
        g2.textBaseline = 'middle'
        g2.font = "66px 'Apple Color Emoji'"
        g2.fillText(c.icon, 40, 84)
        g2.font = "500 74px 'Kanit'"
        g2.fillStyle = '#ffffff'
        g2.fillText(c.text, 128, 84)
      })
      label.mesh.position.z = 0.065
      g.add(halo, body, label.mesh)
      team.add(g)

      // line of light: from the logo's edge (just in front of the mark) to the chip's inner end; the upper chip of
      // Claude/Gemini is reached by a near-vertical trace that passes just inside the lower chip
      const [lx, ly, lz] = LOGO[c.b], sx = Math.sign(c.at[0]), upper = c.b !== 'chatgpt' && c.at[2] > 2
      const ex = c.at[0] - sx * (CHIP_W / 2 + (upper ? 0.09 : 0.04))
      const dx = ex - lx, dz = c.at[2] - lz, dl = Math.hypot(dx, dz)
      const start = v([lx + (dx / dl) * 1.0 + (upper ? -sx * 0.04 : 0), ly - 0.3, lz + (dz / dl) * 1.0])
      const inner = v([ex, c.at[1], c.at[2]])
      const mid = start.clone().lerp(inner, 0.5).add(new THREE.Vector3(0, c.b === 'chatgpt' ? 0.16 : 0, 0))
      const curve = new THREE.QuadraticBezierCurve3(start, mid, inner)
      const mat = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: glow.clone() }, uProg: { value: 0 }, uTime: { value: 0 }, uBoost: { value: 0 } },
        vertexShader: BEAM_VS, fragmentShader: BEAM_FS, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
      })
      beams.push(mat)
      const beam = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.014, 6, false), mat)
      beam.renderOrder = -1
      const dots = [start, inner].map(p => {
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), new THREE.MeshBasicMaterial({ color: glow.clone().multiplyScalar(1.6) }))
        d.position.copy(p)
        return d
      })
      team.add(beam, ...dots)
      return { c, g, dots, seed: i * 1.7 }
    })

    // ---- DOM titles
    const k1 = kicker(dom, 'เคล็ดลับ', 186)
    const t1 = title3d(dom, `ไม่ต้องเลือก<br>${hl('ตัวเดียว')}`, 258, 132)
    const k2 = kicker(dom, 'ตอนหน้า', 186)
    const t2 = title3d(dom, `เขียนพรอมต์<br>ให้เก่งขึ้น ${hl('2 เท่า')}`, 258, 118)

    // ---- outro-2: typed prompt on the Blender box face
    const prompt = board(1024, 260, 3.0, () => {})
    prompt.mesh.position.copy(v(BOX))
    root.add(prompt.mesh)
    let promptKey = ''
    const drawPrompt = (typed: number, caret: boolean, sendReady: boolean) => {
      const key = `${typed}|${caret}|${sendReady}`
      if (key === promptKey) return
      promptKey = key
      prompt.redraw(g => {
        g.textBaseline = 'middle'
        g.font = "500 92px 'Kanit'"
        const text = typed < 0 ? 'ถาม AI อะไรก็ได้' : TYPED.slice(0, typed).join('')
        g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = 'rgba(4,6,10,.85)'
        g.strokeText(text, 70, 136)
        g.fillStyle = typed < 0 ? '#7d8799' : '#ffffff'
        g.fillText(text, 70, 136)
        const w = typed < 0 ? 0 : g.measureText(text).width
        if (caret) { g.fillStyle = '#ffffff'; g.fillRect(74 + w, 82, 7, 104) }
        // send button
        g.beginPath(); g.arc(920, 130, 64, 0, Math.PI * 2)
        g.fillStyle = sendReady ? C.accent : '#3a4152'; g.fill()
        g.strokeStyle = sendReady ? '#1a1406' : '#9aa3b5'; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round'
        g.beginPath(); g.moveTo(920, 160); g.lineTo(920, 100); g.moveTo(894, 124); g.lineTo(920, 98); g.lineTo(946, 124); g.stroke()
      })
    }

    // ×2 burst: sparks from the Blender ×2
    const R = rng(4242), n = 140
    const sg = new THREE.BufferGeometry()
    const pos = new Float32Array(n * 3), dir = new Float32Array(n * 3), spd = new Float32Array(n), sz = new Float32Array(n), col = new Float32Array(n * 3)
    const palette = [C.accent, '#FFFFFF', BRAND.chatgpt.glow, BRAND.claude.glow, BRAND.gemini.glow].map(h => new THREE.Color(h))
    const o = v(X2)
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, z = R() * 2 - 1, r = Math.sqrt(1 - z * z)
      const d = new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), z * 0.35).normalize()
      pos.set([o.x, o.y, o.z], i * 3); dir.set([d.x, d.y, d.z], i * 3)
      spd[i] = 0.8 + R() * 2.4; sz[i] = 4 + R() * 10
      const cc = palette[i % palette.length]; col.set([cc.r, cc.g, cc.b], i * 3)
    }
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    sg.setAttribute('dir', new THREE.BufferAttribute(dir, 3))
    sg.setAttribute('spd', new THREE.BufferAttribute(spd, 1))
    sg.setAttribute('sz', new THREE.BufferAttribute(sz, 1))
    sg.setAttribute('col', new THREE.BufferAttribute(col, 3))
    const sparkMat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 } }, vertexShader: SPARK_VS, fragmentShader: SPARK_FS,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false })
    const sparks = new THREE.Points(sg, sparkMat)
    sparks.frustumCulled = false
    root.add(sparks)

    // ---- end card: red glass "กดติดตาม" pill on a white rim, a 3D cursor taps it
    const btn = new THREE.Group()
    btn.position.copy(v(BTN))
    btn.lookAt(CAM2)
    root.add(btn)
    const press = new THREE.Group()
    btn.add(press)
    const red = new THREE.MeshPhysicalMaterial({ color: '#4a0410', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.04,
      emissive: new THREE.Color('#ff1a36'), emissiveIntensity: 0.34, envMapIntensity: 0.45 })
    press.add(pill(2.2, 0.56, 0.14, red, 0.045))
    const rim = pill(2.34, 0.7, 0.06, new THREE.MeshPhysicalMaterial({ color: '#2e3036', roughness: 0.22, clearcoat: 1, envMapIntensity: 0.4,
      emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.5 }), 0.03)
    rim.position.z = -0.09
    btn.add(rim)
    const btnLabel = board(1024, 260, 2.2, g => {
      g.textAlign = 'center'; g.textBaseline = 'middle'
      g.font = "92px 'Apple Color Emoji'"
      g.fillText('🔔', 215, 136)
      g.font = "800 128px 'Kanit'"
      g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = 'rgba(70,0,10,.9)'
      g.strokeText('กดติดตาม', 590, 140)
      g.fillStyle = '#ffffff'
      g.fillText('กดติดตาม', 590, 140)
    })
    btnLabel.mesh.position.z = 0.125
    press.add(btnLabel.mesh)
    const ripples = [0, 0.13].map(() => {
      const m = pill(2.3, 0.66, 0.005, new THREE.MeshBasicMaterial({ color: '#ff5a6e', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 0.004)
      btn.add(m)
      return m
    })

    const arrow = new THREE.Shape()
    ;[[0, 0], [0, -1], [0.23, -0.78], [0.4, -1.16], [0.55, -1.1], [0.38, -0.72], [0.7, -0.72]].forEach(([x, y], i) => (i ? arrow.lineTo(x, y) : arrow.moveTo(x, y)))
    const cursor = new THREE.Group()
    const cWhite = new THREE.Mesh(new THREE.ExtrudeGeometry(arrow, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 3 }),
      new THREE.MeshPhysicalMaterial({ color: '#26282d', roughness: 0.25, clearcoat: 1, envMapIntensity: 0.4, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.58 }))
    const cDark = new THREE.Mesh(new THREE.ExtrudeGeometry(arrow, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.07, bevelSegments: 2 }),
      new THREE.MeshBasicMaterial({ color: '#0b0d12' }))
    cDark.position.z = -0.05
    cursor.add(cDark, cWhite)
    cursor.scale.setScalar(0.36)
    cursor.quaternion.copy(btn.quaternion)
    root.add(cursor)
    const tipAt = v([0.42, -1.62, 5.3]), tipFrom = v([2.7, -2.4, 4.0]), tipRest = v([0.75, -1.85, 5.05])

    return {
      async prepare(f) { await ready; await seq.prepare(f.local) },
      update(f) {
        seq.set(f.local)
        if (track) applyCam(track, f.local, stage.camera)
        const t = f.local

        // outro-1 team + chips (they ride the crane out of frame, then hide)
        team.visible = t < 3.7
        for (const [i, ch] of chips.entries()) {
          const k = ease.back(seg(t, ch.c.t, ch.c.t + 0.32))
          ch.g.visible = t >= ch.c.t
          ch.g.scale.setScalar(Math.max(1e-3, k))
          ch.g.position.copy(v(ch.c.at)).add(new THREE.Vector3(0, 0.03 * Math.sin(t * 1.6 + ch.seed), 0))
          const prog = ease.out(seg(t, ch.c.t - 0.32, ch.c.t + 0.02))
          beams[i].uniforms.uProg.value = prog
          beams[i].uniforms.uTime.value = t + ch.seed
          beams[i].uniforms.uBoost.value = t > TEAM - 0.05 ? 1.1 * Math.exp(-4 * (t - TEAM)) : 0
          ch.dots[0].visible = prog > 0
          ch.dots[1].visible = prog > 0.98
        }

        // titles: kicker on "เคล็ดลับ", title on "ไม่ต้องเลือก", both swap out as the camera cranes up
        const out1 = ease.in(seg(t, 2.95, 3.2))
        const pop = (e: HTMLElement, a: number, extra = '') => {
          const k = ease.back(seg(t, a, a + 0.3))
          e.style.opacity = String(Math.min(seg(t, a, a + 0.12), 1))
          return `scale(${0.82 + 0.18 * k})${extra}`
        }
        k1.style.transform = `translateX(-50%) ${pop(k1, 0.2)} translateY(${-70 * out1}px)`
        t1.style.transform = pop(t1, 1.2, ` translateY(${-70 * out1}px)`)
        if (out1 > 0) { k1.style.opacity = String(1 - out1); t1.style.opacity = String(1 - out1) }
        k2.style.transform = `translateX(-50%) ${pop(k2, 3.2)}`
        t2.style.transform = pop(t2, 3.32)

        // prompt box text: placeholder, then typed on "สอนเขียนพรอมต์", caret blinks
        const rise = ease.inOut(seg(t, 3.0, 3.6)), drift = ease.inOut(seg(t, 3.6, f.dur))
        prompt.mesh.visible = t >= 3.4
        prompt.mesh.position.copy(v([BOX[0], BOX[1], lerp(BOX[2] - 0.7, BOX[2], rise)]))
        prompt.mesh.scale.setScalar(lerp(0.55, 1, rise))
        prompt.mesh.rotation.set(0.02 * drift, -0.03 * drift, 0)
        prompt.mat.opacity = seg(t, 3.4, 3.6)
        const typed = t < TYPE_A ? -1 : Math.min(TYPED.length, Math.floor(seg(t, TYPE_A, TYPE_B) * TYPED.length) + 1)
        drawPrompt(typed, t < TYPE_A || (t > TYPE_B ? Math.floor((t - TYPE_B) / 0.45) % 2 === 0 : true), t >= TYPE_B)

        // ×2 sparks
        const dt = t - X2_T
        sparks.visible = dt >= 0 && dt < 1.2
        sparkMat.uniforms.uT.value = Math.max(0, dt)

        // button pops, the cursor glides in and taps it at 7.0 s, ripples, then a gentle breathing glow to the end
        const kb = ease.back(seg(t, BTN_T, BTN_T + 0.35))
        btn.visible = t >= BTN_T
        btn.scale.setScalar(Math.max(1e-3, kb))
        const down = seg(t, TAP - 0.03, TAP + 0.05), up = ease.out(seg(t, TAP + 0.05, TAP + 0.32))
        const s = 1 - 0.07 * down * (1 - up) + 0.03 * Math.sin(Math.PI * up) * (1 - up)
        press.scale.set(s, s, 1)
        press.position.z = -0.05 * down * (1 - up)
        const flash = t >= TAP ? Math.exp(-3.5 * (t - TAP)) : 0
        red.emissiveIntensity = 0.34 + 0.5 * flash + (t > 7.6 ? 0.06 * (0.5 + 0.5 * Math.sin((t - 7.6) * 4.4)) : 0)
        for (const [i, r] of ripples.entries()) {
          const rp = seg(t, TAP + i * 0.13, TAP + i * 0.13 + 0.6)
          r.visible = rp > 0 && rp < 1
          r.scale.set(1 + 0.45 * ease.out(rp), 1 + 1.3 * ease.out(rp), 1)
          ;(r.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - rp)
        }
        const glide = ease.out(seg(t, 6.45, 6.95)), leave = ease.inOut(seg(t, TAP + 0.35, TAP + 1.0))
        const tip = tipFrom.clone().lerp(tipAt, glide).add(new THREE.Vector3(0, 0.25 * Math.sin(Math.PI * glide), 0)).lerp(tipRest, leave)
        const poke = down * (1 - up)
        cursor.visible = t >= 6.45
        cursor.position.copy(tip).add(stage.camera.position.clone().sub(tip).normalize().multiplyScalar(0.25 - 0.12 * poke))
        cursor.scale.setScalar(0.36 * (1 - 0.1 * poke))
      },
      dispose() { seq.dispose(); sg.dispose() },
    }
  },
} satisfies SceneDef
