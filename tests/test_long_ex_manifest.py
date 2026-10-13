import copy
import importlib.util
import json
import math
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "plugins/bbn-video-studio/skills/long-ex"
spec = importlib.util.spec_from_file_location("validate_manifest", SKILL / "scripts/validate_manifest.py")
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)
EXAMPLE = json.loads((SKILL / "manifest.example.json").read_text())


def verified(route):
    route.update(workflow_ref="test-only-upstream-SKILL.md", revision="test-revision", entrypoint="test-only-entrypoint")
    for field in ("dependency_check", "license_check"):
        route[field] = {"status": "verified", "evidence_ref": "test-only-evidence.md"}


class ManifestTests(unittest.TestCase):
    def setUp(self):
        self.data = copy.deepcopy(EXAMPLE)

    def test_example_is_a_plan_not_ready(self):
        validator.validate(self.data)
        with self.assertRaisesRegex(ValueError, "verified evidence"):
            validator.validate(self.data, ready=True)

    def test_ready_local_plan_with_recorded_checks(self):
        verified(self.data["integrations"][0])
        validator.validate(self.data, ready=True)

    def test_ready_requires_actual_workflow_and_scene_handoff(self):
        verified(self.data["integrations"][0])
        self.data["integrations"][0]["workflow_ref"] = None
        with self.assertRaisesRegex(ValueError, "actual workflow_ref"):
            validator.validate(self.data, ready=True)
        verified(self.data["integrations"][0])
        self.data["scenes"][0]["handoff_ref"] = None
        with self.assertRaisesRegex(ValueError, "concrete scene handoff_ref"):
            validator.validate(self.data, ready=True)

    def test_bad_timings(self):
        for value in (-1, math.nan, math.inf, True, "20"):
            with self.subTest(value=value):
                data = copy.deepcopy(self.data)
                data["scenes"][0]["duration_s"] = value
                with self.assertRaises(ValueError):
                    validator.validate(data)
        for delta in (-1, 1):
            with self.subTest(delta=delta):
                data = copy.deepcopy(self.data)
                data["scenes"][1]["start_s"] += delta
                with self.assertRaisesRegex(ValueError, "gap or overlap"):
                    validator.validate(data)

    def test_duration_mismatch(self):
        self.data["output"]["duration_s"] = 61
        with self.assertRaisesRegex(ValueError, "output duration"):
            validator.validate(self.data)

    def test_duplicate_scene_and_bad_chapter_ownership(self):
        data = copy.deepcopy(self.data)
        data["scenes"].append(copy.deepcopy(data["scenes"][0]))
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            validator.validate(data)
        self.data["chapters"][0]["scene_ids"].append("explain-01")
        with self.assertRaisesRegex(ValueError, "ownership"):
            validator.validate(self.data)

    def test_blocked_route_cannot_produce_scene(self):
        self.data["scenes"][0]["producer"] = "onetake"
        with self.assertRaisesRegex(ValueError, "producer"):
            validator.validate(self.data)

    def test_onetake_requires_commercial_evidence_when_selected(self):
        for route in self.data["integrations"]:
            if route["id"] in ("hyperframes", "onetake"):
                route["decision"] = "selected"
                verified(route)
        validator.validate(self.data)
        with self.assertRaisesRegex(ValueError, "commercial-license"):
            validator.validate(self.data, ready=True)
        self.data["integrations"][1]["commercial_license_ref"] = "test-only-license-evidence.md"
        validator.validate(self.data, ready=True)

    def test_collage_requires_creative_and_spending_records(self):
        for route in self.data["integrations"]:
            if route["id"] in ("hyperframes", "collage-broll"):
                route["decision"] = "selected"
                verified(route)
        scene = self.data["scenes"][0]
        scene["producer"] = "collage-broll"
        with self.assertRaisesRegex(ValueError, "paid generation"):
            validator.validate(self.data)
        scene["cost"].update(paid=True, provider="gemini", estimate=None)
        validator.validate(self.data)
        with self.assertRaisesRegex(ValueError, "metaphor and still"):
            validator.validate(self.data, ready=True)
        scene["approvals"] = {"metaphor_ref": "test-only-metaphor.md", "still_ref": "test-only-still.md"}
        with self.assertRaisesRegex(ValueError, "spending approval"):
            validator.validate(self.data, ready=True)
        scene["cost"].update(estimate=1, approval_ref="test-only-spend.md")
        validator.validate(self.data, ready=True)

    def test_missing_routes_and_asset_provenance(self):
        data = copy.deepcopy(self.data)
        data["integrations"].pop()
        with self.assertRaisesRegex(ValueError, "all five"):
            validator.validate(data)
        self.data["scenes"][0]["assets"] = [{"path": "example.png"}]
        with self.assertRaisesRegex(ValueError, "source, license and credit"):
            validator.validate(self.data)

    def test_accepted_scene_requires_render_and_qa_records(self):
        scene = self.data["scenes"][0]
        scene["status"] = "accepted"
        with self.assertRaisesRegex(ValueError, "fingerprint and artifacts"):
            validator.validate(self.data)
        scene.update(input_fingerprint="test-only-digest", artifacts=["test-only-scene.mp4"])
        with self.assertRaisesRegex(ValueError, "QA evidence"):
            validator.validate(self.data)
        scene["qa_ref"] = "test-only-qa.md"
        validator.validate(self.data)

    def test_malformed_input_fails_cleanly(self):
        for data in ([], {}, {"schema_version": 1}, dict(self.data, output=[]), dict(self.data, schema_version=True)):
            with self.subTest(data=data):
                with self.assertRaises(ValueError):
                    validator.validate(data)


class RegistrationTests(unittest.TestCase):
    def test_marketplace_resolves_three_skills(self):
        market = json.loads((ROOT / ".agents/plugins/marketplace.json").read_text())
        entry = market["plugins"][0]
        plugin = ROOT / entry["source"]["path"]
        manifest = json.loads((plugin / ".codex-plugin/plugin.json").read_text())
        self.assertEqual(manifest["name"], entry["name"])
        skills = plugin / manifest["skills"]
        self.assertEqual({p.parent.name for p in skills.glob("*/SKILL.md")},
                         {"music-video", "short-ex-3d", "long-ex"})
        for name in ("short-ex-3d", "long-ex"):
            self.assertTrue((skills / name / "agents/openai.yaml").is_file())

    def test_versions_agree(self):
        plugin = ROOT / "plugins/bbn-video-studio"
        claude = json.loads((plugin / ".claude-plugin/plugin.json").read_text())
        codex = json.loads((plugin / ".codex-plugin/plugin.json").read_text())
        market = json.loads((ROOT / ".claude-plugin/marketplace.json").read_text())
        self.assertEqual({claude["version"], codex["version"], market["metadata"]["version"],
                          market["plugins"][0]["version"]}, {"0.2.1"})


if __name__ == "__main__":
    unittest.main()
