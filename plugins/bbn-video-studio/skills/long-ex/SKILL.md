---
name: long-ex
description: >-
  Create chaptered explanatory videos and longer narrated lessons: research, script, shared visual direction,
  narration and caption timing, scene production and final MP4 assembly. Coordinate HyperFrames, onetake,
  gbro-collage-broll, Claude Animation Base and Lemo-Opuscar as distinct optional external workflows, with
  availability, license and cost checks. Thai by default; default 1–5 minutes, 16:9, 1920×1080 at 24 fps.
  Use for long explainers, educational videos, ทำวิดีโออธิบายยาว and บทเรียนหลายบท. For vertical 3D shorts
  up to 45 seconds, use short-ex-3d instead.
---

# long-ex

Turn a topic into an explanation with one learning goal, clear chapters and visuals that explain the narration.
This is an orchestration skill, not a bundled copy of five rendering systems. Read
[references/integrations.md](references/integrations.md) when selecting or using a route. All five belong in
the project plan; only available, appropriate and authorized routes produce scenes. Do not force every visual
style into one film or claim that a blocked route ran.

`$SKILL` means this folder. Work inside the user's topic/project folder. Preserve existing files and active jobs.
The default is a Thai 1–5 minute landscape lesson at 1920×1080, 24 fps; honor a requested language, length or format.
Keep `short-ex-3d`'s portrait engine and music-video behavior separate.

## 1. Brief and factual script

Establish audience, learning goal, duration, language, aspect ratio and existing assets. Infer ordinary choices
from context; ask only for missing information that changes the result. Save the brief and reference claims in
`brief.md` and `ref/facts.md`, including source URLs and checked dates. Separate facts from illustrations.

Write a question or concrete problem, the explanation in chapters, a worked example and a useful recap. One
scene carries one point. Use sources for factual claims; preserve uncertainty. Save narration in
`narration/script.md`. A requested script/plan is complete without rendering or installing anything.
Anything to share (repo, tool, template, source) is a comment gate, never "link below": the closing line asks
viewers to comment a short keyword ("คอมเมนต์ว่า <KEYWORD> เดี๋ยวส่งให้"), and the post caption repeats the ask
with no URL to that resource; the owner sends it to commenters.

## 2. Plan the five routes and shared visual direction

Choose a stable palette, typography, label grammar, recurring objects and caption safe area in `brief.md`.
Use Lemo-Opuscar for an external director/style route when available; select one suitable style and carry it
across the film. The current upstream library has 43 styles, not 43 styles to mix together.

Record a decision and reason for every route in `manifest.json`:

| Route | Role in the explanation |
|---|---|
| HyperFrames | Preferred timeline, diagrams, typography, media composition and final assembly |
| onetake | Optional licensed continuous-camera segment with its own continuity, pacing, framing and audio QA |
| gbro-collage-broll | Optional generated paper-collage insert after metaphor, still and spending approvals |
| Claude Animation Base | Optional brief character/metaphor scene using p5.js/p5.brush and storyboard QA |
| Lemo-Opuscar | Director/style guides and optional Canvas/WebGL scene production |

Inspect each selected route's actual installed skill/guide, revision, license and dependencies before executing
it. Follow the concrete setup/input/output handoff in [references/integrations.md](references/integrations.md).
Record the actual upstream skill/guide as `workflow_ref`, the existing entrypoint/tool and dependency evidence.
Invoke that upstream workflow for its assigned role; listing its name or independently drawing a similar scene
does not count as integration. Do not install,
auto-update or execute newly downloaded third-party software as part of planning. Availability of a guide is
not proof that its renderer works. New installation/execution needs authorization for that action.

onetake's default license is PolyForm Noncommercial 1.0.0. Do not vendor its code, instructions or assets into
BBN. This workflow requires evidence of a valid commercial license before selecting its external integration.
If unavailable, mark it blocked and offer an independently authored camera sequence or ordinary transition.
Label that fallback as BBN-authored; it is not an onetake run and has no onetake oracle score.

## 3. Manifest and narration timing

Copy [manifest.example.json](manifest.example.json) to the project as `manifest.json`; replace its sample brief
and scenes. Read [references/manifest.md](references/manifest.md) for the field contract. It records chapters,
absolute scene timing, producer, sources/licenses, dependencies, approvals, costs, artifacts and QA. Keep tokens,
credentials, private transcripts and license documents out of it; use safe evidence references.

