# Calendar non-running evidence research — TJK reviewed route — 2026-09-22

## Decision

Turkey / Türkiye Jokey Kulübü (TJK) is classified as:

- `mode = reviewed`
- `automation_status = candidate`
- `whole_meeting_non_running = supported`
- `postponement = supported`

This is deliberately **not** an automated production collector.

TJK publishes explicit official news notices that prove a named domestic meeting will not run on its original date, including postponements to a later date. A bounded parser is therefore useful and safe for reviewed evidence. However, live discovery through the TJK Haberler query surface was not reliable from GitHub Actions during this wave, so WHR does not poll that route in production.

## Proven official notice family

Reviewed official TJK pages include:

- `https://www.tjk.org/TR/Kurumsal/News/Data/32478`
  - 2019-02-20 İstanbul / Veliefendi.
  - The body explicitly states that **all races** (`tüm koşular`) scheduled at İstanbul Veliefendi on 20.02.2019 were postponed to 25.02.2019.
  - WHR semantics: original 2019-02-20 meeting is the non-running meeting; 2019-02-25 is an independent replacement-date meeting and is never inferred from this evidence alone.
- `https://www.tjk.org/TR/YarisSever/News/Page/52094`
  - title: `Adana Yarışları 23 Mart Pazartesi gününe ertelendi`.
- `https://www.tjk.org/TR/Yar/News/Page/40879`
  - title: `12 Mart Cumartesi İstanbul yarışları ertelendi`.
- `https://www.tjk.org/TR/Kurumsal/News/Page/40457`
  - title: `24 Ocak Pazartesi Bursa yarışları ertelendi`.
- `https://www.tjk.org/TR/Kurumsal/News/Page/44223`
  - title: `15 Mart Çarşamba Şanlıurfa yarışları ertelendi`.
- `https://www.tjk.org/TR/Kurumsal/News/Page/52169`
  - title: `3 Nisan Cuma İzmir Yarışları 6 Nisan Pazartesi gününe ertelendi`.
- `https://www.tjk.org/TR/Kurumsal/News/Page/46319`
  - title: `Diyarbakır yarışları 19 Aralık Salı gününe ertelendi`.

TJK also publishes foreign-racing cancellations and race-level changes. Those are not evidence that a domestic TJK meeting is non-running.

## Bounded parser contract

`scripts/timetable/tjk-non-running-evidence.mjs` accepts evidence only when all of the following hold:

1. the source is an official `www.tjk.org` News Page/Data URL;
2. the article names one of the currently canonical domestic TJK venues:
   Adana, İzmir, İstanbul, Bursa, Ankara, Şanlıurfa, Elazığ, Diyarbakır or Kocaeli;
3. the article body contains explicit all-races wording (`tüm koşular`);
4. the body contains explicit postponement/cancellation wording;
5. an original meeting date can be resolved from the explicit body evidence.

The parser rejects:

- title-only wrapper pages without the explicit body;
- race-only cancellation;
- foreign-racing cancellation;
- unknown/non-canonical venue identities;
- replacement-date inference.

## Live discovery experiment

Two GitHub Actions smoke runs tested whether the official Haberler discovery surface could safely become an automated production route.

### Filtered Haberler query

Run:

- workflow: `Calendar unified official refresh`
- run ID: `35674385147`
- run number: `460`

The historical date/subject-filtered Haberler request timed out after the 20-second source boundary:

`query_fetch_failed: The operation was aborted due to timeout`

### Unfiltered current Haberler page

Run:

- workflow: `Calendar unified official refresh`
- run ID: `35674553262`
- run number: `466`

The current Haberler page with only the normal Turkish/Yarışsever flags also timed out after 20 seconds from GitHub Actions.

This matters operationally. A source that can be found through a browser/search index but cannot be fetched reliably from the production execution environment is not an active automated source.

## Production behavior

No TJK news poller is activated.

The production TJK annual/daily programme path remains positive evidence only.

Therefore:

- programme omission -> `absent_unconfirmed`;
- TJK programme fetch failure -> preserve verified state;
- reviewed explicit TJK whole-meeting notice -> may be entered as `confirmed_non_running`;
- partial-race cancellation -> never suppress the whole meeting;
- postponed/replacement date -> independent meeting only.

This keeps the Calendar safe while preserving a documented reviewed path for real TJK cancellations/postponements.
