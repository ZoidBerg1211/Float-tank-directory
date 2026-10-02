"use strict";

// Shared site header + footer for the generated pages (2026-10-01).
// about/index.html is static and carries a hand-copied version of this
// markup — keep the two in step when changing either.

const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6";

const NAV_LINK =
  "rounded-md py-2 text-sm font-medium text-ink-muted sm:px-1 transition-colors hover:text-primary " +
  "aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-primary " +
  "aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-[10px] " +
  "focus-visible:outline-2 focus-visible:outline-primary";

/**
 * @param {object} opts
 * @param {string} opts.base   Relative path to the site root ("./", "../", "../../").
 * @param {"home"|"about"|"float"|null} opts.current  Page to mark aria-current.
 */
function siteHeader({ base, current }) {
  const cur = (key) => (current === key ? ' aria-current="page"' : "");
  const links = [];
  if (current !== "home") links.push(`<a href="${base}" class="${NAV_LINK}">Home</a>`);
  links.push(`<a href="${base}about/" class="${NAV_LINK}"${cur("about")}>About</a>`);
  links.push(`<a href="${base}float/" class="${NAV_LINK}"${cur("float")}>Find a Float</a>`);

  return `<header class="sticky top-0 z-50 border-b border-border bg-canvas/85 backdrop-blur-md">
    <div class="${CONTAINER} flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3">
      <a href="${base}" class="font-display text-brand font-semibold text-primary focus-visible:outline-2 focus-visible:outline-primary sm:text-lg"${cur(
        "home"
      )}>Float Tank Directory</a>
      <nav class="flex items-center gap-2 sm:gap-5" aria-label="Primary">
        ${links.join("\n        ")}
      </nav>
    </div>
  </header>`;
}

function siteFooter({ base }) {
  const link =
    "text-ink-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-primary";
  return `<footer class="mt-20 border-t border-border bg-surface">
    <div class="${CONTAINER} flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
      <div class="max-w-sm">
        <a href="${base}" class="font-display text-lg font-semibold text-primary-dark focus-visible:outline-2 focus-visible:outline-primary">Float Tank Directory</a>
        <p class="mt-2 text-sm text-ink-muted">
          Float tank studios across the United States, with pricing, amenities, and cleaning
          standards where studios publish them.
        </p>
      </div>
      <nav aria-label="Footer">
        <ul class="flex flex-wrap gap-x-6 gap-y-3 text-sm" role="list">
          <li><a href="${base}" class="${link}">Home</a></li>
          <li><a href="${base}float/" class="${link}">Find a Float</a></li>
          <li><a href="${base}about/" class="${link}">What is floating?</a></li>
          <li><a href="${base}about/#sources-heading" class="${link}">Research sources</a></li>
        </ul>
      </nav>
    </div>
  </footer>`;
}

module.exports = { siteHeader, siteFooter, CONTAINER };
