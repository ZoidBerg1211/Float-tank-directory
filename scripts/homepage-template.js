"use strict";

const { escapeHtml } = require("./listing-template");

function renderHomepage(listings, { siteUrl }) {
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/`;
  const count = listings.length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: listings.map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl.replace(/\/$/, "")}/listings/${l.slug}/`,
      name: l.business_name,
    })),
  };

  const items = listings
    .map((l) => {
      const searchKey = `${l.business_name} ${l.city} ${l.state}`.toLowerCase();
      return `<li data-search="${escapeHtml(searchKey)}" class="border-b border-border py-3">
          <a href="listings/${escapeHtml(l.slug)}/" class="font-medium text-primary hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-primary">${escapeHtml(
        l.business_name
      )}</a>
          <span class="block text-sm text-ink-muted">${escapeHtml(l.city)}, ${escapeHtml(l.state)}</span>
        </li>`;
    })
    .join("\n        ");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Float Tank Directory \u2013 Find Float Tanks Near You</title>
  <meta
    name="description"
    content="Search ${count} verified float tank studios by city, state, or name. Compare real pricing, amenities, and cleaning standards before you book."
  />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="stylesheet" href="./dist/output.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap"
    rel="stylesheet"
  />
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
</head>
<body class="bg-canvas text-ink font-sans antialiased">
  <header class="border-b border-border">
    <div class="mx-auto max-w-3xl px-4 py-4">
      <span class="font-display text-lg font-semibold text-primary">Float Tank Directory</span>
    </div>
  </header>

  <main class="mx-auto max-w-3xl px-4 py-8 sm:py-12">
    <section class="text-center sm:text-left">
      <h1 class="font-display text-3xl font-semibold text-ink sm:text-4xl">Find a Float Tank Near You</h1>
      <p class="mt-3 text-ink-muted">
        Search ${count} verified studios by city, state, or name — compare real pricing, amenities, and
        cleaning standards before you book.
      </p>
      <div class="mt-6">
        <label for="search" class="sr-only">Search by business, city, or state</label>
        <input
          type="search"
          id="search"
          placeholder="Search by business, city, or state\u2026"
          class="w-full rounded-lg border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-primary"
        />
        <p id="result-count" class="mt-2 text-sm text-ink-muted" aria-live="polite">${count} studios</p>
      </div>
    </section>

    <section class="mt-8" aria-labelledby="listings-heading">
      <h2 id="listings-heading" class="sr-only">All Listings</h2>
      <ul id="listings-list" role="list">
        ${items}
      </ul>
      <p id="no-results" class="py-6 text-center text-ink-muted" hidden>No studios match your search.</p>
    </section>
  </main>

  <footer class="mt-12 border-t border-border">
    <div class="mx-auto max-w-3xl px-4 py-6 text-sm text-ink-muted">Float Tank Directory</div>
  </footer>

  <script>
    (function () {
      var input = document.getElementById("search");
      var items = Array.prototype.slice.call(document.querySelectorAll("#listings-list li"));
      var countEl = document.getElementById("result-count");
      var noResults = document.getElementById("no-results");

      input.addEventListener("input", function () {
        var query = input.value.trim().toLowerCase();
        var visible = 0;
        items.forEach(function (li) {
          var match = !query || li.getAttribute("data-search").indexOf(query) !== -1;
          li.hidden = !match;
          if (match) visible++;
        });
        countEl.textContent = visible + (visible === 1 ? " studio" : " studios");
        noResults.hidden = visible !== 0;
      });
    })();
  </script>
</body>
</html>
`;
}

module.exports = { renderHomepage };
