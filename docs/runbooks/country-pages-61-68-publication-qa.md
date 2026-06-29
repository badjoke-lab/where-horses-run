# Country page publication QA — entries 61-68

Status: GitHub QA in progress; rendered preview required  
Work ID: `WHR-PUB-61-68`  
Deployment: one final preview, then one production deployment after merge

## Scope

Slovenia, Croatia, Dominican Republic, Tunisia, Lebanon, Libya, Mainland China, and Indonesia.

## Required checks

- 8 English and 8 Japanese routes build successfully
- canonical URLs and language alternates are correct
- each route has one H1 and a working language switch
- official source links are present
- empty-state wording is visible where no meeting rows exist
- all country pages remain at public ceiling C
- start-time and timezone columns remain hidden
- no embedded media or direct-stream output is introduced
- desktop and Pixel 7 rendered views have no horizontal overflow
- Japanese text renders with appropriate CJK fonts

## Retained boundaries

- Slovenia, Lebanon, and Libya remain link-only.
- Mainland China remains absent from current-calendar rows until an official Conghua meeting calendar is reviewed.
- Croatia, Tunisia, and Indonesia retain manual confirmation.
- Dominican Republic remains limited to Hipódromo V Centenario.

## Preview gate

Create exactly one `preview-country-pages-61-68` deployment from the final reviewed QA head. Record the deployment, rendered-check run, artifact, digest, representative routes, and any errors before publication.
