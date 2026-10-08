# Yekan Bakh

Persian UI typography prefers the actual Yekan Bakh family (local names `Yekan Bakh` and `YekanBakh`), followed by Tahoma. The repository currently contains no Yekan Bakh font files; IranYekan is a different family.

Download the webfont package from [Fontiran](https://fontiran.com/fonts/yekan-bakh), then paste its WOFF2 files and license information into:

`/home/erfan/Project/js/async-fast-api-base-frontend/public/fonts/yekan-bakh/`

Use either one variable font named `YekanBakh-Variable.woff2`, or two static fonts named `YekanBakh-Regular.woff2` and `YekanBakh-Bold.woff2`. Rename files only to match their actual family and weight.

Restart `npm start` after copying the files. Start and build commands automatically generate `src/yekan-bakh-fonts.css`, registering only present files with `font-display: swap`. The variable font takes precedence. Run `npm run fonts:prepare` manually when using the Angular CLI directly.

Until the font is supplied, Persian uses locally installed Yekan Bakh or Tahoma without requesting missing files. Shared typography applies to PrimeNG, Material, and Tailwind text without replacing icon fonts.
