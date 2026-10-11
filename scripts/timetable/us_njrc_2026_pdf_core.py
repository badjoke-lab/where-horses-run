"""Extract date + racing code from the NJ Racing Commission's official 2026 color calendar.

Only NJRC official PDF is fetched. No Meadowlands/Monmouth/Far Hills operator scraping.
Distribute normalized facts, never re-host or retain the source PDF.
"""
from __future__ import annotations
import datetime as dt
from collections import Counter
from dataclasses import dataclass
import hashlib
import re
import urllib.parse
import urllib.request

import fitz

SOURCE_URL = "https://www.njoag.gov/wp-content/uploads/2026/04/Monmouth-race-dates-2026.pdf"
SOURCE_HOSTS = {"www.njoag.gov", "njoag.gov"}
EXPECTED_TOTAL = {"monmouth": 50, "meadowlands_turf": 9, "far_hills_steeplechase": 1}
# These are pure date/venue facts observed in an official government publication.
MONTH_BOXES = (
    (5,46,243,218,327),
    (6,274,472,218,327),
    (7,498,698,218,327),
    (8,46,244,386,493),
    (9,274,473,386,493),
    (10,498,698,386,493),
)
# Color fingerprint of the published calendar, not any copyrightable presentation output.
CELL_COLORS = {
    (11,89,46): "monmouth",
    (0,174,239): "meadowlands_turf",
    (135,96,169): "far_hills_steeplechase",
}
STABLE_SITE = {
    "monmouth": {"racecourse_id":"united-states--monmouth-park","racing_system_id":"us-nj-monmouth-thoroughbred-2026-system","racing_type":"thoroughbred-flat","name":"Monmouth Park"},
    "meadowlands_turf":{"racecourse_id":"united-states--meadowlands-racetrack","racing_system_id":"us-nj-meadowlands-thoroughbred-turf-2026-system","racing_type":"thoroughbred-flat","name":"Meadowlands Racetrack"},
    "far_hills_steeplechase":{"racecourse_id":"united-states--far-hills-moorland-farm","racing_system_id":"us-nj-far-hills-steeplechase-2026-system","racing_type":"steeplechase","name":"Far Hills Race Meeting (Moorland Farm)"},
}

def fetch_official_pdf():
    req=urllib.request.Request(SOURCE_URL,headers={
        "User-Agent":"WhereHorsesRun/1.0 (+https://github.com/badjoke-lab/where-horses-run)",
        "Accept":"application/pdf"})
    with urllib.request.urlopen(req,timeout=45) as response:
        host=urllib.parse.urlparse(response.url).hostname
        if response.status!=200 or host not in SOURCE_HOSTS:
            raise ValueError(f"NJRC official source host/status failed {host}/{response.status}")
        data=response.read(8_000_001)
    if not (2000<=len(data)<=8_000_000 and data.startswith(b"%PDF-")):
        raise ValueError("NJRC source is not a bounded PDF")
    return data

def parse_official_pdf(data:bytes):
    if not data.startswith(b"%PDF-"): raise ValueError("PDF fingerprint missing")
    pdf=fitz.open(stream=data,filetype="pdf")
    if len(pdf)!=1: raise ValueError("expected one-page NJRC calendar")
    page=pdf[0]
    if abs(page.rect.width-792)>2 or abs(page.rect.height-612)>2:
        raise ValueError("unexpected NJRC calendar page geometry")
    doc_text=page.get_text()
    # The printed legend confirms the exact groups.
    if "50 Racing Days" not in doc_text or "9 Racing Days" not in doc_text or "1 Racing Day" not in doc_text or "2026" not in doc_text:
        raise ValueError("NJRC 2026 legend no longer matches reviewed document")
    pix=page.get_pixmap(matrix=fitz.Matrix(2,2),colorspace=fitz.csRGB,alpha=False)
    rows=[]
    seen=set()
    for block in page.get_text("dict").get("blocks",[]):
        for line in block.get("lines",[]):
            for span in line.get("spans",[]):
                day_text=str(span.get("text","")).strip()
                if not re.fullmatch(r"(?:[1-9]|[12]\d|3[01])",day_text): continue
                if span.get("color")!=16777215: continue # dark unselected numbers
                x0,y0,x1,y1=span["bbox"]
                cx=(x0+x1)/2
                cy=(y0+y1)/2
                matches=[mo for mo,xmin,xmax,ymin,ymax in MONTH_BOXES
                         if xmin<=cx<=xmax and ymin<=cy<=ymax]
                if len(matches)!=1: continue
                month=matches[0]
                try: date=dt.date(2026,month,int(day_text))
                except ValueError: raise ValueError("invalid highlighted calendar day")
                # Sample inside the cell to the left of glyph (avoid antialiasing text).
                px=max(0,min(pix.width-1,round((x0-4)*2)))
                py=max(0,min(pix.height-1,round(cy*2)))
                rgb=tuple(pix.pixel(px,py)[:3])
                if rgb==(255,255,255): continue # white glyph on white, e.g. Sep 1: unhighlighted artifact
                category=CELL_COLORS.get(rgb)
                if not category: raise ValueError(f"unknown highlight {date.isoformat()} rgb={rgb}")
                key=(category,date.isoformat())
                if key in seen: raise ValueError(f"duplicate NJRC highlighted date {key}")
                seen.add(key)
                rows.append({
                    "date":date.isoformat(),
                    "category":category,
                    "racecourse_id":STABLE_SITE[category]["racecourse_id"],
                    "racing_system_id":STABLE_SITE[category]["racing_system_id"],
                    "racing_type":STABLE_SITE[category]["racing_type"],
                    "venue_name":STABLE_SITE[category]["name"],
                    "source_url":SOURCE_URL,
                })
    counts=Counter(r["category"] for r in rows)
    if dict(counts)!=EXPECTED_TOTAL:
        raise ValueError(f"NJRC per-venue count mismatch expected={EXPECTED_TOTAL}, observed={dict(counts)}")
    if len(rows)!=60: raise ValueError(f"NJRC expected 60 highlighted days, got {len(rows)}")
    def has(c,d): return any(r["category"]==c and r["date"]==d for r in rows)
    for category,date in [
        ("monmouth","2026-05-09"),("monmouth","2026-09-13"),
        ("meadowlands_turf","2026-09-26"),("meadowlands_turf","2026-10-16"),
        ("far_hills_steeplechase","2026-10-17")
    ]:
        if not has(category,date): raise ValueError(f"expected NJRC color-coded date missing: {category} {date}")
    if any(r["date"]=="2026-09-01" for r in rows):
        raise ValueError("unhighlighted Sep 1 was accidentally promoted")
    rows.sort(key=lambda r:(r["date"],r["category"]))
    return rows,{"source_id":"njrc-approved-2026-race-date-calendar","source_url":SOURCE_URL,
                 "pdf_sha256":hashlib.sha256(data).hexdigest(),
                 "approved_calendar_dates":len(rows),
                 "per_venue_counts":dict(counts),
                 "geometry":"approved_2026_njrc_color_coded_calendar",
                 "raw_pdf_retained":False}
