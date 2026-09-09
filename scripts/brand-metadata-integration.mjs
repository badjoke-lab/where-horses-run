import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BRAND_PATH = '/brand/whr-mark.png';
const BRAND_WIDTH = '160';
const BRAND_HEIGHT = '108';

async function walkHtml(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtml(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function replaceMetaContent(html, selectorPattern, value) {
  return html.replace(
    new RegExp(`(<meta\\s+${selectorPattern}\\s+content=")[^"]*("\\s*\\/?>)`, 'i'),
    `$1${value}$2`,
  );
}

function applyBrandMetadata(html) {
  const isJapanese = /<html[^>]+lang=["']ja["']/i.test(html);
  const alt = isJapanese ? '競馬どこ？ / Where Horses Run のロゴ' : 'Where Horses Run logo';

  let output = html.replaceAll('/social/whr-social-card-v1.png', BRAND_PATH);
  output = replaceMetaContent(output, 'property="og:image:width"', BRAND_WIDTH);
  output = replaceMetaContent(output, 'property="og:image:height"', BRAND_HEIGHT);
  output = replaceMetaContent(output, 'property="og:image:alt"', alt);
  output = replaceMetaContent(output, 'name="twitter:card"', 'summary');
  output = replaceMetaContent(output, 'name="twitter:image:alt"', alt);

  if (!/<link\s+rel=["']icon["']/i.test(output)) {
    output = output.replace(
      /(<meta\s+name=["']viewport["'][^>]*>)/i,
      `$1\n    <link rel="icon" type="image/png" href="${BRAND_PATH}" />`,
    );
  }

  return output;
}

export default function brandMetadataIntegration() {
  return {
    name: 'where-horses-run-brand-metadata',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outputDirectory = fileURLToPath(dir);
        const htmlFiles = await walkHtml(outputDirectory);
        let updated = 0;
        for (const filePath of htmlFiles) {
          const current = await fs.readFile(filePath, 'utf8');
          const next = applyBrandMetadata(current);
          if (next === current) continue;
          await fs.writeFile(filePath, next);
          updated += 1;
        }
        logger.info(`Applied WHR brand favicon/social metadata to ${updated} HTML files.`);
      },
    },
  };
}

export { applyBrandMetadata, BRAND_HEIGHT, BRAND_PATH, BRAND_WIDTH };
