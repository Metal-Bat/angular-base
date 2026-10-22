# Vazirmatn

Persian and Arabic use the bundled Vazirmatn variable font, including body text,
headings, controls and overlays. English retains the existing system font stack.
The app serves the font itself; it makes no third-party font requests.

- Upstream: https://github.com/rastikerdar/vazirmatn/tree/v33.003
- Asset: `fonts/webfonts/Vazirmatn[wght].woff2`, unchanged, stored locally as
  `vazirmatn/Vazirmatn-Variable.woff2`.
- SHA-256: `4e3fa217d38fdafc1fea4414ceb58ca5e662cf0ab5fa735a8c8c20e8b42cad92`.
- License: SIL Open Font License 1.1, bundled as `vazirmatn/OFL.txt`.

Start and build commands run `scripts/prepare-fonts.mjs`, generating
`src/vazirmatn-fonts.css` with weights 100–900 and `font-display: swap`.
A missing or invalid bundled file fails preparation instead of silently shipping
fallback typography. Run `npm run fonts:prepare` when using Angular CLI directly.

This replaces the earlier optional Yekan Bakh setup at the user's request.
