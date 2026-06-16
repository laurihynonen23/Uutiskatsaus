# Tiedustelukatsaus — päivittäinen siviilitiedusteluraportti

Lukittu **HTML/CSS-generaattori**, joka tuottaa PowerPoint-briiffaustyylisen PDF:n.
Design on koodissa (yksi totuuden lähde) → ulkonäkö on **aina sama**, vain sisältö vaihtuu.

## Iterointi (design)

Muokkaa ulkonäköä **luomatta uutta raporttia**:

```bash
npm install            # kerran (Chromium puppeteerin mukana)
./preview.sh           # rakentaa preview.pdf NÄYTEdatalla ja avaa sen
```

- **Värit / fontit / mitat:** [`theme.css`](theme.css) — design-tokenit.
- **Diapohjat / asettelu:** [`report.css`](report.css).
- **Diarakenne / mitä kenttiä:** [`template.js`](template.js).
- **Näytesisältö previewille:** [`sample-data.json`](sample-data.json).

Muokkaa CSS:ää → aja `./preview.sh` → katso `preview.pdf`. Ei uutisten hakua, ei karttoja netistä — sekunneissa valmis.

## Tuotanto (päivittäinen ajo)

Rutiini (claude.ai/code) tekee joka aamu:

1. Hakee päivän uutiset web-hauilla.
2. Kirjoittaa päivän sisällön: `data/uutiskatsaus_VVVVKKPP.json` (sama skeema kuin `sample-data.json`).
3. Renderöi konfliktikartat: `python3 render_map.py <spec.json>` → `maps/*.png` (OSM-pohja + overlay).
4. Rakentaa PDF:n: `node build.js --data data/uutiskatsaus_VVVVKKPP.json --out reports/tiedustelukatsaus_VVVVKKPP.pdf`
5. Lähettää PDF:n sähköpostilla liitteenä (Resend) ja committaa sen repoon.

## Rakenne

| Tiedosto | Vastuu |
|---|---|
| `theme.css` | Design-tokenit (värit, fontit, mitat) |
| `report.css` | Kaikkien diatyyppien asettelu (ylivuotosuojattu flexillä) |
| `template.js` | `data.json` → HTML |
| `build.js` | `data.json` → `report.html` → PDF (Chrome/puppeteer) |
| `render_map.py` | Karttaspeksi → PNG (OSM-tiilet + hallinta-alueet, kaupungit, rintamalinja) |
| `sample-data.json` | Kiinteä näytesisältö previewiä varten |
| `fonts/` | Bundlatut woff2 (Playfair Display, Lora, Inter) — identtinen renderöinti kaikkialla |

## Diarakenne (5–7 diaa)

Kansi · **Ukraina — rintamatilanne** (ainoa kartta; lähde Black Bird Group + ISW) ·
Kansainvälinen politiikka · Turvallisuus ja puolustus · Suomi · Teknologia ja markkinat ·
Lähteet ja luotettavuusarviot.

Aihediat (`topics`) käyttävät samaa pohjaa: otsikko + nostot (3–5) + valinnainen sivupalkki.

## Tyyli

"Editoriaali / tiedustelubriiffi": vaalea kerma tausta, navy-sivupalkit, punainen + kulta aksentit,
serif-otsikot (Playfair/Lora). **Ei** tummaa navy-täystaustaa sisältödioilla, **ei** SVG-laatikoita karttoina.
