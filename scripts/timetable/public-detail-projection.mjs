export function resolveDetailFieldVisibility(policy = {}) {
  const fields = policy.detail_fields ?? {};
  return {
    show_race_name: fields.show_race_name === true,
    show_distance: fields.show_distance === true,
    show_surface: fields.show_surface === true,
    show_course: fields.show_course === true,
  };
}

export function projectPublicTimetableRows(rowsInput = [], policy = {}) {
  const visibility = resolveDetailFieldVisibility(policy);
  const rows = (Array.isArray(rowsInput) ? rowsInput : []).map((row) => ({
    label: row.label,
    post_time_local: row.post_time_local,
    ...(visibility.show_race_name && row.race_name ? { race_name: row.race_name } : {}),
    ...(visibility.show_distance && Number.isFinite(row.distance_m) ? { distance_m: row.distance_m } : {}),
    ...(visibility.show_surface && row.surface ? { surface: row.surface } : {}),
    ...(visibility.show_course && row.course_label ? { course_label: row.course_label } : {}),
  }));

  return { visibility, rows };
}
