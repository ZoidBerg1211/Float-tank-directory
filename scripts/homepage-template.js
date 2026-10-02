"use strict";

const { escapeHtml } = require("./listing-template");
const { siteHeader, siteFooter, CONTAINER } = require("./site-chrome");

// One class string for the server-rendered and the JS-rendered cards so the
// two can't drift. The lift is cancelled under reduced motion (the global
// rule only shortens the transition; it would still jump).
const CARD_CLASS =
  "group block h-full min-h-20 rounded-squircle border border-border bg-surface p-5 transition-[translate,box-shadow,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-accent-tint hover:shadow-lift focus-visible:-translate-y-0.5 focus-visible:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0";

const FEATURED_COUNT = 10;

function escapeJsonForScriptTag(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

function cardHtml(l) {
  return `<li>
          <a
            href="listings/${escapeHtml(l.slug)}/"
            class="${CARD_CLASS}"
          >
            <span class="block font-display font-semibold text-ink group-hover:text-primary-dark">${escapeHtml(
              l.business_name
            )}</span>
            <span class="mt-1 block text-sm text-ink-muted">${escapeHtml(l.city)}, ${escapeHtml(l.state)}</span>
          </a>
        </li>`;
}

function renderHomepage(listings, { siteUrl }) {
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/`;
  const count = listings.length;

  // Server-rendered set: what a no-JS visitor and a crawler actually see, so
  // the ItemList below matches visible content. JS immediately re-randomizes
  // this for real visitors — see the inline script.
  const featured = listings.slice(0, FEATURED_COUNT);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: featured.map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl.replace(/\/$/, "")}/listings/${l.slug}/`,
      name: l.business_name,
    })),
  };

  // Lightweight dataset (not full listing records) for client-side search +
  // rotation, so the homepage doesn't have to server-render all 475 as
  // cards to keep search working.
  const dataset = listings.map((l) => ({
    slug: l.slug,
    business_name: l.business_name,
    city: l.city,
    state: l.state,
  }));

  const featuredHtml = featured.map(cardHtml).join("\n        ");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Float Tank Directory – Find Float Tanks Near You</title>
  <meta
    name="description"
    content="Search verified float tank studios by city, state, or name. Compare real pricing, amenities, and cleaning standards before you book."
  />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="stylesheet" href="./dist/output.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap"
    rel="stylesheet"
  />
  <script type="application/ld+json">${escapeJsonForScriptTag(jsonLd)}</script>
