import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await mkdir(output, { recursive: true });
const html = await readFile(path.join(root, 'ventas-os.html'), 'utf8');
await writeFile(path.join(output, 'index.html'), html);
await writeFile(path.join(output, 'ventas-os.html'), html);
for (const directory of ['css', 'js']) {
  await cp(path.join(root, directory), path.join(output, directory), {
    recursive: true,
    filter: (source) => !source.endsWith('_pendiente.json')
  });
}
console.log('Ventas OS: sitio generado en dist/');
