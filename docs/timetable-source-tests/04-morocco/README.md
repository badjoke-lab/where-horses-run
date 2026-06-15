# 04 - Morocco timetable source test

Status: pending
Checked date: 2026-06-10
Authority: Société Royale d'Encouragement du Cheval
Technical capability rank: Not confirmed
Fallback rank: Not confirmed

## Current decision

Morocco testing is paused.

Do not assign A+, A, B+, B or C yet.

Official racecourses and digital services were confirmed, but no stable
official source has yet produced concrete meeting-date and racecourse
pairings or complete Race 1-N timetable data.

## Confirmed

- SOREC official website is reachable.
- SOREC WordPress REST API is reachable.
- Seven SOREC racecourses are documented.
- FARAS is a current official application.
- FARAS includes race programme functionality.
- FARAS Android package: com.sorec.apk
- FARAS iOS bundle: ma.sorec.filiere.apk
- FARAS iOS version checked: 2.1.3
- FARAS iOS release date checked: 2026-06-03
- SOREC TV Android package: ma.sorec.sorectv

## Unresolved

- Stable public meeting source
- Official meeting-date and racecourse pairings
- Complete Race 1-N post times
- Distance and surface coverage
- Current FARAS backend host
- Nationwide racecourse verification

## Network findings

- e-sorec.ma resolves in DNS.
- e-sorec.ma HTTP and HTTPS connections timed out.
- SOREC streaming host resolves in DNS.
- SOREC streaming HTTP and HTTPS connections timed out.
- Public WordPress API exposed no confirmed race-programme endpoint.
- Certificate history exposed no useful API subdomain.
- Store pages exposed no confirmed backend host.

## Resume plan

Resume from A+ investigation, not from C.

1. Inspect the current FARAS application package or network traffic.
2. Retry E-SOREC and streaming infrastructure.
3. Search official programme PDFs and hidden endpoints.
4. Verify all active racecourses.
5. Assign the highest supported rank only after source verification.

## Public-safe boundary

Do not commit raw HTML, APK files, runners, horses, jockeys, trainers,
odds, results, payouts, predictions, tips or full racecard text.

Raw investigation files remain under .whr-local-source-tests/.