</head>
<body class="bg-canvas text-ink font-sans antialiased">
  ${siteHeader({ base: "./", current: "home" })}

  <main>
    <section class="relative isolate overflow-hidden border-b border-border bg-surface" aria-labelledby="hero-heading">
      <div class="relative ${CONTAINER} pt-14 pb-12 sm:pt-24 sm:pb-20">
        <!-- Decorative: a drop landing on still water. Rings are CSS-animated
             (not SMIL) so the reduced-motion block in input.css can stop them. -->
        <svg
          class="ripple pointer-events-none absolute -top-24 -right-44 -z-10 size-[26rem] sm:top-1/2 sm:-right-40 sm:size-[40rem] sm:-translate-y-1/2"
          viewBox="0 0 400 400"
          aria-hidden="true"
          focusable="false"
        >
          <circle class="ripple-ring" cx="200" cy="200" r="196" />
          <circle class="ripple-ring" cx="200" cy="200" r="196" />
          <circle class="ripple-ring" cx="200" cy="200" r="196" />
          <circle class="ripple-ring" cx="200" cy="200" r="196" />
          <circle class="ripple-drop" cx="200" cy="200" r="5" />
        </svg>
        <h1 id="hero-heading" class="max-w-xl font-display text-4xl font-semibold tracking-tight text-ink sm:text-hero">
          Find a float tank near you
        </h1>
        <p class="mt-5 max-w-lg text-lede text-ink-muted">
          Search verified studios by city, state, or name — compare real pricing, amenities, and
          cleaning standards before you book.
        </p>
        <div class="mt-8 max-w-xl">
          <label for="search" class="sr-only">Search by business, city, or state</label>
          <div class="relative">
            <svg class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-muted" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true" focusable="false">
              <circle cx="8.5" cy="8.5" r="5.75" />
              <path d="m13 13 4 4" stroke-linecap="round" />
            </svg>
            <input
              type="search"
              id="search"
              placeholder="Search by business, city, or state…"
              class="w-full rounded-2xl border border-border bg-canvas py-4 pr-4 pl-12 text-base text-ink shadow-search transition-[border-color,box-shadow] placeholder:text-ink-muted hover:border-primary/40 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
          </div>
          <p id="result-count" class="mt-3 text-sm text-ink-muted" aria-live="polite">${count} studios</p>
        </div>
      </div>
    </section>

    <div class="${CONTAINER} py-10 sm:py-14">
    <section aria-labelledby="listings-heading">
      <div class="flex items-center justify-between gap-4">
        <h2 id="listings-heading" class="font-display text-section font-semibold text-ink">Featured Studios</h2>
        <button
          type="button"
          id="rotation-toggle"
          aria-pressed="false"
          class="shrink-0 text-sm font-medium text-ink-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          Pause auto-refresh
        </button>
      </div>
      <ul id="listings-grid" role="list" class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        ${featuredHtml}
      </ul>
      <p id="no-results" class="py-6 text-center text-ink-muted" hidden>No studios match your search.</p>
    </section>
    </div>
  </main>

  ${siteFooter({ base: "./" })}

  <script type="application/json" id="listings-data">${escapeJsonForScriptTag(dataset)}</script>
  <script>
    (function () {
      var PAGE_SIZE = ${FEATURED_COUNT};
      var ROTATE_MS = 5 * 60 * 1000;

      var listings = JSON.parse(document.getElementById("listings-data").textContent);
      var grid = document.getElementById("listings-grid");
      var input = document.getElementById("search");
      var countEl = document.getElementById("result-count");
      var noResults = document.getElementById("no-results");
      var toggleBtn = document.getElementById("rotation-toggle");
      var totalLabel = listings.length + (listings.length === 1 ? " studio" : " studios");

      var order = listings.slice();
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = order[i];
        order[i] = order[j];
        order[j] = tmp;
      }
      var offset = order.length ? Math.floor(Math.random() * order.length) : 0;
      var paused = false;
      var searching = false;

      function escapeHtml(s) {
        return String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function cardHtml(item) {
        return (
          '<li><a href="listings/' +
          escapeHtml(item.slug) +
          '/" class="${CARD_CLASS}">' +
          '<span class="block font-display font-semibold text-ink group-hover:text-primary-dark">' +
          escapeHtml(item.business_name) +
          '</span><span class="mt-1 block text-sm text-ink-muted">' +
          escapeHtml(item.city) +
          ", " +
          escapeHtml(item.state) +
          "</span></a></li>"
        );
      }

      function renderWindow() {
        var slice = [];
        for (var i = 0; i < PAGE_SIZE && i < order.length; i++) {
          slice.push(order[(offset + i) % order.length]);
        }
        grid.innerHTML = slice.map(cardHtml).join("");
        countEl.textContent = totalLabel;
        noResults.hidden = true;
      }

      function renderSearch(query) {
        var q = query.toLowerCase();
        var matches = listings.filter(function (item) {
          return (item.business_name + " " + item.city + " " + item.state).toLowerCase().indexOf(q) !== -1;
        });
        grid.innerHTML = matches.map(cardHtml).join("");
        countEl.textContent = matches.length + (matches.length === 1 ? " studio" : " studios");
        noResults.hidden = matches.length !== 0;
      }

      function tick() {
        if (paused || searching) return;
        if (grid.contains(document.activeElement)) return; // don't yank focus from a card mid-tab
        offset = (offset + PAGE_SIZE) % order.length;
        renderWindow();
      }

      input.addEventListener("input", function () {
        var query = input.value.trim();
        searching = query.length > 0;
        if (searching) {
          renderSearch(query);
        } else {
          renderWindow();
        }
      });

      toggleBtn.addEventListener("click", function () {
        paused = !paused;
        toggleBtn.setAttribute("aria-pressed", String(paused));
        toggleBtn.textContent = paused ? "Resume auto-refresh" : "Pause auto-refresh";
      });

      // Replaces the server-rendered (deterministic, crawler-visible) set
      // with a randomized window so repeat/long-lived visitors don't all
      // see the same first page.
      renderWindow();
      setInterval(tick, ROTATE_MS);
    })();
  </script>
</body>
</html>
`;
}

module.exports = { renderHomepage };
