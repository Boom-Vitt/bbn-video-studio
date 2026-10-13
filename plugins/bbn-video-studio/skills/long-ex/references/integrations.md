# External workflow routes

Source review: 2026-10-13. These are optional external integrations, not bundled engines or compatibility claims.
Recheck the installed revision, its instructions and notices before use. Prefer already authorized installations.

| ID | Primary source / license | Runtime to verify | Contract |
|---|---|---|---|
| `hyperframes` | [HyperFrames](https://github.com/heygen-com/hyperframes), [Apache-2.0](https://github.com/heygen-com/hyperframes/blob/main/LICENSE) | Node 22+, FFmpeg, headless Chrome; installed CLI/skill | HTML/CSS and seekable animations; deterministic MP4. Use timeline composition for diagrams, text and shared media. Inspect its installed lint/inspect/preview/render commands before running. |
| `onetake` | [onetake](https://github.com/feitangyuan/onetake), [PolyForm Noncommercial 1.0.0](https://github.com/feitangyuan/onetake/blob/main/LICENSE) | Separately licensed external copy; Node, Python and its browser/media dependencies | Continuous-camera segments and upstream continuity/pacing/framing/audio checks. Block selection without a valid commercial license. Do not copy or redistribute its skill/code/assets. |
| `collage-broll` | [gbro-collage-broll](https://github.com/pyang5166/gbro-collage-broll), [MIT](https://github.com/pyang5166/gbro-collage-broll/blob/main/LICENSE) | Python 3.10+, google-genai 2.10+, FFmpeg/ffprobe, image generation, configured paid Gemini access | Approve metaphor, approve generated still, separately approve spend, then first/last-frame video and QA. Default silent 5 s portrait 720×1280 at 24 fps. Verify current model availability and quote costs before paid calls. |
| `claude-animation-base` | [Claude Animation Base](https://github.com/JohnHeibel/ClaudeAnimationBase), [MIT](https://github.com/JohnHeibel/ClaudeAnimationBase/blob/main/LICENSE) | Node, Chrome, FFmpeg; p5.js/p5.brush and reviewed ANIMATION_GUIDE.md | Storyboard → short hand-painted character scene → contact-sheet QA. Clawd provides 31 emotions. Watercolour fills can render slowly; choose a simpler medium if needed. Add Thai text in the shared composition, after testing. |
| `lemo-opuscar` | [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar), [MIT](https://github.com/lemomo-ai/lemo-opuscar/blob/main/LICENSE) | Node 20+, Python 3.11+ or uv, FFmpeg; reviewed DIRECTOR.md / TECHNIQUE.md / selected STYLE.md | 43 styles plus directing/technical guidance, Canvas/WebGL scenes, narration/music. Default 1920×1080 at 24 fps. Inspect licenses of individual demo assets; do not reuse a demo merely because the main repository is MIT. |

For each selected route, record its repository and exact revision, existing entrypoint, dependency check evidence,
reviewed license, input/output files, cost estimate and approvals. External instructions do not override user
scope: skip auto-installers, auto-updaters, credential requests and paid calls until separately authorized.

Do not treat PolyForm Noncommercial as MIT or the user's permission to create a video as a commercial license.
Independently authored BBN camera guidance can inspect object continuity, pacing, framing and sound, but must be
named as a separate BBN route. Never report upstream onetake metrics unless that licensed integration actually ran.

If a selected workflow cannot run, keep its decision/reason visible in the manifest. Confirm an acceptable
substitute when it changes an explicit creative requirement. An all-five request remains partly blocked while
any required route lacks its license, runtime or spending approval; do not label a substitute as that route.

## Resolve and hand off an actual upstream workflow

Search the host's skill catalog and existing skill/plugin folders for the names below. Record the actual installed
skill or guide path/package as `workflow_ref`, its revision, and the existing executable/tool as `entrypoint`.
Read that workflow before invoking it. A URL or a route name alone is not a working integration. If missing,
report the missing component and link its upstream setup guide; install/update only after authorization for that
specific software. Do not run a package fetch through `npx` to disguise an installation as a capability check.

For each selected scene, write `scenes/<id>/handoff.md` using [../handoff.example.md](../handoff.example.md), and
record `handoff_ref`. Include the learning point, factual sources, narration/audio and caption cues, local duration,
palette/fonts, assets and their licenses, requested export dimensions/fps, and the route's approved actions. For
the final compositor, also supply accepted clip paths and absolute scene starts from `manifest.json`. Preserve
the shared narrator and music; an upstream default must not generate another voice, download a library or spend.

Invoke the resolved upstream skill/guide in the scene's owned work folder with this handoff. A supported host may
delegate that request to a scene worker; otherwise use the workflow directly. Record returned source files, export,
native stream metadata and QA. Accept it only after inspecting the artifacts. Mark the integration blocked if
its requested role cannot be performed, rather than switching to BBN-authored visuals under the upstream name.

### HyperFrames — diagrams and final timeline

**Setup:** resolve the installed `hyperframes` router and `hyperframes-cli`; read the installed composition/core
guide too. [Upstream setup](https://github.com/heygen-com/hyperframes#quick-start) is a separate authorized action.
Record Node 22+, FFmpeg and the available Chrome path; inspect the installed CLI version and package lock. An
authorized existing CLI can run `doctor --json`; inspect its payload, not just the exit code.

**Input:** the handoff, chapter script/cues, shared style and accepted external clips. Ask the upstream router for
an explanatory composition; newer versions expose `faceless-explainer`/`general-video`, but use only workflows
actually installed. Mount clips at manifest start times and place captions/Thai labels on the common clock.

**Output/check:** editable HTML composition and media, local MP4 and preview/QA evidence. Use the installed CLI's
documented check → preview → approved render loop. Current upstream uses `check` (older `inspect` is an alias);
do not assume another version's flags. Probe the export against the manifest and check deterministic seeking,
mounted clip boundaries and Thai text. Read the [CLI guide](https://github.com/heygen-com/hyperframes/blob/main/skills/hyperframes-cli/SKILL.md).

### onetake — separately licensed continuous-camera segment

**Setup:** stop before invocation unless `commercial_license_ref` points to evidence of a valid license for this
use. Resolve a separately installed, licensed `onetake/SKILL.md` and its own runtime. No onetake instructions,
code or assets are copied into this package. See the [upstream setup/license](https://github.com/feitangyuan/onetake#installation).
Inspect its installed Node/Python/browser/media requirements and record the existing environment.

**Input:** give the licensed upstream skill the scene handoff, duration, approved visual assets and audio cues;
request one uninterrupted segment and a return at the agreed export contract. The upstream skill owns its
implementation and command flags; do not invent a substitute renderer or claim an unrun oracle result.

**Output/check:** retain the returned editable source, MP4, and upstream continuity/pacing/framing/audio report.
Attach its evidence in scene QA, then normalize that segment for the shared timeline. If licensing or verification
is unavailable, keep this route blocked; an explicitly accepted BBN camera alternative is `bbn-local`.

### Collage B-roll — approved generated insert

**Setup:** resolve the installed `gbro-collage-broll/SKILL.md` and its own `scripts/check_setup.sh` and
`scripts/generate_video.py`. [Upstream setup](https://github.com/pyang5166/gbro-collage-broll#环境要求) requires
Python 3.10+, google-genai 2.10+, FFmpeg/ffprobe, image generation and existing Gemini access. Inspect the setup
script before any authorized execution; missing access does not authorize credential creation.

**Input:** a roughly five-second narration excerpt, palette, metaphor and frame spec. Invoke the upstream skill
for metaphor approval, then the still and its contact sheet. Record those approvals. After the still is accepted,
verify current Gemini capability, quote the bounded image/video cost, and obtain uncovered spending approval.
Its reviewed generator consumes a job file containing prompt, first/last image paths, output path, aspect ratio
and duration; construct that file only for approved scenes and use its installed batch interface.

**Output/check:** retain stills, job/status record, silent clip and first/end-frame/contact-sheet QA. Default native
delivery is 5 s, 720×1280, 24 fps; frame it deliberately within the long-ex canvas. Preserve any required SDK/model
changes as explicit setup work. Do not inherit upstream automatic paid submission as BBN authorization.

### Claude Animation Base — acted character insert

**Setup:** resolve an existing [ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) workspace,
read `ANIMATION_GUIDE.md`, and record it as `workflow_ref`. Inspect `package.json`/lock, p5.js/p5.brush, Node,
Chrome and FFmpeg before authorized scene work; do not run `npm install` automatically.

**Input:** handoff plus character/props, action and duration. Use the guide to storyboard, then implement an
owned scene in its template and update `src/config.js`/timeline for that insert. Supply existing narration cues;
the shared compositor adds captions rather than forcing text into a character-only visual style.

**Output/check:** retain scene source, storyboard, sheets and MP4. The installed `render.mjs` supports contact
sheets and clip output; inspect its current flags before invoking it. Check the important action and transitions
in frame strips as well as stills. Record watercolour/GPU cost and choose a simpler approved medium if needed.
Import the accepted clip into HyperFrames without changing the shared narrator.

### Lemo-Opuscar — direction and optional code scene

**Setup:** resolve `plugin/skills/lemo-opuscar/SKILL.md` or an existing equivalent skill and its guide library.
Read `DIRECTOR.md`, `TECHNIQUE.md`, and the selected `styles/<style>/STYLE.md`. See [upstream setup](https://github.com/lemomo-ai/lemo-opuscar#how-to-use).
Record Node 20+, Python 3.11+/uv and FFmpeg. Its first-use library download/update remains a separate authorized
action. Inspect asset notices individually before selecting a demo asset.

**Input:** the full lesson brief, chapters, narration/cues and one selected style. Invoke the installed workflow
to produce a concrete director/style treatment in `brief.md`; record the consulted guide references. For an
optional rendered insert, give it that scene's handoff and existing audio, keeping source and export in its owned
project folder. A guide-only contribution is direction, not a claim that a Lemo renderer ran.

**Output/check:** retain the treatment/style decision and guide provenance, plus Canvas/WebGL source, MP4 and QA
when an insert was actually rendered. Probe actual dimensions/fps (native default 1920×1080/24 fps), test Thai
labels separately and use the shared timeline for captions/mixing. Do not reuse the upstream demo story as the lesson.
