#!/usr/bin/env python3
"""Browser regression: translator is a native Tlahtōlli tab, not a separate page."""
from pathlib import Path
from urllib.parse import urlsplit
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
MIME = {".js": "text/javascript", ".json": "application/json",
        ".html": "text/html", ".css": "text/css"}
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    page = browser.new_page(accept_downloads=True, viewport={"width": 1100, "height": 850})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    def respond(route):
        url = urlsplit(route.request.url)
        if url.hostname != "tlahtolli.test":
            route.abort()
            return
        path = url.path.lstrip("/") or "index.html"
        file = ROOT / path
        if not file.is_file() or not file.resolve().is_relative_to(ROOT.resolve()):
            route.fulfill(status=404, body="Not found")
            return
        if path == "cloud-config.js":
            # Keep testing independent of real Supabase credentials and network.
            route.fulfill(status=200, content_type="text/javascript",
                          body="window.TLAHTOLLI_CLOUD_CONFIG={url:'',publishableKey:''};")
            return
        route.fulfill(status=200, body=file.read_bytes(),
                      content_type=MIME.get(file.suffix, "text/plain"))

    page.route("**/*", respond)
    page.goto("https://tlahtolli.test/", wait_until="load", timeout=30000)
    page.locator("#tabTranslator").click()
    page.wait_for_function("document.querySelector('#translatorStatus').textContent.includes('128')")
    assert page.locator("#translatorView").is_visible(), "Translator tab did not open"
    assert page.locator("#dictionaryView").is_hidden(), "Dictionary remained visible"
    assert page.locator("#tabTranslator").get_attribute("aria-selected") == "true"
    # The 1573 manuscript reading aid uses only a tiny editorial-assisted
    # excerpt. It must never claim that the low-resolution image was deciphered.
    desk=page.locator("#manuscriptReadingDesk")
    assert desk.count()==1
    desk.evaluate("(node)=>node.open=true")
    page.wait_for_function("""() => document.querySelector('#manuscriptReadingContent')
      ?.textContent.includes('ticnamaca y¯ totlal')""")
    reading=page.locator("#manuscriptReadingContent").inner_text()
    assert "NOT a decipherment" in reading
    assert "NOT independent evaluation data" in reading
    assert "abbreviation unresolved" in reading
    morph_review=page.locator("#manuscriptMorphCrosscheck")
    assert morph_review.count()==1
    morph_review.evaluate("(node)=>node.open=true")
    source_review=morph_review.inner_text()
    assert "morpheme-level claims" in source_review
    assert "ti · Verbal subject agreement" in source_review
    assert "1pl / 2sg" in source_review
    assert "y¯ · Historical scribal nasal abbreviation" in source_review
    assert "1563" in source_review
    assert "NOT been verified against a readable facsimile" in source_review
    assert morph_review.get_by_role("link",name="Open source").count()>=6

    assert page.locator("#manuscriptReadingContent").get_by_role("link",name="Open original manuscript image").count()==1
    assert page.locator("#manuscriptReadingContent").get_by_role("link",name="Read the editorial transcript on ENL").count()==1
    page.locator("#manuscriptReadingContent .translator-actions button").click()
    assert page.locator("#translatorInput").input_value()=="ticnamaca y¯ totlal"
    assert "[?ticnamaca]" in page.locator("#translatorGloss").inner_text()
    assert "[?totlal]" in page.locator("#translatorGloss").inner_text()
    # Source-level morphology is now visible inside the actual translator but
    # cannot upgrade an unknown dictionary word or a complete sentence.
    page.locator("#translatorPassages details.translator-morph-panel").evaluate_all(
        "(nodes)=>nodes.forEach(node=>node.open=true)")
    sentence=page.locator("#translatorPassages").inner_text()
    proposals=page.locator("#translatorPassages .translator-agreement-proposals")
    assert proposals.count()==1
    assert proposals.locator(".translator-analysis").count()==2
    assert "subject 1pl" in sentence and "subject 2sg" in sentence
    assert "possible direct object: y¯ totlal" in sentence
    assert "Particle: editorial nasal expansion HYPOTHESIS" in sentence
    assert "NOT a translation" in sentence
    assert proposals.get_by_role("link",name="Inspect agreement and noun evidence").count()>=4
    assert "Outside supported clause grammar" in sentence
    assert "Partial morphology only" in sentence
    assert "NOT a sentence translation" in sentence
    assert "ticnamaca" in sentence and "totlal" in sentence and "y¯" in sentence
    assert "1pl" in sentence and "2sg" in sentence
    assert "yn/in proposed, NOT source-spelled" in sentence
    assert "We are selling our land" not in sentence
    page.locator("#translatorAnalyses details.translator-morph-panel").evaluate_all(
        "(nodes)=>nodes.forEach(node=>node.open=true)")
    all_words=page.locator("#translatorAnalyses").inner_text()
    assert "namaca" in all_words and "tlalli" in all_words
    assert "Source-crosschecked token hypothesis" in all_words
    assert page.locator("#translatorAnalyses").get_by_role("link",name="Inspect independent morpheme reference").count()>0
    page.locator("#translatorInput").fill("ticnamacas yn totlalli")
    page.locator("#translatorForm button[type=submit]").click()
    changed=page.locator("#translatorAnalyses").inner_text()
    assert "Source-crosschecked token hypothesis" not in changed
    page.locator("#translatorInput").fill("ticnamaca in cihuātl")
    page.locator("#translatorForm button[type=submit]").click()
    page.locator("#translatorPassages details.translator-morph-panel").evaluate_all(
        "(nodes)=>nodes.forEach(node=>node.open=true)")
    applied=page.locator("#translatorPassages").inner_text()
    assert "possible direct object: in cihuātl" in applied
    assert "unique curated noun headword" in applied
    assert "subject 1pl" in applied and "subject 2sg" in applied
    assert "Outside supported clause grammar" in applied
    page.locator("#translatorInput").fill("ahmo ticnamaca y¯ totlal")
    page.locator("#translatorForm button[type=submit]").click()
    assert page.locator("#translatorPassages .translator-agreement-proposals").count()==0
    assert "Outside supported clause grammar" in page.locator("#translatorPassages").inner_text()
    # Source interpretation must not become a confident contextual sentence.
    assert "No automatically inferred reading here is a verified historical word" in reading
    # Personal parallel reading: NOTHING bundled or automatically aligned.
    panel=page.locator("#parallelReadingPanel")
    assert panel.count()==1
    panel.evaluate("(node)=>node.open=true")
    assert page.locator("#parallelAddPair").is_disabled()
    assert not page.locator("#parallelNahuatl").input_value()
    assert not page.locator("#parallelEnglish").input_value()
    page.locator("#parallelNahuatl").fill("ticnamaca y¯ totlal\nnoce")
    page.locator("#parallelEnglish").fill("We are selling our land\nor something else")
    page.locator("#parallelPrepare").click()
    assert page.locator("#parallelNhChoice option").count()==2
    assert page.locator("#parallelEnChoice option").count()==2
    assert page.locator("#parallelPairs article").count()==0
    assert page.locator("#parallelStatus").inner_text().find("no automatic alignment")>=0
    page.locator("#parallelNote").fill("Editorial text; phrase correspondence not verified")
    page.locator("#parallelAddPair").click()
    assert page.locator("#parallelPairs article").count()==1
    assert "User-proposed relation" in page.locator("#parallelPairs").inner_text()
    page.locator("#parallelInspect").click()
    assert page.locator("#translatorInput").input_value()=="ticnamaca y¯ totlal"
    assert "[?ticnamaca]" in page.locator("#translatorGloss").inner_text()
    with page.expect_download() as downloaded:
        page.locator("#parallelDownload").click()
    payload=json.loads(Path(downloaded.value.path()).read_text(encoding="utf-8"))
    assert payload["source_id"]=="ENL-BC16-1573"
    assert payload["alignments"][0]["nahuatl_text"]=="ticnamaca y¯ totlal"
    assert payload["alignments"][0]["status"]=="user_proposed_alignment_unverified"
    assert payload["translation_verified"] is False
    assert payload["train_eligible"] is False
    assert payload["evaluation_eligible"] is False
    assert payload["published_translation_rights"]=="not_verified"
    # Editing invalidates old alignments until the user re-prepares; no stale export.
    page.locator("#parallelEnglish").fill("some other text")
    assert page.locator("#parallelDownload").is_disabled()
    # Import the prior personal export without publishing it anywhere.
    page.once("dialog",lambda dlg:dlg.accept())
    page.locator("#parallelImport").set_input_files(downloaded.value.path())
    page.wait_for_function("""() => document.querySelector('#parallelStatus')
      ?.textContent.includes('Personal reading imported locally')""")
    assert page.locator("#parallelPairs article").count()==1
    assert page.locator("#parallelEnglish").input_value().startswith("We are selling our land")
    assert not page.locator("#parallelDownload").is_disabled()
    page.locator("#translatorInput").fill("in xōchitl in cuīcatl")
    page.locator("#translatorForm button[type=submit]").click()
    assert "[?xōchitl: multiple dictionary senses]" in page.locator("#translatorGloss").inner_text()
    assert "UNRESOLVED DICTIONARY SENSES" in page.locator("#translatorAnalyses").inner_text()
    assert "calendrical day sign" in page.locator("#translatorAnalyses").inner_text()
    assert page.locator("#translatorAnalyses .translator-word").count() == 4
    page.locator("#translatorInput").fill("iuhquin chimalli")
    page.locator("#translatorForm button[type=submit]").click()
    assert "Compositional comparison reading" in page.locator("#translatorPassages").inner_text()
    assert "like shield" in page.locator("#translatorPassages").inner_text()
    assert "not a verified passage translation" in page.locator("#translatorPassages").inner_text()
    # Independent Florentine Codex comparison fragment; generalized to other
    # curated Classical noun lexemes, never a complete finite sentence.
    page.locator("#translatorInput").fill("iuhqujn chimalli")
    page.locator("#translatorForm button[type=submit]").click()
    fragment=page.locator("#translatorPassages .translator-contextual-fragments")
    assert fragment.count()==1
    fragment.evaluate("(node)=>node.open=true")
    source_reading=fragment.inner_text()
    assert "Comparative particle + source-checked noun phrase" in source_reading
    assert "source-attested editorial comparison (not blind)" in source_reading
    assert "like / as if + [shield; metaphor for war]" in source_reading
    assert "Published contextual reading of this exact historical fragment: Like a shield." in source_reading
    assert "NOT independent held-out translation evidence" in source_reading
    assert fragment.get_by_role("link",name="Inspect comparative evidence").count()>=3
    page.locator("#translatorInput").fill("iuhquin calli")
    page.locator("#translatorForm button[type=submit]").click()
    fragment=page.locator("#translatorPassages .translator-contextual-fragments")
    assert fragment.count()==1
    fragment.evaluate("(node)=>node.open=true")
    general=fragment.inner_text()
    assert "compositional comparison hypothesis (not independently attested)" in general
    assert "like / as if + [house; building; dwelling]" in general
    assert "Published contextual reading" not in general
    assert "Outside supported clause grammar" in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorInput").fill("atl yitic nemjnj")
    page.locator("#translatorForm button[type=submit]").click()
    assert page.locator("#translatorPassages .translator-contextual-fragments").count()==0
    # Source-located relational nouns from FC Book 11 and independent ODN
    # lexical/grammatical witnesses. These remain nonfinite proposals.
    page.locator("#translatorInput").fill("atl yitic nemjnj")
    page.locator("#translatorForm button[type=submit]").click()
    locative=page.locator("#translatorPassages .translator-locative-interpretations")
    assert locative.count()==1
    locative.evaluate("(node)=>node.open=true")
    located=locative.inner_text()
    assert "Nominal location + possessed relational + unresolved agentive/verb form" in located
    assert "historical fragment (nonblind, editorially consulted)" in located
    assert "3sg possessor" in located
    assert "UNRESOLVED: agentive noun or homophonous verbal form" in located
    assert "Published contextual note for this EXACT historical fragment:" in located
    assert "NOT held-out evaluation" in located
    assert locative.get_by_role("link",name="Inspect locative evidence").count()>=4
    assert "Outside supported clause grammar" in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorInput").fill("calli itic")
    page.locator("#translatorForm button[type=submit]").click()
    locative=page.locator("#translatorPassages .translator-locative-interpretations")
    assert locative.count()==1
    locative.evaluate("(node)=>node.open=true")
    comp=locative.inner_text()
    assert "grammar-composed locative proposal (not independently attested)" in comp
    assert "inside / within / in the interior of + [house; building; dwelling]" in comp
    assert "Published contextual note" not in comp
    page.locator("#translatorInput").fill("cihuātl ītech")
    page.locator("#translatorForm button[type=submit]").click()
    locative=page.locator("#translatorPassages .translator-locative-interpretations")
    assert locative.count()==1
    locative.evaluate("(node)=>node.open=true")
    assert "on / by / in contact with / attached to / concerning / from" in locative.inner_text()
    page.locator("#translatorInput").fill("atl ytech nemjnj")
    page.locator("#translatorForm button[type=submit]").click()
    assert page.locator("#translatorPassages .translator-locative-interpretations").count()==0
    # Clause composition: finite verb + source-graded relational location,
    # optionally an overt in + object noun. No fluent invented English.
    page.locator("#translatorInput").fill("ninemi calli itic")
    page.locator("#translatorForm button[type=submit]").click()
    complex_panel=page.locator("#translatorPassages .translator-complex-clause-proposals")
    assert complex_panel.count()==1
    complex_panel.evaluate("(node)=>node.open=true")
    clause=complex_panel.inner_text()
    assert "finite verb + locative context" in clause.lower()
    assert "grammar-composed verb + relational location" in clause
    assert "subject I" in clause
    assert "Possible relational senses: inside / within / in the interior of" in clause
    assert "Every original clause token is consumed" in clause
    assert complex_panel.get_by_role("link",name="Inspect finite-locative evidence").count()>=3
    assert "Outside supported clause grammar" in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorInput").fill("niquittaz in cihuātl calli itic")
    page.locator("#translatorForm button[type=submit]").click()
    complex_panel=page.locator("#translatorPassages .translator-complex-clause-proposals")
    assert complex_panel.count()==1
    complex_panel.evaluate("(node)=>node.open=true")
    reading=complex_panel.inner_text()
    assert "overt third-person object (cihuātl)" in reading
    assert "possible clause/event location OR possible modification of the overt noun phrase" in reading
    assert "future" in reading
    assert "NOT a verified translation" in reading
    page.locator("#translatorInput").fill("quitta in cihuātl calli itic")
    page.locator("#translatorForm button[type=submit]").click()
    complex_panel=page.locator("#translatorPassages .translator-complex-clause-proposals")
    assert complex_panel.locator(".translator-analysis").count()==2
    complex_panel.evaluate("(node)=>node.open=true")
    third=complex_panel.inner_text()
    assert "subject noun cihuātl" in third
    assert "overt third-person object (cihuātl)" in third
    page.locator("#translatorInput").fill("ninemi calli itic. nichōca calli itic.")
    page.locator("#translatorForm button[type=submit]").click()
    context=page.locator("#translatorPassages .translator-context-links")
    assert context.count()==1
    context.evaluate("(node)=>node.open=true")
    linking=context.inner_text()
    assert "Clause 1 → 2" in linking
    assert "repeated written location: calli itic" in linking
    assert "NOT verified person identity" in linking
    page.locator("#translatorInput").fill("ninemi calli itic. nichōca.")
    page.locator("#translatorForm button[type=submit]").click()
    assert page.locator("#translatorPassages .translator-context-links").count()==0
    page.locator("#translatorInput").fill("ninemi atl yitic nemjnj")
    page.locator("#translatorForm button[type=submit]").click()
    assert page.locator("#translatorPassages .translator-complex-clause-proposals").count()==0
    # Relative in vs article-like in, plus non-identifying antecedent link.
    page.locator("#translatorInput").fill("in cihuātl in chōca")
    page.locator("#translatorForm button[type=submit]").click()
    relative=page.locator("#translatorPassages .translator-relative-in-proposals")
    assert relative.count()==1
    relative.evaluate("(node)=>node.open=true")
    relative_text=relative.inner_text()
    assert "relative subject" in relative_text
    assert "explicit lexical head; referent identity NOT determined" in relative_text or "does not identify a pronoun" in relative_text
    assert relative.get_by_role("link",name="Inspect relative grammar evidence").count()>=3
    assert "Outside supported clause grammar" in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorInput").fill("in cihuātl in quitta")
    page.locator("#translatorForm button[type=submit]").click()
    relative=page.locator("#translatorPassages .translator-relative-in-proposals")
    assert relative.locator(".translator-analysis").count()==2
    relative.evaluate("(node)=>node.open=true")
    assert "relative subject" in relative.inner_text()
    assert "relative object" in relative.inner_text()
    page.locator("#translatorInput").fill("niquitta in cihuātl in chōca")
    page.locator("#translatorForm button[type=submit]").click()
    relative=page.locator("#translatorPassages .translator-relative-in-proposals")
    assert relative.count()==1
    relative.evaluate("(node)=>node.open=true")
    assert "head in matrix object slot" in relative.inner_text()
    page.locator("#translatorInput").fill("nicmati in nichōca")
    page.locator("#translatorForm button[type=submit]").click()
    dependent=page.locator("#translatorPassages .translator-nominal-in-proposals")
    assert dependent.count()==1
    dependent.evaluate("(node)=>node.open=true")
    assert "possible nominalized complement or adverbial subordinate clause" in dependent.inner_text()
    assert "no clause type" in dependent.inner_text().lower()
    assert dependent.get_by_role("link",name="Inspect subordinate grammar evidence").count()>=3
    page.locator("#translatorInput").fill("chōca in cihuātl. nemi.")
    page.locator("#translatorForm button[type=submit]").click()
    antecedent=page.locator("#translatorPassages .translator-antecedent-proposals")
    assert antecedent.count()==1
    antecedent.evaluate("(node)=>node.open=true")
    antecedent_text=antecedent.inner_text()
    assert "single agreement-compatible antecedent candidate, NOT resolved reference" in antecedent_text
    assert "cihuātl" in antecedent_text
    assert "Unmentioned third-person discourse referents" in antecedent_text
    page.locator("#translatorInput").fill("quitta in cihuātl. nemi.")
    page.locator("#translatorForm button[type=submit]").click()
    assert page.locator("#translatorPassages .translator-antecedent-proposals").count()==0
    page.locator("#translatorInput").fill("niquitta in cihuātl")
    page.locator("#translatorForm button[type=submit]").click()
    assert "I see the woman" in page.locator("#translatorPassages").inner_text()
    assert page.locator("#translatorPassages .translator-relative-in-proposals").count()==0
    assert page.locator("#translatorPassages .translator-nominal-in-proposals").count()==0
    # Recursive finite in-subordination plus source-located possessed relative heads.
    page.locator("#translatorInput").fill("nicmati in quimati in chōca")
    page.locator("#translatorForm button[type=submit]").click()
    nested=page.locator("#translatorPassages .translator-nested-in-proposals")
    assert nested.count()==1
    nested.evaluate("(node)=>node.open=true")
    assert "nested in-introduced finite dependency" in nested.inner_text()
    assert "depth 2" in nested.inner_text()
    assert "Exact token coverage: 5" in nested.inner_text()
    assert "NOT a translation" in nested.inner_text()
    page.locator("#translatorInput").fill("nicmati in niquitta in iicxi in chōca")
    page.locator("#translatorForm button[type=submit]").click()
    nested=page.locator("#translatorPassages .translator-nested-in-proposals")
    assert nested.count()==1
    nested.evaluate("(node)=>node.open=true")
    nested_text=nested.inner_text()
    assert "finite complement containing a headed in-relative" in nested_text
    assert "Source-listed possessed relative head: iicxi" in nested_text
    assert "nominal possessor 3sg" in nested_text
    assert "NOT the finite verb subject" in nested_text
    assert "neither the outer matrix subject nor the inner relative subject" in nested_text
    page.locator("#translatorInput").fill("chōca in cihuātl. nemi. chōca.")
    page.locator("#translatorForm button[type=submit]").click()
    mentions=page.locator("#translatorPassages .translator-discourse-references")
    assert mentions.count()==1
    mentions.evaluate("(node)=>node.open=true")
    mention_text=mentions.inner_text()
    assert "Clause 3" in mention_text
    assert "cihuātl" in mention_text
    assert "identity NOT resolved" in mention_text
    assert "Unmentioned discourse referents" in mention_text
    # Declarative grammar now licenses overt nouns INSIDE in-subordinate clauses.
    page.locator("#translatorInput").fill("nicmati in chōca in cihuātl")
    page.locator("#translatorForm button[type=submit]").click()
    embedded=page.locator("#translatorPassages .translator-nested-in-proposals")
    assert embedded.count()==1
    embedded.evaluate("(node)=>node.open=true")
    embedded_text=embedded.inner_text()
    assert "finite clause with overt nominal argument" in embedded_text
    assert "Overt embedded subject: cihuātl" in embedded_text
    assert "Exact token coverage: 5" in embedded_text
    assert "NOT a translation" in embedded_text
    page.locator("#translatorInput").fill("nicmati in in cihuātl chōca")
    page.locator("#translatorForm button[type=submit]").click()
    embedded=page.locator("#translatorPassages .translator-nested-in-proposals")
    assert embedded.count()==1
    embedded.evaluate("(node)=>node.open=true")
    assert "Overt embedded subject: cihuātl" in embedded.inner_text()
    page.locator("#translatorInput").fill("nicmati in quitta in cihuātl")
    page.locator("#translatorForm button[type=submit]").click()
    embedded=page.locator("#translatorPassages .translator-nested-in-proposals")
    assert embedded.locator(".translator-analysis").count()==2
    embedded.evaluate("(node)=>node.open=true")
    assert "Overt embedded subject: cihuātl" in embedded.inner_text()
    assert "Overt embedded object: cihuātl" in embedded.inner_text()
    page.locator("#translatorInput").fill("nicmati in chōca nocal")
    page.locator("#translatorForm button[type=submit]").click()
    embedded=page.locator("#translatorPassages .translator-nested-in-proposals")
    assert embedded.count()==1
    embedded.evaluate("(node)=>node.open=true")
    assert "noun possessor 1sg" in embedded.inner_text()
    assert "does not establish the embedded verb subject" in embedded.inner_text()
    page.locator("#translatorInput").fill("ninemi in chōca in cihuātl")
    page.locator("#translatorForm button[type=submit]").click()
    assert page.locator("#translatorPassages .translator-nested-in-proposals").count()==0
    # Explicit Classical multi-clause markers. Never infer a single English
    # conjunction, conditional truth, or implicit reference.
    page.locator("#translatorInput").fill("ninemi auh nichōca")
    page.locator("#translatorForm button[type=submit]").click()
    syntax=page.locator("#translatorPassages .translator-multiclause-proposals")
    assert syntax.count()==1
    syntax.evaluate("(node)=>node.open=true")
    coordination=syntax.inner_text()
    assert "explicit discourse / clause coordination" in coordination
    assert "Markers: auh" in coordination
    assert "Auh marks a clause or discourse transition" in coordination
    assert "Unit 1 · ninemi" in coordination and "Unit 2 · nichōca" in coordination
    assert "Indexed person possibilities: 1sg" in coordination
    assert "NOT an independently verified translation" in coordination
    assert syntax.get_by_role("link",name="Inspect multi-clause grammar evidence").count()>=3
    page.locator("#translatorInput").fill("intla ninemi, nichōca")
    page.locator("#translatorForm button[type=submit]").click()
    syntax=page.locator("#translatorPassages .translator-multiclause-proposals")
    assert syntax.count()==1
    syntax.evaluate("(node)=>node.open=true")
    conditional=syntax.inner_text()
    assert "conditional antecedent and consequent" in conditional
    assert "conditional antecedent (mood/force NOT independently verified)" in conditional
    assert "proposed consequent (consequence type NOT independently verified)" in conditional
    assert "verb mood, type of condition" in conditional
    page.locator("#translatorInput").fill("ninemi calli itic auh nichōca calli itic")
    page.locator("#translatorForm button[type=submit]").click()
    syntax=page.locator("#translatorPassages .translator-multiclause-proposals")
    assert syntax.count()==1
    syntax.evaluate("(node)=>node.open=true")
    context=page.locator("#translatorPassages .translator-context-links")
    assert context.count()==1
    context.evaluate("(node)=>node.open=true")
    assert "repeated written location: calli itic" in context.inner_text()
    assert "finite+locative structural proposals only" in syntax.inner_text()
    page.locator("#translatorInput").fill("intla ahmo ninemi, nichōca")
    page.locator("#translatorForm button[type=submit]").click()
    assert page.locator("#translatorPassages .translator-multiclause-proposals").count()==0
    page.locator("#translatorInput").fill("ninemi ihuan nichōca")
    page.locator("#translatorForm button[type=submit]").click()
    assert page.locator("#translatorPassages .translator-multiclause-proposals").count()==0
    # The native sentence tab now reuses canonical source-located morphology:
    # source-listed finite forms can show their exact recorded glosses, but a
    # following noun does not become a magically parsed sentence.
    page.locator("#translatorInput").fill("onicoch")
    page.locator("#translatorForm button[type=submit]").click()
    finite=page.locator("#translatorPassages").inner_text()
    assert "I slept" in finite
    assert "source-listed finite-form gloss (unverified in context)" in finite
    assert "NOT a generated sentence translation" in finite
    page.locator("#translatorInput").fill("onicoch in cihuātl")
    page.locator("#translatorForm button[type=submit]").click()
    partial=page.locator("#translatorPassages").inner_text()
    assert "Outside supported clause grammar" in partial
    assert "Partial morphology only" in partial
    assert "NOT a sentence translation" in partial
    assert "I slept" not in partial
    page.locator("#translatorInput").fill("ahmo onicoch")
    page.locator("#translatorForm button[type=submit]").click()
    assert "Outside supported clause grammar" in page.locator("#translatorPassages").inner_text()
    assert "I did not sleep" not in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorInput").fill("ahmo nichōca")
    page.locator("#translatorForm button[type=submit]").click()
    assert "I do not cry" in page.locator("#translatorPassages").inner_text()
    assert "grammar-derived candidate" in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorInput").fill("ahmo niquittaz in cihuātl")
    page.locator("#translatorForm button[type=submit]").click()
    assert "I will not see the woman" in page.locator("#translatorPassages").inner_text()
    assert "future" in page.locator("#translatorPassages").inner_text()
    assert "wife (possessed)" in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorInput").fill("quitta in cihuātl in conetl")
    page.locator("#translatorForm button[type=submit]").click()
    assert "Subject/object roles remain ambiguous" in page.locator("#translatorPassages").inner_text()
    assert "The woman sees the child" in page.locator("#translatorPassages").inner_text()
    assert "The child sees the woman" in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorInput").fill("nichōca extra")
    page.locator("#translatorForm button[type=submit]").click()
    assert "no words were silently discarded" in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorExample").click()
    assert "mirror" in page.locator("#translatorPassages").inner_text().lower()
    assert "Not an approved translation training pair" in page.locator("#translatorPassages").inner_text()
    page.locator("#translatorInput").fill("zzzyxxy")
    page.locator("#translatorForm button[type=submit]").click()
    assert "Unindexed form" in page.locator("#translatorAnalyses").inner_text()
    page.locator("#translatorInput").fill("nimitzchīhua")
    page.locator("#translatorForm button[type=submit]").click()
    assert page.locator("#translatorAnalyses .translator-morph-panel").count() >= 1, "Advanced morphological proposals missing"
    assert "Tēntli morphology engine" in page.locator("#translatorMorphStatus").inner_text()
    page.locator("#translatorLukeExample").click()
    assert page.locator("#translatorOrthography").input_value() == "luke1833"
    assert "Yacuic" in page.locator("#translatorInput").input_value()
    page.locator("#codexAtlas").evaluate("(e)=>e.open=true")
    page.wait_for_function("document.querySelectorAll('#codexBookRows tr').length === 12")
    assert '291,900' in page.locator('#codexSummary').inner_text()
    page.locator("#lukeAtlas").evaluate("(e)=>e.open=true")
    page.wait_for_function("document.querySelector('#lukeSummary')?.textContent.includes('26,201')")
    assert '1833' in page.locator('#lukeAtlas').inner_text()
    page.locator('#lukeReviewLoad').click()
    page.wait_for_function("document.querySelectorAll('#lukeReviewItems .luke-review-card').length === 15")
    assert '0 mechanically joined' in page.locator('#lukeReviewCounts').inner_text()
    assert '400 unresolved' in page.locator('#lukeReviewCounts').inner_text()
    assert page.locator('#lukeVersePicker option').count() >= 700
    assert 'unverified' in page.locator('#lukeVersePreview').inner_text().lower()
    page.locator('#lukeReviewItems .luke-review-card').first.locator('button').first.click()
    assert 'Local review: accept' in page.locator('#lukeReviewItems .luke-review-card').first.inner_text()
    page.locator('#lukeReviewType').select_option('possible_spaced_word')
    assert page.locator('#lukeReviewItems .luke-review-card').count() >= 1

    page.locator("#translatorInput").fill("yhuan")
    page.locator("#translatorOrthography").select_option('luke1833')
    page.locator("#translatorForm button[type=submit]").click()
    assert 'īhuān' in page.locator('#translatorAnalyses').inner_text()
    assert '1833 Luke unverified OCR' in page.locator('#translatorAnalyses').inner_text()
    page.wait_for_function("document.querySelectorAll('#lukeChapterRows tr').length === 24")
    page.locator("#lukeChapterPicker").select_option("1")
    assert '1–80' in page.locator("#lukeChapterDetail").inner_text()
    assert 'NOT proofread' in page.locator("#lukeChapterDetail").inner_text()
    page.locator("#lukeChapterPicker").select_option("21")
    assert 'CUAITL' in page.locator("#lukeChapterDetail").inner_text()
    page.locator('#codexBookSelect').select_option('6')
    assert 'Rhetoric' in page.locator('#codexBookDetail').inner_text()
    assert 'Not' not in page.locator('#codexSummary').inner_text()

    page.locator("#tabStudy").click()
    assert page.locator("#translatorView").is_hidden()
    assert page.locator("#studyView").is_visible()
    page.locator("#tabTranslator").click()
    assert page.locator("#translatorView").is_visible()
    assert not errors, f"Unexpected browser JS errors: {errors}"
    print("PASS: integrated translator tab, lexical gloss, sourced passage, unknown-word caution and navigation")
    browser.close()
