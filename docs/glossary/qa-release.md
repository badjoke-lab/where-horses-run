# Glossary public v1 QA release

Status: release ready

Release ID: `WHR-GLOSSARY-V1`

Work ID: `WHR-GLOSSARY-DICTIONARY-V1`

Implementation unit: `GLOSSARY-QA-RELEASE-01`

Last reviewed: 2026-07-16

## Release decision

The English and Japanese Where Horses Run glossary is ready to be treated as public v1.

This release freezes the currently reviewed concept IDs, public routes, category IDs, relationship graph, multilingual fields, beginner explanations, and publication boundaries. It does not prevent later reviewed additions, but any change to the frozen v1 contract must be explicit and validated as a later release.

## Public scope

```text
glossary concepts:              48
categories:                      9
localized category labels:      18
English term routes:            48
Japanese term routes:           48
relationship graph routes:       2
total glossary routes:          98
reviewed relationship edges:    57
connected components:            1
isolated concepts:                0
```

Every concept has:

- an English term and summary;
- a Japanese term and summary;
- a Japanese reading;
- an English beginner explanation;
- a Japanese beginner explanation;
- a reviewed category;
- a review status and date;
- a publication-boundary object;
- valid reciprocal related-term links.

## Frozen concept contract

The v1 contract contains 48 concept IDs. IDs and slugs remain identical, so the English route is `/glossary/{slug}/` and the Japanese route is `/ja/glossary/{slug}/`.

The release keeps the existing nine categories:

1. Racing type;
2. Breed;
3. Horse type;
4. Role;
5. Data term;
6. Official source;
7. Governance term;
8. Track term;
9. Surface.

Category IDs remain machine-readable while the public pages display localized English and Japanese labels.

## Relationship contract

The reviewed graph contains 48 nodes and 57 undirected edges. All relationships are stored reciprocally, there are no self-loops or duplicate edges, and every concept belongs to the same connected component.

The frozen graph digest is:

```text
sha256:b4a653f0417bc0b2fb61aff8d10fbc811fd4a433100e9f90f92ece415102a849
```

A related-term connection is navigational context. It does not mean that the connected concepts are synonyms or interchangeable.

## User-visible release state

The English and Japanese glossary indexes display:

- public v1 release status;
- 48 reviewed concepts;
- 57 reviewed relationships;
- a link to the localized relationship graph.

Both indexes carry the machine-readable marker:

```html
data-glossary-release="WHR-GLOSSARY-V1"
```

Every term detail page continues to show the reviewed definition, localized category, reading, beginner explanation, related terms, review state, and public-data boundary where applicable.

## Public boundary

Glossary public v1 provides definitions and navigation only.

It does not publish:

- participant datasets;
- complete racecards or entries;
- odds;
- results;
- payouts;
- predictions or betting advice;
- raw source bodies;
- embedded videos;
- direct stream URLs.

The release does not activate live fetching, automatic source acceptance, automatic translation, automatic text generation, automatic publication, or deployment.

## Validation

The final permanent gate:

- runs all nine earlier glossary release gates;
- rebuilds all 98 glossary routes;
- validates the exact 48 concept IDs and route patterns;
- validates the nine category counts and 18 localized labels;
- validates every required English and Japanese field;
- validates all readings and paired beginner explanations;
- validates the 57-edge digest, reciprocity, and graph connectivity;
- validates rendered release, schema, content, category, beginner, and public-boundary markers;
- checks that prohibited dataset language is not rendered as live content;
- confirms the repository remains clean;
- performs no publication or deployment.

## Completed glossary units

1. `GLOSSARY-SCHEMA-EXTENSION-01`;
2. `GLOSSARY-RACING-TYPE-EXPANSION-01`;
3. `GLOSSARY-HORSE-BREED-EXPANSION-01`;
4. `GLOSSARY-ROLE-EXPANSION-01`;
5. `GLOSSARY-TIMETABLE-TERM-EXPANSION-01`;
6. `GLOSSARY-OFFICIAL-SOURCE-TERM-EXPANSION-01`;
7. `GLOSSARY-MULTILINGUAL-FIELD-CLEANUP-01`;
8. `GLOSSARY-RELATED-TERMS-GRAPH-01`;
9. `GLOSSARY-BEGINNER-EXPLANATIONS-01`;
10. `GLOSSARY-QA-RELEASE-01`.

## Next work

The glossary work ID is complete after this release. The next work ID is `WHR-SEARCH-FILTER-SEO-V1`.
