"use strict";

const { escapeHtml, toNumber } = require("./listing-template");
const { siteHeader, siteFooter, CONTAINER } = require("./site-chrome");

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
  ${siteHeader({ base: "../", current: "float" })}

  <main class="${CONTAINER} py-10 sm:py-14">
    <h1 class="font-display text-3xl font-semibold tracking-tight text-ink sm:text-page">Find a float near you</h1>

    <div class="mt-6 max-w-xl">
      <label for="search" class="sr-only">Search by city, state, or zip</label>
      <div class="relative">
        <svg class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-muted" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true" focusable="false">
          <circle cx="8.5" cy="8.5" r="5.75" />
          <path d="m13 13 4 4" stroke-linecap="round" />
        </svg>
        <input
          type="search"
          id="search"
          placeholder="Search by city, state, or zip…"
          class="w-full rounded-2xl border border-border bg-canvas py-4 pr-4 pl-12 text-base text-ink shadow-search transition-[border-color,box-shadow] placeholder:text-ink-muted hover:border-primary/40 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      </div>
      <p id="results-count" class="mt-3 min-h-5 text-sm text-ink-muted" aria-live="polite"></p>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-8">
      <section class="lg:col-start-2 lg:row-start-1" aria-labelledby="map-heading">
        <h2 id="map-heading" class="sr-only">Map</h2>
        <div id="map" class="isolate h-80 w-full overflow-hidden rounded-2xl border border-border sm:h-96 lg:sticky lg:top-24 lg:h-[calc(100dvh-8rem)] lg:max-h-[44rem]"></div>
      </section>

      <section class="lg:col-start-1 lg:row-start-1" aria-labelledby="results-heading">
        <h2 id="results-heading" class="sr-only">Results</h2>
        <div id="results">
          <p id="results-prompt" class="rounded-2xl bg-surface px-5 py-8 text-center text-ink-muted">
            Search by city, state, or zip to see float studios near you.
          </p>
        </div>
      </section>
    </div>
  </main>

  ${siteFooter({ base: "../" })}

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
      var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      function pinIcon() {
        return L.divIcon({ className: "", html: '<span class="map-pin"></span>', iconSize: [20, 20], iconAnchor: [10, 10] });
      }

      // Display-only: show the 2-letter code whichever form the row stores.
      function displayState(l) {
        return l._stateAbbr.length === 2 ? l._stateAbbr.toUpperCase() : l.state;
      }

      // Card -> pin half of the two-way highlight.
      var activeSlug = "";
      function setActivePin(slug) {
        var prev = markersBySlug[activeSlug];
        if (prev && prev.getElement()) {
          prev.getElement().firstChild.classList.remove("is-active");
          prev.setZIndexOffset(0);
        }
        activeSlug = slug || "";
        var next = markersBySlug[activeSlug];
        if (next && next.getElement()) {
          next.getElement().firstChild.classList.add("is-active");
          next.setZIndexOffset(1000);
        }
      }

      function clearMarkers() {
        activeSlug = "";
        currentMarkers.forEach(function (m) {
          map.removeLayer(m);
        });
        currentMarkers = [];
        markersBySlug = {};
      }

      // Pin -> card half of the two-way highlight.
      function clearHighlight() {
        var prev = document.querySelector("[data-result-card].is-highlighted");
        if (prev) prev.classList.remove("is-highlighted", "border-primary", "bg-accent-tint");
      }

      function highlightResult(slug) {
        clearHighlight();
        setActivePin(slug);
        var card = document.querySelector('[data-result-card="' + CSS.escape(slug) + '"]');
        if (card) {
          card.classList.add("is-highlighted", "border-primary", "bg-accent-tint");
          card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        }
      }

      function makeResultCard(listing) {
        var li = document.createElement("li");

        // The whole card is the link (approved 2026-10-01).
        var a = document.createElement("a");
        a.href = "../listings/" + listing.slug + "/";
        a.setAttribute("data-result-card", listing.slug);
        a.className =
          "group block rounded-2xl border border-border bg-canvas p-4 transition-[translate,box-shadow,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lift focus-visible:-translate-y-0.5 focus-visible:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0";

        var name = document.createElement("span");
        name.className = "block font-display font-semibold text-ink group-hover:text-primary-dark";
        name.textContent = listing.name;
        a.appendChild(name);

        var place = document.createElement("span");
        place.className = "mt-0.5 block text-sm text-ink-muted";
        place.textContent = listing.city + ", " + displayState(listing) + (listing.zip ? " " + listing.zip : "");
        a.appendChild(place);

        a.addEventListener("mouseenter", function () { setActivePin(listing.slug); });
        a.addEventListener("mouseleave", function () { setActivePin(""); });
        a.addEventListener("focus", function () { setActivePin(listing.slug); });
        a.addEventListener("blur", function () { setActivePin(""); });

        li.appendChild(a);
        return li;
      }

      function renderResults(matches) {
        var container = document.getElementById("results");
        container.innerHTML = "";
        document.getElementById("results-count").textContent =
          matches.length + (matches.length === 1 ? " studio" : " studios");

        if (matches.length === 0) {
          var p = document.createElement("p");
          p.className = "rounded-2xl bg-surface px-5 py-8 text-center text-ink-muted";
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
          var marker = L.marker([l.lat, l.lng], { icon: pinIcon(), title: l.name, alt: l.name }).addTo(map);
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
          document.getElementById("results-count").textContent = "";
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
