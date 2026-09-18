"use strict";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJsonForScriptTag(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

// Sentinel used throughout the source data for "not collected" — confirmed
// against public.listings on 2026-09-18 (also treats null/"" as absent).
function isAbsent(value) {
  if (value === null || value === undefined) return true;
  const s = String(value).trim();
  return s === "" || s.toLowerCase() === "not listed";
}

function splitPills(value) {
  if (isAbsent(value)) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatMoney(n) {
  const hasCents = Math.round(n * 100) % 100 !== 0;
  return `$${n.toFixed(hasCents ? 2 : 0)}`;
}

function pillListHtml(items) {
  return items
    .map(
      (label) =>
        `<li class="inline-flex items-center rounded-full bg-accent-tint px-3 py-1 text-sm font-medium text-primary">${escapeHtml(
          label
        )}</li>`
    )
    .join("\n            ");
}

function buildMetaDescription(row, featurePills, shortestPrice, shortestMin) {
  const parts = [];
  parts.push(
    `${row.business_name} offers float tank sessions in ${row.city}, ${row.state}.`
  );
  if (shortestPrice != null) {
    parts.push(
      `Floats start at ${formatMoney(shortestPrice)}${
        shortestMin != null ? ` for ${shortestMin} minutes` : ""
      }.`
    );
  } else if (featurePills.length) {
    parts.push(`Amenities include ${featurePills.slice(0, 3).join(", ").toLowerCase()}.`);
  }
  parts.push("View amenities, pricing, and location.");
  let description = parts.join(" ");
  if (description.length > 160) {
    description = description.slice(0, 157).trimEnd() + "...";
  }
  return description;
}

function renderListingPage(row, { siteUrl, canonicalPath }) {
  const lat = toNumber(row.latitude);
  const lng = toNumber(row.longitude);

  const amenityPills = splitPills(row.amenities);
  const podPills = splitPills(row.pod_type);
  const lightingPills = splitPills(row.lighting);
  const musicPills = splitPills(row.music);
  const showerPill = !isAbsent(row.showers) && row.showers.trim().toLowerCase() === "yes" ? ["Showers"] : [];
  const featurePills = [...amenityPills, ...podPills, ...lightingPills, ...musicPills, ...showerPill];

  const sanitationPills = splitPills(row.sanitation_badges);

  const shortestPrice = toNumber(row.shortest_session_price);
  const shortestMin = toNumber(row.shortest_session_min);
  const membershipPrice = toNumber(row.membership_price_month);
  const hasMembership = row.membership_available === true;
  const pricingUrl = !isAbsent(row.pricing_page_url) ? row.pricing_page_url : null;
  const hasPricingSection = shortestPrice != null || hasMembership || pricingUrl;

  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}${canonicalPath}`;
  const title = `${row.business_name} – Float Tank in ${row.city}, ${row.state}`;
  const description = buildMetaDescription(row, featurePills, shortestPrice, shortestMin);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DaySpa",
    name: row.business_name,
    address: {
      "@type": "PostalAddress",
      streetAddress: row.street_address || undefined,
      addressLocality: row.city || undefined,
      addressRegion: row.state || undefined,
      postalCode: row.zip_code || undefined,
      addressCountry: "US",
    },
    telephone: row.phone || undefined,
    email: row.email || undefined,
    url: row.website_url || undefined,
    geo:
      lat != null && lng != null
        ? { "@type": "GeoCoordinates", latitude: lat, longitude: lng }
        : undefined,
    priceRange: shortestPrice != null ? formatMoney(shortestPrice) : undefined,
  };

  const telHref = !isAbsent(row.phone) ? row.phone.replace(/[^\d+]/g, "") : null;

  const geoData = {
    lat,
    lng,
    name: row.business_name,
    address: row.full_address || "",
  };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <link rel="stylesheet" href="../../dist/output.css" />
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
  <script type="application/ld+json">${escapeJsonForScriptTag(jsonLd)}</script>
</head>
<body class="bg-canvas text-ink font-sans antialiased">
  <header class="border-b border-border">
    <div class="mx-auto flex max-w-3xl items-center gap-6 px-4 py-4">
      <a href="../../" class="font-display text-lg font-semibold text-primary">Float Tank Directory</a>
      <a
        href="../../about/"
        class="text-sm font-medium text-ink-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >About</a
      >
      <a
        href="../../float/"
        class="text-sm font-medium text-ink-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >Find a Float</a
      >
    </div>
  </header>

  <main class="mx-auto max-w-3xl px-4 py-8 sm:py-12">
    <header class="mb-8">
      <h1 class="font-display text-2xl sm:text-3xl font-semibold text-ink">${escapeHtml(row.business_name)}</h1>
      <address class="not-italic mt-2 text-ink-muted">${escapeHtml(row.full_address || "")}</address>
      <div class="mt-3 flex flex-col gap-1 sm:flex-row sm:gap-6">
        ${
          !isAbsent(row.email)
            ? `<a href="mailto:${escapeHtml(row.email)}" class="text-primary underline decoration-border underline-offset-2 hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-primary">${escapeHtml(
                row.email
              )}</a>`
            : ""
        }
        ${
          !isAbsent(row.phone)
            ? `<a href="tel:${escapeHtml(telHref)}" class="text-primary underline decoration-border underline-offset-2 hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-primary">${escapeHtml(
                row.phone
              )}</a>`
            : ""
        }
      </div>
    </header>

    ${
      featurePills.length
        ? `<section class="mt-8" aria-labelledby="amenities-heading">
      <h2 id="amenities-heading" class="font-display text-lg font-semibold text-ink">Amenities &amp; Features</h2>
      <ul class="mt-3 flex flex-wrap gap-2" role="list">
            ${pillListHtml(featurePills)}
      </ul>
    </section>`
        : ""
    }

    ${
      sanitationPills.length
        ? `<section class="mt-8" aria-labelledby="cleaning-heading">
      <h2 id="cleaning-heading" class="font-display text-lg font-semibold text-ink">Cleaning &amp; Sanitation</h2>
      <ul class="mt-3 flex flex-wrap gap-2" role="list">
            ${pillListHtml(sanitationPills)}
      </ul>
    </section>`
        : ""
    }

    ${
      hasPricingSection
        ? `<section class="mt-8" aria-labelledby="pricing-heading">
      <h2 id="pricing-heading" class="font-display text-lg font-semibold text-ink">Float Pricing</h2>
      <dl class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        ${
          shortestPrice != null
            ? `<div class="rounded-lg border border-border bg-surface p-4">
          <dt class="text-sm text-ink-muted">Shortest Float</dt>
          <dd class="mt-1 text-lg font-semibold text-ink">${
            shortestMin != null ? `${shortestMin} min — ` : ""
          }${formatMoney(shortestPrice)}</dd>
        </div>`
            : ""
        }
        ${
          hasMembership
            ? `<div class="rounded-lg border border-border bg-surface p-4">
          <dt class="text-sm text-ink-muted">Membership</dt>
          <dd class="mt-1 text-lg font-semibold text-ink">${
            membershipPrice != null ? `${formatMoney(membershipPrice)}/month` : "Available"
          }</dd>
        </div>`
            : ""
        }
      </dl>
      ${
        pricingUrl
          ? `<a href="${escapeHtml(
              pricingUrl
            )}" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex items-center gap-1 font-medium text-primary hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-primary">View full pricing →</a>`
          : ""
      }
    </section>`
        : ""
    }

    ${
      lat != null && lng != null
        ? `<section class="mt-10" aria-labelledby="location-heading">
      <h2 id="location-heading" class="font-display text-lg font-semibold text-ink">Location</h2>
      <div id="map" class="mt-3 h-80 w-full rounded-lg border border-border sm:h-96"></div>
    </section>`
        : ""
    }
  </main>

  <footer class="mt-12 border-t border-border">
    <div class="mx-auto max-w-3xl px-4 py-6 text-sm text-ink-muted">
      <a href="../../" class="text-primary hover:text-primary-dark">Back to directory</a>
    </div>
  </footer>

  ${
    lat != null && lng != null
      ? `<script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <script type="application/json" id="listing-geo">${escapeJsonForScriptTag(geoData)}</script>
  <script>
    (function () {
      var data = JSON.parse(document.getElementById("listing-geo").textContent);
      var map = L.map("map").setView([data.lat, data.lng], 15);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      var marker = L.marker([data.lat, data.lng]).addTo(map);
      var popup = document.createElement("div");
      var strong = document.createElement("strong");
      strong.textContent = data.name;
      popup.appendChild(strong);
      if (data.address) {
        popup.appendChild(document.createElement("br"));
        popup.appendChild(document.createTextNode(data.address));
      }
      marker.bindPopup(popup);
    })();
  </script>`
      : ""
  }
</body>
</html>
`;
}

module.exports = { renderListingPage, isAbsent, splitPills, toNumber, escapeHtml };
