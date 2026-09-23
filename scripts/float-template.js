"use strict";

const { escapeHtml, toNumber } = require("./listing-template");

function escapeJsonForScriptTag(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

function renderFloatPage(listings, { siteUrl }) {
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/float/`;

  const geoData = listings
    .map((l) => {
      const lat = toNumber(l.latitude);
      const lng = toNumber(l.longitude);
      if (lat == null || lng == null) return null;
      return {
        slug: l.slug,
        name: l.business_name,
        city: l.city,
        state: l.state,
        zip: l.zip_code || "",
        lat,
        lng,
      };
    })
    .filter(Boolean);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Find a Float Near You – Float Tank Directory</title>
  <meta
    name="description"
    content="Search float tank studios by city, state, or zip and see them plotted on a map."
  />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="stylesheet" href="../dist/output.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap"
    rel="stylesheet"
  />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
</head>
<body class="bg-canvas text-ink font-sans antialiased">
  <header class="border-b border-border">
    <div class="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-4">
      <a href="../" class="font-display text-base font-semibold text-primary sm:text-lg">Float Tank Directory</a>
      <nav class="flex items-center gap-2 sm:gap-6" aria-label="Primary">
        <a
          href="../"
          class="text-sm font-medium text-ink-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          >Home</a
        >
        <a
          href="../about/"
          class="text-sm font-medium text-ink-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          >About</a
        >
        <a
          href="./"
          class="text-sm font-medium text-ink-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          aria-current="page"
          >Find a Float</a
        >
      </nav>
    </div>
  </header>

  <main class="mx-auto max-w-3xl px-4 py-8 sm:py-12">
    <h1 class="font-display text-3xl font-semibold text-ink sm:text-4xl">Find a Float Near You</h1>

    <div class="mt-6">
      <label for="search" class="sr-only">Search by city, state, or zip</label>
      <input
        type="search"
        id="search"
        placeholder="Search by city, state, or zip…"
        class="w-full rounded-lg border border-border bg-surface px-4 py-3 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-primary"
      />
    </div>

    <section class="mt-6" aria-labelledby="map-heading">
      <h2 id="map-heading" class="sr-only">Map</h2>
      <div id="map" class="h-80 w-full rounded-lg border border-border sm:h-96"></div>
    </section>

    <section class="mt-6" aria-labelledby="results-heading">
      <h2 id="results-heading" class="sr-only">Results</h2>
      <div id="results" role="list">
        <p id="results-prompt" class="py-6 text-center text-ink-muted">
          Search by city, state, or zip to see float studios near you.
        </p>
      </div>
    </section>
  </main>

  <footer class="mt-12 border-t border-border">
    <div class="mx-auto max-w-3xl px-4 py-6 text-sm text-ink-muted">
      <a href="../" class="text-primary hover:text-primary-dark">Back to directory</a>
    </div>
  </footer>

  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <script type="application/json" id="listings-geo">${escapeJsonForScriptTag(geoData)}</script>
  <script>
    (function () {
      var LISTINGS = JSON.parse(document.getElementById("listings-geo").textContent);

      // Normalize US state input to a canonical 2-letter code, whichever
      // form (abbreviation or full name) the row or the query happens to
      // use — public.listings has a genuine mix of both (2026-09-18).
      var STATE_TO_ABBR = {
        alabama: "al", alaska: "ak", arizona: "az", arkansas: "ar", california: "ca",
        colorado: "co", connecticut: "ct", delaware: "de", florida: "fl", georgia: "ga",
        hawaii: "hi", idaho: "id", illinois: "il", indiana: "in", iowa: "ia",
        kansas: "ks", kentucky: "ky", louisiana: "la", maine: "me", maryland: "md",
        massachusetts: "ma", michigan: "mi", minnesota: "mn", mississippi: "ms", missouri: "mo",
        montana: "mt", nebraska: "ne", nevada: "nv", "new hampshire": "nh", "new jersey": "nj",
        "new mexico": "nm", "new york": "ny", "north carolina": "nc", "north dakota": "nd", ohio: "oh",
        oklahoma: "ok", oregon: "or", pennsylvania: "pa", "rhode island": "ri", "south carolina": "sc",
        "south dakota": "sd", tennessee: "tn", texas: "tx", utah: "ut", vermont: "vt",
        virginia: "va", washington: "wa", "west virginia": "wv", wisconsin: "wi", wyoming: "wy",
        "district of columbia": "dc",
      };
      function normalizeState(s) {
        var v = String(s || "").trim().toLowerCase();
        if (!v) return "";
        if (v.length === 2) return v;
        return STATE_TO_ABBR[v] || v;
      }
      LISTINGS.forEach(function (l) {
        l._stateAbbr = normalizeState(l.state);
      });

      var map = L.map("map").setView([39.8, -98.6], 4);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      var markersBySlug = {};
      var currentMarkers = [];

      function clearMarkers() {
        currentMarkers.forEach(function (m) {
          map.removeLayer(m);
        });
        currentMarkers = [];
        markersBySlug = {};
      }

      function clearHighlight() {
        var prev = document.querySelector('[data-result-card].is-highlighted');
        if (prev) prev.classList.remove("is-highlighted", "ring-2", "ring-primary", "bg-accent-tint");
      }

      function highlightResult(slug) {
        clearHighlight();
        var card = document.querySelector('[data-result-card="' + CSS.escape(slug) + '"]');
        if (card) {
          card.classList.add("is-highlighted", "ring-2", "ring-primary", "bg-accent-tint");
          card.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      function makeResultCard(listing) {
        var li = document.createElement("li");
        li.setAttribute("data-result-card", listing.slug);
        li.className =
          "rounded-lg border border-border p-3 transition-colors";

        var a = document.createElement("a");
        a.href = "../listings/" + listing.slug + "/";
        a.className =
          "font-medium text-primary hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-primary";
        a.textContent = listing.name;
        li.appendChild(a);

        var span = document.createElement("span");
        span.className = "block text-sm text-ink-muted";
        span.textContent = listing.city + ", " + listing.state + " " + listing.zip;
        li.appendChild(span);

        return li;
      }

      function renderResults(matches) {
        var container = document.getElementById("results");
        container.innerHTML = "";

        if (matches.length === 0) {
          var p = document.createElement("p");
          p.className = "py-6 text-center text-ink-muted";
          p.textContent = "No float studios match that search.";
          container.appendChild(p);
          return;
        }

        var ul = document.createElement("ul");
        ul.className = "space-y-3";
        ul.setAttribute("role", "list");
        matches.forEach(function (l) {
          ul.appendChild(makeResultCard(l));
        });
        container.appendChild(ul);
      }

      function renderMarkers(matches) {
        clearMarkers();
        matches.forEach(function (l) {
          var marker = L.marker([l.lat, l.lng]).addTo(map);
          marker.on("click", function () {
            highlightResult(l.slug);
          });
          markersBySlug[l.slug] = marker;
          currentMarkers.push(marker);
        });

        if (matches.length > 1) {
          var group = L.featureGroup(currentMarkers);
          map.fitBounds(group.getBounds().pad(0.2));
        } else if (matches.length === 1) {
          map.setView([matches[0].lat, matches[0].lng], 12);
        } else {
          map.setView([39.8, -98.6], 4);
        }
      }

      function runSearch(query) {
        var q = query.trim().toLowerCase();
        var promptEl = document.getElementById("results-prompt");

        if (q.length < 2) {
          document.getElementById("results").innerHTML = "";
          document.getElementById("results").appendChild(promptEl);
          clearMarkers();
          map.setView([39.8, -98.6], 4);
          return;
        }

        var isZipQuery = /^\\d+$/.test(q);
        var qStateAbbr = normalizeState(q);

        var matches = LISTINGS.filter(function (l) {
          if (isZipQuery) return l.zip.indexOf(q) === 0;
          var cityMatch = l.city.toLowerCase().indexOf(q) !== -1;
          var stateMatch = l._stateAbbr === qStateAbbr && qStateAbbr.length === 2;
          return cityMatch || stateMatch;
        });

        renderResults(matches);
        renderMarkers(matches);
      }

      var debounceTimer = null;
      document.getElementById("search").addEventListener("input", function (e) {
        var value = e.target.value;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          runSearch(value);
        }, 300);
      });
    })();
  </script>
</body>
</html>
`;
}

module.exports = { renderFloatPage };
