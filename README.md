# Uutiskatsaus

Päivittäinen tiedustelukatsaus → HTML-sähköposti Resend API:n kautta.

Lähetetään joka aamu klo 06:30 Helsinki-aikaa (UTC `30 3 * * *`).

## Rakenne

```
.claude/
  setup.sh                 # SessionStart: asentaa pandocin
  settings.json            # Hook + permissions
  commands/
    uutiskatsaus.md        # /uutiskatsaus slash-komento
send_briefing.py           # MD → HTML → Resend API
briefings/                 # Generoidut briiffit (gitignored)
```

## Setup uudelle käyttäjälle

### 1. Resend

1. Luo tili: https://resend.com
2. Verifioi domain tai käytä jaettua `fyxio.fi`-osoitetta (kysy Laurilta API-avain)
3. Kopioi API-avain

### 2. Claude Code on the web

1. https://claude.ai/code → New project → linkitä tämä repo
2. Settings → Environment → **Network Access: Full** (pakollinen Resend API:lle)
3. Luo rutiini:
   - **Model:** `claude-opus-4-8`
   - **Cron:** `30 3 * * *` (= 06:30 Helsinki EEST)
   - **Prompt:** katso alla

### 3. Rutiinin prompt (VAIHE 0 -kohta)

Vaihda `RESEND_API_KEY` ja `BRIEFING_RECIPIENT` omiksi:

```bash
export RESEND_API_KEY=<oma-avain>
export BRIEFING_RECIPIENT='sinun@email.com'
export BRIEFING_FROM='Tiedustelukatsaus <uutiset@fyxio.fi>'
which pandoc || sudo apt-get install -y --no-install-recommends pandoc
mkdir -p briefings
```

## Lokaali testaus

```bash
set -a && source .env.local && set +a
python3 send_briefing.py briefings/uutiskatsaus_YYYY-MM-DD.md
```

`.env.local` (ei commitoida):
```
RESEND_API_KEY=...
BRIEFING_RECIPIENT=sinun@email.com
BRIEFING_FROM=Tiedustelukatsaus <uutiset@fyxio.fi>
```
