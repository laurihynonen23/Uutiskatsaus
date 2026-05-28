# Uutiskatsaus

Päivittäinen uutiskatsaus → HTML-sähköposti Gmail SMTP:n kautta.

## Setup (kerran)

### 1. Google App Password

1. Päälle 2FA: https://myaccount.google.com/security → "2-Step Verification"
2. Luo App Password: https://myaccount.google.com/apppasswords
   - "App name": `Uutiskatsaus`
   - Kopioi 16-merkkinen koodi (esim. `abcd efgh ijkl mnop`)

### 2. Push GitHubiin

Tämä repo on jo Githubissa: https://github.com/laurihynonen23/Uutiskatsaus

### 3. Yhdistä Claude Code on the web

1. https://claude.ai/code → New project → linkitä GitHub-repo
2. Settings → Environment variables → lisää:
   - `GMAIL_USER` = `lauri.hynonen@gmail.com`
   - `GMAIL_APP_PASSWORD` = `abcd efgh ijkl mnop` (16-merkkinen app password)
   - `BRIEFING_RECIPIENT` = `miskahirvo@gmail.com`

## Käyttö

```
/uutiskatsaus
```

1. WebSearch hakee päivän uutiset
2. Briiffi kirjoitetaan tiedostoon `briefings/uutiskatsaus_YYYY-MM-DD.md`
3. `send_briefing.py` renderöi HTML:n ja lähettää Gmail SMTP:llä

## Ajastus pilvessä

```
/schedule create "Päivittäinen uutiskatsaus" \
  --prompt "/uutiskatsaus" \
  --cron "0 7 * * *" \
  --tz Europe/Helsinki
```

## Lokaali testaus

```bash
cp .env.example .env.local
# täytä arvot .env.local-tiedostoon
set -a && source .env.local && set +a
./send_briefing.py briefings/uutiskatsaus_YYYY-MM-DD.md
```

## Rakenne

```
.claude/
  setup.sh                 # SessionStart: asentaa pandocin
  settings.json            # Hook + permissions
  commands/
    uutiskatsaus.md        # /uutiskatsaus slash-komento
send_briefing.py           # MD -> HTML -> Gmail SMTP
briefings/                 # Generoidut briiffit (gitignored)
.env.example               # Env-muuttujamalli
```
