# Where Horses Run — map runtime provider implementation note

Status: active implementation note  
Reviewed: 2026-09-06  
Applies to: MAP-004 and later shared map surfaces

## Selected runtime

Where Horses Run uses MapLibre GL JS for the interactive map client and OpenFreeMap for the initial basemap style.

Pinned client module:

```text
https://unpkg.com/maplibre-gl@6.7.0/dist/maplibre-gl.mjs
https://unpkg.com/maplibre-gl@6.7.0/dist/maplibre-gl.css
```

Initial basemap style:

```text
https://tiles.openfreemap.org/styles/liberty
```

## Review basis

- MapLibre GL JS is open source under the BSD-3-Clause license.
- MapLibre's current browser-ESM documentation supports loading the pinned module directly from a CDN.
- OpenFreeMap's official quick-start documentation publishes the Liberty style URL above for MapLibre use without an API key.
- OpenFreeMap describes the hosted service as free and provided as-is. Ordinary public map rendering must remain responsible use; provider terms and service suitability must be re-reviewed if traffic or usage materially changes.

## Attribution

MapLibre attribution controls remain enabled. Where Horses Run also renders a visible text attribution adjacent to the map identifying OpenFreeMap and OpenStreetMap contributors.

## Data boundary

The provider is used only to render the basemap and required map assets. Racecourse points come from the locally generated reviewed projection:

```text
/data/racecourse-locations-v1.geojson
```

No meeting schedule, race detail, racecard, result, betting information, or other racing-source content is fetched from MapLibre, OpenFreeMap, OpenStreetMap, or another map provider at page runtime.

## Failure boundary

The map is progressive enhancement. If the MapLibre module, basemap style, tiles, browser WebGL support, or local GeoJSON projection is unavailable, the ordinary page content remains present and the map area changes to an explicit unavailable state rather than removing racecourse or meeting information.
