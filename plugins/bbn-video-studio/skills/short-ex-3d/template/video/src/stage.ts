import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { C } from './kit'
import type { Theme } from './types'

export const W = 1080, H = 1920 // vertical 9:16 (TikTok/Reels)

const THEMES: Record<Theme, { bg: string; bloom: number }> = {
  dark: { bg: C.ink, bloom: 0.85 },
  paper: { bg: C.paper, bloom: 0 },
  red: { bg: C.bloodBg, bloom: 0.9 },
  deep: { bg: '#03060F', bloom: 1.0 }, // cinematic night/deep-sea look of this film
}

/** Soft studio reflections for PBR materials (envMap / scene.environment). */
export let studioEnv: THREE.Texture | null = null

export class Stage {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 400)
  readonly overlay: HTMLDivElement
  theme: Theme = 'dark'
  private composer: EffectComposer
  private bloom: UnrealBloomPass
  private film: ShaderPass
  /** A scene's full-frame backdrop (e.g. a Blender Sequence texture); replaces the theme colour until the next cut. */
  backdrop: THREE.Texture | null = null

  constructor(frame: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(1)
    this.renderer.setSize(W, H, false)
    this.renderer.toneMapping = THREE.NoToneMapping // flat graphic colours stay exact
    frame.prepend(this.renderer.domElement)
    this.overlay = frame.querySelector('#overlay')!
    studioEnv = new THREE.PMREMGenerator(this.renderer).fromScene(new RoomEnvironment(), 0.04).texture
    studioEnv!.userData.shared = true

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x223044, 1.4))
    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(4, 8, 6)
    this.scene.add(key)

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.85, 0.55, 0.72)
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())
    // cinematic finish in display space: fine grain (seeded by frame time, so renders are deterministic),
    // soft vignette and a touch of lens chromatic aberration at the edges
    this.film = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: 0.045 }, uVig: { value: 0.32 }, uCA: { value: 0.0016 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uGrain, uVig, uCA; varying vec2 vUv;
        float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime * 0.6180339) * 43758.5453); }
        void main() {
          vec2 d = vUv - 0.5; float r2 = dot(d, d);
          vec3 c = vec3(texture2D(tDiffuse, vUv - d * uCA * r2 * 8.0).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + d * uCA * r2 * 8.0).b);
          c *= 1.0 - uVig * smoothstep(0.08, 0.55, r2 * 1.6);
          float l = dot(c, vec3(0.299, 0.587, 0.114));
          c += (h(vUv * 1000.0) - 0.5) * uGrain * (1.0 - l * 0.6);
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
    this.composer.addPass(this.film)
    this.resetCamera()
  }

  /** Default framing: 10 units back, so the visible plane at z=0 is ~3.54 wide x 6.3 tall (portrait). */
  resetCamera() {
    this.camera.fov = 35
    this.camera.position.set(0, 0, 10)
    this.camera.up.set(0, 1, 0)
    this.camera.lookAt(0, 0, 0)
    this.camera.updateProjectionMatrix()
  }

  /** Per-scene renderer state goes back to defaults on every cut (scenes may set ACES tone mapping, fog, env). */
  resetRenderer() {
    this.renderer.toneMapping = THREE.NoToneMapping
    this.renderer.toneMappingExposure = 1
    this.scene.fog = null
    this.scene.environment = null
    this.backdrop = null
  }

  setTheme(theme: Theme) {
    this.theme = theme
    const t = THEMES[theme]
    this.scene.background = this.backdrop ?? new THREE.Color(t.bg)
    this.bloom.strength = t.bloom
    this.bloom.enabled = t.bloom > 0
  }

  /** t = song time: seeds the film grain so every frame (and every render job) is identical. */
  render(t = 0) { this.film.uniforms.uTime.value = Math.round(t * 30); this.composer.render() }
}
