# Active-event live/replay recheck queue

Status: operating queue  
Last updated: 2026-06-08

This document consolidates live/replay audit targets that should be re-checked on active racing days before any static record is added or changed. It does not add UI behavior, runtime fetching, embedded media, direct media URLs, schedules, racecards, entries, results, payouts, predictions, or tips.

## Purpose

Several jurisdictions have credible official organisations or media leads, but did not meet the stable landing-page threshold during the first source review. These should not be repeatedly searched through weak public results. They should be rechecked only when a current official event, official racing day, or official media page is active.

## Queue summary

| Priority | Target | Current state | Recheck trigger | Possible JSON action |
| --- | --- | --- | --- | --- |
| 1 | Indonesia / SARGA.CO | Strong official-media candidate; no static record yet. | Active SARGA event day or new official event/live page. | Add `indonesia-sarga` only if stable official live/replay surface is verified. |
| 2 | Thailand / RBSC | Official organisation and race schedules confirmed; no static record yet. | Active RBSC racing day or new official media page. | Add `thailand-rbsc` only if stable official live/replay surface is verified. |
| 3 | Mauritius / MBC + current operator | Official broadcaster lead; operator/current race-media surface not verified. | Active Mauritius racing day or new official race-media page. | Add Mauritius record only if current operator or official broadcaster evidence is stable. |
| 4 | Estonia / Lithuania / Slovenia trotting | Federation/code context confirmed; no stable live/replay surface verified. | Active trotting event day or new official federation/venue media page. | Add code-specific records only if stable official surfaces are verified. |
| 5 | Great Britain trotting / Ireland harness / Czech trotting | Code-specific organisations identified; no separate record justified yet. | Active event day or stable official code-specific media page. | Add separate code-specific records only if materially distinct from existing country records. |
| 6 | Russia trotting | Status-first review only; UET marks membership as suspended indefinitely. | Governance/status and current operator evidence reconfirmed. | Do not add live/replay record until status and official operator are clear. |

## Candidate-specific checklists

### Indonesia / SARGA.CO

Reference plan: `docs/research/live-broadcast-indonesia-active-event-recheck-plan.md`

Check only:

- SARGA.CO official website;
- SARGA.CO active event page;
- official `Sarga. Co` channel linked from SARGA.CO;
- official social accounts linked from SARGA.CO;
- Indonesian Thoroughbred Association only if it links to the same media surface.

Promotion threshold:

- stable official live-racing landing page, or stable official replay/archive landing page;
- repeatable official channel pattern, not isolated uploads;
- clear scope as SARGA-operated Indonesian racing, not complete national coverage.

### Thailand / RBSC

Reference plan: `docs/research/live-broadcast-thailand-active-event-recheck-plan.md`

Check only:

- RBSC official website;
- RBSC horse-racing page;
- RBSC race-day or event page;
- official RBSC-linked social accounts;
- official media partner linked by RBSC.

Promotion threshold:

- stable official live-racing landing page, or stable official replay/archive landing page;
- source clearly tied to RBSC;
- scope remains RBSC-specific unless broader official evidence is found.

### Mauritius / MBC + current operator

Reference plan: `docs/research/live-broadcast-mauritius-active-event-recheck-plan.md`

Check only:

- Mauritius Broadcasting Corporation official website;
- MBC Live / MBC 11 or current official MBC racing programme page;
- current official Mauritius racing operator;
- current Champ-de-Mars official operator or venue page if available;
- official social accounts linked from MBC or the current operator.

Promotion threshold:

- current operator confirmed;
- stable race-specific live or replay surface verified;
- generic MBC Live or programme pages alone are not enough.

### Estonia / Lithuania / Slovenia trotting

Check only:

- relevant national trotting federation;
- current racecourse or venue operator;
- official federation/venue media pages;
- official-social channels linked from federation or venue pages.

Promotion threshold:

- stable official live/replay surface for the code;
- current activity confirmed;
- no generalisation from membership statistics alone.

### Great Britain trotting / Ireland harness / Czech trotting

Check only:

- Trot Britain official media surfaces;
- Irish Harness Racing Association official media surfaces;
- current Czech trotting authority and venue media surfaces.

Promotion threshold:

- stable official code-specific media surface;
- material difference from existing country-level records;
- code-specific scope preserved in record notes.

### Russia trotting

Check only after:

- current governance/status is reconfirmed;
- current official operator or venue evidence is identified;
- any suspension or international-status caveat is preserved.

Promotion threshold:

- no live/replay review should proceed until status and current official operator are clear.

## General do-not-add rules

Do not add or change static records when only the following are found:

- event schedules or race-day notices;
- generic live pages without race-specific coverage;
- isolated social uploads with no stable official pattern;
- historical or inactive operator pages;
- unofficial videos, fan channels, reposts, restreams, or search snippets;
- direct media, playlist, manifest, or embed-only URLs;
- unclear access terms or unclear official source relationship.

## Next operating step

Use this queue only when an active event day or new official media page appears. Until then, the static live/replay dataset should remain unchanged.
