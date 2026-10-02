# Lessons Learned

Durable record of recurring mistake patterns and their fixes, imported into CLAUDE.md. This survives across machines and sessions (unlike auto memory, which is local to one repo on one machine). Keep entries short — the pattern, not the full story. Prune entries that no longer apply.

## Format
- **Date:**
- **Mistake:**
- **Fix:**
- **Rule going forward:**

---

### `text-primary` on a tinted background fails contrast
- **Date:** 2026-10-01
- **Mistake:** Used `text-primary` (#0077c2) for small text on `bg-accent-tint` (#e3f2fc) — 4.16:1 — and on `bg-surface` (#f4f8fc) — 4.45:1. Both are under AA 4.5:1 for normal text. Happened three times (homepage card hover, result-card hover over a highlighted card, extras-toggle hover) because each looked fine by eye.
- **Fix:** Switched those to `text-primary-dark` (#005a94) — 6.36:1 on the tint.
- **Rule going forward:** `text-primary` is only for text on `bg-canvas` (4.75:1). On `surface` or `accent-tint`, use `text-primary-dark`. Check hover states too — a hover that tints the background changes the pair.

### Arbitrary values slip in right after tokens exist
- **Date:** 2026-10-01
- **Mistake:** Wrote `shadow-[...rgb(0_119_194/...)]` and `text-[0.9375rem]` straight into markup, against the "define colors and type once in `@theme`" rule, in the same session the matching tokens were being added.
- **Fix:** Moved them to `--shadow-search` and `--text-brand` in `src/styles/input.css`.
- **Rule going forward:** Before finishing, grep templates for `-[` arbitrary values that carry a color or a font size; those belong in `@theme`.
