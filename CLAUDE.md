# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PGPkeygenerator.com is a static, client-side-only website for generating OpenPGP key pairs in the browser. There is no build system, no package manager, no server, and no dependencies to install. All files are served directly as static HTML/CSS/JS.

Deployed on Netlify from the `main` branch.

## Development

Open any `.html` file directly in a browser, or use a simple local static server:

```bash
python -m http.server 8080
# or
npx serve .
```

There are no build steps, lint commands, or tests.

## Architecture

The site is intentionally minimal with no framework or bundler:

- **`index.html`** — Main page UI markup only. No inline JS or event handler attributes.
- **`app.js`** — All application JavaScript: DOM element references, key generation logic, clipboard/download helpers, event listeners, and WebMCP tool registration. Loaded with `defer`.
- **`worker.js`** — Web Worker that loads the self-hosted `openpgp.min.js` and performs the actual key generation off the main thread. Communicates with `index.html` via `postMessage`.
- **`openpgp.min.js`** — Vendored OpenPGP.js v6.3.0. To upgrade, download the new minified build from jsDelivr and replace this file.
- **`style.css`** — Shared stylesheet used by all pages. Two-column float layout on desktop (340px each side), responsive via `@media (max-width: 768px)`.
- **`faq.html`** — FAQ page including WebMCP documentation.
- **`about-pgp-encryption.html`** — Educational page about PGP encryption.

### Key Generation Flow

1. User fills in form fields in `index.html` and clicks "Generate Keys"
2. `generateKeys()` posts an options object to the Web Worker (`worker.js`)
3. `worker.js` calls `openpgp.generateKey(...)` using the self-hosted OpenPGP.js 6.3.0
4. Worker posts back `{ privateKey, publicKey, revocationCertificate }` (armored strings)
5. Main thread populates the three textareas and enables copy/download buttons

Errors (worker failure, generation error, invalid email, clipboard failure) are shown via `showError()` in `app.js`, which populates the `#error-message` div in the HTML. No `alert()` is used anywhere.

### Known Gaps

- No automated tests — known gap, medium priority
- Float-based CSS layout — functional but dated; known low-priority improvement

### Design Decisions

- Blank `name` field is intentionally allowed — users may generate keys without a name.

### WebMCP Integration

`app.js` registers a `generate_pgp_keys` MCP tool via `navigator.modelContext` (Chrome Canary WebMCP API). The tool populates the form UI and calls `generateKeys()`, then resolves a Promise via `_mcpPendingResolve`/`_mcpPendingReject` when the worker responds. The registration is guarded so it silently does nothing on unsupported browsers.

### Content Security Policy

The CSP (`index.html` meta tag) is fully locked down: `script-src 'self'` and `style-src 'self'` — no `unsafe-inline` anywhere, no external origins. `index.html` has zero inline styles and zero inline scripts. All JS is in `app.js`, all styles in `style.css`. Adding any external resource requires updating both the CSP and the `_headers` file if needed.

### Security Headers

`_headers` (Netlify) applies to all routes: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and `Permissions-Policy` disabling geolocation, camera, and microphone.
