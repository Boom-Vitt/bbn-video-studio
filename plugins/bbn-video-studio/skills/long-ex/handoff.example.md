# Scene handoff template

Copy into `scenes/<scene-id>/handoff.md` and fill from the current manifest and measured narration.
This is a request to the resolved upstream workflow, not proof that it ran.

- Scene ID, chapter, learning point and factual source references:
- Manifest producer, exact installed workflow_ref, revision and entrypoint:
- Narration excerpt, existing audio path, caption cue path and measured local duration:
- Shared palette, typography, recurring objects and asset paths/licenses:
- Required export path, width, height, fps, duration and audio policy:
- Permitted actions and evidence references for runtime/license/creative/spending approvals:
- Expected source, media and QA files to return; checks required by the selected upstream workflow:

Use the actual selected upstream skill or guide to perform this role in the owned scene folder. Preserve the
supplied audio and timing. Return source paths, export metadata and QA evidence. Stop and report a missing
dependency, license or approval; do not install, spend, generate credentials or substitute another producer.
If this is a direction-only Lemo request, return the treatment and consulted guide references without claiming
a rendered clip. If this is HyperFrames assembly, include every accepted clip and its absolute manifest start.
