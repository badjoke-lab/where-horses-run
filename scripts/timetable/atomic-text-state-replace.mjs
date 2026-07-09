import fs from 'node:fs';
import path from 'node:path';

function fsyncDirectory(directory) {
  const fd = fs.openSync(directory, 'r');
  try {
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

export function writeExclusiveDurableTextSync(targetPath, text) {
  const absolute = path.resolve(targetPath);
  const directory = path.dirname(absolute);
  fs.mkdirSync(directory, { recursive: true });
  const fd = fs.openSync(absolute, 'wx', 0o600);
  try {
    fs.writeFileSync(fd, text, 'utf8');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fsyncDirectory(directory);
}

export function atomicReplaceTextSync(targetPath, text) {
  const absolute = path.resolve(targetPath);
  const directory = path.dirname(absolute);
  const basename = path.basename(absolute);
  fs.mkdirSync(directory, { recursive: true });
  const temporary = path.join(directory, `.${basename}.${process.pid}.${Date.now()}.tmp`);
  let fd = null;
  try {
    fd = fs.openSync(temporary, 'wx', 0o600);
    fs.writeFileSync(fd, text, 'utf8');
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;
    fs.renameSync(temporary, absolute);
    fsyncDirectory(directory);
  } catch (error) {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch {}
    }
    try { fs.unlinkSync(temporary); } catch {}
    throw error;
  }
}
