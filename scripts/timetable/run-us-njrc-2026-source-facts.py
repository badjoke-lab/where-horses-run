"""One-shot current-year NJRC fact extraction; outputs date/venue/code JSON, not public Calendar."""
import argparse
import json
from pathlib import Path
from us_njrc_2026_pdf_core import fetch_official_pdf,parse_official_pdf

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--output",required=True)
    args=p.parse_args()
    rows,meta=parse_official_pdf(fetch_official_pdf())
    out={"schema_version":"njrc-approved-2026-exact-date-facts-v1",
         "source":meta,"rows":rows,
         "production_calendar_changed":False,
         "meeting_records_emitted":0}
    target=Path(args.output)
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(out,indent=2,ensure_ascii=False)+"\n")
    print("NJRC_2026_EXACT_DATES "+json.dumps({
      "total":len(rows),
      "counts":meta["per_venue_counts"],
      "all_forward_from_2026_10_12":[{"date":r["date"],"category":r["category"]} for r in rows if r["date"]>="2026-10-12"],
      "document_sha256":meta["pdf_sha256"],
      "raw_pdf_retained":False,
      "production_calendar_changed":False}))

if __name__=="__main__":
    main()
