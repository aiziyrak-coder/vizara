import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

await esbuild.build({
  entryPoints: [path.join(root, 'server/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: path.join(root, 'dist-server/index.js'),
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
});

console.log('Server built → dist-server/index.js');
