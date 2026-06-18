/* ============================================================
   template.js — data (JSON) -> HTML
   Rakenne: kansi · Päivän ydin · Ukraina (rintama+kartta) · aihediat · lähteet
   Sisältöstringit saavat sisältää yksinkertaista HTML:ää
   (esim. <span class="warn">⚠</span>) — data on luotettavaa.
   ============================================================ */

const esc = (s = "") => String(s ?? "");

function foot(d, n) {
  return `<div class="foot"><span>${esc(d.footer)}</span>
    <span>${esc(d.date)} · ${esc(d.time)}</span><span>${n} / ${d._total}</span></div>`;
}

// per-dia johtopäätös (alapalkki ennen alatunnistetta)
function synth(text) {
  return text ? `<div class="synthesis"><span class="lbl">Johtopäätös</span><span>${esc(text)}</span></div>` : "";
}

const ARROW = { up: "▲", down: "▼", flat: "▬" };

function indicators(list) {
  if (!list || !list.length) return "";
  const tiles = list.map((x) => `
    <div class="ind ${esc(x.dir || "flat")}">
      <div class="l">${esc(x.label)}</div>
      <div class="v">${esc(x.value)}</div>
      <div class="d">${ARROW[x.dir] || ARROW.flat} ${esc(x.delta)}</div>
    </div>`).join("");
  return `<div class="indicators">${tiles}</div>`;
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

function ydinSlide(d, n) {
  const y = d.ydin;
  const pts = (y.points || []).map((p) =>
    `<div class="ykp"><span class="dot"></span><span>${esc(p)}</span></div>`).join("");
  return `<section class="slide ydinslide">
    <div class="eyebrow">Päivän ydin</div>
    <h1 class="title">${esc(y.headline)}</h1>
    <div class="rule"></div>
    <p class="lede">${esc(y.lede)}</p>
    <div class="ykps">${pts}</div>
    ${indicators(y.indicators)}
    ${foot(d, n)}
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
    ${synth(u.synthesis)}
    ${foot(d, n)}
  </section>`;
}

function topic(d, t, n) {
  const items = t.items.map((i) =>
    `<div class="item"><h4>${esc(i.h)}</h4><p>${esc(i.p)}</p></div>`).join("");
  let side = "";
  if (t.side) {
    const chart = t.side.chart
      ? `<img class="sidechart" src="${esc(t.side.chart.image)}" alt="kaavio">
         ${t.side.chart.caption ? `<div class="chartcap">${esc(t.side.chart.caption)}</div>` : ""}`
      : "";
    const pts = (t.side.points || []).map((p) => `<li>${esc(p)}</li>`).join("");
    side = `<div class="sidebox"><h3>${esc(t.side.title)}</h3>${chart}${pts ? `<ul>${pts}</ul>` : ""}</div>`;
  }
  const cls = ["slide", "trending"];
  if (!t.side) cls.push("nosidebar");
  if (t.side && t.side.chart) cls.push("has-chart");
  if (t.light) cls.push("light");
  return `<section class="${cls.join(" ")}">
    <div class="eyebrow">${esc(t.eyebrow)}</div>
    <h1 class="title">${esc(t.title)}</h1>
    ${t.subtitle ? `<div class="subtitle">${esc(t.subtitle)}</div>` : ""}
    <div class="rule"></div>
    <div class="cols"><div class="feed">${items}</div>${side}</div>
    ${synth(t.synthesis)}
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
  d._total = 1 + (d.ydin ? 1 : 0) + 1 + d.topics.length + (d.kevyet ? 1 : 0) + (d.sources ? 1 : 0);
  let pn = 1; // kansi = sivu 1 (ei alatunnistetta)
  const slides = [cover(d)];
  if (d.ydin) slides.push(ydinSlide(d, ++pn));
  slides.push(ukraina(d, ++pn));
  d.topics.forEach((t) => slides.push(topic(d, t, ++pn)));
  if (d.kevyet) slides.push(topic(d, { ...d.kevyet, light: true }, ++pn));
  if (d.sources) slides.push(sources(d, ++pn));

  return `<!doctype html><html lang="fi"><head><meta charset="utf-8">
    <link rel="stylesheet" href="theme.css"><link rel="stylesheet" href="report.css">
    </head><body>${slides.join("\n")}</body></html>`;
}

module.exports = { renderHTML };
