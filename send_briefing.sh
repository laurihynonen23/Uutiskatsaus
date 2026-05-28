#!/usr/bin/env bash
# Usage: ./send_briefing.sh <briefing.md>
# Env: RESEND_API_KEY, BRIEFING_RECIPIENT
set -euo pipefail

MD_FILE="${1:?Usage: $0 <briefing.md>}"
: "${RESEND_API_KEY:?RESEND_API_KEY missing}"
: "${BRIEFING_RECIPIENT:?BRIEFING_RECIPIENT missing}"
FROM_ADDR="${BRIEFING_FROM:-Uutiskatsaus <onboarding@resend.dev>}"

if [[ ! -f "$MD_FILE" ]]; then
  echo "Error: $MD_FILE not found" >&2
  exit 1
fi

DATE_FI=$(date +"%-d.%-m.%Y")
SUBJECT="Uutiskatsaus – ${DATE_FI}"

# Extract title (first H1) if present, else default
TITLE=$(grep -m1 '^# ' "$MD_FILE" | sed 's/^# //' || echo "Uutiskatsaus")

# Render Markdown -> HTML body fragment with inline link styling.
# We render to a fragment, then wrap in our own styled HTML shell.
BODY_HTML=$(pandoc -f markdown -t html5 --wrap=none "$MD_FILE")

# Build full HTML email with inline CSS (email clients ignore <style> in <head> spotty,
# but Gmail handles it fine. We use <style> + scoped table layout for max compatibility).
HTML_FILE=$(mktemp -t briefing.XXXXXX.html)
cat > "$HTML_FILE" <<HTML
<!DOCTYPE html>
<html lang="fi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${TITLE}</title>
<style>
  body { margin:0; padding:0; background:#f5f5f4; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color:#1c1917; line-height:1.55; }
  .wrap { max-width: 680px; margin: 0 auto; background:#ffffff; padding: 40px 48px; }
  h1 { font-size: 26px; font-weight: 700; margin: 0 0 8px; color:#0c0a09; letter-spacing:-0.01em; }
  h2 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color:#57534e; margin: 0 0 16px; }
  h3 { font-size: 18px; font-weight: 600; margin: 36px 0 14px; padding-bottom: 8px; border-bottom: 2px solid #e7e5e4; color:#1c1917; }
  h3:first-of-type { margin-top: 28px; }
  p { margin: 0 0 14px; font-size: 15px; }
  ul { margin: 0 0 18px; padding-left: 22px; }
  li { margin-bottom: 12px; font-size: 15px; }
  li p { margin: 0 0 4px; }
  a { color: #0369a1; text-decoration: none; border-bottom: 1px solid #bae6fd; }
  a:hover { color: #075985; border-bottom-color: #0369a1; }
  strong { color: #0c0a09; font-weight: 600; }
  .lead { background:#fafaf9; border-left: 3px solid #0369a1; padding: 14px 18px; margin: 0 0 28px; font-size: 15px; }
  .lead p:last-child { margin-bottom: 0; }
  hr { border:0; border-top:1px solid #e7e5e4; margin: 28px 0; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e7e5e4; font-size: 12px; color:#78716c; text-align:center; }
  @media (max-width: 600px) {
    .wrap { padding: 24px 20px; }
    h1 { font-size: 22px; }
  }
</style>
</head>
<body>
  <div class="wrap">
    ${BODY_HTML}
    <div class="footer">Generoitu automaattisesti · Claude</div>
  </div>
</body>
</html>
HTML

# Plain-text fallback
TEXT_FILE=$(mktemp -t briefing.XXXXXX.txt)
pandoc -f markdown -t plain --wrap=preserve "$MD_FILE" > "$TEXT_FILE"

# Build JSON payload with jq
PAYLOAD=$(jq -n \
  --arg from "$FROM_ADDR" \
  --arg to "$BRIEFING_RECIPIENT" \
  --arg subject "$SUBJECT" \
  --arg html "$(cat "$HTML_FILE")" \
  --arg text "$(cat "$TEXT_FILE")" \
  '{from: $from, to: [$to], subject: $subject, html: $html, text: $text}')

echo "[send] To: $BRIEFING_RECIPIENT"
echo "[send] Subject: $SUBJECT"

RESPONSE=$(curl -sS -X POST 'https://api.resend.com/emails' \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD")

rm -f "$HTML_FILE" "$TEXT_FILE"

if echo "$RESPONSE" | jq -e '.id' >/dev/null 2>&1; then
  echo "[send] OK id=$(echo "$RESPONSE" | jq -r '.id')"
else
  echo "[send] FAILED: $RESPONSE" >&2
  exit 1
fi
