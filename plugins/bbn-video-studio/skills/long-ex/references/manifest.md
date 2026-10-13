# Manifest contract

`manifest.example.json` is a valid planning example for a 60-second, three-chapter film. It is not a rendered film
or provider authorization. Replace its topic, narrative and scene data; keep IDs stable when resuming.

- `output`: intended dimensions, fps and total duration. Scene times use absolute seconds and cover this duration
  in order, without gaps or overlaps larger than one frame. Scene media is normalized to this contract at assembly.
- `style`: shared palette, font choices and caption placement; test actual font files and Thai layout.
- `integrations`: all five external routes, their source/license and `selected`, `optional` or `blocked` decision.
  `workflow_ref` points to the actual installed upstream skill/guide; `revision`, `entrypoint`, `dependency_check`
  and `license_check` record verified state; null/unchecked is honest
  during planning. Use `evidence_ref` for a safe note path, not secrets or legal documents.
- `chapters`: unique ID, learning goal and ordered scene IDs. Each scene belongs to exactly one chapter.
- `scenes`: unique ID, chapter, start/duration, producer, narration/caption references, factual sources, asset
  provenance/licenses, cost record, creative approval references, fingerprint, render state, artifacts and QA.
  `handoff_ref` points to the scene request with concrete input and export contracts (see `handoff.example.md`).
  The producer is a selected integration or `bbn-local` for independently authored work. Never name BBN work
  `onetake` or `hyperframes` without actually using those workflows.
- `cost`: `paid`, provider, estimate, currency and safe `approval_ref`. Null estimate means unknown; do not
  infer free access from missing data. Approval references document existing authorization, not confer it.
- `approvals`: collage needs separate `metaphor_ref` and `still_ref`, plus the spending record. Each is tied to
  the current scene inputs; invalidate it when an approved input changes.
- `input_fingerprint`: a digest of the script, assets, timing, shared style and actual producer revision. Check
  files and QA before reusing a `rendered` or `accepted` scene. Neither state nor digest proves an export exists.
- `artifacts`: paths relative to the project; `qa_ref`: current scene review evidence. Accepted scenes need both.

`validate_manifest.py` uses only Python's standard library and never renders, installs, calls providers or spends.
It checks timeline, chapter ownership, provenance/cost records and route decisions. `--ready` additionally requires
selected runtime/license checks, actual workflow references, source revisions/entrypoints, scene handoffs,
onetake commercial-license evidence, and paid/collage
approvals. The validator checks recorded prerequisites; the agent must verify real user authorization, current
provider access, source licenses, input fingerprints and actual media separately before executing or delivering.
