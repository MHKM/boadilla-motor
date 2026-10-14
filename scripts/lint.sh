#!/usr/bin/env bash
# Grep-based lint for the one-page site. Usage: bash scripts/lint.sh
# Output: "LINT <rule-id> <file>:<line> <message>" per violation, exit 1; "LINT OK" and exit 0 otherwise.
# Scope: HTML rules on index.html; CSS rules on css/*.css except css/tokens.css (generated);
#        JS rules on js/*.js; test-name rule on tests/*.test.js. Missing files are not errors.
# Limitation: tag rules are line based, so keep an <a ...> tag with target/rel on a single line.
set -u

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

VIOLATIONS=0

report() { # rule file line message
  printf 'LINT %s %s:%s %s\n' "$1" "$2" "$3" "$4"
  VIOLATIONS=$((VIOLATIONS + 1))
}

# scan <rule> <file> <message> <grep -E pattern>: one violation per matching line
scan() {
  local rule="$1" file="$2" message="$3" pattern="$4" line
  [ -f "$file" ] || return 0
  while IFS=: read -r line _; do
    [ -n "$line" ] && report "$rule" "$file" "$line" "$message"
  done < <(grep -nE -- "$pattern" "$file")
}

HTML=index.html
CSS_FILES=()
for f in css/*.css; do
  [ -f "$f" ] && [ "$f" != "css/tokens.css" ] && CSS_FILES+=("$f")
done
JS_FILES=()
for f in js/*.js; do
  [ -f "$f" ] && JS_FILES+=("$f")
done
TEST_FILES=()
for f in tests/*.test.js; do
  [ -f "$f" ] && TEST_FILES+=("$f")
done

# ---- HTML rules (index.html) ----

# no-external-resource: no http(s):// in src= or <link href=
scan no-external-resource "$HTML" "external resource in src/href (no CDN, fonts or third-party)" \
  "(src|<link[^>]*href)=[\"']?(https?:)?//"

# no-inline-style: no style= attribute
scan no-inline-style "$HTML" "inline style attribute (use css/styles.css)" '[[:space:]]style='

# target-blank-rel: target="_blank" needs rel containing noopener
if [ -f "$HTML" ]; then
  while IFS=: read -r line _; do
    row="$(sed -n "${line}p" "$HTML")"
    if ! printf '%s' "$row" | grep -qE "rel=[\"'][^\"']*noopener"; then
      report target-blank-rel "$HTML" "$line" 'target="_blank" without rel="noopener"'
    fi
  done < <(grep -nE "target=[\"']_blank[\"']" "$HTML")
fi

# no-data-config: no data-config attribute, no js/config.js
scan no-data-config "$HTML" "data-config attribute is not allowed (D003)" 'data-config'
if [ -f js/config.js ]; then
  report no-data-config js/config.js 1 "js/config.js is not allowed (D003)"
fi

# wa-me-text-encoded: every wa.me link has ?text= with an URL-encoded text (no raw spaces)
check_wa_me() {
  local file="$1" line url
  [ -f "$file" ] || return 0
  while IFS=: read -r line url; do
    if ! printf '%s' "$url" | grep -qE '^wa\.me/[0-9]+\?text=[^[:space:]]+$'; then
      report wa-me-text-encoded "$file" "$line" "wa.me link without ?text= or with raw spaces: $url"
    fi
  done < <(grep -noE "wa\.me[^\"'<>]*" "$file")
}
check_wa_me "$HTML"

# no-absolute-path: relative paths only
scan no-absolute-path "$HTML" 'absolute path in src/href (use relative paths)' "(src|href)=[\"']/"
for f in "${CSS_FILES[@]+"${CSS_FILES[@]}"}"; do
  scan no-absolute-path "$f" "absolute path in url()" "url\([\"']?/"
done

# ---- CSS rules (css/*.css except tokens.css) ----

for f in "${CSS_FILES[@]+"${CSS_FILES[@]}"}"; do
  # no-color-literal: no hex / rgb / hsl colour outside the generated tokens
  scan no-color-literal "$f" "colour literal (use a var(--color-*) token)" \
    '(:|,|\() *#[0-9a-fA-F]{3,8}([^0-9a-zA-Z_-]|$)|(rgb|rgba|hsl|hsla)\('
done

# css-var-defined: every var(--x) is defined in css/tokens.css or in a css file of the project
for f in "${CSS_FILES[@]+"${CSS_FILES[@]}"}"; do
  while IFS=: read -r line name; do
    name="${name#var(}"
    if ! grep -qE "(^|[[:space:];{])${name}[[:space:]]*:" css/*.css; then
      report css-var-defined "$f" "$line" "var($name) is not defined in css/tokens.css or css/styles.css"
    fi
  done < <(grep -noE 'var\(--[A-Za-z0-9_-]+' "$f")

  # font-size-token: font-size values come from a token
  while IFS=: read -r line _; do
    row="$(sed -n "${line}p" "$f")"
    if ! printf '%s' "$row" | grep -qE 'font-size:[^;]*var\('; then
      report font-size-token "$f" "$line" "font-size must use var(--font-size-*)"
    fi
  done < <(grep -nE '(^|[^a-z-])font-size[[:space:]]*:' "$f")

  # no-spacing-literal: margin / padding / gap use 0, auto or tokens, never px/rem/em
  scan no-spacing-literal "$f" "spacing literal in margin/padding/gap (use var(--space-*))" \
    '(^|[^a-z-])(margin|padding|gap|row-gap|column-gap)(-[a-z]+)?[[:space:]]*:[^;]*[0-9.]+(px|rem|em)([^a-z]|$)'

  # media-width: only the project breakpoints
  while IFS=: read -r line value; do
    case "$value" in
      640px | 768px | 1024px | 1280px) ;;
      *) report media-width "$f" "$line" "@media width $value is not a breakpoint (640px, 768px, 1024px, 1280px)" ;;
    esac
  done < <(grep -noE '@media[^{]*(min|max)-width[[:space:]]*:[[:space:]]*[0-9.]+[a-z%]*' "$f" | sed -E 's/^([0-9]+):.*(min|max)-width[[:space:]]*:[[:space:]]*/\1:/')
done

# ---- JS rules (js/*.js) ----

for f in "${JS_FILES[@]+"${JS_FILES[@]}"}"; do
  # no-contact-in-js: contact data lives in index.html (D003)
  scan no-contact-in-js "$f" "contact data in JS (phones, wa.me, tel: belong in index.html)" \
    'wa\.me|tel:|\+34|[0-9]{3} ?[0-9]{2} ?[0-9]{2} ?[0-9]{2}'
  check_wa_me "$f"
done

# ---- Test rules (tests/*.test.js) ----

for f in "${TEST_FILES[@]+"${TEST_FILES[@]}"}"; do
  # test-name-id: every test("...") name starts with an AC id or a task id
  while IFS=: read -r line _; do
    row="$(sed -n "${line}p" "$f")"
    if ! printf '%s' "$row" | grep -qE '(^|[^A-Za-z0-9_.])test\("(AC-F[0-9]{3}-[0-9]{2}|T[0-9]{3}) '; then
      report test-name-id "$f" "$line" 'test name must start with "AC-F###-NN " or "T### " (double quotes, same line)'
    fi
  done < <(grep -nE '(^|[^A-Za-z0-9_.])test\(' "$f")
done

if [ "$VIOLATIONS" -gt 0 ]; then
  exit 1
fi
echo "LINT OK"
