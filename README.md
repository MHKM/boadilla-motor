# Boadilla Motor Sport

One-page, read-only website for Boadilla Motor Sport, a multi-brand car workshop in Boadilla del Monte. It shows what the workshop does and why to choose it, and lets visitors call, WhatsApp or find the workshop on the map with one tap. The page content is in Spanish; the code and documentation are in English.

Plain HTML5, CSS3 and JavaScript. No dependencies, no Node, no build step. It works when opened from `file://`, from a GitHub Pages sub-path and from a custom domain, so every path is relative.

## Commands

| Action | Command |
|---|---|
| install | none (no dependencies) |
| build | none (no build step) |
| run (local) | `open index.html` (macOS; on Linux `xdg-open index.html`) |
| test | `bash scripts/test.sh` |
| test one suite | `bash scripts/test.sh F001` (runs only `tests/F001.test.js`) |
| lint | `bash scripts/lint.sh` |

### Tests

Tests run in the browser and are driven headless by Google Chrome. `scripts/test.sh` uses `$CHROME` if set, otherwise Google Chrome on macOS, `google-chrome`, `google-chrome-stable` or `chromium`. It prints one `PASS <name>` or `FAIL <name> :: <message>` line per test and ends with `RESULT: PASS n/n` or `RESULT: FAIL x/n`; the exit code is 0 only when all tests pass.

- `tests/harness.js` is the harness (`test`, `assert`, `assertEqual`, `assertMatch`, `byTestId`, `allByTestId`, `text`, `isVisible`, `loadFrame`). Each test receives `page.mobile` (375x812), `page.desktop` (1280x900) and `page.nojs` (375x812, scripts disabled), each with the `doc` and `win` of `index.html`.
- One suite per feature: `tests/F###.test.js`, registered in the `SUITES` list of `tests/index.html`. Test names start with the acceptance criterion they cover (`AC-F001-02 ...`); technical tests start with the task ID (`T001 ...`).
- You can also open `tests/index.html` (or `tests/index.html?suite=base`) in Chrome started with `--allow-file-access-from-files`.

### Lint

`scripts/lint.sh` checks the rules of the project with grep: no external resources, no inline styles, `rel="noopener"` on `target="_blank"` links, no `data-config` and no `js/config.js`, no contact data in `js/*.js`, URL-encoded `text=` on `wa.me` links, relative paths only, no colour literals in CSS outside the generated tokens, every `var(--x)` in `css/styles.css` defined in `css/tokens.css` or `css/styles.css` (`css-var-defined`), `font-size` values using `var(...)` (`font-size-token`), no `px`/`rem`/`em` literals in `margin`, `padding` or `gap` (`no-spacing-literal`), `@media` widths only 640px, 768px, 1024px or 1280px (`media-width`) and test names starting with an AC or task ID. It prints `LINT <rule> <file>:<line> <message>` per violation and exits 1, or prints `LINT OK`.

## Changing a contact value

Phones, WhatsApp, address, map link, hours and reviews link are written directly in `index.html` (visible without JavaScript) and repeated in several places.

1. Edit **every** occurrence in `index.html`.
2. Edit the expected value in `tests/contact-data.js` (test-only, never loaded by the page).
3. Run `bash scripts/test.sh contact`: the contact consistency test must pass.

Formats: visible phone `915 04 80 56` with `href="tel:+34915048056"`; WhatsApp `https://wa.me/34619768932?text=<urlencoded message>`.

## Publishing

GitHub Pages serves `master` from the repository root (`.nojekyll` is present). Publishing is done by the maintainer.
