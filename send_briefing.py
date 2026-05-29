#!/usr/bin/env python3
"""
Render a Markdown briefing to HTML and send via Resend API.

Usage:  ./send_briefing.py <briefing.md>
Env:    RESEND_API_KEY, BRIEFING_RECIPIENT
        (optional) BRIEFING_FROM  -- defaults to "Uutiskatsaus <onboarding@resend.dev>"
"""
import json
import os
import re
import subprocess
import sys
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

CSS = """
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
  blockquote { background:#fafaf9; border-left: 3px solid #0369a1; padding: 14px 18px; margin: 0 0 28px; font-size: 15px; color:#1c1917; }
  blockquote p:last-child { margin-bottom: 0; }
  hr { border:0; border-top:1px solid #e7e5e4; margin: 28px 0; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e7e5e4; font-size: 12px; color:#78716c; text-align:center; }
"""


def require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        sys.exit(f"Error: env var {name} missing")
    return val


def render(md_path: Path) -> tuple[str, str]:
    html = subprocess.check_output(
        ["pandoc", "-f", "markdown", "-t", "html5", "--wrap=none", str(md_path)],
        text=True,
    )
    text = subprocess.check_output(
        ["pandoc", "-f", "markdown", "-t", "plain", "--wrap=preserve", str(md_path)],
        text=True,
    )
    return html, text


def extract_title(md_path: Path) -> str:
    for line in md_path.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^#\s+(.+)$", line)
        if m:
            return m.group(1).strip()
    return "Uutiskatsaus"


def build_html(body: str, title: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="fi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>{CSS}</style>
</head>
<body>
  <div class="wrap">
    {body}
    <div class="footer">Generoitu automaattisesti &middot; Claude</div>
  </div>
</body>
</html>
"""


def main() -> int:
    if len(sys.argv) != 2:
        sys.exit(f"Usage: {sys.argv[0]} <briefing.md>")

    md_path = Path(sys.argv[1])
    if not md_path.is_file():
        sys.exit(f"Error: {md_path} not found")

    api_key   = require_env("RESEND_API_KEY")
    recipient = require_env("BRIEFING_RECIPIENT")
    from_addr = os.environ.get("BRIEFING_FROM", "Uutiskatsaus <onboarding@resend.dev>")

    title = extract_title(md_path)
    body_html, text = render(md_path)
    html = build_html(body_html, title)

    date_fi = datetime.now().strftime("%-d.%-m.%Y")
    subject = f"Uutiskatsaus – {date_fi}"

    payload = json.dumps({
        "from": from_addr,
        "to": [recipient],
        "subject": subject,
        "html": html,
        "text": text,
    }).encode()

    print(f"[send] From:    {from_addr}")
    print(f"[send] To:      {recipient}")
    print(f"[send] Subject: {subject}")

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "uutiskatsaus/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read())
            print(f"[send] OK id={body.get('id')}")
            return 0
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"[send] FAILED {e.code}: {err}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
