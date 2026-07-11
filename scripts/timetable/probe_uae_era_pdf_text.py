#!/usr/bin/env python3
"""Fetch the official ERA fixture PDF into memory and emit a public-safe structure summary.

The probe never writes the PDF bytes or extracted text to disk. Only aggregate structure,
venue occurrence counts, normalized date candidates, and hashes are emitted.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
import urllib.request
from datetime import datetime
from io import BytesIO
from urllib.parse import urlparse

from pypdf import PdfReader

PDF_URL = "https://d2xuc5ucjmnf40.cloudfront.net/downloads/UAE-ERA-Race-Fixture-2026-27.pdf"
ALLOWED_FINAL_HOSTS = {"d2xuc5ucjmnf40.cloudfront.net"}
VENUE_LABELS = [
    "Meydan Racecourse",
    "Abu Dhabi Turf Club",
    "Al Ain Racecourse",
    "Jebel Ali Racecourse",
    "Sharjah Racecourse",
]
VENUE_ALIASES = {
    "Meydan Racecourse": ["Meydan"],
    "Abu Dhabi Turf Club": ["Abu Dhabi"],
    "Al Ain Racecourse": ["Al Ain"],
    "Jebel Ali Racecourse": ["Jebel Ali"],
    "Sharjah Racecourse": ["Sharjah"],
}
MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}
SEASON_YEAR_BY_MONTH = {
    10: 2026,
    11: 2026,
    12: 2026,
    1: 2027,
    2: 2027,
    3: 2027,
}


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def safe_iso_date(year: int, month: int, day: int) -> str | None:
    try:
        return datetime(year, month, day).date().isoformat()
    except ValueError:
        return None


def expand_two_digit_year(value: int) -> int:
    return 2000 + value if value < 70 else 1900 + value


def extract_date_candidates(text: str) -> list[str]:
    candidates: set[str] = set()

    dated_patterns = [
        re.compile(r"\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b", re.IGNORECASE),
        re.compile(r"\b(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s](\d{2})\b", re.IGNORECASE),
    ]
    for index, pattern in enumerate(dated_patterns):
        for match in pattern.finditer(text):
            day = int(match.group(1))
            month = MONTHS.get(match.group(2).lower())
            if month is None:
                continue
            raw_year = int(match.group(3))
            year = raw_year if index == 0 else expand_two_digit_year(raw_year)
            value = safe_iso_date(year, month, day)
            if value:
                candidates.add(value)

    numeric = re.compile(r"\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2}|\d{2})\b")
    for match in numeric.finditer(text):
        day = int(match.group(1))
        month = int(match.group(2))
        raw_year = int(match.group(3))
        year = raw_year if raw_year >= 1000 else expand_two_digit_year(raw_year)
        value = safe_iso_date(year, month, day)
        if value:
            candidates.add(value)

    season_day_month = re.compile(r"\b(\d{1,2})[-\s]([A-Za-z]{3,9})\b", re.IGNORECASE)
    for match in season_day_month.finditer(text):
        day = int(match.group(1))
        month = MONTHS.get(match.group(2).lower())
        year = SEASON_YEAR_BY_MONTH.get(month)
        if month is None or year is None:
            continue
        value = safe_iso_date(year, month, day)
        if value:
            candidates.add(value)

    season_month_day = re.compile(r"\b([A-Za-z]{3,9})[-\s](\d{1,2})\b", re.IGNORECASE)
    for match in season_month_day.finditer(text):
        month = MONTHS.get(match.group(1).lower())
        year = SEASON_YEAR_BY_MONTH.get(month)
        if month is None or year is None:
            continue
        day = int(match.group(2))
        value = safe_iso_date(year, month, day)
        if value:
            candidates.add(value)

    return sorted(candidates)


def extract_month_year_headers(text: str) -> list[str]:
    headers: set[str] = set()
    pattern = re.compile(r"\b([A-Za-z]{3,9})\s+(20\d{2})\b", re.IGNORECASE)
    for match in pattern.finditer(text):
        month = MONTHS.get(match.group(1).lower())
        if month is None:
            continue
        headers.add(f"{match.group(2)}-{month:02d}")
    return sorted(headers)


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

    reader = PdfReader(BytesIO(payload))
    page_texts: list[str] = []
    page_text_char_counts: list[int] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        page_texts.append(text)
        page_text_char_counts.append(len(text))

    extracted_text = "\n".join(page_texts)
    normalized = normalize_text(extracted_text)
    lowered = normalized.casefold()
    non_empty_lines = [line.strip() for line in extracted_text.splitlines() if line.strip()]
    venue_occurrences = {
        label: lowered.count(label.casefold()) for label in VENUE_LABELS
    }
    venue_alias_occurrences = {
        label: sum(lowered.count(alias.casefold()) for alias in aliases)
        for label, aliases in VENUE_ALIASES.items()
    }
    venue_alias_line_counts = {
        label: sum(
            1
            for line in non_empty_lines
            if any(alias.casefold() in line.casefold() for alias in aliases)
        )
        for label, aliases in VENUE_ALIASES.items()
    }
    date_candidates = extract_date_candidates(normalized)
    month_year_headers = extract_month_year_headers(normalized)

    summary = {
        "schema_version": "calendar-uae-era-pilot-03-pdf-text-structure-summary-v1",
        "work_id": "WHR-CAL-UAE-ERA",
        "implementation_unit": "UAE-PILOT-03",
        "source_url": PDF_URL,
        "http_status": status,
        "final_url": final_url,
        "final_host": final_host,
        "content_type": content_type,
        "response_bytes": len(payload),
        "pdf_magic": True,
        "page_count": len(reader.pages),
        "extracted_text_chars": len(extracted_text),
        "non_empty_line_count": len(non_empty_lines),
        "normalized_text_sha256": hashlib.sha256(normalized.encode("utf-8")).hexdigest(),
        "page_text_char_counts": page_text_char_counts,
        "venue_label_occurrences": venue_occurrences,
        "venue_alias_occurrences": venue_alias_occurrences,
        "venue_alias_line_counts": venue_alias_line_counts,
        "all_five_full_venue_labels_observed": all(count > 0 for count in venue_occurrences.values()),
        "all_five_venue_aliases_observed": all(count > 0 for count in venue_alias_occurrences.values()),
        "month_year_headers": month_year_headers,
        "date_candidates": date_candidates,
        "date_candidate_count": len(date_candidates),
        "season_boundary_dates_observed": {
            "opening_2026_10_22": "2026-10-22" in date_candidates,
            "closing_2027_03_27": "2027-03-27" in date_candidates,
        },
        "raw_pdf_stored": False,
        "raw_text_stored": False,
        "extracted_text_emitted": False,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001 - fail-closed probe surface
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        raise
