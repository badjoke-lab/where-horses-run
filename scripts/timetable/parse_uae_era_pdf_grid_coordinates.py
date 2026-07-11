#!/usr/bin/env python3
"""Parse public-safe ERA calendar coordinates into label-based meeting observations.

Input is the public-safe coordinate summary emitted by PILOT-04. The parser never reads
raw PDF bytes or raw page text. It pairs month columns, day cells, weekday cells, and
reviewed venue aliases using coordinate proximity, then emits label-based C-level
observations only. Proposed venue IDs remain unapproved and are not candidate targets.
"""

from __future__ import annotations

import argparse
import calendar
import json
from collections import Counter
from datetime import date
from pathlib import Path

MONTHS = {
    "October": (2026, 10),
    "November": (2026, 11),
    "December": (2026, 12),
    "January": (2027, 1),
    "February": (2027, 2),
    "March": (2027, 3),
    "April": (2027, 4),
}
EXPECTED_MONTH_COUNTS = {
    "2026-10": 4,
    "2026-11": 11,
    "2026-12": 10,
    "2027-01": 13,
    "2027-02": 11,
    "2027-03": 10,
    "2027-04": 5,
}
EXPECTED_VENUE_COUNTS = {
    "Meydan": 17,
    "Abu Dhabi": 16,
    "Al Ain": 14,
    "Jebel Ali": 11,
    "Sharjah": 6,
}
VENUE_MAPPING = {
    "Meydan": {
        "venue_label": "Meydan Racecourse",
        "mapping_status": "accepted_existing",
        "canonical_id": "meydan-racecourse",
        "proposed_canonical_id": "meydan-racecourse",
    },
    "Abu Dhabi": {
        "venue_label": "Abu Dhabi Turf Club",
        "mapping_status": "proposed_unapproved",
        "canonical_id": None,
        "proposed_canonical_id": "abu-dhabi-turf-club",
    },
    "Al Ain": {
        "venue_label": "Al Ain Racecourse",
        "mapping_status": "proposed_unapproved",
        "canonical_id": None,
        "proposed_canonical_id": "al-ain-racecourse",
    },
    "Jebel Ali": {
        "venue_label": "Jebel Ali Racecourse",
        "mapping_status": "proposed_unapproved",
        "canonical_id": None,
        "proposed_canonical_id": "jebel-ali-racecourse",
    },
    "Sharjah": {
        "venue_label": "Sharjah Racecourse",
        "mapping_status": "proposed_unapproved",
        "canonical_id": None,
        "proposed_canonical_id": "sharjah-racecourse",
    },
}
ARTICLE_OPENING_DATE = "2026-10-22"
ARTICLE_CLOSING_DATE = "2027-03-27"
MONTH_X_TOLERANCE = 50.0
VENUE_X_TOLERANCE = 60.0
ROW_Y_TOLERANCE = 2.0


def center(item: dict, axis: str) -> float:
    if axis == "x":
        return (float(item["x0"]) + float(item["x1"])) / 2
    if axis == "y":
        return (float(item["y0"]) + float(item["y1"])) / 2
    raise ValueError(f"unsupported axis {axis}")


def nearest(items: list[dict], target: float, axis: str) -> tuple[dict, float]:
    if not items:
        raise ValueError("cannot resolve nearest item from empty collection")
    item = min(items, key=lambda entry: abs(center(entry, axis) - target))
    return item, abs(center(item, axis) - target)


def assign_to_month(items: list[dict], month_centers: dict[str, float], tolerance: float) -> dict[str, list[dict]]:
    assigned = {month: [] for month in month_centers}
    for item in items:
        item_x = center(item, "x")
        month, distance = min(
            ((name, abs(item_x - month_x)) for name, month_x in month_centers.items()),
            key=lambda pair: pair[1],
        )
        if distance <= tolerance:
            assigned[month].append(item)
    return assigned


