import fs from 'node:fs/promises';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const WIDTH = 1200;
const HEIGHT = 630;
const OUTPUT_PATH = 'social/whr-social-card-v1.png';
const BACKGROUND = [247, 246, 242];
const INK = [17, 17, 17];
const MUTED = [205, 202, 194];

const FONT = {
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  B: ['11110','10001','10001','11110','10001','10001','11110'],
  C: ['01111','10000','10000','10000','10000','10000','01111'],
  D: ['11110','10001','10001','10001','10001','10001','11110'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  F: ['11111','10000','10000','11110','10000','10000','10000'],
  G: ['01111','10000','10000','10111','10001','10001','01110'],
  H: ['10001','10001','10001','11111','10001','10001','10001'],
  I: ['11111','00100','00100','00100','00100','00100','11111'],
  J: ['00111','00010','00010','00010','10010','10010','01100'],
  K: ['10001','10010','10100','11000','10100','10010','10001'],
  L: ['10000','10000','10000','10000','10000','10000','11111'],
  M: ['10001','11011','10101','10101','10001','10001','10001'],
  N: ['10001','11001','10101','10011','10001','10001','10001'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  P: ['11110','10001','10001','11110','10000','10000','10000'],
  Q: ['01110','10001','10001','10001','10101','10010','01101'],
  R: ['11110','10001','10001','11110','10100','10010','10001'],
  S: ['01111','10000','10000','01110','00001','00001','11110'],
  T: ['11111','00100','00100','00100','00100','00100','00100'],
  U: ['10001','10001','10001','10001','10001','10001','01110'],
  V: ['10001','10001','10001','10001','10001','01010','00100'],
  W: ['10001','10001','10001','10101','10101','10101','01010'],
  X: ['10001','10001','01010','00100','01010','10001','10001'],
  Y: ['10001','10001','01010','00100','00100','00100','00100'],
  Z: ['11111','00001','00010','00100','01000','10000','11111'],
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
};

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

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function createCanvas() {
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);
  for (let offset = 0; offset < pixels.length; offset += 3) {
    pixels[offset] = BACKGROUND[0];
    pixels[offset + 1] = BACKGROUND[1];
    pixels[offset + 2] = BACKGROUND[2];
  }
  return pixels;
}

function setPixel(pixels, x, y, color) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  const offset = (y * WIDTH + x) * 3;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
}

function fillRect(pixels, x, y, width, height, color) {
  for (let row = Math.max(0, y); row < Math.min(HEIGHT, y + height); row += 1) {
    for (let column = Math.max(0, x); column < Math.min(WIDTH, x + width); column += 1) {
      setPixel(pixels, column, row, color);
    }
  }
}

function line(pixels, x0, y0, x1, y1, color, thickness = 1) {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  let x = x0;
  let y = y0;
  while (true) {
    fillRect(pixels, x - Math.floor(thickness / 2), y - Math.floor(thickness / 2), thickness, thickness, color);
    if (x === x1 && y === y1) break;
    const doubled = 2 * error;
    if (doubled >= dy) {
      error += dy;
      x += sx;
    }
    if (doubled <= dx) {
      error += dx;
      y += sy;
    }
  }
}

function ellipse(pixels, centerX, centerY, radiusX, radiusY, color, thickness = 1) {
  const steps = Math.ceil(2 * Math.PI * Math.max(radiusX, radiusY) * 1.5);
  let previous = null;
  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2;
    const point = [
      Math.round(centerX + radiusX * Math.cos(angle)),
      Math.round(centerY + radiusY * Math.sin(angle)),
    ];
    if (previous) line(pixels, previous[0], previous[1], point[0], point[1], color, thickness);
    previous = point;
  }
}

function drawText(pixels, text, x, y, scale, color, spacing = 1) {
  let cursor = x;
  for (const rawCharacter of text.toUpperCase()) {
    const character = FONT[rawCharacter] ?? FONT[' '];
    for (let row = 0; row < character.length; row += 1) {
      for (let column = 0; column < character[row].length; column += 1) {
        if (character[row][column] === '1') {
          fillRect(pixels, cursor + column * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    cursor += (5 + spacing) * scale;
  }
}

function renderCard() {
  const pixels = createCanvas();

  // Frame and hierarchy.
  line(pixels, 52, 52, WIDTH - 52, 52, INK, 3);
  line(pixels, WIDTH - 52, 52, WIDTH - 52, HEIGHT - 52, INK, 3);
  line(pixels, WIDTH - 52, HEIGHT - 52, 52, HEIGHT - 52, INK, 3);
  line(pixels, 52, HEIGHT - 52, 52, 52, INK, 3);
  drawText(pixels, 'WHERE HORSES RUN', 90, 88, 7, INK, 1);
  line(pixels, 90, 150, WIDTH - 90, 150, MUTED, 2);
  drawText(pixels, 'WHR', 90, 225, 27, INK, 1);
  drawText(pixels, 'CALENDARS  RACECOURSES  SOURCES', 92, 484, 5, INK, 1);

  // Abstract racecourse oval and finishing marker.
  ellipse(pixels, 960, 320, 165, 155, INK, 9);
  ellipse(pixels, 960, 320, 115, 105, MUTED, 4);
  line(pixels, 1088, 244, 1088, 394, INK, 8);
  fillRect(pixels, 1088, 246, 36, 18, INK);
  for (let angle = 205; angle <= 325; angle += 20) {
    const radians = angle * Math.PI / 180;
    const x = Math.round(960 + 151 * Math.cos(radians));
    const y = Math.round(320 + 141 * Math.sin(radians));
    ellipse(pixels, x, y, 5, 5, INK, 6);
  }

  const scanlines = Buffer.alloc((WIDTH * 3 + 1) * HEIGHT);
  for (let y = 0; y < HEIGHT; y += 1) {
    const target = y * (WIDTH * 3 + 1);
    scanlines[target] = 0;
    pixels.copy(scanlines, target + 1, y * WIDTH * 3, (y + 1) * WIDTH * 3);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0);
  header.writeUInt32BE(HEIGHT, 4);
  header[8] = 8;
  header[9] = 2;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(scanlines, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export default function socialCardIntegration() {
  return {
    name: 'where-horses-run-social-card',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outputDirectory = fileURLToPath(dir);
        const outputFile = path.join(outputDirectory, OUTPUT_PATH);
        const image = renderCard();
        await fs.mkdir(path.dirname(outputFile), { recursive: true });
        await fs.writeFile(outputFile, image);
        logger.info(`Generated ${OUTPUT_PATH} (${WIDTH}x${HEIGHT}, ${image.length} bytes).`);
      },
    },
  };
}

export { HEIGHT, OUTPUT_PATH, WIDTH, renderCard };
