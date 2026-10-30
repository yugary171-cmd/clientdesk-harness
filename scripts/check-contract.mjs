import openapiTS, { astToString } from 'openapi-typescript';
import { readFile, writeFile } from 'node:fs/promises';
const source = new URL('../src/contracts/openapi.json', import.meta.url);
const target = new URL('../src/contracts/generated.ts', import.meta.url);
const output = astToString(await openapiTS(source));
if (process.argv.includes('--write')) {
  await writeFile(target, output);
  console.log('Contract types generated.');
} else if ((await readFile(target, 'utf8')) !== output) {
  console.error('Contract types drifted. Run npm run contract:generate.');
  process.exitCode = 1;
} else {
  console.log('Contract types match.');
}
