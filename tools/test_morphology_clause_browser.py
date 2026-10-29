#!/usr/bin/env python3
"""Verify actual Translator UI renders indexed morphology as non-gold structural alternatives."""
from pathlib import Path
from urllib.parse import urlsplit
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
paradigms = json.loads((ROOT / "paradigms.json").read_text(encoding="utf-8"))["paradigms"]
first = paradigms["itta"]["cells"][1][0]  # exact nonpresent grammar-derived 1sg
third = paradigms["itta"]["cells"][1][2]

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1200, "height": 900})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))

    def serve(route):
        u = urlsplit(route.request.url)
        if u.hostname != "tlahtolli.test":
            route.abort()
            return
        rel = u.path.lstrip("/") or "index.html"
        file = (ROOT / rel).resolve()
        if not file.is_file() or not file.is_relative_to(ROOT.resolve()):
            route.fulfill(status=404, body="Not found")
            return
        if rel == "cloud-config.js":
            route.fulfill(status=200, content_type="text/javascript",
                          body="window.TLAHTOLLI_CLOUD_CONFIG={url:'',publishableKey:''};")
            return
        typ = {".html": "text/html", ".js": "text/javascript",
               ".json": "application/json"}.get(file.suffix, "text/plain")
        route.fulfill(status=200, body=file.read_bytes(), content_type=typ)

    page.route("**/*", serve)
    page.goto("https://tlahtolli.test/", wait_until="load")
    page.locator("#tabTranslator").click()
    page.wait_for_function(
        "() => document.querySelector('#translatorStatus')?.textContent.includes('128')"
    )
    def analyze(text):
        page.locator("#translatorInput").fill(text)
        page.locator("#translatorForm button[type=submit]").click()

    analyze(first + " in cihuātl")
    proposal = page.locator("#translatorPassages .translator-morphosyntactic-proposals")
    assert proposal.count() == 1
    proposal.evaluate("(node) => node.open=true")
    display = proposal.inner_text()
    assert "Indexed morphology + clause grammar" in display
    assert "NOT a translation" in display
    assert "grammar-generated matrix cell" in display
    assert "1sg" in display and "itta" in display
    assert "Possible noun subject: none stated" in display
    assert "possible noun object: cihuātl" in display
    assert proposal.get_by_role("link", name="Inspect indexed morphology and grammar source").count() >= 2
    assert "Outside supported clause grammar" in page.locator("#translatorPassages").inner_text()
    assert "I saw the woman" not in page.locator("#translatorPassages").inner_text()

    analyze(third + " in cihuātl")
    proposal = page.locator("#translatorPassages .translator-morphosyntactic-proposals")
    proposal.evaluate("(node) => node.open=true")
    assert proposal.locator(".translator-analysis").count() >= 2
    text = proposal.inner_text()
    assert "Possible noun subject: cihuātl" in text
    assert "possible noun object: cihuātl" in text

    # Possessor features must remain independent of the verb subject.
    analyze("niquitta nocal")
    possession = page.locator("#translatorPassages .translator-possessed-agreement-proposals")
    assert possession.count() == 1
    possession.evaluate("(node) => node.open=true")
    owner = possession.inner_text()
    assert "nominal possessor 1sg" in owner
    assert "verb subject 1sg" in owner
    assert "possible grammatical object" in owner
    assert "nocal" in owner and "calli" in owner
    assert "NOT a translation" in owner
    assert possession.get_by_role("link", name="Inspect possession and agreement source").count() >= 2
    analyze("tiquitta nocal")
    possession = page.locator("#translatorPassages .translator-possessed-agreement-proposals")
    possession.evaluate("(node) => node.open=true")
    assert "verb subject 2sg" in possession.inner_text()
    assert "nominal possessor 1sg" in possession.inner_text()
    analyze("quitta nocal")
    possession = page.locator("#translatorPassages .translator-possessed-agreement-proposals")
    possession.evaluate("(node) => node.open=true")
    ambiguous_owner = possession.inner_text()
    assert "possible grammatical object" in ambiguous_owner
    assert "possible grammatical subject" in ambiguous_owner
    for sourced, lemma in (("iicxi", "icxitl"), ("itoca", "tocaitl")):
        analyze("niquitta " + sourced)
        relation = page.locator("#translatorPassages .translator-possessed-agreement-proposals")
        assert relation.count() == 1
        relation.evaluate("(node) => node.open=true")
        assertion = relation.inner_text()
        assert "nominal possessor 3sg" in assertion and lemma in assertion
        assert "verb subject 1sg" in assertion
        assert "NOT a translation" in assertion
        analyze("tiquitta " + sourced)
        relation = page.locator("#translatorPassages .translator-possessed-agreement-proposals")
        relation.evaluate("(node) => node.open=true")
        assert "verb subject 2sg" in relation.inner_text()
        assert "nominal possessor 3sg" in relation.inner_text()
    for unsupported in ("niquitta inxiuh", "niquitta imitzcuinoan",
                        "niquitta itlatqui", "niquitta mocal",
                        "ahmo niquitta nocal", "niquitta nocal extra"):
        analyze(unsupported)
        assert page.locator("#translatorPassages .translator-possessed-agreement-proposals").count() == 0

    # Exact recorded possessive forms can head bounded in-relative hypotheses.
    for surface, lemma, owner in (("nocal", "calli", "1sg"),
                                  ("iicxi", "icxitl", "3sg"),
                                  ("itoca", "tocaitl", "3sg")):
        analyze("in " + surface + " in chōca")
        relation = page.locator("#translatorPassages .translator-relative-in-proposals")
        assert relation.count() == 1
        relation.evaluate("(node) => node.open=true")
        display = relation.inner_text()
        assert "Source-listed possessed head: " + surface in display
        assert "nominal possessor " + owner in display
        assert "NOT the finite verb subject" in display
        assert "relative subject" in display
        assert lemma in display
        assert "NOT a verified translation" in display
        assert relation.get_by_role("link", name="Inspect relative grammar evidence").count() >= 2
    analyze("niquitta in iicxi in chōca")
    relation = page.locator("#translatorPassages .translator-relative-in-proposals")
    relation.evaluate("(node) => node.open=true")
    assert "nominal possessor 3sg" in relation.inner_text()
    assert "Matrix verb niquitta" in relation.inner_text()
    for unlicensed in ("in inxiuh in chōca", "in itlatqui in chōca",
                       "in iicxi in nichōca", "in iicxi in chōca extra"):
        analyze(unlicensed)
        assert page.locator("#translatorPassages .translator-relative-in-proposals").count() == 0

    for rejected in ["ahmo " + first + " in cihuātl",
                     first + " cihuātl", first + " in cihuātl extra"]:
        analyze(rejected)
        assert page.locator(
            "#translatorPassages .translator-morphosyntactic-proposals"
        ).count() == 0, rejected

    analyze("niquitta in cihuātl")
    normal = page.locator("#translatorPassages").inner_text()
    assert "I see the woman" in normal
    assert not errors, errors
    browser.close()

print("PASS integrated browser: exact nonpresent morphology, alternative roles,")
print("     safe refusals and no invented historical English.")
