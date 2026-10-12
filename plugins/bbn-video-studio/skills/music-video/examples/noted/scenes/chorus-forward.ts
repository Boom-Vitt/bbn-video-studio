// Chorus B: forward it, never open it, let the bots vote, go home at 17:00.
// One right-hand vignette per line, hard-cut on the line start; the lyric owns the left half.
import * as THREE from 'three'
import { C, F, canvasTexture, clamp, ease, el, lerp, pulse, rng, roundRect, seg, slate } from '../kit'
import { animateMascot, mascot, mascotSVG } from '../mascot'
import type { SceneDef } from '../types'

const NAMES = ['ต้น', 'แพร', 'บีม', 'มิ้นท์', 'โอ๊ต', 'ฝน', 'กอล์ฟ', 'เจน', 'ปั้น', 'นุ่น']
const STAMPS = ['ด่วนมาก', 'ด่วนมาก', 'ด่วนที่สุด', 'ด่วนมาก!!', 'ลับ + ด่วน']
const step = (x: number) => Math.floor(x) + ease.out(x - Math.floor(x))

function cardTex(from: string, acc: string, file: string, meta: string) {
  return canvasTexture(720, 400, g => {
    g.fillStyle = C.ink2; roundRect(g, 4, 4, 712, 392, 34); g.fill()
    g.strokeStyle = C.rule; g.lineWidth = 3; roundRect(g, 4, 4, 712, 392, 34); g.stroke()
    g.font = `500 26px ${F.mono}`; g.fillStyle = acc; g.fillText('↪ ส่งต่อ', 40, 62)
    g.fillStyle = C.gray; g.textAlign = 'right'; g.fillText(`จาก ${from}`, 680, 62); g.textAlign = 'left'
    g.fillStyle = C.rule; g.fillRect(40, 86, 640, 2)
    g.fillStyle = C.red; roundRect(g, 40, 120, 76, 96, 8); g.fill()
    g.fillStyle = '#fff'; g.font = `600 20px ${F.mono}`; g.fillText('PDF', 56, 200)
    g.fillStyle = '#C3C9D4'; g.font = `600 27px ${F.ui}`; g.fillText(file, 138, 158)
    g.fillStyle = C.gray; g.font = `400 22px ${F.mono}`; g.fillText(meta, 138, 198)
    g.fillStyle = C.red; roundRect(g, 40, 290, 150, 56, 14); g.fill()
    g.fillStyle = '#fff'; g.font = `600 26px ${F.ui}`; g.fillText('ด่วนมาก', 62, 328)
    g.strokeStyle = acc; g.lineWidth = 3; roundRect(g, 470, 290, 210, 56, 28); g.stroke()
    g.fillStyle = acc; g.font = `600 26px ${F.ui}`; g.fillText('ส่งต่อ ↪', 520, 328)
  })
}

function envelopeTex(stamp: string, seed: number) {
  const r = rng(seed)
  return canvasTexture(512, 330, g => {
    g.fillStyle = '#B39463'; g.fillRect(0, 0, 512, 330)
    g.strokeStyle = '#8A6F44'; g.lineWidth = 4
    g.beginPath(); g.moveTo(0, 0); g.lineTo(256, 170); g.lineTo(512, 0); g.stroke()
    g.fillStyle = '#5B4628'; g.font = `500 20px ${F.mono}`; g.fillText('ถึง: ทุกคนในกลุ่ม', 40, 262); g.fillText('จาก: พี่บอส', 40, 292)
    g.save(); g.translate(330 + r() * 40, 236); g.rotate(-0.18 + r() * 0.12)
    g.strokeStyle = C.red; g.lineWidth = 7; roundRect(g, -118, -46, 236, 84, 10); g.stroke()
    g.fillStyle = C.red; g.font = `800 ${stamp.length > 8 ? 40 : 52}px ${F.display}`; g.textAlign = 'center'; g.fillText(stamp, 0, 18)
    g.restore()
    g.fillStyle = '#9E2B2E'; g.beginPath(); g.arc(256, 170, 26, 0, Math.PI * 2); g.fill() // sealed
  })
}

function paddleTex() {
  return canvasTexture(256, 160, g => {
    g.fillStyle = C.ink2; roundRect(g, 6, 6, 244, 148, 22); g.fill()
    g.strokeStyle = C.yellow; g.lineWidth = 7; roundRect(g, 6, 6, 244, 148, 22); g.stroke()
    g.fillStyle = C.yellow; g.font = `800 64px ${F.display}`; g.textAlign = 'center'; g.fillText('✓', 128, 84)
    g.font = `600 30px ${F.ui}`; g.fillText('เห็นด้วย', 128, 136)
  })
}

