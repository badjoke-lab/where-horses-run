# Glossary related-terms graph

Status: implemented for review

Work ID: `WHR-GLOSSARY-DICTIONARY-V1`

Implementation unit: `GLOSSARY-RELATED-TERMS-GRAPH-01`

Last reviewed: 2026-07-16

## Purpose

Formalize the reviewed relationships between all released glossary concepts without changing concept IDs, canonical terms, categories, evidence status, or publication boundaries.

## Baseline

```text
glossary nodes: 48
reviewed undirected edges: 34
connected components: 18
isolated nodes: 8
bilingual term routes: 96
graph pages: 0
```

The isolated concepts were Racecourse, Turf, Dirt, All-weather course, Left-handed course, Right-handed course, Both-directions course, and Straight course.

## Implemented graph

```text
glossary nodes: 48
reviewed undirected edges: 57
added edges: 23
connected components: 1
isolated nodes: 0
bilingual term routes: 96
graph pages: 2
```

The relationship patch is additive. It may add a reviewed connection to an existing concept but cannot remove an earlier relationship or create a concept ID.

## Connection groups

### Racecourse, surface, and layout

Racecourse is connected to Turf, Dirt, All-weather course, Jump course, the four direction/layout concepts, Racecourse operator, and Banei racing.

Flat racing is connected to Turf, Dirt, All-weather course, Arabian racing, and Quarter Horse racing. This describes useful navigation and does not make a surface, breed, or race type synonymous with another concept.

### Schedule, documents, and participants

Meeting is connected to Racecard. Entries is connected to Jockey, Driver, Trainer, and Owner. These links connect schedule and participant concepts without publishing participant datasets.

### Market and outcome

Odds is connected to Payouts while preserving their distinct definitions. Results remains connected to Payouts.

### Source and governance

Official source is connected to Governing body and Racing authority. Racecourse operator connects the official-source group to Racecourse.

## Graph rules

- the graph is undirected;
- every stored relationship must be reciprocal;
- self-loops are prohibited;
- duplicate edges are prohibited;
- isolated nodes are prohibited after this unit;
- relationships are navigational and do not imply synonymy;
- relationship patches are additive;
- category boundaries remain unchanged;
- concept IDs and term routes remain unchanged.

## Public pages

Two pages expose the reviewed adjacency graph:

- `/glossary/relationships/`;
- `/ja/glossary/relationships/`.

Each page shows 48 nodes, 57 edges, the localized category of every node, and its reviewed neighboring concepts. Detail pages also show the category of each related term and link to the full graph.

## Public boundary

This unit publishes definitions and navigation only.

It does not:

- infer relationships automatically;
- add or remove concepts;
- publish participant, odds, result, or payout datasets;
- copy raw source bodies;
- change source acceptance;
- publish or deploy generated data.

## Runtime and validation

The permanent gate:

- builds 96 bilingual term routes and two graph pages;
- preserves the previous seven glossary contracts;
- proves the pre-patch graph contains 48 nodes, 34 edges, 18 connected components, and eight isolated nodes;
- validates the 23 additive edges and the final edge digest;
- proves the final graph contains 48 nodes, 57 edges, one connected component, and no isolated nodes;
- rejects missing endpoints, self-loops, duplicate edges, and nonreciprocal relationships;
- verifies graph summaries, adjacency lists, categories, related-term IDs, and links in English and Japanese;
- proves no concept ID or term route changed;
- proves the repository remains clean;
- performs no network request, automatic relation inference, publication, or deployment.

## Next unit

`GLOSSARY-BEGINNER-EXPLANATIONS-01` will expand beginner explanations while preserving the reviewed graph.
