#!/usr/bin/env python3
"""
render_chart.py — Selkeä hinnanmuutoskäyrä (minigraafi) raportin keskeisimmästä aiheesta.
Esim. öljyn hinta tai tekoälymarkkinoiden indeksi/yhtiöt.

Käyttö:  python3 render_chart.py spec.json   (tai spec stdin:istä)

Spec (JSON):
{
  "out": "charts/oil.png",
  "size": [1000, 460],            # px
  "title": "Brent-raakaöljy",
  "subtitle": "$/tnl · 14 vrk",
  "labels": ["2.6","3.6", ...],   # x-akselin pisteet
  "values": [92.1, 93.0, ...],    # hinnat
  "color": "#A8412F",             # viivan väri (valinnainen)
  "delta": "+1,9 %",              # muutos jakson yli (valinnainen)
  "dir": "up"                      # up | down | flat -> värittää delta-luvun
}

Riippuvuus: pip install matplotlib
Tyyli: vaalea kerma tausta, minimalistinen — sopii editoriaalibriiffiin.
"""
import json, sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

CREAM = "#FBF8F1"
INK = "#1A1614"
MUTED = "#6B6256"
NAVY = "#1C2738"
GREEN = "#4A6B3A"
RED = "#A8412F"
LINE = "#1C2738"


def pick_font(weight="normal"):
    for name in ["Inter", "Liberation Sans", "DejaVu Sans", "Arial", "Helvetica"]:
        try:
            font_manager.findfont(name, fallback_to_default=False)
            return name
        except Exception:
            continue
    return "DejaVu Sans"


def render(spec):
    w, h = spec.get("size", [1000, 460])
    labels = spec["labels"]
    values = spec["values"]
    color = spec.get("color", LINE)
    fam = pick_font()
    plt.rcParams["font.family"] = fam

    fig = plt.figure(figsize=(w / 100, h / 100), dpi=100)
    fig.patch.set_facecolor(CREAM)
    ax = fig.add_axes([0.06, 0.13, 0.90, 0.66])
    ax.set_facecolor(CREAM)

    x = list(range(len(values)))
    ax.plot(x, values, color=color, linewidth=2.6, zorder=3,
            solid_capstyle="round", solid_joinstyle="round")
    ax.fill_between(x, values, min(values) - (max(values) - min(values)) * 0.12,
                    color=color, alpha=0.10, zorder=2)

    # viimeinen piste korostettuna
    ax.plot([x[-1]], [values[-1]], "o", color=color, markersize=7,
            markeredgecolor=CREAM, markeredgewidth=2, zorder=4)
    ax.annotate(f"{values[-1]:g}", (x[-1], values[-1]),
                textcoords="offset points", xytext=(-4, 10),
                ha="right", fontsize=13, fontweight="bold", color=INK)

    # kevyet vaakaviivat
    ax.grid(axis="y", color=NAVY, alpha=0.08, linewidth=0.8)
    ax.set_axisbelow(True)
    for s in ["top", "right", "left"]:
        ax.spines[s].set_visible(False)
    ax.spines["bottom"].set_color(MUTED)
    ax.spines["bottom"].set_alpha(0.4)
    ax.tick_params(length=0, labelsize=10.5, colors=MUTED)

    # x-merkinnät harvennettuna (alku, keski, loppu + muutama)
    n = len(labels)
    step = max(1, n // 7)
    idx = list(range(0, n, step))
    if (n - 1) not in idx:
        idx.append(n - 1)
    ax.set_xticks(idx)
    ax.set_xticklabels([labels[i] for i in idx])
    ax.set_xlim(-0.4, n - 0.6)
    pad = (max(values) - min(values)) * 0.18 or 1
    ax.set_ylim(min(values) - pad, max(values) + pad)

    # otsikko + subtitle (vasen ylä)
    fig.text(0.06, 0.90, spec.get("title", ""), fontsize=16, fontweight="bold", color=INK)
    if spec.get("subtitle"):
        fig.text(0.06, 0.845, spec["subtitle"], fontsize=11, color=MUTED)

    # delta (oikea ylä), väri suunnan mukaan
    delta = spec.get("delta")
    if delta:
        dcol = {"up": GREEN, "down": RED}.get(spec.get("dir", "flat"), MUTED)
        arrow = {"up": "▲", "down": "▼"}.get(spec.get("dir", "flat"), "▬")
        fig.text(0.96, 0.89, f"{arrow} {delta}", fontsize=15, fontweight="bold",
                 color=dcol, ha="right")

    out = spec.get("out", "chart.png")
    import os
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    fig.savefig(out, facecolor=CREAM)
    plt.close(fig)
    print(out)


def main():
    spec = json.load(open(sys.argv[1], encoding="utf-8")) if len(sys.argv) > 1 else json.load(sys.stdin)
    render(spec)


if __name__ == "__main__":
    main()
