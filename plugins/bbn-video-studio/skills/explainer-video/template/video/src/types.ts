import type * as THREE from 'three'
import type { Stage } from './stage'

export type Theme = 'dark' | 'paper' | 'red' | 'deep'

export interface LineCue { id: string; section: string; text: string; start: number; end: number }
export interface SceneCue { scene: string; start: number; end: number; lines: string[] }
export interface Cues { bpm: number; offset?: number; duration: number; lines: LineCue[]; scenes: SceneCue[] }

/** Where the global caption layer puts the narrated line while this scene is active (default bottom). */
export interface TypeLayout {
  pos: 'left' | 'center' | 'top' | 'bottom' | 'right'
  size?: number // px, default 62
  color?: string // settled word colour (defaults by theme)
  accent?: string // colour of *keywords*
}

/** Everything a scene may read each frame. All animation MUST be a pure function of these numbers. */
export interface Frame {
  t: number // seconds since song start
  local: number // seconds since this scene started
  dur: number // scene length in seconds
  p: number // local / dur, 0..1
  beat: number // float beats since song start (120 BPM => 2 per second)
  lines: LineCue[] // this scene's lines, in order
  li: number // index into lines of the current/last-started line (-1 before the first)
  lp: number // 0..1 progress through lines[li] (0 when li = -1)
}

export interface SceneCtx {
  stage: Stage
  root: THREE.Group // scene-owned; removed + disposed automatically
  dom: HTMLDivElement // scene-owned 1080x1920 overlay layer above the canvas; removed automatically
  cue: SceneCue
  variant: number // 0 for the first use of this scene id, 1 for the second, ...
}

export interface SceneInstance {
  update(f: Frame): void
  /** Optional: load what frame f needs (e.g. a Blender sequence frame) before update(f) runs. Awaited when rendering. */
  prepare?(f: Frame): Promise<void>
  dispose?(): void
}

export interface SceneDef {
  theme: Theme
  type?: TypeLayout | false // false = scene draws its own lyrics
  create(ctx: SceneCtx): SceneInstance
}
