# Uutiskatsaus

Päivittäinen uutiskatsaus → HTML-sähköposti Resendin kautta.

## Setup (kerran)

1. **Resend-tili**: https://resend.com/signup (ilmainen, 100 viestiä/päivä)
2. **API-avain**: Dashboard → API Keys → "Create API Key" → kopioi `re_xxx...`
3. **Push tämä repo GitHubiin** ja yhdistä Claude Code on the web -ympäristöön
4. **Environment variables** (Claude Code -dashboardissa):
   - `RESEND_API_KEY` = `re_xxx...`
   - `BRIEFING_RECIPIENT` = `miskahirvo@gmail.com`
   - `BRIEFING_FROM` *(valinnainen)* = `"Uutiskatsaus <onboarding@resend.dev>"` (oletus)

> Lähettäjä `onboarding@resend.dev` toimii heti ilman domain-verifiointia.
> Tuotantokäyttöön verifioi oma domain Resendissä ja vaihda `BRIEFING_FROM`.

## Käyttö

```
/uutiskatsaus
```

Tämä:
1. Hakee päivän uutiset WebSearchilla
2. Kirjoittaa briiffin tiedostoon `briefings/uutiskatsaus_YYYY-MM-DD.md`
3. Renderöi HTML-sähköpostin ja lähettää Resendin kautta

## Ajastus (cron pilvessä)

Aja Claude Code -routineksi:

```
/schedule create "Päivittäinen uutiskatsaus" --prompt "/uutiskatsaus" --cron "0 7 * * *" --tz Europe/Helsinki
```

## Rakenne

```
.claude/
  setup.sh                 # SessionStart: asentaa pandocin
  settings.json            # Hook + permissions
  commands/
    uutiskatsaus.md        # /uutiskatsaus slash-komento
send_briefing.sh           # MD -> HTML -> Resend
briefings/                 # Generoidut briiffit
```

## Lokaali testaus

```bash
export RESEND_API_KEY=re_xxx
export BRIEFING_RECIPIENT=miskahirvo@gmail.com
./send_briefing.sh briefings/uutiskatsaus_2026-05-28.md
```
