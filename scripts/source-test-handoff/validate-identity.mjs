const text = (value) => typeof value === 'string' && value.trim().length > 0;
const slug = (value) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

export const validateIdentity = (data) => {
  const errors = [];
  const country = data.country ?? {};
  const source = data.source ?? {};
  if (!slug(data.evidence_id)) errors.push('evidence_id is invalid');
  if (!/^\d{2}$/.test(country.delivery_no ?? '')) errors.push('country.delivery_no is invalid');
  if (!slug(country.slug)) errors.push('country.slug is invalid');
  if (!text(country.name_en) || !text(country.name_ja)) errors.push('country names are required');
  if (!slug(source.source_id)) errors.push('source.source_id is invalid');
  if (!text(source.document_owner)) errors.push('source.document_owner is required');
  if (!text(source.public_distributor)) errors.push('source.public_distributor is required');
  if (!text(source.content_type)) errors.push('source.content_type is required');
  return errors;
};
