from pathlib import Path
import base64
import zlib

ROOT = Path('.')


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'missing replacement target: {label}')
    return text.replace(old, new, 1)


def decode_payload(source: str, destination: str) -> None:
    encoded = (ROOT / source).read_text(encoding='utf-8').strip()
    decoded = zlib.decompress(base64.b64decode(encoded)).decode('utf-8')
    (ROOT / destination).write_text(decoded, encoding='utf-8')


decode_payload('.tmp/calendar-readiness-authority-21-36.zlib.b64', 'data/static/authority-source-inventory.json')
decode_payload('.tmp/calendar-readiness-registry-21-36.zlib.b64', 'data/static/calendar-readiness-registry.json')

path = ROOT / 'docs/project-roadmap.md'
text = path.read_text(encoding='utf-8')
text = replace_once(text, 'Current Work ID: `WHR-CAL-BACKFILL-21-36`', 'Current Work ID: `WHR-CAL-BACKFILL-37-52`', 'project current Work ID')
text = replace_once(text, 'Next Work ID: `WHR-CAL-BACKFILL-37-52`', 'Next Work ID: `WHR-CP-PROFILE-45-52`', 'project next Work ID')
text = replace_once(
    text,
    '- Calendar Readiness decisions are closed for entries 01-20; entries 21-52 remain to be backfilled.',
    '- Calendar Readiness decisions are closed for entries 01-36; entries 37-52 remain to be backfilled.',
    'project readiness position',
)
text = replace_once(
    text,
    'Completed: `WHR-CAL-BACKFILL-01-20` via PR #321 with 20 closed countries and 30 system/source records.\n\nCurrent Work ID: `WHR-CAL-BACKFILL-21-36`',
    'Completed:\n\n- `WHR-CAL-BACKFILL-01-20` via PR #321 with 20 closed countries and 30 system/source records.\n- `WHR-CAL-BACKFILL-21-36` via PR #322 with 16 additional countries and 21 additional system/source records.\n\nCurrent Work ID: `WHR-CAL-BACKFILL-37-52`',
    'phase 3 progress',
)
path.write_text(text, encoding='utf-8')

path = ROOT / 'START-HERE.md'
text = path.read_text(encoding='utf-8')
text = replace_once(text, 'WHR-CAL-BACKFILL-21-36', 'WHR-CAL-BACKFILL-37-52', 'START-HERE current Work ID')
text = replace_once(text, 'WHR-CAL-BACKFILL-37-52', 'WHR-CP-PROFILE-45-52', 'START-HERE next Work ID')
path.write_text(text, encoding='utf-8')

path = ROOT / 'docs/country-pages/programme-roadmap.md'
text = path.read_text(encoding='utf-8')
text = replace_once(text, 'Latest confirmed merge: PR #321', 'Latest confirmed merge: PR #322', 'country roadmap latest merge')
text = replace_once(text, 'Current Work ID: WHR-CAL-BACKFILL-21-36', 'Current Work ID: WHR-CAL-BACKFILL-37-52', 'country roadmap current Work ID')
text = replace_once(text, 'Next working branch: calendar-readiness-backfill-21-36', 'Next working branch: calendar-readiness-backfill-37-52', 'country roadmap branch')
text = replace_once(
    text,
    'PR #321 closes Calendar Readiness decisions for entries 01-20 with 30 system/source records. Entries 29-44 remain published, entries 21-36 are the active Readiness backfill, and reviewed-note/Profile v2 work for entries 45-52 remains queued.',
    'PR #322 closes Calendar Readiness decisions for entries 21-36, bringing the cumulative state to 36 countries and 51 system/source records. Entries 37-52 are the active Readiness backfill, and Profile v2 work for entries 45-52 remains queued.',
    'country roadmap summary',
)
text = replace_once(
    text,
    '| #321 | Calendar Readiness | Closed entries 01-20 with 30 system/source decisions; implementation remains not started. |',
    '| #321 | merged | Closed Calendar Readiness for entries 01-20 with 30 system/source decisions. |\n| #322 | Calendar Readiness | Closed entries 21-36 with 21 additional system/source decisions; implementation remains not started. |',
    'country roadmap PR row',
)
path.write_text(text, encoding='utf-8')

