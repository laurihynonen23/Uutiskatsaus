#!/usr/bin/env python3
"""
render_map.py — Tuottaa OIKEAN NÄKÖISEN konfliktikartan (OSM-pohja + dataoverlay).

Käyttö:  python3 render_map.py spec.json
         python3 render_map.py < spec.json

Spec (JSON):
{
  "out": "maps/ukraina.png",
  "size": [900, 760],
  "bbox": [w, s, e, n],            # lon/lat — kartan rajaus (pakollinen)
  "title": "ITÄ-UKRAINA — rintama-arvio",
  "date": "6.6.2026",
  "source": "Karttalähde: ISW / DeepState · © OpenStreetMap-avustajat",
  "control": [                     # läpikuultavat hallinta-alueet
    {"polygon": [[lon,lat],...], "color": "#A8412F", "alpha": 90, "label": "Venäjän hallinta"}
  ],
  "frontline": [[lon,lat], ...],   # rintamalinja (katkoviiva)
  "cities":  [{"name":"Kyiv","lon":30.52,"lat":50.45}, ...],
  "legend":  [{"color":"#3E5C76","label":"Ukrainan hallinta"},
              {"color":"#A8412F","label":"Venäjän hallinta"},
              {"color":"#A8412F","label":"Rintamalinja","line":true}]
}

Riippuvuudet:  pip install staticmap pillow
Jos OSM-tiilien haku epäonnistuu, piirtää tyhjän merikartta-taustan ja overlayn
(maantiede yhä suuntaa-antava) — ei koskaan kaadu koko raporttia.
"""
import json, sys, math
from PIL import Image, ImageDraw, ImageFont

