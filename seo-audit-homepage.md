# On-Page SEO Audit — Homepage

**URL:** `/` (pre-launch; `SITE_URL` still a localhost placeholder)
**Primary target query:** `float tank near me`
**Role:** navigational/commercial directory homepage
**Date:** 2026-09-18

## Scores

| Dimension | Score | Note |
|---|---|---|
| Title tag | Pass | 48 chars, unique, primary query near front |
| Meta description | **Fail** | 149 chars (fine length) but stacks 3 target phrases into one sentence |
| Header structure | Pass | One H1, one (visually hidden) H2 — fine for this page's simple structure |
| Body content | **Fail** | Hero subhead stacks the same 3 phrases the meta description does |
| Internal links | Pass | 475 descriptive-anchor links to every listing page |
| Images/media | N/A | No images on site yet (licensing not cleared) |
| URL slug | N/A | Homepage is `/` |
| On-page schema | Pass | Valid `ItemList` JSON-LD, matches visible content |

## Critical fixes

**1. Meta description stacks 3 target phrases in one sentence.**
Current: *"Browse 475 float tank studios across the U.S. offering sensory deprivation (REST) and zero-gravity float therapy. Search by business, city, or state."*
This reads as a keyword checklist, not ad copy that earns a click, and it doesn't restate the actual differentiator of this directory (that listings carry real pricing/amenities/cleaning data other directories don't).

**2. Hero subhead repeats the same pattern right under an H1 that already says "Float Tank."**
Current: *"Browse verified float tank studios offering sensory deprivation (REST) and zero-gravity float therapy across the U.S."*
Restating "float tank" here is redundant with the H1 one line above, and the sentence exists to hold keywords rather than tell the visitor something new.

## Fix applied

Rewrote both to carry one idea each, built from what's actually true about the site (475 real listings, per-listing pricing/amenities/cleaning data) instead of restating keyword phrases:

- **Meta description:** "Search 475 verified float tank studios by city, state, or name. Compare real pricing, amenities, and cleaning standards before you book."
- **Hero subhead:** "Search 475 verified studios by city, state, or name — compare real pricing, amenities, and cleaning standards before you book."

Title tag and H1 were left as-is (both already Pass, both already carry "float tank" + "near you" naturally, no duplication issue on their own).

## Nice-to-have (not applied, flagged for later)

"Zero-gravity float" and "REST / sensory deprivation" (2 of CLAUDE.md's 4 target phrases) currently appear nowhere on the site after this fix, since forcing them into the homepage hero is what caused the stuffing in the first place. The honest fix isn't to relocate the stuffing elsewhere — it's real educational content. An About/FAQ page ("What is float therapy?", "What is sensory deprivation (REST)?", "What does zero-gravity floating mean?") would let those terms appear naturally, repeatedly, in real explanatory prose, which is both better UX and a stronger AEO signal than a synonym-dense tagline. Not building this now — flagging it as the natural next home for those two keywords.
