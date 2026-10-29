"""Check real English location choices without external network dependencies."""
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
    analyze("niquitta in cihuātl in calli itic")
    assert output.inner_text() == "Inside the house, I see the woman."
    page.get_by_role("combobox", name="Clause 1 English reading", exact=True).select_option(
        label="I see the woman inside the house — Describes the object: inside")
    assert output.inner_text() == "I see the woman inside the house."
    panel = page.locator(".translator-composed-english")
    assert "relational possessor" in panel.inner_text()
    panel.locator("summary").click()
    assert "wife" in panel.inner_text() and "dwelling" in panel.inner_text()
    assert panel.locator("a[href='https://nahuatl.wired-humanities.org/content/itic']").count() == 1
    analyze("quitta in cihuātl in calli itic")
    page.get_by_role("combobox", name="Clause 1 English reading", exact=True).select_option(
        label="The woman inside the house sees him / her / it — Describes the subject: inside")
    assert output.inner_text() == "The woman inside the house sees him / her / it."
    analyze("ahmo nichōca in calli itic auh nitlacua")
    page.get_by_role("combobox", name="Connector 1 English reading", exact=True).select_option(label="and")
    assert output.inner_text() == "Inside the house, I do not cry, and I eat."
    assert "house" not in page.get_by_role("combobox", name="Clause 2 English reading", exact=True).inner_text()
    analyze("nichōca in calli ītech")
    page.get_by_role("combobox", name="Clause 1 English reading", exact=True).select_option(
        label="By the house, I cry — Event relation: by")
    assert output.inner_text() == "By the house, I cry."
    for text in ["nichōca in calli itic xyzzy", "nichōca in calli itic in ātl itic"]:
        analyze(text)
        assert output.count() == 0
    assert not errors, errors
    browser.close()
print("Location English browser attachment, senses, source display and clause-context regressions passed.")
