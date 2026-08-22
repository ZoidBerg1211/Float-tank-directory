# Lessons Learned

Durable record of recurring mistake patterns and their fixes, imported into CLAUDE.md. This survives across machines and sessions (unlike auto memory, which is local to one repo on one machine). Keep entries short — the pattern, not the full story. Prune entries that no longer apply.

## Format
- **Date:**
- **Mistake:**
- **Fix:**
- **Rule going forward:**

---

### Example entry (replace/delete once real entries exist)
- **Date:** 2026-08-22
- **Mistake:** Assumed a listing's phone number was correct without cross-checking the enrichment source, and it was outdated.
- **Fix:** Verified against the business's current site and updated.
- **Rule going forward:** Never write a phone/address/hours field without noting the source it came from in the same commit.
