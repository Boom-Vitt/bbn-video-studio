import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { C } from './kit'
import type { Theme } from './types'

export const W = 1920, H = 1080

const THEMES: Record<Theme, { bg: string; bloom: number }> = {
  dark: { bg: C.ink, bloom: 0.85 },
  paper: { bg: C.paper, bloom: 0 },
  red: { bg: C.bloodBg, bloom: 0.9 },
}

export class Stage {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 400)
  readonly overlay: HTMLDivElement
  theme: Theme = 'dark'
  private composer: EffectComposer
  private bloom: UnrealBloomPass

  constructor(frame: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(1)
    this.renderer.setSize(W, H, false)
    this.renderer.toneMapping = THREE.NoToneMapping // flat graphic colours stay exact
    frame.prepend(this.renderer.domElement)
    this.overlay = frame.querySelector('#overlay')!

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x223044, 1.4))
    const key = new THREE.DirectionalLight(0xffffff, 2.2)
    key.position.set(4, 8, 6)
    this.scene.add(key)

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.85, 0.55, 0.72)
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())
    this.resetCamera()
  }

  /** Default framing: 10 units back, so the visible plane at z=0 is ~6.3 x 3.5 units. */
  resetCamera() {
    this.camera.fov = 35
    this.camera.position.set(0, 0, 10)
    this.camera.up.set(0, 1, 0)
    this.camera.lookAt(0, 0, 0)
    this.camera.updateProjectionMatrix()
  }

  setTheme(theme: Theme) {
    this.theme = theme
    const t = THEMES[theme]
    this.scene.background = new THREE.Color(t.bg)
    this.bloom.strength = t.bloom
    this.bloom.enabled = t.bloom > 0
  }

  render() { this.composer.render() }
}
