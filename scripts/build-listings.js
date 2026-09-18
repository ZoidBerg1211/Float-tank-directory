"use strict";

const fs = require("fs");
const path = require("path");
const { renderListingPage } = require("./listing-template");

try {
  process.loadEnvFile();
} catch {
  // .env is optional locally; CI/hosts may inject real env vars directly.
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SITE_URL = process.env.SITE_URL;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_ANON_KEY. Set them in .env (see .env.example).");
  process.exit(1);
}
if (!SITE_URL) {
  console.error("Missing SITE_URL in .env (used for canonical URLs). Set it before building.");
  process.exit(1);
}

const OUT_DIR = path.join(__dirname, "..", "listings");

function slugify(str) {
  return String(str)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeUniqueSlug(row, usedSlugs) {
  const base = slugify(`${row.business_name}-${row.city}-${row.state}`) || row.id;
  let slug = base;
  let n = 2;
  while (usedSlugs.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  usedSlugs.add(slug);
  return slug;
}

async function fetchListings() {
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/listings?select=*&order=business_name.asc&limit=1000`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase fetch failed: ${res.status} ${res.statusText}\n${await res.text()}`);
  }
  return res.json();
}

async function main() {
  console.log("Fetching listings from Supabase...");
  const rows = await fetchListings();
  console.log(`Fetched ${rows.length} rows.`);
  if (rows.length !== 475) {
    console.warn(
      `WARNING: expected 475 rows (per last known public.listings count), got ${rows.length}. Continuing, but verify this is expected.`
    );
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const usedSlugs = new Set();
  const generated = [];

  for (const row of rows) {
    const slug = makeUniqueSlug(row, usedSlugs);
    const canonicalPath = `/listings/${slug}/`;
    const html = renderListingPage(row, { siteUrl: SITE_URL, canonicalPath });

    const dir = path.join(OUT_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
    generated.push({ slug, file: path.join(dir, "index.html") });
  }

  console.log(`Wrote ${generated.length} listing pages to ${OUT_DIR}`);

  // --- Verification: catch bugs across all pages, not just a hand-picked sample. ---
  let failures = 0;

  if (generated.length !== rows.length) {
    console.error(`FAIL: generated file count (${generated.length}) !== row count (${rows.length})`);
    failures++;
  }

  const forbidden = [/Not listed/, /\bnull\b/, /\bundefined\b/, /\bNaN\b/];
  for (const { slug, file } of generated) {
    const content = fs.readFileSync(file, "utf8");
    for (const pattern of forbidden) {
      if (pattern.test(content)) {
        console.error(`FAIL: ${slug} contains forbidden pattern ${pattern}`);
        failures++;
      }
    }
  }

  // JSON-LD sanity check on one generated page.
  if (generated.length > 0) {
    const sampleContent = fs.readFileSync(generated[0].file, "utf8");
    const match = sampleContent.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!match) {
      console.error(`FAIL: no JSON-LD script found in ${generated[0].slug}`);
      failures++;
    } else {
      try {
        JSON.parse(match[1]);
      } catch (e) {
        console.error(`FAIL: JSON-LD in ${generated[0].slug} did not parse: ${e.message}`);
        failures++;
      }
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} verification failure(s). See above.`);
    process.exit(1);
  }

  console.log("Verification passed: row count matches, no forbidden sentinels, JSON-LD parses.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
