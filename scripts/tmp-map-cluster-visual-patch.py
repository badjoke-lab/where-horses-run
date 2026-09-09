from pathlib import Path

component_path = Path('src/components/RacecourseMap.astro')
text = component_path.read_text()

old = """  const MAP_CLUSTER_LAYER = 'racecourse-clusters';
  const MAP_CLUSTER_COUNT_LAYER = 'racecourse-cluster-count';
  const MAP_CLUSTER_RUNNING_BADGE_LAYER = 'racecourse-cluster-running-badge';
  const MAP_CLUSTER_UPCOMING_BADGE_LAYER = 'racecourse-cluster-upcoming-badge';
"""
new = """  const MAP_CLUSTER_LAYER = 'racecourse-clusters';
  const MAP_CLUSTER_LIVE_GLOW_LAYER = 'racecourse-cluster-live-glow';
  const MAP_CLUSTER_STATUS_RING_LAYER = 'racecourse-cluster-status-ring';
  const MAP_CLUSTER_COUNT_LAYER = 'racecourse-cluster-count';
  const MAP_CLUSTER_RUNNING_BADGE_LAYER = 'racecourse-cluster-running-badge';
  const MAP_CLUSTER_UPCOMING_BADGE_LAYER = 'racecourse-cluster-upcoming-badge';
  const MAP_CLUSTER_LIVE_BADGE_IMAGE = 'racecourse-cluster-live-pill';
  const MAP_CLUSTER_UPCOMING_BADGE_IMAGE = 'racecourse-cluster-upcoming-pill';
"""
assert old in text, 'cluster constants anchor not found'
text = text.replace(old, new, 1)

old = """  const addDays = (dateText, days) => {
    const date = new Date(`${dateText}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };
"""
new = old + """

  const registerClusterPillImage = (map, name, fill, border) => {
    if (typeof map.hasImage === 'function' && map.hasImage(name)) return;
    const width = 56;
    const height = 20;
    const radius = height / 2;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.beginPath();
    context.moveTo(radius, 0.75);
    context.lineTo(width - radius, 0.75);
    context.arcTo(width - 0.75, 0.75, width - 0.75, radius, radius - 0.75);
    context.arcTo(width - 0.75, height - 0.75, width - radius, height - 0.75, radius - 0.75);
    context.lineTo(radius, height - 0.75);
    context.arcTo(0.75, height - 0.75, 0.75, radius, radius - 0.75);
    context.arcTo(0.75, 0.75, radius, 0.75, radius - 0.75);
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = border;
    context.lineWidth = 1.5;
    context.stroke();

    map.addImage(name, context.getImageData(0, 0, width, height), {
      pixelRatio: 1,
      stretchX: [[radius, width - radius]],
      content: [7, 3, width - 7, height - 3]
    });
  };
"""
assert old in text, 'addDays anchor not found'
text = text.replace(old, new, 1)

old = """    let statusRefresh = null;
    let hoverPopup = null;
"""
new = """    let statusRefresh = null;
    let clusterPulseTimer = null;
    let hoverPopup = null;
"""
assert old in text, 'runtime variable anchor not found'
text = text.replace(old, new, 1)

old = """      if (statusRefresh !== null) window.clearInterval(statusRefresh);
"""
new = """      if (statusRefresh !== null) window.clearInterval(statusRefresh);
      if (clusterPulseTimer !== null) window.clearInterval(clusterPulseTimer);
"""
assert old in text, 'fail cleanup anchor not found'
text = text.replace(old, new, 1)

