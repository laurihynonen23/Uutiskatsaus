/* ============================================================
   template.js — data (JSON) -> HTML
   Rakenne: kansi · Ukraina (rintama+kartta) · aihediat (topics) · lähteet
   Sisältöstringit saavat sisältää yksinkertaista HTML:ää
   (esim. <span class="warn">⚠</span>) — data on luotettavaa.
   ============================================================ */

const esc = (s = "") => String(s ?? "");

function foot(d, n) {
  return `<div class="foot"><span>${esc(d.footer)}</span>
    <span>${esc(d.date)} · ${esc(d.time)}</span><span>${n} / ${d._total}</span></div>`;
}

function cover(d) {
  const c = d.cover;
  return `<section class="slide cover">
    <div class="eyebrow">${esc(c.eyebrow)}</div>
    <h1>${esc(c.title)}</h1>
    <div class="sub">${esc(c.subtitle)}</div>
    <div class="meta">
      <div><span class="k">Päivämäärä</span><span class="v">${esc(d.date)}</span></div>
      <div style="text-align:right"><span class="k">Laadittu</span><span class="v">${esc(d.time)}</span></div>
    </div>
  </section>`;
}

function ukraina(d, n) {
  const u = d.ukraina;
  const li = (arr) => arr.map((x) => `<li>${esc(x)}</li>`).join("");
  return `<section class="slide conflict">
    <div class="eyebrow">Rintamatilanne · Ukraina</div>
    <h1 class="title sm">${esc(u.name)}</h1>
    <div class="rule"></div>
    ${u.intro ? `<p class="intro"><b>Tilannekuva.</b> ${esc(u.intro)}</p>` : ""}
    <div class="cols">
      <div class="mapwrap">
        <img src="${esc(u.map)}" alt="Ukrainan rintamakartta">
        <div class="mapcap"><span>${esc(u.mapSource)}</span>
          <span>Luotettavuus: <span class="rel ${u.relClass}">${esc(u.reliability)}</span></span></div>
      </div>
      <div class="analysis">
        <div class="sec"><h4>Viimeisimmät muutokset (24–48 h)</h4><ul>${li(u.changes)}</ul></div>
        <div class="sec"><h4>Strateginen merkitys</h4><ul>${li(u.assessment)}</ul></div>
      </div>
    </div>
    ${foot(d, n)}
  </section>`;
}

function topic(d, t, n) {
  const items = t.items.map((i) =>
    `<div class="item"><h4>${esc(i.h)}</h4><p>${esc(i.p)}</p></div>`).join("");
  const side = t.side ? `<div class="sidebox"><h3>${esc(t.side.title)}</h3>
    <ul>${t.side.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>` : "";
  return `<section class="slide trending${t.side ? "" : " nosidebar"}">
    <div class="eyebrow">${esc(t.eyebrow)}</div>
    <h1 class="title">${esc(t.title)}</h1>
    <div class="rule"></div>
    <div class="cols"><div class="feed">${items}</div>${side}</div>
    ${foot(d, n)}
  </section>`;
}

function sources(d, n) {
  const s = d.sources;
  const rows = s.rows.map((r) =>
    `<tr><td>${esc(r.src)}</td><td>${esc(r.use)}</td><td class="rel ${r.relClass}">${esc(r.rel)}</td></tr>`).join("");
  const leg = s.legend.map((l) =>
    `<dt>${l.swatch ? `<span class="swatch" style="background:${l.swatch}"></span>` : ""}${esc(l.term)}</dt><dd>${esc(l.desc)}</dd>`).join("");
  return `<section class="slide sources">
    <div class="eyebrow">Metodi ja jäljitettävyys</div>
    <h1 class="title">Lähteet ja luotettavuusarviot</h1>
    <div class="rule"></div>
    <div class="cols">
      <table class="src"><thead><tr><th>Lähde</th><th>Käyttö</th><th>Luotettavuus</th></tr></thead>
        <tbody>${rows}</tbody></table>
      <div class="merkinnat"><h3>Merkinnät</h3><dl>${leg}</dl></div>
    </div>
    ${foot(d, n)}
  </section>`;
}

function renderHTML(d) {
  d._total = 1 + 1 + d.topics.length + (d.sources ? 1 : 0);
  let pn = 1; // kansi = sivu 1 (ei alatunnistetta)
  const slides = [cover(d)];
  slides.push(ukraina(d, ++pn));
  d.topics.forEach((t) => slides.push(topic(d, t, ++pn)));
  if (d.sources) slides.push(sources(d, ++pn));

  return `<!doctype html><html lang="fi"><head><meta charset="utf-8">
    <link rel="stylesheet" href="theme.css"><link rel="stylesheet" href="report.css">
    </head><body>${slides.join("\n")}</body></html>`;
}

module.exports = { renderHTML };
