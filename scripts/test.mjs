import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
const runs = [
  ['node_modules/vitest/vitest.mjs', 'run', ...process.argv.slice(2)],
  [
    '--test',
    ...readdirSync('scripts')
      .filter((file) => file.endsWith('.test.mjs'))
      .map((file) => `scripts/${file}`),
  ],
];
for (const args of runs) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    if (result.error) console.error(result.error.message);
    process.exit(result.status ?? 1);
  }
}
