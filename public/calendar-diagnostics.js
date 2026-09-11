(() => {
  const params = new URL(window.location.href).searchParams;
  if (params.get('diag') !== 'calendar') return;

  const coverageText = (coverage) => {
    const total = Number(coverage?.rows ?? 0);
    return `T${coverage?.time ?? 0}/${total} N${coverage?.race_name ?? 0}/${total} D${coverage?.distance ?? 0}/${total} S${coverage?.surface ?? 0}/${total} C${coverage?.course ?? 0}/${total}`;
  };

  const makeLine = (label, value) => {
    const line = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    line.append(strong, document.createTextNode(value));
    return line;
  };

  const makePanel = (record, compact = false) => {
    const panel = document.createElement('aside');
    panel.className = compact ? 'whr-calendar-diag whr-calendar-diag--compact' : 'whr-calendar-diag';
    panel.setAttribute('data-calendar-diagnostic', 'true');
    panel.setAttribute('aria-label', 'Calendar acquisition diagnostics');

    const rank = record.canonical_rank ?? '—';
    const publicRank = record.effective_public_rank ?? '—';
    const disposition = record.disposition ?? '—';
    panel.append(makeLine('Rank', `${rank} · public ${publicRank} · ${disposition}`));
    panel.append(makeLine('Canonical', coverageText(record.canonical)));
    panel.append(makeLine('Public', coverageText(record.public)));
    if (!compact && record.last_checked_date) panel.append(makeLine('Last checked', record.last_checked_date));
    return panel;
  };

  const addStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .whr-calendar-diag {
        margin-block: .75rem 1rem;
        padding: .75rem .85rem;
        border: 1px dashed currentColor;
        border-radius: .5rem;
        font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        overflow-wrap: anywhere;
      }
      .whr-calendar-diag--compact {
        grid-column: 1 / -1;
        margin: .35rem 0 0;
        padding: .5rem .65rem;
      }
      .whr-calendar-diag strong { font-weight: 700; }
    `;
    document.head.append(style);
  };

  const detailMeetingId = () => {
    const match = window.location.pathname.match(/\/(?:ja\/)?timetable\/meetings\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  fetch('/calendar/diagnostics.json', { credentials: 'same-origin' })
    .then((response) => {
      if (!response.ok) throw new Error(`diagnostics HTTP ${response.status}`);
      return response.json();
    })
    .then((payload) => {
      const records = Array.isArray(payload?.meetings) ? payload.meetings : [];
      const byId = new Map(records.map((record) => [record.meeting_id, record]));
      addStyles();

      document.querySelectorAll('[data-calendar-meeting-row][data-meeting-id]').forEach((row) => {
        if (!(row instanceof HTMLElement)) return;
        const record = byId.get(row.dataset.meetingId);
        if (!record || row.querySelector('[data-calendar-diagnostic]')) return;
        row.append(makePanel(record, true));
      });

      const meetingId = detailMeetingId();
      if (!meetingId) return;
      const record = byId.get(meetingId);
      if (!record) return;
      const root = document.querySelector('[data-calendar-runtime-sensitive]');
      const firstSection = root?.querySelector('section');
      if (firstSection && !root?.querySelector('[data-calendar-diagnostic]')) {
        firstSection.insertAdjacentElement('afterend', makePanel(record, false));
      }
    })
    .catch((error) => {
      console.warn('Calendar diagnostics unavailable', error);
    });
})();
