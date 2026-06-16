export const validateShape = (data) =>
  Object.keys(data ?? {}).length === 9 ? [] : ['handoff top-level field count is invalid'];
