#!/usr/bin/env python3
"""Historical research hybrid must never output raw 'nca' as an English translation."""
import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from neural.hybrid_infer import canonical_candidates,infer_hybrid

class TestCanonicalNeuralBridge(unittest.TestCase):
    def test_eight_constructed_grammar_controls(self):
        examples=[
            ("nichōca","I cry."),
            ("nitlacua","I eat."),
            ("niquitta in cihuātl","I see the woman."),
            ("ahmo niquittaz in cihuātl","I will not see the woman."),
            ("niquitta in cihuātl in chōca","I see the woman that cries."),
            ("chōca in cihuātl","The woman cries."),
            ("nichōca auh nitlacua","I cry. I eat."),
            ("chōca in cihuātl. chōca","The woman cries. He / she / it cries."),
        ]
        for text,expected in examples:
            with self.subTest(text=text):
                response=infer_hybrid(text)
                self.assertEqual(response["status"],"candidates")
                self.assertEqual(response["english"],expected)
                self.assertFalse(response["neural_free_generation_used"])
                self.assertFalse(response["translation_is_human_verified"])
                self.assertEqual(response["neural"]["status"],"not_requested")
    def test_abstention_never_contains_raw_hallucination(self):
        for sample in ("xyzzy","asfdghjk xyzwe","nichōca auh xyzzy",
                       "nca","niquitta xyzzy","intla nichōca; nitlacua."):
            with self.subTest(sample=sample):
                output=infer_hybrid(sample)
                self.assertIsNone(output["english"])
                self.assertEqual(output["status"],"abstain")
                self.assertEqual(output["neural"]["status"],"not_scored_unsupported_grammar")
    def test_experimental_rank_requires_model(self):
        with self.assertRaises(ValueError):
            infer_hybrid("nichōca",selection="experimental-neural-ranked")
    def test_canonical_evidence_invariants(self):
        a=canonical_candidates("nichōca")
        self.assertEqual(a["candidates"][0]["english"],"I cry.")
        self.assertIn("I weep.",[x["english"] for x in a["candidates"]])
        self.assertFalse(a["verified_translation"])
        self.assertTrue(all(x["source_urls"] for x in a["candidates"]))
    def test_input_boundaries(self):
        with self.assertRaises(ValueError):
            infer_hybrid("")
        with self.assertRaises(ValueError):
            infer_hybrid("x"*7001)
        with self.assertRaises(ValueError):
            canonical_candidates("nichōca",max_candidates=500)

if __name__=="__main__":
    unittest.main()
