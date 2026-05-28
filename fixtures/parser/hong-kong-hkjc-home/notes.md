# Hong Kong HKJC fixture notes

Status: public-safe manual fixture  
Source id: hong-kong-hkjc-home  
Phase: M2b Generated Pipeline Foundation

This fixture is a small artificial sample for parser development.

It is not a copied HKJC racecard page.

## Purpose

This fixture checks that a future parser can recognize a simple meeting-like block and normalize it into the expected parser output shape.

## Safety boundary

This fixture intentionally does not include:

- full racecards
- entries
- odds
- results
- payouts
- betting tips
- copied page bodies
- credentials
- hidden access details

## Expected behavior

A future parser should return:

- source_id: hong-kong-hkjc-home
- status: ok
- meetings as an array
- one Sha Tin placeholder meeting
- warnings as an array
- errors as an array

## Notes

The fixture is not live schedule data. Official sources remain the confirmation point.
