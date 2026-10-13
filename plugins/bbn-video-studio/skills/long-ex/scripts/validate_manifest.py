#!/usr/bin/env python3
"""Check a long-ex plan and recorded prerequisites without external side effects."""

import argparse
import json
import math
import re
from pathlib import Path


ROUTES = {
    "hyperframes": ("heygen-com/hyperframes", "Apache-2.0"),
    "onetake": ("feitangyuan/onetake", "PolyForm-Noncommercial-1.0.0"),
    "collage-broll": ("pyang5166/gbro-collage-broll", "MIT"),
    "claude-animation-base": ("JohnHeibel/ClaudeAnimationBase", "MIT"),
    "lemo-opuscar": ("lemomo-ai/lemo-opuscar", "MIT"),
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def text(value):
    return isinstance(value, str) and bool(value.strip())


def number(value):
    return type(value) in (int, float) and math.isfinite(value)


def indexed(items, label):
    require(isinstance(items, list) and bool(items), f"{label} must be a nonempty list")
    result = {}
    for item in items:
        require(isinstance(item, dict), f"{label} entries must be objects")
        key = item.get("id")
        require(text(key) and re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", key), f"Invalid {label} id")
        require(key not in result, f"Duplicate {label} id: {key}")
        result[key] = item
    return result


def validate(data, ready=False):
    require(isinstance(data, dict) and type(data.get("schema_version")) is int and data["schema_version"] == 1,
            "Expected manifest schema_version 1")
    require(text(data.get("title")) and text(data.get("language")), "title and language are required")
    output = data.get("output", {})
    require(isinstance(output, dict), "output must be an object")
    for key in ("width", "height"):
        require(type(output.get(key)) is int and output[key] > 0, f"output.{key} must be a positive integer")
    for key in ("fps", "duration_s"):
        require(number(output.get(key)) and output[key] > 0, f"output.{key} must be finite and positive")
    require(isinstance(data.get("style"), dict) and data["style"], "A shared style is required")
    routes = indexed(data.get("integrations"), "integration")
    require(set(routes) == set(ROUTES), "Record decisions for all five external integrations")
    for key, route in routes.items():
        repo, license_name = ROUTES[key]
        require(route.get("repository") == f"https://github.com/{repo}" and route.get("license") == license_name,
                f"{key}: unexpected source or license")
        require(route.get("decision") in ("selected", "optional", "blocked") and text(route.get("reason")),
                f"{key}: decision and reason are required")
        for field in ("dependency_check", "license_check"):
            check = route.get(field, {})
            require(isinstance(check, dict) and check.get("status") in ("unchecked", "verified", "missing", "blocked"),
                    f"{key}: invalid {field}")
            if ready and route["decision"] == "selected":
                require(check["status"] == "verified" and text(check.get("evidence_ref")),
                        f"{key}: {field} needs verified evidence")
        if ready and route["decision"] == "selected":
            require(all(text(route.get(field)) for field in ("workflow_ref", "revision", "entrypoint")),
                    f"{key}: actual workflow_ref, verified revision and entrypoint are required")
            if key == "onetake":
                require(text(route.get("commercial_license_ref")), "onetake: valid commercial-license evidence required")

    chapters = indexed(data.get("chapters"), "chapter")
    scenes = indexed(data.get("scenes"), "scene")
    order = []
    for key, chapter in chapters.items():
        require(text(chapter.get("title")) and text(chapter.get("learning_goal")), f"{key}: title and learning goal required")
        ids = chapter.get("scene_ids")
        require(isinstance(ids, list) and ids and all(text(s) for s in ids), f"{key}: scene_ids required")
        for sid in ids:
            require(sid in scenes and scenes[sid].get("chapter") == key, f"{key}: invalid scene ownership: {sid}")
        order.extend(ids)
    require(order == list(scenes), "Chapters must own each scene exactly once, in timeline order")

    end = 0
    tolerance = 1 / output["fps"]
    for sid, scene in scenes.items():
        start, duration = scene.get("start_s"), scene.get("duration_s")
        require(number(start) and start >= 0 and number(duration) and duration > 0, f"{sid}: invalid timing")
        require(abs(start - end) <= tolerance + 1e-9, f"{sid}: timeline gap or overlap exceeds one frame")
        end = start + duration
        producer = scene.get("producer")
        require(producer == "bbn-local" or (text(producer) and producer in routes and routes[producer]["decision"] == "selected"),
                f"{sid}: producer must be selected or bbn-local")
        if ready:
            require(text(scene.get("handoff_ref")), f"{sid}: concrete scene handoff_ref required")
        narration = scene.get("narration", {})
        require(isinstance(narration, dict) and text(narration.get("text")), f"{sid}: narration text required")
        require(isinstance(narration.get("fact_sources"), list) and all(text(s) for s in narration["fact_sources"]),
                f"{sid}: fact_sources must be a list of source references")
        assets = scene.get("assets")
        require(isinstance(assets, list), f"{sid}: assets must be a list")
        for asset in assets:
            require(isinstance(asset, dict) and all(text(asset.get(k)) for k in ("path", "source", "license", "credit")),
                    f"{sid}: each asset needs path, source, license and credit")
        cost = scene.get("cost", {})
        require(isinstance(cost, dict) and type(cost.get("paid")) is bool, f"{sid}: cost.paid must be explicit")
        require(text(cost.get("provider")) and text(cost.get("currency")), f"{sid}: provider and currency required")
        estimate = cost.get("estimate")
        require(estimate is None or (number(estimate) and estimate >= 0), f"{sid}: invalid cost estimate")
        require(cost["paid"] or estimate in (None, 0), f"{sid}: nonzero cost cannot be marked free")
        if producer == "collage-broll":
            require(cost["paid"], f"{sid}: collage must record paid generation")
            approvals = scene.get("approvals", {})
            require(isinstance(approvals, dict), f"{sid}: approvals must be an object")
            if ready:
                require(all(text(approvals.get(k)) for k in ("metaphor_ref", "still_ref")),
                        f"{sid}: collage metaphor and still approvals required")
        if ready and cost["paid"]:
            require(estimate is not None and text(cost.get("approval_ref")), f"{sid}: quoted cost and spending approval required")
        require(scene.get("status") in ("planned", "rendered", "accepted"), f"{sid}: invalid render status")
        artifacts = scene.get("artifacts")
        require(isinstance(artifacts, list) and all(text(p) for p in artifacts), f"{sid}: artifacts must be path references")
        if scene["status"] in ("rendered", "accepted"):
            require(text(scene.get("input_fingerprint")) and bool(artifacts), f"{sid}: rendered scenes need fingerprint and artifacts")
        if scene["status"] == "accepted":
            require(text(scene.get("qa_ref")), f"{sid}: accepted scenes need QA evidence")
    require(abs(end - output["duration_s"]) <= tolerance + 1e-9, "Timeline does not match output duration")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--ready", action="store_true", help="Also require recorded execution prerequisites")
    args = parser.parse_args()
    try:
        validate(json.loads(args.manifest.read_text()), args.ready)
    except (OSError, ValueError) as error:
        parser.exit(1, f"Invalid manifest: {error}\n")
    print("Manifest valid" + ("; recorded execution prerequisites present (verify actual authorization separately)" if args.ready else " as a plan"))


if __name__ == "__main__":
    main()
