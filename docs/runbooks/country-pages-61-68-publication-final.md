# Country page publication — entries 61-68

Status: ready for merge after rendered-preview approval  
Work ID: `WHR-PUB-61-68`  
PR: #333  
Publication date: 2026-06-29

## Scope

Slovenia, Croatia, Dominican Republic, Tunisia, Lebanon, Libya, Mainland China, and Indonesia are published in English and Japanese. Every country-level public ceiling remains C.

## Rendered-preview evidence

- preview branch: `preview-country-pages-61-68`
- preview trigger commit: `2b639f460efc1278891c79661f10e287ceaa674c`
- rendered check run: `28369320969`
- Cloudflare Pages deployment: `94121055-c2cf-4d21-bb32-16325e184a32`
- checked routes: 8 English + 8 Japanese
- representative routes: Slovenia, Dominican Republic, Mainland China, and Indonesia
- viewports: 1440x1200 and 412x915
- artifact: `rendered-preview-61-68` / `7950774820`
- digest: `sha256:dbb5126e397cf026d23244b153d5029bebe37ddcf83cb2146d7a5e876ff32d00`
- errors: 0

Canonical URLs, language alternates, H1 count, language switching, official links, empty states, CJK rendering, horizontal overflow, media exclusion, and C-level time-column suppression passed.

## Boundaries retained

Slovenia, Lebanon, and Libya remain link-only. Mainland China remains absent from current-calendar rows until an official Conghua calendar is reviewed. Croatia, Tunisia, and Indonesia retain manual confirmation. Dominican Republic remains limited to Hipódromo V Centenario. No runner, participant, odds, result, payout, full racecard, embedded video, or direct-stream output is introduced.

## Deployment

Merge PR #333 without `[CF-Pages-Skip]` so exactly one production deployment runs. Confirm the production check after deployment.

## Next

`WHR-ST2-69-76`
