import fs from 'node:fs/promises';
import path from 'node:path';
import { deflateSync, inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const FAVICON_ICO_PATH = '/favicon.ico';
const FAVICON_16_PATH = '/favicon-16x16.png';
const FAVICON_32_PATH = '/favicon-32x32.png';
const FAVICON_48_PATH = '/favicon-48x48.png';
const APPLE_TOUCH_PATH = '/apple-touch-icon.png';
const OG_PATH = '/social/whr-og.png';
const OG_WIDTH = '1200';
const OG_HEIGHT = '630';

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
  const alt = isJapanese
    ? '白背景に競馬どこ？ / Where Horses Run のロゴ'
    : 'Where Horses Run logo on a white background';

  let output = replaceMetaContent(html, 'property="og:image"', OG_PATH);
  output = replaceMetaContent(output, 'property="og:image:secure_url"', OG_PATH);
  output = replaceMetaContent(output, 'property="og:image:width"', OG_WIDTH);
  output = replaceMetaContent(output, 'property="og:image:height"', OG_HEIGHT);
  output = replaceMetaContent(output, 'property="og:image:alt"', alt);
  output = replaceMetaContent(output, 'name="twitter:card"', 'summary_large_image');
  output = replaceMetaContent(output, 'name="twitter:image"', OG_PATH);
  output = replaceMetaContent(output, 'name="twitter:image:alt"', alt);

  output = output.replace(
    /\s*<link\s+rel=["'](?:shortcut\s+)?icon["'][^>]*>\s*/gi,
    '\n',
  );
  output = output.replace(
    /\s*<link\s+rel=["']apple-touch-icon["'][^>]*>\s*/gi,
    '\n',
  );

  const iconLinks = [
    `    <link rel="icon" href="${FAVICON_ICO_PATH}" sizes="any" />`,
    `    <link rel="icon" type="image/png" sizes="32x32" href="${FAVICON_32_PATH}" />`,
    `    <link rel="icon" type="image/png" sizes="16x16" href="${FAVICON_16_PATH}" />`,
    `    <link rel="apple-touch-icon" sizes="180x180" href="${APPLE_TOUCH_PATH}" />`,
  ].join('\n');

  output = output.replace(
    /(<meta\s+name=["']viewport["'][^>]*>)/i,
    `$1\n${iconLinks}`,
  );

  return output;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const value of buffer) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePng(buffer) {
  const signature = buffer.subarray(0, 8);
  if (!signature.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error('WHR brand mark is not a PNG file.');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette = null;
  let transparency = null;
  const idat = [];

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'PLTE') {
      palette = data;
    } else if (type === 'tRNS') {
      transparency = data;
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (bitDepth !== 8 || interlace !== 0) {
    throw new Error(`Unsupported WHR brand PNG: bitDepth=${bitDepth}, interlace=${interlace}.`);
  }

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`Unsupported WHR brand PNG color type ${colorType}.`);
  if (colorType === 3 && !palette) throw new Error('Indexed WHR brand PNG has no palette.');

  const scanlineLength = width * channels;
  const inflated = inflateSync(Buffer.concat(idat));
  const expected = height * (scanlineLength + 1);
  if (inflated.length < expected) {
    throw new Error(`WHR brand PNG scanlines are truncated (${inflated.length} < ${expected}).`);
  }

  const raw = Buffer.alloc(width * height * channels);
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const rowOffset = y * scanlineLength;
    const previousOffset = (y - 1) * scanlineLength;

    for (let x = 0; x < scanlineLength; x += 1) {
      const encoded = inflated[sourceOffset + x];
      const left = x >= channels ? raw[rowOffset + x - channels] : 0;
      const up = y > 0 ? raw[previousOffset + x] : 0;
      const upLeft = y > 0 && x >= channels ? raw[previousOffset + x - channels] : 0;
      let value;
      if (filter === 0) value = encoded;
      else if (filter === 1) value = (encoded + left) & 0xff;
      else if (filter === 2) value = (encoded + up) & 0xff;
      else if (filter === 3) value = (encoded + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) value = (encoded + paethPredictor(left, up, upLeft)) & 0xff;
      else throw new Error(`Unsupported PNG filter ${filter}.`);
      raw[rowOffset + x] = value;
    }
    sourceOffset += scanlineLength;
  }

  const rgba = Buffer.alloc(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const source = pixel * channels;
    const target = pixel * 4;
    if (colorType === 3) {
      const index = raw[source];
      rgba[target] = palette[index * 3] ?? 0;
      rgba[target + 1] = palette[index * 3 + 1] ?? 0;
      rgba[target + 2] = palette[index * 3 + 2] ?? 0;
      rgba[target + 3] = transparency && index < transparency.length ? transparency[index] : 255;
    } else if (colorType === 6) {
      rgba[target] = raw[source];
      rgba[target + 1] = raw[source + 1];
      rgba[target + 2] = raw[source + 2];
      rgba[target + 3] = raw[source + 3];
    } else if (colorType === 2) {
      rgba[target] = raw[source];
      rgba[target + 1] = raw[source + 1];
      rgba[target + 2] = raw[source + 2];
      rgba[target + 3] = 255;
    } else if (colorType === 0) {
      rgba[target] = raw[source];
      rgba[target + 1] = raw[source];
      rgba[target + 2] = raw[source];
      rgba[target + 3] = 255;
    } else if (colorType === 4) {
      rgba[target] = raw[source];
      rgba[target + 1] = raw[source];
      rgba[target + 2] = raw[source];
      rgba[target + 3] = raw[source + 1];
    }
  }

  return { width, height, rgba };
}

function encodePng({ width, height, rgba }) {
  const scanlineLength = width * 4;
  const scanlines = Buffer.alloc((scanlineLength + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const target = y * (scanlineLength + 1);
    scanlines[target] = 0;
    rgba.copy(scanlines, target + 1, y * scanlineLength, (y + 1) * scanlineLength);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function transparentBrand(source) {
  const rgba = Buffer.from(source.rgba);
  let transparentBorder = 0;
  let borderCount = 0;
  const counts = new Map();

  const addBorderPixel = (x, y) => {
    const offset = (y * source.width + x) * 4;
    const alpha = rgba[offset + 3];
    borderCount += 1;
    if (alpha === 0) {
      transparentBorder += 1;
      return;
    }
    const key = `${rgba[offset]},${rgba[offset + 1]},${rgba[offset + 2]}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  };

  for (let x = 0; x < source.width; x += 1) {
    addBorderPixel(x, 0);
    if (source.height > 1) addBorderPixel(x, source.height - 1);
  }
  for (let y = 1; y < source.height - 1; y += 1) {
    addBorderPixel(0, y);
    if (source.width > 1) addBorderPixel(source.width - 1, y);
  }

  if (transparentBorder / Math.max(borderCount, 1) < 0.5 && counts.size > 0) {
    const [backgroundKey] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    const background = backgroundKey.split(',').map(Number);
    for (let offset = 0; offset < rgba.length; offset += 4) {
      const distance = Math.max(
        Math.abs(rgba[offset] - background[0]),
        Math.abs(rgba[offset + 1] - background[1]),
        Math.abs(rgba[offset + 2] - background[2]),
      );
      if (distance <= 8) rgba[offset + 3] = 0;
    }
  }

  return { width: source.width, height: source.height, rgba };
}

function cropTransparent(source) {
  let minX = source.width;
  let minY = source.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const alpha = source.rgba[(y * source.width + x) * 4 + 3];
      if (alpha <= 8) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return source;

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const from = ((minY + y) * source.width + minX) * 4;
    source.rgba.copy(rgba, y * width * 4, from, from + width * 4);
  }
  return { width, height, rgba };
}

function createCanvas(width, height, background = [0, 0, 0, 0]) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let offset = 0; offset < rgba.length; offset += 4) {
    rgba[offset] = background[0];
    rgba[offset + 1] = background[1];
    rgba[offset + 2] = background[2];
    rgba[offset + 3] = background[3];
  }
  return { width, height, rgba };
}

function compositeContain(source, canvas, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / source.width, maxHeight / source.height);
  const drawWidth = Math.max(1, Math.round(source.width * scale));
  const drawHeight = Math.max(1, Math.round(source.height * scale));
  const startX = Math.floor((canvas.width - drawWidth) / 2);
  const startY = Math.floor((canvas.height - drawHeight) / 2);

  for (let y = 0; y < drawHeight; y += 1) {
    const sourceY = Math.min(source.height - 1, Math.max(0, (y + 0.5) / scale - 0.5));
    const y0 = Math.floor(sourceY);
    const y1 = Math.min(source.height - 1, y0 + 1);
    const fy = sourceY - y0;

    for (let x = 0; x < drawWidth; x += 1) {
      const sourceX = Math.min(source.width - 1, Math.max(0, (x + 0.5) / scale - 0.5));
      const x0 = Math.floor(sourceX);
      const x1 = Math.min(source.width - 1, x0 + 1);
      const fx = sourceX - x0;

      const samples = [
        [(y0 * source.width + x0) * 4, (1 - fx) * (1 - fy)],
        [(y0 * source.width + x1) * 4, fx * (1 - fy)],
        [(y1 * source.width + x0) * 4, (1 - fx) * fy],
        [(y1 * source.width + x1) * 4, fx * fy],
      ];
      const pixel = [0, 0, 0, 0];
      for (const [offset, weight] of samples) {
        for (let channel = 0; channel < 4; channel += 1) {
          pixel[channel] += source.rgba[offset + channel] * weight;
        }
      }

      const target = ((startY + y) * canvas.width + startX + x) * 4;
      const sourceAlpha = pixel[3] / 255;
      const targetAlpha = canvas.rgba[target + 3] / 255;
      const outAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);
      if (outAlpha <= 0) continue;
      for (let channel = 0; channel < 3; channel += 1) {
        const sourceValue = pixel[channel] / 255;
        const targetValue = canvas.rgba[target + channel] / 255;
        const outValue = (sourceValue * sourceAlpha + targetValue * targetAlpha * (1 - sourceAlpha)) / outAlpha;
        canvas.rgba[target + channel] = Math.round(outValue * 255);
      }
      canvas.rgba[target + 3] = Math.round(outAlpha * 255);
    }
  }

  return canvas;
}

function makeSquareIcon(source, size, background) {
  const canvas = createCanvas(size, size, background);
  const padding = Math.max(1, Math.round(size * 0.08));
  return compositeContain(source, canvas, size - padding * 2, size - padding * 2);
}

function makeOgCard(source) {
  const canvas = createCanvas(1200, 630, [255, 255, 255, 255]);
  return compositeContain(source, canvas, 720, 360);
}

function encodeIco(pngEntries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngEntries.length, 4);

  const directory = Buffer.alloc(pngEntries.length * 16);
  let imageOffset = 6 + directory.length;
  pngEntries.forEach(({ size, png }, index) => {
    const entry = index * 16;
    directory[entry] = size >= 256 ? 0 : size;
    directory[entry + 1] = size >= 256 ? 0 : size;
    directory[entry + 2] = 0;
    directory[entry + 3] = 0;
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(png.length, entry + 8);
    directory.writeUInt32LE(imageOffset, entry + 12);
    imageOffset += png.length;
  });

  return Buffer.concat([header, directory, ...pngEntries.map(({ png }) => png)]);
}

async function generateBrandAssets(outputDirectory) {
  const sourcePath = path.resolve(process.cwd(), 'public/brand/whr-mark.png');
  const source = cropTransparent(transparentBrand(decodePng(await fs.readFile(sourcePath))));

  const favicon16 = encodePng(makeSquareIcon(source, 16, [0, 0, 0, 0]));
  const favicon32 = encodePng(makeSquareIcon(source, 32, [0, 0, 0, 0]));
  const favicon48 = encodePng(makeSquareIcon(source, 48, [0, 0, 0, 0]));
  const appleTouch = encodePng(makeSquareIcon(source, 180, [255, 255, 255, 255]));
  const og = encodePng(makeOgCard(source));
  const ico = encodeIco([
    { size: 16, png: favicon16 },
    { size: 32, png: favicon32 },
    { size: 48, png: favicon48 },
  ]);

  const assets = [
    ['favicon-16x16.png', favicon16],
    ['favicon-32x32.png', favicon32],
    ['favicon-48x48.png', favicon48],
    ['favicon.ico', ico],
    ['apple-touch-icon.png', appleTouch],
    ['social/whr-og.png', og],
  ];

  for (const [relativePath, data] of assets) {
    const target = path.join(outputDirectory, relativePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
  }

  return assets.map(([relativePath]) => relativePath);
}

export default function brandMetadataIntegration() {
  return {
    name: 'where-horses-run-brand-metadata',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outputDirectory = fileURLToPath(dir);
        const assets = await generateBrandAssets(outputDirectory);
        const htmlFiles = await walkHtml(outputDirectory);
        let updated = 0;
        for (const filePath of htmlFiles) {
          const current = await fs.readFile(filePath, 'utf8');
          const next = applyBrandMetadata(current);
          if (next === current) continue;
          await fs.writeFile(filePath, next);
          updated += 1;
        }
        logger.info(`Generated WHR brand assets: ${assets.join(', ')}.`);
        logger.info(`Applied WHR favicon/social metadata to ${updated} HTML files.`);
      },
    },
  };
}

export {
  applyBrandMetadata,
  APPLE_TOUCH_PATH,
  FAVICON_ICO_PATH,
  FAVICON_16_PATH,
  FAVICON_32_PATH,
  FAVICON_48_PATH,
  generateBrandAssets,
  OG_HEIGHT,
  OG_PATH,
  OG_WIDTH,
};