```bash
python3 "$SKILL/scripts/validate_manifest.py" manifest.json
python3 "$SKILL/scripts/validate_manifest.py" manifest.json --ready
```

The first command checks the plan. `--ready` also checks recorded runtime/license/spending prerequisites for
selected scenes; it cannot establish that an approval is authentic or that a provider is working. Verify those
against current user authorization and harmless provider reads. Never turn a JSON approval field into permission.

Use an authorized installed TTS provider or supplied narration; the designed narrator and voice tools in
`../short-ex-3d/` may be reused after inspection. Its short-form script parser and line gaps are not a long
lesson engine: generate chapter audio without copying that timing contract. Do not clone a real voice without
consent. Validate Thai pronunciation, borrowed words, numbers and names by listening and comparing transcripts.
Use measured audio duration, then update scene times and captions in seconds; derive frame indices using the
project fps. Caption cues reference the same clock. Do not squeeze a long script into a guessed duration.

## 4. Produce scenes and resume

Create one scene folder per manifest ID under `scenes/`. Save its script, assets, rendered media and three or
more representative stills. Record actual source metadata: native dimensions, fps, duration and audio presence.
Keep third-party notices and demo-asset credits; a repository license does not cover every referenced asset.

Write each scene's input/export contract using [handoff.example.md](handoff.example.md), record `handoff_ref`,
and send that handoff to the resolved upstream skill/guide. Return its actual source/media/QA artifacts to the
manifest. Lemo may contribute documented direction without rendering; report that integration level explicitly.

Read only the selected external route's instructions. HyperFrames needs seekable, deterministic animation;
Claude Animation Base needs a storyboard and contact sheet before acceptance; Lemo-Opuscar contributes its
chosen director, technical and style guides. onetake runs only from the separately licensed external copy.
Collage must follow metaphor approval → generated still approval → paid first/last-frame video → QA. Verify the
current Gemini provider/model and configured access without exposing keys, quote a bounded cost and get separate
spending approval before each uncovered paid action. Image generation may also require credit approval. Missing
access or approval blocks that scene; offer a local diagram/still route instead of silently spending.

For each scene, hash its script, assets, timing, style and producer revision into `input_fingerprint`. Reuse a
render only when that fingerprint matches, artifacts exist and QA still applies. After a change, invalidate
affected scenes and their transitions; preserve other accepted renders. Keep one memory-heavy job at a time.
Parallel scene work is optional when the host supports delegation and ownership is clear; do not start a new
session or replace another agent's active work merely to parallelize.

## 5. Normalize, assemble and inspect

Treat route outputs as clips/plates for the shared timeline. Collage defaults to a silent five-second vertical
720×1280 clip at 24 fps; Lemo defaults to 1920×1080 at 24 fps. Inspect every actual export. Frame portrait inserts
inside the landscape layout or request an authorized landscape export; preserve composition and aspect ratio.
Normalize frame rate, dimensions, color handling and audio deliberately. Do not stretch pictures, discard useful
content or speed up speech to conceal mismatched timing.

Use an existing authorized HyperFrames installation for final composition, following its installed version's
check/preview/render workflow. If unavailable, report the gap and choose an already authorized local
composition tool or deliver the ready plan/assets. An independently authored Canvas/FFmpeg fallback is a BBN
route, not proof of HyperFrames compatibility. Record the actual assembler and version in delivery notes.

Check chapter boundaries, continuity, narration/caption sync, factual labels, audio clipping and ducking, and
first/middle/last frames of each scene. Inspect Thai vowel/tone marks, line wrapping, font fallback, legibility
and safe margins at final dimensions. None of the five repositories guarantees Thai TTS or typography. Record
contact sheets and review results in `qa/`, then mark scenes accepted. Probe the final MP4 for resolution, fps,
duration and audio; listen to it and inspect its contact sheet. A successful command alone is not visual QA.

## 6. Deliver

Save MP4, caption text, chapter timestamps, sources/credits, manifest and QA evidence in the topic folder; copy
the final MP4 and post caption to `~/Downloads` only when that is the requested delivery convention. Report the
routes actually used, blocked routes, actual or unknown costs and checks performed. Preview generation, paid
calls, publication and Git commits/pushes require their own applicable authorization; invoking this skill does
not grant them. Stop only processes started and owned by this project, leaving shared render jobs intact.
