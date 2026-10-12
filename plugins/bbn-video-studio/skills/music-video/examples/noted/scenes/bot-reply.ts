// Bridge: the bot answers the panic with perfect manners — "thanks for flagging!" — then a one-line TL;DR: we've been sold.
import * as THREE from 'three'
import { C, F, canvasTexture, clamp, ease, el, lerp, pulse, seg, slate } from '../kit'
import { animateMascot, mascot } from '../mascot'
import type { LineCue, SceneDef } from '../types'

const wseg = new Intl.Segmenter('th', { granularity: 'word' })
/** When the global type layer reveals the first word matching `key` (mirrors type.ts timing). */
function wordAt(l: LineCue, key: string) {
  const ws = l.text.split(/(\([^)]*\))/).filter(Boolean).flatMap(p => [...wseg.segment(p)].map(s => s.segment)).filter(s => s.trim())
  const i = Math.max(0, ws.findIndex(w => w.includes(key) || key.startsWith(w)))
  return l.start + (i / ws.length) * Math.max(0.6, (l.end - l.start) * 0.82)
}

const THANKS = 'ขอบคุณที่ทักนะครับ! 🙏'
const BG = 'rgba(24,8,12,.92)'

export default {
  theme: 'red',
  type: { pos: 'left', size: 80, width: 780 },
  create({ dom, root, stage }) {
    const cam = stage.camera
    slate(dom, 'ห้องแชท · ฝ่ายบริการลูกค้า · ตอบกลับอัตโนมัติ', 'ศุกร์ 17:01 · ความสุภาพ 100%', '#B9646C')

    // ---- 3D: pedestal, spotlight, mascot
    const MX = 2.55, FEET = -1.22
    const stageG = new THREE.Group()
    stageG.position.set(MX, FEET, 0)
    root.add(stageG)
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.36, 0.42, 64),
      new THREE.MeshStandardMaterial({ color: '#2A1218', roughness: 0.45, metalness: 0.3 }))
    ped.position.y = -0.21
    const lip = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.014, 8, 128), new THREE.MeshBasicMaterial({ color: '#FF7A7F' }))
    lip.rotation.x = Math.PI / 2
    const lip2 = lip.clone()
    lip2.scale.setScalar(1.36 / 1.25)
    lip2.position.y = -0.42
    const glow = (inner: string) => canvasTexture(256, 256, g => {
      const r = g.createRadialGradient(128, 128, 0, 128, 128, 128)
      r.addColorStop(0, inner); r.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = r; g.fillRect(0, 0, 256, 256)
    })
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.24, 64), new THREE.MeshBasicMaterial({
      map: glow('rgba(255,220,190,.22)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
    pool.rotation.x = -Math.PI / 2
    pool.position.y = 0.003
    const coneTex = canvasTexture(4, 256, g => {
      const r = g.createLinearGradient(0, 0, 0, 256)
      r.addColorStop(0, 'rgba(255,240,215,0)'); r.addColorStop(1, 'rgba(255,240,215,1)')
      g.fillStyle = r; g.fillRect(0, 0, 4, 256)
    })
    const CH = 6
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.22, CH, 64, 1, true), new THREE.MeshBasicMaterial({
      map: coneTex, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))
    cone.position.y = CH / 2
    const spot = new THREE.SpotLight('#FFE6C8', 1.6, 0, 0.42, 0.6, 0)
    spot.position.set(0, CH, 0.6)
    spot.target.position.set(0, 0.5, 0)
    const m = mascot(C.yellow)
    m.group.scale.setScalar(1.6)
    stageG.add(ped, lip, lip2, pool, cone, spot, spot.target, m.group)
    const fill = new THREE.DirectionalLight(C.red, 1.6)
    fill.position.set(-4, 1, 3)
    root.add(fill)

    // ---- DOM: speech bubble → TL;DR card, stamp, pen notes. Anchored above the mascot (screen x ≈ 1390).
    const CX = 1395
    const typing = el('div', `position:absolute;left:${CX - 70}px;top:400px;width:140px;height:62px;border-radius:31px;background:${BG};
      border:3px solid ${C.yellow};box-sizing:border-box;display:grid;place-items:center;font:800 30px ${F.display};color:${C.yellow};letter-spacing:.18em`, dom)
    const bubble = el('div', `position:absolute;left:${CX - 450}px;top:112px;width:900px;box-sizing:border-box;padding:30px 44px 26px;
      border:3px solid ${C.yellow};border-radius:30px;background:${BG};transform-origin:50% 100%;
      box-shadow:0 0 50px ${C.yellow}33, inset 0 0 40px ${C.yellow}14`, dom)
    const txt = el('div', `font:800 76px/1.2 ${F.display};white-space:nowrap;color:${C.yellow};text-shadow:0 0 26px ${C.yellow}55`, bubble)
    const graphemes = [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(THANKS)].map(s =>
      el('span', 'visibility:hidden', txt, s.segment))
    el('div', `margin-top:14px;font:500 16px ${F.mono};letter-spacing:.1em;color:#C98A8F`, bubble,
      'น้องสรุป · ตอบอัตโนมัติ · 0.3 วินาที · อ่านข้อความแล้ว 0%')
    el('div', 'position:absolute;left:50%;bottom:-55px;margin-left:-38px;width:76px;height:58px', bubble,
      `<svg width="76" height="58" viewBox="0 0 76 58" style="overflow:visible"><path d="M0 0 L38 54 L76 0" fill="${BG}" stroke="${C.yellow}" stroke-width="3" stroke-linejoin="round"/>
       <rect x="3" y="-4" width="70" height="5" fill="${BG}"/></svg>`)

    const card = el('div', `position:absolute;left:${CX - 390}px;top:66px;width:780px;box-sizing:border-box;border-radius:14px;overflow:hidden;
      background:#1E0A10;border:1px solid #5A1E28;transform-origin:50% 100%;box-shadow:0 40px 90px #000c`, dom,
      `<div style="display:flex;justify-content:space-between;padding:14px 26px;background:${C.red};color:#fff;
         font:500 17px ${F.mono};letter-spacing:.14em"><span>TL;DR · สรุปสั้นๆ ให้เลย</span><span>92 หน้า → 1 บรรทัด</span></div>
       <div style="padding:18px 32px 22px">
         <div style="font:500 32px ${F.display};color:#C98A8F">สรุปสั้นๆ:</div>
         <div style="font:800 86px/1.04 ${F.display};color:${C.white};letter-spacing:-.01em">เราโดนซื้อ<br>แล้วครับ</div>
         <div style="margin-top:12px;font:400 15px ${F.mono};color:#8E5A60;letter-spacing:.06em">
           ผู้ซื้อ: OmniMind Co., Ltd. · มีผล: ศุกร์ 17:00 · ความยาวต้นฉบับ: 92 หน้า</div>
       </div>`)
    const stamp = el('div', `position:absolute;left:${CX + 40}px;top:255px;padding:10px 26px 12px;border:7px double ${C.red};border-radius:12px;
      color:${C.red};text-align:center;transform-origin:50% 50%;background:rgba(20,6,10,.9)`, dom,
      `<div style="font:800 92px/1 ${F.display};letter-spacing:.02em">ขายแล้ว</div>
       <div style="font:500 15px ${F.mono};letter-spacing:.24em;margin-top:4px">OMNIMIND · 17:00</div>`)
    const pen = (css: string, html: string) => el('div', `position:absolute;${css};font:400 40px/1.1 ${F.pen};color:${C.red};
      text-shadow:0 0 18px ${C.red}66;opacity:0`, dom, html)
    const note1 = pen('left:985px;top:520px;transform-origin:100% 0',
      `(ไม่ใช่ข่าวดี)<svg width="120" height="110" viewBox="0 0 120 110" style="position:absolute;left:120px;top:-92px;overflow:visible">
        <path d="M6 96 C 30 60, 60 34, 108 10 M108 10 l-20 2 M108 10 l-6 18" fill="none" stroke="${C.red}" stroke-width="3.5" stroke-linecap="round"/></svg>`)
    const note2 = pen('left:1625px;top:540px;transform-origin:0 0',
      `(บอตยังยิ้มอยู่)<svg width="90" height="60" viewBox="0 0 90 60" style="position:absolute;left:-80px;top:20px;overflow:visible">
        <path d="M84 6 C 60 6, 30 16, 8 44 M8 44 l4 -18 M8 44 l18 -4" fill="none" stroke="${C.red}" stroke-width="3.5" stroke-linecap="round"/></svg>`)
    el('div', `position:absolute;left:1590px;top:930px;font:500 14px ${F.mono};letter-spacing:.14em;color:#8E5A60;
      border-top:1px solid #5A1E28;padding-top:8px;width:270px`, dom, 'น้องสรุป v4.7 · บอตตอบอัตโนมัติ<br>อ่านสัญญา: 0 / 92 หน้า')

    return {
      update(f) {
        const t = f.t, [l1, l2] = f.lines
        const t1 = l1?.start ?? f.t - f.local + 0.25
        const tThanks = l1 ? wordAt(l1, 'ขอบคุณ') : t1 + 1.8
        const t2 = l2?.start ?? t1 + f.dur * 0.5
        const tSold = l2 ? wordAt(l2, 'ซื้อ') : t2 + 2.4

        cam.position.set(lerp(0.25, -0.15, f.p), 0.55, lerp(10.2, 9.6, f.p))
        cam.lookAt(0, -0.1, 0)
        animateMascot(m, f.beat, t >= tSold ? 1.6 : 1)
        m.group.rotation.y = -0.28 + Math.sin(f.beat * Math.PI * 0.5) * 0.12
        const hit = pulse(f.beat, 5)
        ;(cone.material as THREE.MeshBasicMaterial).opacity = 0.05 + hit * 0.025
        spot.intensity = 1.4 + hit * 0.5

        // typing dots → bubble pops on "ขอบคุณ" and types itself out
        const kTy = seg(t, t1, t1 + 0.15) * (1 - seg(t, tThanks - 0.05, tThanks))
        typing.style.opacity = String(kTy)
        typing.style.transform = `scale(${0.8 + 0.2 * ease.back(seg(t, t1, t1 + 0.2))})`
        typing.textContent = '•••'.slice(0, 1 + (Math.floor(f.beat * 2) % 3))
        const kb = seg(t, tThanks, tThanks + 0.25), kShrink = ease.inOut(seg(t, t2, t2 + 0.35))
        bubble.style.display = kb > 0 && kShrink < 1 ? 'block' : 'none'
        bubble.style.opacity = String(clamp(kb * 3) * (1 - kShrink))
        bubble.style.transform = `translateY(${kShrink * 260}px) scale(${(0.5 + 0.5 * ease.back(kb)) * (1 - 0.8 * kShrink)})`
        const n = Math.floor(seg(t, tThanks, tThanks + 0.9) * graphemes.length + 0.001)
        graphemes.forEach((g, i) => (g.style.visibility = i < n ? 'visible' : 'hidden'))

        // TL;DR card grows out of the collapsed bubble; stamp slams on "ซื้อ"
        const kc = seg(t, t2 + 0.2, t2 + 0.6)
        const shake = Math.exp(-14 * Math.max(0, t - tSold)) * (t >= tSold ? 1 : 0)
        card.style.display = kc > 0 ? 'block' : 'none'
        card.style.opacity = String(clamp(kc * 2))
        card.style.transform = `translate(${Math.sin(t * 90) * 10 * shake}px, ${(1 - ease.out(kc)) * 200}px) scale(${0.25 + 0.75 * ease.back(kc)})`
        const ks = seg(t, tSold, tSold + 0.14)
        stamp.style.display = ks > 0 ? 'block' : 'none'
        stamp.style.opacity = String(clamp(ks * 1.6) * 0.95)
        stamp.style.transform = `rotate(${lerp(-24, -11, ks)}deg) scale(${lerp(2.3, 1, ease.out(ks))})`
        const k1 = seg(t, tSold + 0.35, tSold + 0.6), k2 = seg(t, tSold + 0.7, tSold + 0.95)
        note1.style.opacity = String(k1)
        note1.style.transform = `rotate(-7deg) scale(${0.7 + 0.3 * ease.elastic(k1)})`
        note2.style.opacity = String(k2)
        note2.style.transform = `rotate(5deg) scale(${0.7 + 0.3 * ease.elastic(k2)})`
      },
    }
  },
} satisfies SceneDef