export default {
  theme: 'dark',
  type: { pos: 'left', size: 96, width: 860 },
  create({ stage, root, dom, variant }) {
    const cam = stage.camera
    const v1 = variant > 0, acc = v1 ? C.blue : C.yellow
    const FORWARDS = v1 ? 12048 : 1204, ENVS = v1 ? 60 : 40, BOTS = v1 ? 9 : 7
    const r = rng(v1 ? 2 : 1)
    const groups = [0, 1, 2, 3].map(() => { const g = new THREE.Group(); root.add(g); return g })

    // line 1: a beat-stepped chain of forwarded message cards receding up the right side
    // zig-zag relay: each hop swings to the other side and further back
    const slotPos = (s: number, out: THREE.Vector3) => out.set(2.9 + 0.62 * s - 0.8 * Math.cos(Math.PI * s), -1.2 + 1.05 * s, 2 - 2.6 * s)
    const cardTexs = NAMES.map(n => v1 ? cardTex(n, acc, 'สัญญา_OmniMind_ฉบับเซ็นแล้ว.pdf', '300 หน้า · ยังไม่ได้เปิด') : cardTex(n, acc, 'แผนกลยุทธ์_AI_2027_final_v9.pdf', '92 หน้า · ยังไม่ได้เปิด'))
    const cards = NAMES.map((_, j) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.5), new THREE.MeshBasicMaterial({ map: cardTexs[j], transparent: true, depthWrite: false }))
      groups[0].add(m)
      return m
    })
    const chainPts = Array.from({ length: 36 }, (_, i) => slotPos(i / 8 - 1, new THREE.Vector3()).clone())
    const chain = new THREE.Line(new THREE.BufferGeometry().setFromPoints(chainPts), new THREE.LineDashedMaterial({ color: acc, dashSize: 0.18, gapSize: 0.14, transparent: true, opacity: 0.5 }))
    chain.computeLineDistances()
    groups[0].add(chain)

    // line 2: a heap of sealed "urgent" envelopes, a few more landing on every beat
    const envs = Array.from({ length: ENVS }, (_, i) => {
      const tex = envelopeTex(STAMPS[i % STAMPS.length], 77 + i)
      const side = new THREE.MeshBasicMaterial({ color: '#7C6440' })
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.88, 0.05), [side, side, side, side, new THREE.MeshBasicMaterial({ map: tex }), side])
      const k = i / ENVS, x = 3.0 + (r() - 0.5) * 3.6 * (1 - k * 0.55)
      const y = -2.95 + k * (v1 ? 2.9 : 2.3) - Math.abs(x - 3) * 0.35 + r() * 0.25
      groups[1].add(m)
      return { m, x, y, z: -1 + i * 0.035, rz: (r() - 0.5) * 1.1, rx: -0.45 + (r() - 0.5) * 0.3, ry: (r() - 0.5) * 0.5 }
    })

    // line 3: the board of bots, paddles up on the beat
    const paddle = paddleTex()
    const bots = Array.from({ length: BOTS }, (_, k) => {
      const b = mascot(C.yellow, 0.075)
      b.group.position.set(lerp(-4.6, 4.6, k / (BOTS - 1)), -2.9, 0)
      b.body.traverse(o => { // tame the bloom: seven glowing bots in a row wash out the frame
        const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
        if (mat?.emissive && !mat.userData.dim) { mat.userData.dim = 1; mat.color.multiplyScalar(0.88); mat.emissiveIntensity = 0.04 }
      })
      const arm = new THREE.Group()
      arm.position.set(0.48, 0.42, 0.06)
      const stick = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.05), new THREE.MeshStandardMaterial({ color: C.white, roughness: 0.6 }))
      stick.position.y = 0.31
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.39), new THREE.MeshBasicMaterial({ map: paddle, transparent: true }))
      sign.position.set(0, 0.74, 0.03)
      arm.add(stick, sign)
      b.body.add(arm)
      groups[2].add(b.group)
      return { b, arm }
    })

    // line 4: office ceiling lights click off row by row
    const lights = Array.from({ length: 6 * 4 }, (_, i) => {
      const row = Math.floor(i / 4), col = i % 4
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), new THREE.MeshBasicMaterial({ color: '#FFF3D1', side: THREE.DoubleSide }))
      m.rotation.x = Math.PI / 2
      m.position.set(-3.6 + col * 2.4, 3.2, 3 - row * 4)
      groups[3].add(m)
      return { m, row }
    })

    // DOM
    slate(dom, v1 ? 'Chorus 2 · ส่งต่อเลย' : 'Chorus · ส่งต่อเลย', 'ทีม AI-First 🚀 · 48 สมาชิก')
    const panes = [0, 1, 2, 3].map(() => el('div', 'position:absolute;inset:0;display:none', dom))
    const hudCss = `position:absolute;left:120px;bottom:100px;font:500 18px ${F.mono};letter-spacing:.1em;color:${C.gray}`
    const fwd = el('div', hudCss, panes[0], `ส่งต่อแล้ว <span style="font:800 88px/1 ${F.display};color:${acc};letter-spacing:-.01em">0</span> ครั้ง`)
    const fwdN = fwd.querySelector('span')!
    const urg = el('div', hudCss, panes[1], `ด่วนมาก × <span style="font:800 88px/1 ${F.display};color:${C.red}">0</span>
      <div style="margin-top:6px">เปิดแล้ว <b style="font:800 40px ${F.display};color:${C.white}">0</b> ฉบับ</div>`)
    const urgN = urg.querySelector('span')!
    const MIN = ['ที่ประชุมรับทราบ', 'ที่ประชุมเห็นชอบตามที่เสนอ', 'ไม่มีผู้คัดค้าน', `ผู้เข้าประชุม: บอต ${BOTS} · คน 0`]
    const minutes = el('div', `position:absolute;right:56px;top:96px;width:560px;padding:26px 30px;box-sizing:border-box;border:1px solid ${C.rule};
      border-radius:20px;background:${C.ink2};font:400 24px/1.75 ${F.ui};color:${C.white}`, panes[2],
      `<div style="display:flex;gap:14px;align-items:center;font:500 16px ${F.mono};letter-spacing:.1em;color:${C.gray};margin-bottom:10px">
        ${mascotSVG(30)} บันทึกการประชุม · จดโดย บอต</div>
       ${MIN.map(s => `<div data-m>• ${s}</div>`).join('')}
       <div data-m style="margin-top:12px;padding-top:12px;border-top:1px solid ${C.rule};font:500 20px ${F.mono};color:${C.gray}">มติ: เห็นด้วย <b style="font:800 40px ${F.display};color:${C.yellow}">${BOTS}</b> · ไม่เห็นด้วย 0</div>`)
    const minRows = [...minutes.querySelectorAll<HTMLElement>('[data-m]')]
    const clock = el('div', `position:absolute;left:120px;bottom:96px;font:500 18px ${F.mono};letter-spacing:.12em;color:${C.gray}`, panes[3],
      `<div style="font:800 150px/1 ${F.display};color:${C.white};letter-spacing:-.02em" data-c>16:59</div>เลิกงาน · ตอกบัตรออก`)
    const clockN = clock.querySelector<HTMLElement>('[data-c]')!
    const ROSTER = [['ต้น', 0], ['แพร', 0], ['น้องสรุป', 1], ['บีม', 0], ['มิ้นท์', 0], ['น้องสรุป 2', 1], ['โอ๊ต', 0], ['ฝน', 0], ['น้องสรุป 3', 1]] as const
    const roster = el('div', `position:absolute;right:56px;top:150px;width:470px;font:400 26px ${F.ui};color:${C.white}`, panes[3],
      `<div style="font:500 16px ${F.mono};letter-spacing:.12em;color:${C.gray};margin-bottom:14px">สมาชิก · สถานะ</div>` +
      ROSTER.map(([n, bot]) => `<div data-r style="display:flex;align-items:center;gap:16px;height:72px;border-bottom:1px solid ${C.rule}">
        <div style="width:46px;height:46px;border-radius:12px;background:${bot ? 'transparent' : C.ink3};display:grid;place-items:center;font:600 20px ${F.ui};color:${C.gray}">${bot ? mascotSVG(40) : n[0]}</div>
        <div style="flex:1">${n}${bot ? ` <span style="color:${C.dim};font-size:18px">(บอต)</span>` : ''}</div>
        <div data-dot style="width:16px;height:16px;border-radius:50%"></div>
        <div data-s style="width:150px;font:500 17px ${F.mono};text-align:right"></div></div>`).join(''))
    const rRows = [...roster.querySelectorAll<HTMLElement>('[data-r]')].map((row, i) => ({
      bot: ROSTER[i][1] === 1, dot: row.querySelector<HTMLElement>('[data-dot]')!, s: row.querySelector<HTMLElement>('[data-s]')!, row }))

    return {
      update(f) {
        const t = f.t, b = f.beat, kick = pulse(b, 6), bps = f.t > 0 ? f.beat / f.t : 2
        const st = (i: number) => f.lines[i]?.start ?? (f.t - f.local) + 0.25 + i * 4
        const en = (i: number) => f.lines[i]?.end ?? st(i) + 3.75
        const li = Math.max(0, f.li)
        groups.forEach((g, i) => { g.visible = i === li })
        panes.forEach((p, i) => { p.style.display = i === li ? 'block' : 'none' })
        cam.position.set(Math.sin(f.local * 0.4) * 0.15, Math.cos(f.local * 0.3) * 0.1, 10)
        cam.lookAt(0, 0, 0)

        if (li === 0) {
          const B = step(b - st(0) * bps + 1) // card c enters on beat c of the line
          const n = cards.length
          cards.forEach((m, j) => {
            const c = Math.floor(B) - (((Math.floor(B) - j) % n) + n) % n
            const s = B - c - 1
            slotPos(s, m.position)
            m.rotation.set(-0.08, -0.32 + 0.22 * Math.cos(Math.PI * s), 0.03 * Math.sin(c))
            m.scale.setScalar(1 + (s < 0.2 ? kick * 0.04 : 0))
            ;(m.material as THREE.MeshBasicMaterial).opacity = clamp(s + 1) * (1 - seg(s, 3.1, 4.1))
          })
          const left = Math.max(0, Math.ceil((en(0) - 0.5 - t) * bps))
          fwdN.textContent = Math.max(0, FORWARDS - left * 17).toLocaleString('en-US')
          fwdN.style.textShadow = `0 0 ${10 + kick * 30}px ${acc}88`
        }

        if (li === 1) {
          let landed = 0
          envs.forEach((e, i) => {
            const at = st(1) - 0.05 + (Math.floor(i / 5) + (i % 5) * 0.14) * (ENVS > 40 ? 0.68 : 1) / bps
            const k = seg(t, at, at + 0.3)
            e.m.visible = k > 0
            if (k >= 1) landed++
            e.m.position.set(e.x, e.y + 5 * (1 - k) ** 2, e.z)
            e.m.rotation.set(e.rx, e.ry, e.rz + (1 - k) * 0.8)
          })
          urgN.textContent = String(landed)
          urg.style.transform = `scale(${1 + kick * 0.04})`
        }

        if (li === 2) {
          const vote = seg(t, lerp(st(2), en(2), 0.82), lerp(st(2), en(2), 0.9))
          bots.forEach(({ b: m, arm }, k) => {
            animateMascot(m, b - k * 0.06)
            const ph = (b - k * 0.06) % 1
            const up = Math.max(1 - clamp(ph * 1.8), vote)
            arm.rotation.z = lerp(-2.5, -0.15, ease.out(up))
          })
          minRows.forEach((row, i) => {
            const k = seg(t, st(2) + 0.25 + i * 0.5, st(2) + 0.45 + i * 0.5)
            row.style.opacity = String(k)
            row.style.transform = `translateX(${(1 - ease.out(k)) * 24}px)`
          })
        }

        if (li === 3) {
          const beats = (t - st(3)) * bps
          lights.forEach(({ m, row }) => {
            const off = 1 + (5 - row) * 0.9 // far rows go first
            const flick = beats > off - 0.25 && beats < off && Math.floor(beats * 16) % 2 === 0
            ;(m.material as THREE.MeshBasicMaterial).color.set(beats >= off || flick ? C.ink3 : '#FFF3D1')
          })
          clockN.textContent = t < st(3) + 0.1 ? '16:59' : '17:00'
          clockN.style.color = t < st(3) + 0.1 ? C.white : acc
          clockN.style.transform = `scale(${1 + pulse(beats, 4) * 0.03})`
          let h = 0
          rRows.forEach(rr => {
            const off = !rr.bot && beats > 1.2 + h++ * 0.75
            rr.dot.style.background = rr.bot ? C.yellow : off ? C.dim : '#3DDC84'
            rr.dot.style.boxShadow = rr.bot ? `0 0 14px ${C.yellow}` : 'none'
            rr.s.textContent = rr.bot ? 'ออนไลน์ 24/7' : off ? 'ออฟไลน์' : 'ออนไลน์'
            rr.s.style.color = rr.bot ? C.yellow : off ? C.dim : '#3DDC84'
            rr.row.style.opacity = off ? '0.55' : '1'
          })
        }
      },
    }
  },
} satisfies SceneDef
