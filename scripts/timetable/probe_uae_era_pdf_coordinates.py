#!/usr/bin/env python3
"""Emit public-safe coordinates for ERA calendar-grid tokens only.

The probe downloads the official fixture PDF into memory, extracts word coordinates,
and emits only approved structural tokens: month names, weekday labels,
calendar day numbers, and the five reviewed venue aliases. Raw PDF bytes and raw
page text are never persisted or emitted.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from io import BytesIO
from urllib.parse import urlparse

import pymupdf

PDF_URL = "https://d2xuc5ucjmnf40.cloudfront.net/downloads/UAE-ERA-Race-Fixture-2026-27.pdf"
ALLOWED_FINAL_HOSTS = {"d2xuc5ucjmnf40.cloudfront.net"}
MONTHS = {
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
}
WEEKDAYS = {"mon", "tue", "wed", "thu", "fri", "sat", "sun"}
VENUE_ALIASES = {
    "Meydan Racecourse": "Meydan",
    "Abu Dhabi Turf Club": "Abu Dhabi",
    "Al Ain Racecourse": "Al Ain",
    "Jebel Ali Racecourse": "Jebel Ali",
    "Sharjah Racecourse": "Sharjah",
}


def rounded_rect(rect: pymupdf.Rect) -> dict[str, float]:
    return {
        "x0": round(rect.x0, 2),
        "y0": round(rect.y0, 2),
        "x1": round(rect.x1, 2),
        "y1": round(rect.y1, 2),
    }


def word_rect(word: tuple) -> pymupdf.Rect:
    return pymupdf.Rect(word[0], word[1], word[2], word[3])


def clean_token(value: str) -> str:
    return re.sub(r"^[^A-Za-z0-9]+|[^A-Za-z0-9]+$", "", value).strip()


def main() -> int:
    request = urllib.request.Request(
        PDF_URL,
        headers={
            "User-Agent": "WhereHorsesRun/1.0 (+public timetable research; review-artifacts-only)",
            "Accept": "application/pdf,*/*;q=0.8",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = response.read()
        status = getattr(response, "status", None)
        final_url = response.geturl()
        content_type = response.headers.get("Content-Type")

    final_host = (urlparse(final_url).hostname or "").lower()
    if status != 200:
        raise RuntimeError(f"official PDF returned HTTP {status}")
    if final_host not in ALLOWED_FINAL_HOSTS:
        raise RuntimeError(f"official PDF final host not allowed: {final_host}")
    if not payload.startswith(b"%PDF-"):
        raise RuntimeError("official PDF response lacks PDF magic")

    document = pymupdf.open(stream=payload, filetype="pdf")
    pages = []
    for page_index, page in enumerate(document):
        words = page.get_text("words", sort=False)
        month_tokens = []
        weekday_tokens = []
        day_tokens = []

        for word in words:
            raw = str(word[4])
            token = clean_token(raw)
            lowered = token.casefold()
            rect = word_rect(word)
            if lowered in MONTHS:
                month_tokens.append({"value": token.title(), **rounded_rect(rect)})
            if lowered in WEEKDAYS:
                weekday_tokens.append({"value": lowered.upper(), **rounded_rect(rect)})
            if token.isdigit() and 1 <= int(token) <= 31:
                day_tokens.append({"value": int(token), **rounded_rect(rect)})

        venue_anchors = []
        for canonical_label, alias in VENUE_ALIASES.items():
            hits = page.search_for(alias)
            for rect in hits:
                venue_anchors.append({
                    "canonical_label": canonical_label,
                    "alias": alias,
                    **rounded_rect(rect),
                })

        month_tokens.sort(key=lambda item: (item["y0"], item["x0"], item["value"]))
        weekday_tokens.sort(key=lambda item: (item["y0"], item["x0"], item["value"]))
        day_tokens.sort(key=lambda item: (item["y0"], item["x0"], item["value"]))
        venue_anchors.sort(key=lambda item: (item["y0"], item["x0"], item["alias"]))

        drawing_clusters = []
        try:
            clusters = page.cluster_drawings()
            drawing_clusters = [rounded_rect(rect) for rect in clusters]
        except Exception:
            drawing_clusters = []

        pages.append({
            "page_index": page_index,
            "page_width": round(page.rect.width, 2),
            "page_height": round(page.rect.height, 2),
            "month_tokens": month_tokens,
            "weekday_tokens": weekday_tokens,
            "day_tokens": day_tokens,
            "venue_anchors": venue_anchors,
            "drawing_cluster_count": len(drawing_clusters),
            "drawing_clusters": drawing_clusters,
        })

    summary = {
        "schema_version": "calendar-uae-era-pilot-04-coordinate-summary-v1",
        "work_id": "WHR-CAL-UAE-ERA",
        "implementation_unit": "UAE-PILOT-04",
        "source_url": PDF_URL,
        "http_status": status,
        "final_url": final_url,
        "final_host": final_host,
        "content_type": content_type,
        "response_bytes": len(payload),
        "pdf_magic": True,
        "page_count": len(document),
        "pages": pages,
        "totals": {
            "month_tokens": sum(len(page["month_tokens"]) for page in pages),
            "weekday_tokens": sum(len(page["weekday_tokens"]) for page in pages),
            "day_tokens": sum(len(page["day_tokens"]) for page in pages),
            "venue_anchors": sum(len(page["venue_anchors"]) for page in pages),
        },
        "raw_pdf_stored": False,
        "raw_text_stored": False,
        "unapproved_text_emitted": False,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001 - fail-closed evidence probe
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        raise