start = text.index("        const clusterAllToday = ['==', ['get', 'today_count'], ['get', 'point_count']];")
end = text.index("        const pointBaseRadius = [", start)
replacement = """        const clusterAllToday = ['==', ['get', 'today_count'], ['get', 'point_count']];
        const clusterAllFuture = ['==', ['get', 'future_count'], ['get', 'point_count']];
        const clusterAllEnded = ['==', ['get', 'ended_count'], ['get', 'point_count']];
        const clusterAllNeutral = [
          '==',
          ['+', ['get', 'running_count'], ['get', 'upcoming_count'], ['get', 'today_count'], ['get', 'future_count'], ['get', 'ended_count']],
          0
        ];
        const clusterHasRunning = ['>', ['get', 'running_count'], 0];
        const clusterHasUpcoming = ['>', ['get', 'upcoming_count'], 0];
        const clusterHasPriorityState = ['any', clusterHasRunning, clusterHasUpcoming];

        registerClusterPillImage(map, MAP_CLUSTER_LIVE_BADGE_IMAGE, '#e53935', 'rgba(255, 255, 255, 0.58)');
        registerClusterPillImage(map, MAP_CLUSTER_UPCOMING_BADGE_IMAGE, '#fb8c00', 'rgba(255, 255, 255, 0.58)');

        map.addLayer({
          id: MAP_CLUSTER_LIVE_GLOW_LAYER,
          type: 'circle',
          source: MAP_SOURCE,
          filter: ['all', ['has', 'point_count'], clusterHasRunning],
          paint: {
            'circle-radius': 29,
            'circle-color': '#e53935',
            'circle-opacity': 0.16,
            'circle-blur': 0.72
          }
        });

        map.addLayer({
          id: MAP_CLUSTER_STATUS_RING_LAYER,
          type: 'circle',
          source: MAP_SOURCE,
          filter: ['all', ['has', 'point_count'], clusterHasPriorityState],
          paint: {
            'circle-radius': 24,
            'circle-color': [
              'case',
              clusterHasRunning, 'rgba(229, 57, 53, 0.22)',
              'rgba(251, 140, 0, 0.19)'
            ],
            'circle-stroke-color': [
              'case',
              clusterHasRunning, '#e53935',
              '#fb8c00'
            ],
            'circle-stroke-width': 4
          }
        });

        map.addLayer({
          id: MAP_CLUSTER_LAYER,
          type: 'circle',
          source: MAP_SOURCE,
          filter: ['has', 'point_count'],
          paint: {
            'circle-radius': 19,
            'circle-color': [
              'case',
              clusterHasPriorityState, '#59636f',
              clusterAllToday, '#fffcf4',
              clusterAllEnded, '#666666',
              clusterAllFuture, '#111111',
              clusterAllNeutral, '#ffffff',
              '#111111'
            ],
            'circle-stroke-color': [
              'case',
              clusterHasRunning, '#ff8b87',
              clusterHasUpcoming, '#ffd08a',
              clusterAllToday, '#7a5a00',
              clusterAllNeutral, '#777777',
              '#ffffff'
            ],
            'circle-stroke-width': [
              'case',
              clusterAllToday, 3,
              2
            ]
          }
        });

        map.addLayer({
          id: MAP_CLUSTER_COUNT_LAYER,
          type: 'symbol',
          source: MAP_SOURCE,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 12,
            'text-allow-overlap': true,
            'text-ignore-placement': true
          },
          paint: {
            'text-color': [
              'case',
              clusterHasPriorityState, '#ffffff',
              clusterAllToday, '#3b2b00',
              clusterAllNeutral, '#111111',
              '#ffffff'
            ]
          }
        });

        map.addLayer({
          id: MAP_CLUSTER_RUNNING_BADGE_LAYER,
          type: 'symbol',
          source: MAP_SOURCE,
          filter: ['all', ['has', 'point_count'], clusterHasRunning],
          layout: {
            'icon-image': MAP_CLUSTER_LIVE_BADGE_IMAGE,
            'icon-text-fit': 'width',
            'icon-text-fit-padding': [0, 6, 0, 6],
            'icon-offset': [0, -30],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'text-field': ['concat', 'LIVE ', ['to-string', ['get', 'running_count']]],
            'text-size': 10,
            'text-offset': [0, -3],
            'text-allow-overlap': true,
            'text-ignore-placement': true
          },
          paint: {
            'text-color': '#ffffff'
          }
        });

        map.addLayer({
          id: MAP_CLUSTER_UPCOMING_BADGE_LAYER,
          type: 'symbol',
          source: MAP_SOURCE,
          filter: ['all', ['has', 'point_count'], clusterHasUpcoming],
          layout: {
            'icon-image': MAP_CLUSTER_UPCOMING_BADGE_IMAGE,
            'icon-text-fit': 'width',
            'icon-text-fit-padding': [0, 6, 0, 6],
            'icon-offset': [0, 30],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'text-field': ['concat', 'UPCOMING ', ['to-string', ['get', 'upcoming_count']]],
            'text-size': 10,
            'text-offset': [0, 3],
            'text-allow-overlap': true,
            'text-ignore-placement': true
          },
          paint: {
            'text-color': '#ffffff'
          }
        });

        if (!reducedMotion) {
          const pulseStartedAt = performance.now();
          clusterPulseTimer = window.setInterval(() => {
            if (!map?.getLayer(MAP_CLUSTER_LIVE_GLOW_LAYER)) return;
            const phase = (Math.sin(((performance.now() - pulseStartedAt) / 900) * Math.PI) + 1) / 2;
            map.setPaintProperty(MAP_CLUSTER_LIVE_GLOW_LAYER, 'circle-radius', 28 + (phase * 2.5));
            map.setPaintProperty(MAP_CLUSTER_LIVE_GLOW_LAYER, 'circle-opacity', 0.10 + (phase * 0.12));
          }, 120);
        }

"""
text = text[:start] + replacement + text[end:]
component_path.write_text(text)

