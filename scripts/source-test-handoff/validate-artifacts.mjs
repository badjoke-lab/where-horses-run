export const validateArtifacts = (data) => {
  const errors = [];
  const artifacts = data.capture?.artifacts;
  if (!Array.isArray(artifacts) || artifacts.length === 0) return ['capture.artifacts is required'];
  artifacts.forEach((artifact, index) => {
    if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(artifact.role ?? '')) errors.push(`artifact ${index} role is invalid`);
    if (!/^[a-f0-9]{64}$/.test(artifact.sha256 ?? '')) errors.push(`artifact ${index} sha256 is invalid`);
    if (!Number.isInteger(artifact.size_bytes) || artifact.size_bytes < 0) errors.push(`artifact ${index} size is invalid`);
  });
  return errors;
};
