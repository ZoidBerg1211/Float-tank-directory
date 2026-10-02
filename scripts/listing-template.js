"use strict";

const { siteHeader, siteFooter, CONTAINER } = require("./site-chrome");

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

// Sentinels used in the source data for "not collected" — "Not listed"
// confirmed against public.listings on 2026-09-18; "None found" (written by
// the enrichment step when it found no amenities) confirmed 2026-10-01 on 15
// rows. Also treats null/"" as absent.
const ABSENT_SENTINELS = new Set(["not listed", "none found"]);

function isAbsent(value) {
  if (value === null || value === undefined) return true;
  const s = String(value).trim();
  return s === "" || ABSENT_SENTINELS.has(s.toLowerCase());
}

// Comma-separated list -> items, without splitting inside parentheses:
// "Artemis T-Shape (bipolar radio frequency, low-level laser therapy)" is one
// item, not two broken halves (8 rows affected, found 2026-10-01). If the
// parentheses in a value don't balance, fall back to a plain comma split so a
// stray "(" can't swallow the rest of the list. Drops sentinel items and
// case-insensitive duplicates ("Cold plunge" / "Cold Plunge").
function splitPills(value) {
  if (isAbsent(value)) return [];
  const s = String(value);

  const parts = [];
  let depth = 0;
  let balanced = true;
  let buf = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") {
      depth--;
      if (depth < 0) balanced = false;
    }
    if (ch === "," && depth === 0) {
      parts.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  parts.push(buf);
  const items = balanced && depth === 0 ? parts : s.split(",");

  const seen = new Set();
  return items
    .map((p) => p.trim())
    .filter((p) => p && !isAbsent(p))
    .filter((p) => {
      const key = p.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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

// --- Display labels for the fixed-vocabulary columns -----------------------
// Presentation only: each maps a known source value to a shorter label shown
// under its category heading. Unknown values pass through unchanged.
const POD_LABELS = {
  pod: "Pod",
  "float room / suite": "Float room / suite",
  cabin: "Cabin",
};
const LIGHTING_LABELS = {
  "guest-adjustable lighting": "Guest-adjustable",
  "color / chromotherapy lighting": "Color / chromotherapy",
};
const AUDIO_LABELS = {
  "guest-adjustable music": "Guest-adjustable",
  "in-tank audio": "In-tank",
  "bring your own audio": "Bring your own",
};
function label(map, value) {
  return map[value.toLowerCase()] || value;
}

// --- Icons -----------------------------------------------------------------
// Hand-drawn 24px stroke glyphs. Only the fixed-vocabulary categories get an
// icon (badge direction B, approved 2026-10-01); free-text amenities never do,
// so no icon can make a wrong claim about a studio. Always decorative: every
// use sits next to a visible text label.
const ICON_PATHS = {
  tank: '<rect x="2.5" y="7" width="19" height="10" rx="5"/><path d="M5.5 13c1.4-.9 2.8-.9 4.2 0s2.8.9 4.2 0 2.8-.9 4.2 0"/>',
  light:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  audio: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  shower: '<path d="M5 21V9a5 5 0 0 1 10 0"/><path d="M10.5 9h9"/><path d="M12 13v1M15 13v1M18 13v1M13.5 17v1M16.5 17v1"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  phone:
    '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 7 8.5-7"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
};
function icon(name, cls) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_PATHS[name]}</svg>`;
}

const EXTRAS_VISIBLE = 12;

function featureTilesHtml(tiles) {
  return tiles
    .map(
      (t) => `<li class="flex items-start gap-3 rounded-2xl border border-border bg-canvas p-4">
            <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-tint text-primary">${icon(
              t.icon,
              "size-5"
            )}</span>
            <span class="min-w-0">
              <span class="block text-meta text-ink-muted">${escapeHtml(t.label)}</span>
              <span class="mt-0.5 block font-semibold text-ink">${escapeHtml(t.value)}</span>
            </span>
          </li>`
    )
    .join("\n          ");
}

function sanitationHtml(items) {
  return items
    .map(
      (s) =>
        `<li class="inline-flex items-center gap-2 rounded-full bg-accent-tint py-1.5 pr-3.5 pl-2.5 text-sm font-medium text-primary-dark">${icon(
          "shield",
          "size-4 shrink-0"
        )}${escapeHtml(s)}</li>`
    )
    .join("\n          ");
}

function extrasHtml(items) {
  const chips = items
    .map(
      (a, i) =>
        `<li class="rounded-lg bg-surface px-3 py-1.5 text-sm text-ink${
          i >= EXTRAS_VISIBLE ? " group-data-[collapsed=true]:hidden" : ""
        }">${escapeHtml(a)}</li>`
    )
    .join("\n          ");
  if (items.length <= EXTRAS_VISIBLE) return chips;
  // Toggle starts hidden: with no JS every chip shows and no dead button appears.
  return `${chips}
          <li hidden><button type="button" id="extras-toggle" aria-expanded="true" aria-controls="extras-list" class="rounded-lg border border-dashed border-border px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-accent-tint hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Show fewer</button></li>`;
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
  const hasMap = lat != null && lng != null;

  const amenityPills = splitPills(row.amenities);
  const podPills = splitPills(row.pod_type);
  const lightingPills = splitPills(row.lighting);
  const musicPills = splitPills(row.music);
  const hasShowers = !isAbsent(row.showers) && row.showers.trim().toLowerCase() === "yes";
  const showerPill = hasShowers ? ["Showers"] : [];
  // Still feeds the meta description, unchanged in meaning from before.
  const featurePills = [...amenityPills, ...podPills, ...lightingPills, ...musicPills, ...showerPill];

  const sanitationPills = splitPills(row.sanitation_badges);

  const shortestPrice = toNumber(row.shortest_session_price);
  const shortestMin = toNumber(row.shortest_session_min);
  const membershipPrice = toNumber(row.membership_price_month);
  const hasMembership = row.membership_available === true;
  const pricingUrl = !isAbsent(row.pricing_page_url) ? row.pricing_page_url : null;

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
    geo: hasMap ? { "@type": "GeoCoordinates", latitude: lat, longitude: lng } : undefined,
    priceRange: shortestPrice != null ? formatMoney(shortestPrice) : undefined,
  };

  const hasPhone = !isAbsent(row.phone);
  const hasEmail = !isAbsent(row.email);
  const hasWebsite = !isAbsent(row.website_url);
  const telHref = hasPhone ? row.phone.replace(/[^\d+]/g, "") : "";

  const geoData = {
    lat,
    lng,
    name: row.business_name,
    address: row.full_address || "",
  };

  // --- At-a-glance facts (price first: it's the deciding fact) ---
  const glance = [];
  if (shortestPrice != null) {
    glance.push({
      label: shortestMin != null ? `${shortestMin}-min float` : "Shortest float",
      value: formatMoney(shortestPrice),
    });
  }
  if (hasMembership) {
    glance.push({
      label: "Membership",
      value: membershipPrice != null ? `${formatMoney(membershipPrice)}/mo` : "Available",
    });
  }
  if (podPills.length) {
    glance.push({
      label: podPills.length > 1 ? "Tank types" : "Tank type",
      value: podPills.map((p) => label(POD_LABELS, p)).join(", "),
    });
  }

  // --- "Your float" tiles (tank type lives in the glance row above) ---
  const tiles = [];
  if (lightingPills.length) {
    tiles.push({ icon: "light", label: "Lighting", value: lightingPills.map((p) => label(LIGHTING_LABELS, p)).join(", ") });
  }
  if (musicPills.length) {
    tiles.push({ icon: "audio", label: "Audio", value: musicPills.map((p) => label(AUDIO_LABELS, p)).join(", ") });
  }
  if (hasShowers) {
    tiles.push({ icon: "shower", label: "Showers", value: "On site" });
  }
  // A listing with a tank type but nothing else in this group still gets its
  // tank shown as a tile when there's no glance row to carry it.
  if (!tiles.length && podPills.length && glance.length === 1) {
    glance.length = 0;
    tiles.push({ icon: "tank", label: podPills.length > 1 ? "Tank types" : "Tank type", value: podPills.map((p) => label(POD_LABELS, p)).join(", ") });
  }

  const hasContact = hasWebsite || hasPhone || hasEmail;
  const contactRow =
    "flex items-center gap-3 py-3 text-sm text-ink hover:text-primary focus-visible:outline-2 focus-visible:outline-primary";

  const header = siteHeader({ base: "../../", current: null });
  const footer = siteFooter({ base: "../../" });

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
  ${header}

  <main class="${CONTAINER} py-10 sm:py-14">
    <div class="grid grid-cols-1 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-14">
      <header class="order-1 lg:col-start-1 lg:row-start-1">
        <h1 class="font-display text-3xl font-semibold tracking-tight text-ink sm:text-page">${escapeHtml(row.business_name)}</h1>
        ${row.full_address ? `<address class="mt-3 not-italic text-ink-muted">${escapeHtml(row.full_address)}</address>` : ""}
        ${
          glance.length
            ? `<dl class="mt-6 flex flex-wrap gap-3">
          ${glance
            .map(
              (g) => `<div class="min-w-32 rounded-2xl bg-surface px-4 py-3">
            <dt class="text-meta text-ink-muted">${escapeHtml(g.label)}</dt>
            <dd class="mt-0.5 font-display text-xl font-semibold text-ink tabular-nums">${escapeHtml(g.value)}</dd>
          </div>`
            )
            .join("\n          ")}
        </dl>`
            : ""
        }
        ${
          pricingUrl
            ? `<a href="${escapeHtml(
                pricingUrl
              )}" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-primary">View full pricing${icon(
                "external",
                "size-3.5"
              )}<span class="sr-only"> (opens in a new tab)</span></a>`
            : ""
        }
      </header>

      ${
        hasContact || hasMap
          ? `<div class="contents lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:block lg:self-start lg:sticky lg:top-24">
        ${
          hasContact
            ? `<section class="order-2 rounded-squircle border border-border bg-canvas p-5 shadow-card" aria-labelledby="contact-heading">
          <h2 id="contact-heading" class="sr-only">Contact</h2>
          ${
            hasWebsite
              ? `<a
            href="${escapeHtml(row.website_url)}"
            target="_blank"
            rel="noopener noreferrer"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >Visit website${icon("external", "size-4")}<span class="sr-only"> (opens in a new tab)</span></a
          >`
              : ""
          }
          ${
            hasPhone || hasEmail
              ? `<ul class="${hasWebsite ? "mt-3 " : ""}divide-y divide-border" role="list">
            ${
              hasPhone
                ? `<li><a href="tel:${escapeHtml(telHref)}" class="${contactRow}">${icon(
                    "phone",
                    "size-4 shrink-0 text-ink-muted"
                  )}<span>${escapeHtml(row.phone)}</span></a></li>`
                : ""
            }
            ${
              hasEmail
                ? `<li><a href="mailto:${escapeHtml(row.email)}" class="${contactRow}">${icon(
                    "mail",
                    "size-4 shrink-0 text-ink-muted"
                  )}<span class="min-w-0 wrap-anywhere">${escapeHtml(row.email)}</span></a></li>`
                : ""
            }
          </ul>`
              : ""
          }
        </section>`
            : ""
        }
        ${
          hasMap
            ? `<section class="order-4 lg:mt-5" aria-labelledby="location-heading">
          <h2 id="location-heading" class="font-display text-section font-semibold text-ink lg:sr-only">Location</h2>
          <div id="map" class="isolate mt-4 h-72 w-full overflow-hidden rounded-2xl border border-border lg:mt-0 lg:h-60"></div>
        </section>`
            : ""
        }
      </div>`
          : ""
      }

      <div class="order-3 space-y-10 lg:col-start-1 lg:row-start-2">
        ${
          tiles.length
            ? `<section aria-labelledby="float-heading">
          <h2 id="float-heading" class="font-display text-section font-semibold text-ink">Your float</h2>
          <ul class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" role="list">
          ${featureTilesHtml(tiles)}
          </ul>
        </section>`
            : ""
        }

        ${
          sanitationPills.length
            ? `<section aria-labelledby="cleaning-heading">
          <h2 id="cleaning-heading" class="font-display text-section font-semibold text-ink">Cleaning &amp; sanitation</h2>
          <ul class="mt-4 flex flex-wrap gap-2" role="list">
          ${sanitationHtml(sanitationPills)}
          </ul>
        </section>`
            : ""
        }

        ${
          amenityPills.length
            ? `<section aria-labelledby="extras-heading">
          <h2 id="extras-heading" class="font-display text-section font-semibold text-ink">Also offered <span class="ml-1 font-sans text-sm font-medium text-ink-muted">${amenityPills.length}</span></h2>
          <ul id="extras-list" class="group mt-4 flex flex-wrap gap-2" role="list">
          ${extrasHtml(amenityPills)}
          </ul>
        </section>`
            : ""
        }
      </div>
    </div>
  </main>

  ${footer}

  ${
    amenityPills.length > EXTRAS_VISIBLE
      ? `<script>
    (function () {
      var list = document.getElementById("extras-list");
      var btn = document.getElementById("extras-toggle");
      if (!list || !btn) return;
      var total = ${amenityPills.length};
      function setCollapsed(collapsed) {
        list.setAttribute("data-collapsed", collapsed ? "true" : "false");
        btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
        btn.textContent = collapsed ? "Show all " + total : "Show fewer";
      }
      btn.parentElement.hidden = false;
      setCollapsed(true);
      btn.addEventListener("click", function () {
        setCollapsed(list.getAttribute("data-collapsed") !== "true");
      });
    })();
  </script>`
      : ""
  }

  ${
    hasMap
      ? `<script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <script type="application/json" id="listing-geo">${escapeJsonForScriptTag(geoData)}</script>
  <script>
    (function () {
      var data = JSON.parse(document.getElementById("listing-geo").textContent);
      var map = L.map("map", { scrollWheelZoom: false }).setView([data.lat, data.lng], 15);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      var pin = L.divIcon({ className: "", html: '<span class="map-pin is-active"></span>', iconSize: [20, 20], iconAnchor: [10, 10] });
      var marker = L.marker([data.lat, data.lng], { icon: pin, title: data.name, alt: data.name }).addTo(map);
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