def validate_month_grid(month_name: str, day_cells: list[dict], weekday_cells: list[dict]) -> None:
    year, month_number = MONTHS[month_name]
    expected_days = calendar.monthrange(year, month_number)[1]
    day_values = sorted(int(item["value"]) for item in day_cells)
    if day_values != list(range(1, expected_days + 1)):
        raise ValueError(f"{month_name}: day-cell coverage differs from calendar month")
    if len(weekday_cells) != expected_days:
        raise ValueError(f"{month_name}: weekday-cell count differs from calendar month")

    for day_cell in day_cells:
        day_value = int(day_cell["value"])
        weekday_cell, delta = nearest(weekday_cells, center(day_cell, "y"), "y")
        if delta > ROW_Y_TOLERANCE:
            raise ValueError(f"{month_name} {day_value}: weekday row pairing exceeds tolerance")
        expected_weekday = date(year, month_number, day_value).strftime("%a").upper()
        if weekday_cell["value"] != expected_weekday:
            raise ValueError(
                f"{month_name} {day_value}: weekday mismatch {weekday_cell['value']} != {expected_weekday}"
            )


def parse_coordinate_summary(summary: dict) -> dict:
    if summary.get("schema_version") != "calendar-uae-era-pilot-04-coordinate-summary-v1":
        raise ValueError("coordinate summary schema differs")
    if summary.get("work_id") != "WHR-CAL-UAE-ERA" or summary.get("implementation_unit") != "UAE-PILOT-04":
        raise ValueError("coordinate summary Work identity differs")
    if summary.get("raw_pdf_stored") is not False or summary.get("raw_text_stored") is not False:
        raise ValueError("coordinate summary raw-source boundary differs")
    if summary.get("unapproved_text_emitted") is not False:
        raise ValueError("coordinate summary emitted unapproved text")

    pages = summary.get("pages")
    if not isinstance(pages, list) or len(pages) != 1:
        raise ValueError("PILOT-04 parser currently requires the reviewed one-page PDF structure")
    page = pages[0]

    month_tokens = page.get("month_tokens", [])
    if len(month_tokens) != len(MONTHS):
        raise ValueError(f"expected {len(MONTHS)} reviewed month columns, got {len(month_tokens)}")
    month_centers = {}
    for token in month_tokens:
        name = token.get("value")
        if name not in MONTHS:
            raise ValueError(f"unexpected month token {name}")
        if name in month_centers:
            raise ValueError(f"duplicate month token {name}")
        month_centers[name] = center(token, "x")

    if set(month_centers) != set(MONTHS):
        raise ValueError("reviewed month set differs")

    day_by_month = assign_to_month(page.get("day_tokens", []), month_centers, MONTH_X_TOLERANCE)
    weekday_by_month = assign_to_month(page.get("weekday_tokens", []), month_centers, MONTH_X_TOLERANCE)
    venue_by_month = assign_to_month(page.get("venue_anchors", []), month_centers, VENUE_X_TOLERANCE)

    observations = []
    month_summaries = []
    pairing_deltas = []

    for month_name in sorted(MONTHS, key=lambda name: (MONTHS[name][0], MONTHS[name][1])):
        year, month_number = MONTHS[month_name]
        day_cells = day_by_month[month_name]
        weekday_cells = weekday_by_month[month_name]
        venue_cells = venue_by_month[month_name]
        validate_month_grid(month_name, day_cells, weekday_cells)

        for venue_cell in venue_cells:
            alias = venue_cell.get("alias")
            if alias not in VENUE_MAPPING:
                raise ValueError(f"{month_name}: unexpected venue alias {alias}")
            day_cell, delta = nearest(day_cells, center(venue_cell, "y"), "y")
            if delta > ROW_Y_TOLERANCE:
                raise ValueError(f"{month_name}/{alias}: day-row pairing exceeds tolerance ({delta})")
            pairing_deltas.append(delta)
            day_value = int(day_cell["value"])
            iso_date = date(year, month_number, day_value).isoformat()
            mapping = VENUE_MAPPING[alias]
            observations.append(
                {
                    "date": iso_date,
                    "venue_alias": alias,
                    "venue_label": mapping["venue_label"],
                    "mapping_status": mapping["mapping_status"],
                    "canonical_id": mapping["canonical_id"],
                    "proposed_canonical_id": mapping["proposed_canonical_id"],
                    "candidate_generation_allowed": mapping["mapping_status"] == "accepted_existing",
                }
            )

        month_key = f"{year:04d}-{month_number:02d}"
        month_summaries.append(
            {
                "month": month_key,
                "calendar_day_cells": len(day_cells),
                "weekday_cells": len(weekday_cells),
                "meeting_observations": len(venue_cells),
            }
        )

    observations.sort(key=lambda item: (item["date"], item["venue_alias"]))
    unique_keys = {(item["date"], item["venue_alias"]) for item in observations}
    if len(unique_keys) != len(observations):
        raise ValueError("duplicate date/venue observation detected")

    month_counts = Counter(item["date"][:7] for item in observations)
    venue_counts = Counter(item["venue_alias"] for item in observations)
    if dict(sorted(month_counts.items())) != EXPECTED_MONTH_COUNTS:
        raise ValueError(f"month meeting counts do not close: {dict(sorted(month_counts.items()))}")
    if dict(venue_counts) != EXPECTED_VENUE_COUNTS:
        raise ValueError(f"venue meeting counts do not close: {dict(venue_counts)}")
    if len(observations) != 64:
        raise ValueError(f"expected 64 meeting observations, got {len(observations)}")

    pdf_first_date = observations[0]["date"]
    pdf_last_date = observations[-1]["date"]
    post_article_closing = sorted(
        item["date"] for item in observations if item["date"] > ARTICLE_CLOSING_DATE
    )
    stable_venue_counts = {name: venue_counts[name] for name in EXPECTED_VENUE_COUNTS}

    return {
        "schema_version": "calendar-uae-era-pilot-04-grid-observations-v1",
        "work_id": "WHR-CAL-UAE-ERA",
        "implementation_unit": "UAE-PILOT-04",
        "parser_mode": "coordinate_aware_public_safe_grid",
        "observations": observations,
        "observation_count": len(observations),
        "month_summaries": month_summaries,
        "month_meeting_counts": dict(sorted(month_counts.items())),
        "venue_meeting_counts": stable_venue_counts,
        "pairing_evidence": {
            "max_day_venue_y_delta": round(max(pairing_deltas), 3) if pairing_deltas else None,
            "weekday_calendar_validation": "pass",
            "duplicate_date_venue_observations": 0,
        },
        "mapping_boundary": {
            "accepted_existing_observation_count": sum(
                1 for item in observations if item["mapping_status"] == "accepted_existing"
            ),
            "proposed_unapproved_observation_count": sum(
                1 for item in observations if item["mapping_status"] == "proposed_unapproved"
            ),
            "candidate_generation_scope": "meydan_only",
            "automatic_mapping_approval": False,
        },
        "source_boundary_comparison": {
            "article_opening_date": ARTICLE_OPENING_DATE,
            "pdf_first_observation_date": pdf_first_date,
            "opening_dates_match": ARTICLE_OPENING_DATE == pdf_first_date,
            "article_narrative_closing_date": ARTICLE_CLOSING_DATE,
            "pdf_last_observation_date": pdf_last_date,
            "pdf_observation_count_after_article_closing_date": len(post_article_closing),
            "pdf_observation_dates_after_article_closing_date": post_article_closing,
            "boundary_status": (
                "match" if ARTICLE_CLOSING_DATE == pdf_last_date else "source_boundary_difference_requires_review"
            ),
        },
        "boundaries": {
            "candidate_batch_created": False,
            "automatic_canonical_id_creation": False,
            "automatic_candidate_expansion": False,
            "racecourse_registry_write": False,
            "readiness_registry_write": False,
            "acquisition_registry_write": False,
            "canonical_write": False,
            "public_write": False,
            "publication_effect": "none",
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to public-safe coordinate summary JSON")
    args = parser.parse_args()
    summary = json.loads(Path(args.input).read_text())
    output = parse_coordinate_summary(summary)
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