path = ROOT / 'scripts/check-project-governance-docs.mjs'
text = path.read_text(encoding='utf-8')
text = text.replace('Current Work ID: `WHR-CAL-BACKFILL-21-36`', 'Current Work ID: `WHR-CAL-BACKFILL-37-52`')
text = text.replace('Next Work ID: `WHR-CAL-BACKFILL-37-52`', 'Next Work ID: `WHR-CP-PROFILE-45-52`')
text = text.replace("'START-HERE.md': ['WHR-CAL-BACKFILL-21-36', 'WHR-CAL-BACKFILL-37-52', 'calendar-readiness-registry.json']", "'START-HERE.md': ['WHR-CAL-BACKFILL-37-52', 'WHR-CP-PROFILE-45-52', 'calendar-readiness-registry.json']")
text = text.replace("'backfill_in_progress',\n    'WHR-CAL-BACKFILL-21-36',\n    'WHR-CAL-BACKFILL-37-52'", "'backfill_in_progress',\n    'WHR-CAL-BACKFILL-37-52'")
text = text.replace('CURRENT_WORK_ID: WHR-CAL-BACKFILL-21-36', 'CURRENT_WORK_ID: WHR-CAL-BACKFILL-37-52')
text = text.replace('NEXT_WORK_ID: WHR-CAL-BACKFILL-37-52', 'NEXT_WORK_ID: WHR-CP-PROFILE-45-52')
path.write_text(text, encoding='utf-8')

path = ROOT / 'scripts/check-calendar-contracts.mjs'
text = path.read_text(encoding='utf-8')
text = text.replace("[paths.roadmap, roadmapText, ['Current Work ID: `WHR-CAL-BACKFILL-21-36`', 'Next Work ID: `WHR-CAL-BACKFILL-37-52`']]", "[paths.roadmap, roadmapText, ['Current Work ID: `WHR-CAL-BACKFILL-37-52`', 'Next Work ID: `WHR-CP-PROFILE-45-52`']]")
text = text.replace("[paths.startHere, startHereText, ['WHR-CAL-BACKFILL-21-36', 'WHR-CAL-BACKFILL-37-52']]", "[paths.startHere, startHereText, ['WHR-CAL-BACKFILL-37-52', 'WHR-CP-PROFILE-45-52']]")
text = text.replace('CURRENT_WORK_ID: WHR-CAL-BACKFILL-21-36', 'CURRENT_WORK_ID: WHR-CAL-BACKFILL-37-52')
text = text.replace('NEXT_WORK_ID: WHR-CAL-BACKFILL-37-52', 'NEXT_WORK_ID: WHR-CP-PROFILE-45-52')
path.write_text(text, encoding='utf-8')

path = ROOT / 'scripts/check-country-page-programme-roadmap.mjs'
text = path.read_text(encoding='utf-8')
text = text.replace('for (const pr of [284, 311, 316, 317, 319, 321, 340])', 'for (const pr of [284, 311, 316, 317, 319, 321, 322, 340])')
text = text.replace("'Current Work ID: WHR-CAL-BACKFILL-21-36'", "'Current Work ID: WHR-CAL-BACKFILL-37-52'")
text = text.replace("'Next working branch: calendar-readiness-backfill-21-36'", "'Next working branch: calendar-readiness-backfill-37-52'")
text = text.replace("'Latest confirmed merge: PR #321'", "'Latest confirmed merge: PR #322'")
text = text.replace('KEY_PRS: 284,311,316,317,319,321,340', 'KEY_PRS: 284,311,316,317,319,321,322,340')
text = text.replace('CURRENT_WORK: entries 01-20 readiness closed; current Work ID WHR-CAL-BACKFILL-21-36', 'CURRENT_WORK: entries 01-36 readiness closed; current Work ID WHR-CAL-BACKFILL-37-52')
path.write_text(text, encoding='utf-8')
