/* Tlahtōlli — two-pass manuscript collation workbench.
 * No automatic transcription, AI certification, remote upload, or training approval.
 * The first and second readings are independently entered and compared literally.
 */
(function () {
  "use strict";
  const host = document.getElementById("codexDoublePassReview");
  if (!host) return;
  const STORE = "tlahtolli_codex_two_pass_v1";
  const entries = new Map();
  let work = {};
  try {
    const decoded = JSON.parse(localStorage.getItem(STORE) || "{}");
    if (decoded && typeof decoded === "object" && !Array.isArray(decoded)) work = decoded;
  } catch (err) { work = {}; }
  const elem = (tag, value, cls) => {
    const n = document.createElement(tag);
    if (value !== undefined && value !== null) n.textContent = String(value);
    if (cls) n.className = cls;
    return n;
  };
  const link = (url, title) => {
    if (!/^https:\/\//.test(url || "")) return null;
    const a = elem("a", title);
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    return a;
  };
  const styles = elem("style");
  styles.textContent = [
    ".cdp-note{font-size:.86rem;color:#566458;margin:8px 0}",
    ".cdp-alert{border:1px solid #d8b477;background:#fff6e9;padding:12px;border-radius:8px;margin:12px 0}",
    ".cdp-card{border:1px solid #d9e1d6;border-radius:10px;background:#fff;padding:14px;margin:11px 0}",
    ".cdp-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:13px;margin-top:12px}",
    ".cdp-field{display:flex;flex-direction:column;gap:5px;font-size:.84rem}",
    ".cdp-field textarea{min-height:125px;resize:vertical;white-space:pre-wrap;font-family:ui-monospace,monospace}",
    ".cdp-field input,.cdp-field textarea{width:100%;padding:9px;border:1px solid #abbdb1;border-radius:8px;background:#fff;color:#183529}",
    ".cdp-wide{grid-column:1/-1}",
    ".cdp-card button,.cdp-tools button{padding:8px 11px;border:1px solid #356b5b;background:#edf4ed;color:#204c40;border-radius:8px;cursor:pointer;margin:5px 7px 5px 0}",
    ".cdp-status{font-size:.82rem;font-weight:650;color:#604e34;white-space:pre-wrap;margin:8px 0}",
    ".cdp-compare{font-family:ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere}"
  ].join("");
  document.head.append(styles);
  function rowLabel(text, input) {
    const lab = elem("label", undefined, "cdp-field");
    lab.append(elem("strong", text), input);
    return lab;
  }
  function textfield(value, isArea) {
    const field = elem(isArea ? "textarea" : "input");
    if (!isArea) field.type = "text";
    field.value = String(value || "");
    field.spellcheck = false;
    return field;
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(work)); return true; }
    catch (err) { return false; }
  }
  const review = id => {
    const rec = work[id];
    return rec && typeof rec === "object" && !Array.isArray(rec) ? rec : {};
  };
  function classify(rec) {
    const a = rec.first || {}, b = rec.second || {};
    const evidence = Boolean((rec.exact_line_locator || "").trim() && (rec.image_region || "").trim());
    if (!a.reading || !b.reading) return { code: "incomplete", text: "Incomplete: two independent diplomatic readings have not been entered." };
    if (!a.reviewer || !b.reviewer || a.reviewer.trim().toLowerCase() === b.reviewer.trim().toLowerCase())
      return { code: "reviewers_unconfirmed", text: "Two distinct named readers are required before checking textual agreement. Identity and independence remain self-reported." };
    if (!evidence) return { code: "missing_image_locator", text: "Readings entered, but exact physical line locator and image region are missing." };
    const aa = a.reading.normalize("NFC"), bb = b.reading.normalize("NFC");
    if (aa !== bb) {
      const ac = Array.from(aa), bc = Array.from(bb);
      let offset = 0;
      while (offset < ac.length && offset < bc.length && ac[offset] === bc[offset]) offset++;
      return { code: "disagreement", text: "READINGS DISAGREE. First differing Unicode character index: " + offset + ". No reading selected automatically." };
    }
    return { code: "textual_agreement_only", text: "Both readings match character-for-character (NFC Unicode only). This is NOT verified paleography, grammar, translation, or training approval." };
  }
  function render() {
    host.replaceChildren();
    const warning = elem("p", "Evidence policy: a transcription candidate is NOT a verified manuscript line. No OCR result, model suggestion, or second reader may be silently copied into the first pass. Matching text does not establish accuracy. All exports remain train_eligible=false.", "cdp-alert");
    host.append(warning);
    const count = [...entries.keys()].filter(id => classify(review(id)).code === "textual_agreement_only").length;
    host.append(elem("p", count + " / " + entries.size + " regions have two agreeing text entries; 0 independently certified manuscript lines. Do not interpret this count as verified accuracy.", "cdp-note"));
    const actions = elem("div", undefined, "cdp-tools");
    const exportButton = elem("button", "Export all local readings as JSON"); exportButton.type = "button";
    exportButton.onclick = () => {
      const records = [...entries.values()].map(meta => {
        const draft = review(meta.id);
        return {
          region_id: meta.id, book: meta.book, folio: meta.folio, source_url: meta.source_url,
          exact_line_locator: draft.exact_line_locator || "", image_region: draft.image_region || "",
          first: draft.first || {}, second: draft.second || {},
          disagreement_notes: draft.disagreement_notes || "",
          comparison: classify(draft).code,
          facsimile_certified: false, grammar_certified: false,
          translation_certified: false, train_eligible: false
        };
      });
      const output = { format:"tlahtolli-codex-two-pass-draft", schema:1,
        disclaimer:"Local user-entered drafts; names, provenance and readings are not independently authenticated. Never a training data export.",
        gold_standard:false, train_eligible:false, records };
      const blob = new Blob([JSON.stringify(output, null, 2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = elem("a"); a.href = url; a.download = "tlahtolli-codex-double-pass-DRAFT.json"; a.hidden = true;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    };
    actions.append(exportButton);
    host.append(actions);
    for (const meta of entries.values()) {
      const draft = review(meta.id);
      const card = elem("section", undefined, "cdp-card");
      card.append(elem("h4", "Book " + meta.book + " · " + meta.folio + " · " + meta.id));
      card.append(elem("p", meta.locator + ". Earlier visual observations are hypotheses, not a transcription.", "cdp-note"));
      const source = link(meta.source_url, "Open full manuscript folio"); if (source) card.append(source);
      const fields = elem("div", undefined, "cdp-fields");
      const line = textfield(draft.exact_line_locator);
      fields.append(rowLabel("Physical handwritten line(s) — specify precise location", line));
      const region = textfield(draft.image_region);
      fields.append(rowLabel("Image crop/bounding coordinates or reproducible region locator", region));
      const aName = textfield(draft.first?.reviewer);
      const bName = textfield(draft.second?.reviewer);
      fields.append(rowLabel("First independent reader (name)", aName));
      fields.append(rowLabel("Second independent reader (name)", bName));
      const aText = textfield(draft.first?.reading, true);
      const bText = textfield(draft.second?.reading, true);
      fields.append(rowLabel("First diplomatic reading (preserve line breaks and doubtful glyphs)", aText));
      fields.append(rowLabel("Second diplomatic reading (entered independently, NOT copied)", bText));
      const aNotes = textfield(draft.first?.uncertainties, true);
      const bNotes = textfield(draft.second?.uncertainties, true);
      fields.append(rowLabel("First pass uncertain characters and reasoning", aNotes));
      fields.append(rowLabel("Second pass uncertain characters and reasoning", bNotes));
      const diff = textfield(draft.disagreement_notes, true);
      const wide = rowLabel("Disagreement log / editor adjudication pending", diff);
      wide.classList.add("cdp-wide"); fields.append(wide);
      card.append(fields);
      const status = elem("p", classify(draft).text, "cdp-status");
      const button = elem("button", "Save local draft and compare readings"); button.type = "button";
      button.onclick = () => {
        const rec = { exact_line_locator:line.value, image_region:region.value,
          first:{reviewer:aName.value,reading:aText.value,uncertainties:aNotes.value},
          second:{reviewer:bName.value,reading:bText.value,uncertainties:bNotes.value},
          disagreement_notes:diff.value };
        work[meta.id] = rec;
        const saved = save(), result = classify(rec);
        status.textContent = result.text + (saved ? " Saved locally." : " Browser storage unavailable; export manually.");
        status.dataset.verdict = result.code;
        host.querySelector(".cdp-note").textContent = [...entries.keys()].filter(id => classify(review(id)).code === "textual_agreement_only").length + " / " + entries.size + " agreeing draft regions; zero certified lines.";
      };
      card.append(button, status);
      host.append(card);
    }
  }
  fetch("./research/florentine_codex/folio_visual_collation.json", {cache:"no-store"})
    .then(res => { if(!res.ok) throw Error("HTTP " + res.status); return res.json(); })
    .then(data => {
      if (data.format !== "tlahtolli-manuscript-visual-collation" || data.gold_standard !== false || data.train_eligible !== false)
        throw Error("Unrecognized evidence format");
      for (const folio of data.folios || []) for (const region of folio.regions || []) {
        if (entries.has(region.id)) throw Error("Duplicate region ID");
        entries.set(region.id,{id:region.id, book:folio.book, folio:folio.folio, locator:region.locator, source_url:folio.source_url});
      }
      if (!entries.size) throw Error("No bounded manuscript regions provided");
      render();
    })
    .catch(err => { host.replaceChildren(elem("p", "Double-pass workbench unavailable: " + err.message)); });
})();