NAVY = (28, 39, 56)
INK = (26, 22, 20)
CREAM = (243, 238, 227)


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def load_font(size, bold=False):
    paths = [
        "fonts/Inter-Bold.ttf" if bold else "fonts/Inter-Regular.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()


def fit_zoom(bbox, w, h):
    """Suurin zoom jolla bbox mahtuu kuvaan (90 % marginaalilla)."""
    west, south, east, north = bbox
    for z in range(13, 1, -1):
        n = 2 ** z
        xw = (west + 180.0) / 360.0 * n
        xe = (east + 180.0) / 360.0 * n
        ys = (1 - math.log(math.tan(math.radians(south)) + 1 / math.cos(math.radians(south))) / math.pi) / 2 * n
        yn = (1 - math.log(math.tan(math.radians(north)) + 1 / math.cos(math.radians(north))) / math.pi) / 2 * n
        if abs(xe - xw) * 256 <= w * 0.92 and abs(ys - yn) * 256 <= h * 0.92:
            return z
    return 2


def render(spec):
    w, h = spec.get("size", [900, 760])
    bbox = spec["bbox"]
    center = [(bbox[0] + bbox[2]) / 2.0, (bbox[1] + bbox[3]) / 2.0]
    zoom = spec.get("zoom") or fit_zoom(bbox, w, h)

    img = None
    try:
        from staticmap import StaticMap
        from staticmap.staticmap import _lon_to_x, _lat_to_y
        try:
            m = StaticMap(w, h, url_template="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                          headers={"User-Agent": "tiedustelukatsaus/1.0 (+https://github.com/laurihynonen23/Uutiskatsaus)"})
        except TypeError:
            m = StaticMap(w, h, url_template="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png")
        img = m.render(zoom=zoom, center=center).convert("RGBA")
        lon2px = lambda lon: m._x_to_px(_lon_to_x(lon, m.zoom))
        lat2px = lambda lat: m._y_to_px(_lat_to_y(lat, m.zoom))
    except Exception as e:
        sys.stderr.write(f"[render_map] OSM-tiilet eivät latautuneet ({e}); piirretään tausta ilman tiiliä.\n")
        img = Image.new("RGBA", (w, h), (214, 224, 230, 255))  # vaalea merensininen
        n = 2 ** zoom
        cx = (center[0] + 180.0) / 360.0 * n
        cy = (1 - math.log(math.tan(math.radians(center[1])) + 1 / math.cos(math.radians(center[1]))) / math.pi) / 2 * n
        lon2px = lambda lon: int((lon + 180.0) / 360.0 * n * 256 - (cx * 256 - w / 2))
        def lat2px(lat):
            yy = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
            return int(yy * 256 - (cy * 256 - h / 2))

    draw = ImageDraw.Draw(img, "RGBA")

    # --- control areas (translucent fill + outline) ---
    for area in spec.get("control", []):
        col = hex2rgb(area.get("color", "#A8412F"))
        alpha = int(area.get("alpha", 85))
        pts = [(lon2px(lon), lat2px(lat)) for lon, lat in area["polygon"]]
        if len(pts) >= 3:
            overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
            od = ImageDraw.Draw(overlay)
            od.polygon(pts, fill=col + (alpha,), outline=col + (220,))
            img = Image.alpha_composite(img, overlay)
            draw = ImageDraw.Draw(img, "RGBA")

    # --- frontline (dashed) ---
    fl = spec.get("frontline", [])
    if len(fl) >= 2:
        pts = [(lon2px(lon), lat2px(lat)) for lon, lat in fl]
        for a, b in zip(pts, pts[1:]):
            _dashed(draw, a, b, hex2rgb("#A8412F"), width=4, dash=14, gap=9)

    # --- cities ---
    fcity = load_font(15, bold=True)
    for c in spec.get("cities", []):
        x, y = lon2px(c["lon"]), lat2px(c["lat"])
        r = 5
        draw.ellipse([x - r, y - r, x + r, y + r], fill=NAVY + (255,), outline=(255, 255, 255, 255), width=2)
        _label(draw, (x + 9, y - 9), c["name"], fcity, INK, halo=(255, 255, 255))

    # --- title bar (top-left) ---
    title = spec.get("title", "")
    if title:
        ft = load_font(17, bold=True)
        tw = draw.textlength(title, font=ft)
        draw.rectangle([0, 0, tw + 28, 34], fill=NAVY + (235,))
        draw.text((14, 8), title, font=ft, fill=CREAM)
        date = spec.get("date", "")
        if date:
            fd = load_font(13)
            dw = draw.textlength(date, font=fd)
            draw.rectangle([w - dw - 24, 0, w, 28], fill=NAVY + (235,))
            draw.text((w - dw - 12, 6), date, font=fd, fill=(200, 210, 222, 255))

    # --- legend (bottom-left) ---
    legend = spec.get("legend", [])
    if legend:
        fl_ = load_font(13)
        lh = 22
        box_h = len(legend) * lh + 12
        box_w = 6 + max(draw.textlength(it["label"], font=fl_) for it in legend) + 34
        ly0 = h - box_h - 8
        draw.rectangle([8, ly0, 8 + box_w, ly0 + box_h], fill=(255, 255, 255, 220), outline=NAVY + (120,))
        for i, it in enumerate(legend):
            yy = ly0 + 8 + i * lh
            col = hex2rgb(it.get("color", "#A8412F"))
            if it.get("line"):
                draw.line([16, yy + 8, 32, yy + 8], fill=col + (255,), width=4)
            else:
                draw.rectangle([16, yy + 2, 32, yy + 14], fill=col + (170,), outline=col + (255,))
            draw.text((40, yy), it["label"], font=fl_, fill=INK)

    # --- source caption (bottom strip) ---
    src = spec.get("source", "")
    if src:
        fs = load_font(12)
        draw.rectangle([0, h - 22, w, h], fill=(255, 255, 255, 210))
        draw.text((10, h - 19), src, font=fs, fill=(70, 70, 70, 255))

    out = spec.get("out", "map.png")
    img.convert("RGB").save(out)
    print(out)


def _dashed(draw, a, b, color, width=3, dash=12, gap=8):
    (x1, y1), (x2, y2) = a, b
    dist = math.hypot(x2 - x1, y2 - y1)
    if dist == 0:
        return
    dx, dy = (x2 - x1) / dist, (y2 - y1) / dist
    t = 0
    while t < dist:
        s = min(t + dash, dist)
        draw.line([(x1 + dx * t, y1 + dy * t), (x1 + dx * s, y1 + dy * s)], fill=color + (255,), width=width)
        t += dash + gap


def _label(draw, xy, text, font, color, halo=None):
    x, y = xy
    if halo:
        for ox, oy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            draw.text((x + ox, y + oy), text, font=font, fill=halo + (255,))
    draw.text((x, y), text, font=font, fill=color + (255,))


def main():
    if len(sys.argv) > 1:
        spec = json.load(open(sys.argv[1], encoding="utf-8"))
    else:
        spec = json.load(sys.stdin)
    render(spec)


if __name__ == "__main__":
    main()
