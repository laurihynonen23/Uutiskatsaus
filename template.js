/* ============================================================
   template.js — data (JSON) -> HTML
   Sisältöstringit saavat sisältää yksinkertaista HTML:ää
   (esim. <span class="warn">⚠</span>) — data on luotettavaa.
   ============================================================ */

const esc = (s = "") => String(s); // data on omaa, ei escapeta (sallii inline-merkinnät)

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

function exec(d, n) {
  const e = d.exec;
  const pts = e.points.map((t, i) =>
    `<div class="kp"><div class="n">${i + 1}</div><div class="t">${esc(t)}</div></div>`).join("");
  return `<section class="slide exec">
    <div class="eyebrow">Päivän avainpisteet</div>
    <h1 class="title">Executive Summary</h1>
    <div class="rule"></div>
    <div class="cols">
      <div class="ydin"><h3>Päivän ydin</h3><p>${esc(e.ydin)}</p></div>
      <div class="keypoints">${pts}</div>
    </div>
    ${foot(d, n)}
  </section>`;
}

function conflict(d, c, n) {
  const li = (arr) => arr.map((x) => `<li>${esc(x)}</li>`).join("");
  return `<section class="slide conflict">
    <div class="eyebrow">Aktiivinen konflikti · ${c.n}</div>
    <h1 class="title sm">${esc(c.name)}</h1>
    <div class="rule"></div>
    <div class="cols">
      <div class="mapwrap">
        <img src="${esc(c.map)}" alt="kartta">
        <div class="mapcap"><span>${esc(c.mapSource)}</span>
          <span>Luotettavuus: <span class="rel ${c.relClass}">${esc(c.reliability)}</span></span></div>
      </div>
      <div class="analysis">
        <div class="sec"><h4>Viimeisimmät muutokset (24–48 h)</h4><ul>${li(c.changes)}</ul></div>
        <div class="sec"><h4>Strateginen merkitys</h4><ul>${li(c.assessment)}</ul></div>
      </div>
    </div>
    ${foot(d, n)}
  </section>`;
}

function emerging(d, n) {
  const e = d.emerging;
  const cards = e.cards.map((c) => `
    <div class="card ${c.level}">
      <div class="hd"><h3>${esc(c.name)}</h3><span class="tag">${esc(c.tag)}</span></div>
      <p class="lede">${esc(c.lede)}</p>
      <ul>${c.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </div>`).join("");
  return `<section class="slide emerging">
    <div class="eyebrow">Uusien rintamien tunnistus</div>
    <h1 class="title">Konfliktiseuranta — nousevat kriisit</h1>
    <div class="rule"></div>
    <div class="cards">${cards}</div>
    <div class="critbar"><b>Lisäyskriteerit</b> &nbsp;${esc(e.criteria)}</div>
    ${foot(d, n)}
  </section>`;
}

function alert(d, n) {
  const a = d.alert;
  const stats = a.stats.map((s) =>
    `<div class="stat"><div class="v">${esc(s.v)}</div><div class="l">${esc(s.l)}</div><div class="s">${esc(s.s)}</div></div>`).join("");
  const pts = a.points.map((p) => `<li>${esc(p)}</li>`).join("");
  return `<section class="slide alert">
    <div class="band"><div class="ico">⚠</div>
      <div><div class="eyebrow">${esc(a.eyebrow)}</div><h1>${esc(a.title)}</h1></div></div>
    <div class="body"><div class="bignum">${stats}</div><ul>${pts}</ul></div>
    <div class="kehotus">${esc(a.kehotus)}</div>
    ${foot(d, n)}
  </section>`;
}

function trending(d, t, n) {
  const items = t.items.map((i) =>
    `<div class="item"><h4>${esc(i.h)}</h4><p>${esc(i.p)}</p></div>`).join("");
  const side = t.side ? `<div class="sidebox"><h3>${esc(t.side.title)}</h3>
    <ul>${t.side.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>` : "";
  return `<section class="slide trending">
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
  d._total = 2 + d.conflicts.length + 1 + (d.alert ? 1 : 0) + d.trending.length + 1;
  let pn = 1;                       // cover is page 1 (no footer shown)
  const slides = [];
  slides.push(cover(d));            // cover: no footer number
  slides.push(exec(d, ++pn));
  d.conflicts.forEach((c) => slides.push(conflict(d, c, ++pn)));
  slides.push(emerging(d, ++pn));
  if (d.alert) slides.push(alert(d, ++pn));
  d.trending.forEach((t) => slides.push(trending(d, t, ++pn)));
  slides.push(sources(d, ++pn));

  return `<!doctype html><html lang="fi"><head><meta charset="utf-8">
    <link rel="stylesheet" href="theme.css"><link rel="stylesheet" href="report.css">
    </head><body>${slides.join("\n")}</body></html>`;
}

module.exports = { renderHTML };
