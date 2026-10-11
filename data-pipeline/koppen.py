"""
koppen.py — Köppen–Geiger classification from monthly climate normals.

This is the REAL classification algorithm (Peel, Finlayson & McMahon 2007
formulation, precipitation in mm, temperature in °C). It is independent of the
climate *inputs*: feed it authentic Beck/WorldClim monthly grids and it yields
authentic zones; feed it the placeholder synthetic climate from
`02_build_koppen_grids.py` and it yields the labeled sample zones used for
development.

Class IDs match context.md §7.1 (0 = ocean/no-data, 1..30 = classes).
"""

from __future__ import annotations
import numpy as np

# Ordered class list -> IDs 1..30 (matches context.md legend ordering).
CLASSES = [
    "Af", "Am", "Aw", "BWh", "BWk", "BSh", "BSk",
    "Csa", "Csb", "Csc", "Cwa", "Cwb", "Cwc", "Cfa", "Cfb", "Cfc",
    "Dsa", "Dsb", "Dsc", "Dsd", "Dwa", "Dwb", "Dwc", "Dwd",
    "Dfa", "Dfb", "Dfc", "Dfd", "ET", "EF",
]
CODE_TO_ID = {c: i + 1 for i, c in enumerate(CLASSES)}
OCEAN_ID = 0


def classify_cell(t: np.ndarray, p: np.ndarray, northern: bool) -> str:
    """Classify one cell from 12 monthly temps (°C) and precip (mm).

    `t`, `p` are length-12 arrays, index 0 = January.
    `northern` selects which half-year counts as the high-sun (summer) season.
    """
    Tcold = float(t.min())
    Thot = float(t.max())
    MAT = float(t.mean())
    Pdry = float(p.min())
    MAP = float(p.sum())
    months_ge10 = int((t >= 10).sum())

    # High-sun (summer) half: Apr–Sep for NH, Oct–Mar for SH.
    if northern:
        summer = [3, 4, 5, 6, 7, 8]
    else:
        summer = [9, 10, 11, 0, 1, 2]
    winter = [m for m in range(12) if m not in summer]

    Psummer = float(p[summer].sum())
    Pwinter = float(p[winter].sum())
    Psdry = float(p[summer].min())
    Pswet = float(p[summer].max())
    Pwdry = float(p[winter].min())
    Pwwet = float(p[winter].max())

    # --- Aridity threshold (B) ---
    frac_summer = Psummer / MAP if MAP > 0 else 0.0
    if frac_summer >= 0.7:
        offset = 280.0
    elif frac_summer >= 0.3:
        offset = 140.0
    else:
        offset = 0.0
    R = 20.0 * MAT + offset

    if MAP < R:
        heat = "h" if MAT >= 18 else "k"
        return ("BW" if MAP < 0.5 * R else "BS") + heat

    # --- A tropical ---
    if Tcold >= 18:
        if Pdry >= 60:
            return "Af"
        if Pdry >= 100 - MAP / 25.0:
            return "Am"
        return "Aw"

    # --- E polar ---
    if Thot < 10:
        return "ET" if Thot >= 0 else "EF"

    # --- C / D ---
    group = "C" if Tcold > 0 else "D"

    # second letter (precip seasonality)
    dry_summer = Psdry < 40 and Psdry < (Pwwet / 3.0) and Pwinter > Psummer
    dry_winter = Pwdry < (Pswet / 10.0) and Psummer > Pwinter
    if dry_summer:
        second = "s"
    elif dry_winter:
        second = "w"
    else:
        second = "f"

    # third letter (heat)
    if group == "D" and Tcold <= -38:
        third = "d"
    elif Thot >= 22:
        third = "a"
    elif months_ge10 >= 4:
        third = "b"
    else:
        third = "c"

    code = group + second + third
    # Guard against undefined combos (e.g. Cfd/Cwd/Csd do not exist): clamp to 'c'.
    if code not in CODE_TO_ID:
        code = group + second + "c"
    if code not in CODE_TO_ID:
        code = group + "f" + "c"
    return code


def classify_grids(temp: np.ndarray, precip: np.ndarray, land: np.ndarray,
                   lat: np.ndarray) -> np.ndarray:
    """Vectorized-ish wrapper. temp/precip shape (12, H, W), land/lat shape (H, W).

    Returns Uint8 class-ID grid (H, W). Ocean/no-data cells -> 0.
    """
    H, W = land.shape
    out = np.zeros((H, W), dtype=np.uint8)
    for r in range(H):
        northern = lat[r, 0] >= 0
        for c in range(W):
            if not land[r, c]:
                continue
            code = classify_cell(temp[:, r, c], precip[:, r, c], northern)
            out[r, c] = CODE_TO_ID[code]
    return out
