import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
const files = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bsk-[A-Za-z0-9_-]{24,}/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\bAKIA[A-Z0-9]{16}\b/,
];
let count = 0;
for (const file of files) {
  if (
    file === 'package-lock.json' ||
    file === 'public/mockServiceWorker.js' ||
    !/\.(?:[cm]?[jt]sx?|json|md|yml|yaml|html|css|example|demo)$/.test(file)
  )
    continue;
  const source = await readFile(file, 'utf8');
  source.split('\n').forEach((line, index) => {
    if (patterns.some((pattern) => pattern.test(line))) {
      console.error(`${file}:${index + 1}: possible secret (value suppressed)`);
      count++;
    }
  });
}
console.log(`Secret-pattern scan: ${count} findings. Not a guarantee against all secret formats.`);
if (count) process.exitCode = 1;