test_path = Path('scripts/check-calendar-presentation-color-map.mjs')
test = test_path.read_text()
old = r"""assert.match(
  racecourseMap,
  /'circle-color': \[[\s\S]*?\['>', \['get', 'running_count'\], 0\], '#c40000',[\s\S]*?\['>', \['get', 'upcoming_count'\], 0\], '#d18a00'/,
  'Map cluster emphasis must prioritize running over upcoming without redefining either state',
);
"""
new = r"""assert.match(
  racecourseMap,
  /const clusterHasRunning = \['>', \['get', 'running_count'\], 0\];[\s\S]*?const clusterHasUpcoming = \['>', \['get', 'upcoming_count'\], 0\];/,
  'Map cluster priority must still derive only from resolved running and upcoming child counts',
);
assert.match(
  racecourseMap,
  /id: MAP_CLUSTER_STATUS_RING_LAYER[\s\S]*?clusterHasRunning, '#e53935',[\s\S]*?'#fb8c00'/,
  'Map cluster status emphasis must move to a Live/Upcoming outer ring rather than filling the core',
);
assert.match(
  racecourseMap,
  /clusterHasPriorityState, '#59636f'/,
  'Live and Upcoming clusters must share a neutral core so total count and status emphasis remain visually separated',
);
assert.match(
  racecourseMap,
  /'icon-image': MAP_CLUSTER_LIVE_BADGE_IMAGE[\s\S]*?'icon-text-fit': 'width'[\s\S]*?'LIVE '/,
  'Live cluster counts must render as a fitted pill badge',
);
assert.match(
  racecourseMap,
  /'icon-image': MAP_CLUSTER_UPCOMING_BADGE_IMAGE[\s\S]*?'icon-text-fit': 'width'[\s\S]*?'UPCOMING '/,
  'Upcoming cluster counts must render as a fitted pill badge',
);
assert.match(
  racecourseMap,
  /MAP_CLUSTER_LIVE_GLOW_LAYER[\s\S]*?clusterPulseTimer = window\.setInterval/,
  'Live clusters must retain a dedicated glow layer with motion-aware pulse treatment',
);
"""
assert old in test, 'old cluster color assertion not found'
test = test.replace(old, new, 1)
test_path.write_text(test)
