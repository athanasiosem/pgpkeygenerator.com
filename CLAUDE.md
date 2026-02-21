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

- **`index.html`** — Main page. Contains all UI markup and inline JavaScript for key generation logic, clipboard/download utilities, and WebMCP tool registration.
- **`worker.js`** — Web Worker that loads OpenPGP.js from jsDelivr CDN and performs the actual key generation off the main thread. Communicates with `index.html` via `postMessage`.
- **`style.css`** — Shared stylesheet used by all pages. Two-column float layout on desktop (340px each side), responsive via `@media (max-width: 768px)`.
- **`faq.html`** — FAQ page including WebMCP documentation.
- **`about-pgp-encryption.html`** — Educational page about PGP encryption.

### Key Generation Flow

1. User fills in form fields in `index.html` and clicks "Generate Keys"
2. `generateKeys()` posts an options object to the Web Worker (`worker.js`)
3. `worker.js` calls `openpgp.generateKey(...)` using OpenPGP.js 6.3.0 (loaded from CDN)
4. Worker posts back `{ privateKey, publicKey, revocationCertificate }` (armored strings)
5. Main thread populates the three textareas and enables copy/download buttons

### WebMCP Integration

`index.html` registers a `generate_pgp_keys` MCP tool via `navigator.modelContext` (Chrome Canary WebMCP API). The tool populates the form UI and calls `generateKeys()`, then resolves a Promise via `_mcpPendingResolve`/`_mcpPendingReject` when the worker responds. The registration is guarded so it silently does nothing on unsupported browsers.

### Content Security Policy

The CSP (`index.html` meta tag) restricts scripts to `'self'`, `'unsafe-inline'`, and `https://cdn.jsdelivr.net` only. Any new external resource requires updating the CSP.
