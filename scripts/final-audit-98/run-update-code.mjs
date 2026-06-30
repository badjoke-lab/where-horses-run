import fs from 'node:fs';

try {
  await import('./update-code.mjs');
} catch (error) {
  fs.mkdirSync('artifacts/final-audit-98', { recursive: true });
  fs.writeFileSync('artifacts/final-audit-98/update-code-error.txt', `${error.stack || error.message || String(error)}\n`);
  console.error('FINAL_AUDIT_UPDATE_CODE_FAILED');
  process.exit(1);
}
