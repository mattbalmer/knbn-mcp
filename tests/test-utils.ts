import * as fs from 'fs';
import * as path from 'path';

const tmpdir = path.join(__dirname, 'tmp');

export const createTempDir = (dir: string): string => {
  if (!dir) {
    throw new Error('Directory name must be provided');
  }
  const fullPath = path.join(tmpdir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
}

export const rmTempDir = (dir: string): void => {
  if (!dir) {
    throw new Error('Directory name must be provided');
  }
  const fullPath = path.join(tmpdir, dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}