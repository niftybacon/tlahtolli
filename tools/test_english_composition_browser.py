"""Exercise English choices in the real app, including escaping and failure isolation."""
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
MIME = {".js": "text/javascript", ".json": "application/json",
        ".html": "text/html", ".css": "text/css"}
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
    page = browser.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    def respond(route):
        url = urlsplit(route.request.url)
        file = ROOT / (url.path.lstrip("/") or "index.html")
        if url.hostname != "tlahtolli.test" or not file.is_file() or not file.resolve().is_relative_to(ROOT.resolve()):
            route.fulfill(status=404, body="Not found")
        elif file.name == "cloud-config.js":
            route.fulfill(content_type="text/javascript",
                          body="window.TLAHTOLLI_CLOUD_CONFIG={url:'',publishableKey:''};")
        else:
            route.fulfill(body=file.read_bytes(), content_type=MIME.get(file.suffix, "text/plain"))

    page.route("**/*", respond)
    page.goto("https://tlahtolli.test/", wait_until="load")
    page.locator("#tabTranslator").click()
    page.wait_for_function("document.querySelector('#translatorStatus').textContent.includes('headwords')")

    def analyze(text):
        page.locator("#translatorInput").fill(text)
        page.locator("#translatorForm button[type=submit]").click()

    output = page.locator(".translator-english-output")
    analyze("niquitta in cihuātl in chōca")
    assert output.inner_text() == "I see the woman that cries."
    assert "Grammar-graph evidence:" in page.locator(".translator-composed-english").inner_text()
    assert "relative role alternatives cross-checked" in page.locator(".translator-composed-english").inner_text()
    page.get_by_role("combobox", name="Clause 1 English reading", exact=True).select_option(label="I inspect the woman that cries")
    assert output.inner_text() == "I inspect the woman that cries."
    panel = page.locator(".translator-composed-english")
    panel.locator("summary").click()
    details = panel.locator("details")
    print("EVIDENCE PANEL DIAGNOSTIC", repr(details.evaluate(
        """d => ({open:d.open, html:d.innerHTML.slice(0,2000), text:d.textContent.slice(0,800),
        links:[...d.querySelectorAll('a')].map(a=>({text:a.textContent,href:a.href}))})""")), flush=True)
    assert "wife" in panel.inner_text()
    assert panel.get_by_role("link", name="Inspect composition evidence").count() > 0
    analyze("nichōca auh ahmo niquittaz in cihuātl auh nitlacua")
    assert output.inner_text() == "I cry. I will not see the woman. I eat."
    page.get_by_role("combobox", name="Connector 1 English reading", exact=True).select_option(label="and")
    page.get_by_role("combobox", name="Connector 2 English reading", exact=True).select_option(label="but")
    assert output.inner_text() == "I cry, and I will not see the woman, but I eat."
    analyze("quitta in cihuātl in conetl")
    page.get_by_role("combobox", name="Clause 1 English reading", exact=True).select_option(label="The child sees the woman")
    assert output.inner_text() == "The child sees the woman."
    analyze("quitta in cihuātl in quitta")
    choices = page.get_by_role("combobox", name="Clause 1 English reading", exact=True)
    options = choices.locator("option").all_inner_texts()
    assert any("that sees" in option for option in options)
    assert any("that he / she / it sees" in option for option in options)
    assert "Grammar-graph evidence:" in page.locator(".translator-composed-english").inner_text()
    analyze("nichōca in calli itic")
    assert output.inner_text() == "Inside the house, I cry."
    assert "location alternatives retained" in page.locator(".translator-composed-english").inner_text()
    analyze("niquitta in cihuātl in chōca auh nichōca in calli itic. ahmo nitlacuāz auh ninemi.")
    assert output.inner_text() == "I see the woman that cries. Inside the house, I cry. I will not eat. I live."
    page.get_by_role("combobox", name="Connector 3 English reading", exact=True).select_option(label="but")
    assert output.inner_text().endswith("I will not eat, but I live.")
    assert page.get_by_role("combobox", name="Connector 2 English reading", exact=True).count() == 0
    assert "Runtime unversioned" not in page.locator("#translatorStatus").inner_text()
    assert "Runtime " in page.locator("#translatorStatus").inner_text()
    for name in ["translator-sentence.js", "translator-english.js"]:
        assert page.locator(f'script[src^="./{name}?v="]').count() == 1
    analyze("nichōca auh nitlacua.")
    assert output.inner_text() == "I cry. I eat."
    analyze("nichōca auh nitlacua. xyzzy.")
    assert output.count() == 0
    analyze("nichōca. xyzzy. nitlacua")
    assert output.count() == 0, "Unsupported middle unit must not disappear from the passage"
    analyze("nichōca <img src=x onerror=alert(1)>")
    assert output.count() == 0
    assert page.locator("#translatorPassages img").count() == 0
    # Failure of the optional renderer must leave existing sentence analysis usable.
    page.route("**/translator-english.js*", lambda route: route.fulfill(status=404, body="Not found"))
    page.reload(wait_until="load")
    page.locator("#tabTranslator").click()
    page.wait_for_function("document.querySelector('#translatorStatus').textContent.includes('headwords')")
    analyze("ahmo niquittaz in cihuātl")
    assert output.count() == 0
    assert "I will not see the woman" in page.locator("#translatorPassages").inner_text()
    assert not errors, errors
    browser.close()
print("English composition browser choices, provenance, unsupported units and failure isolation passed.")
