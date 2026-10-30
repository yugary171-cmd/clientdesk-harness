import ts from 'typescript';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export function violation(from, to) {
  const feature = (file) => file.match(/^src\/features\/([^/]+)\//)?.[1];
  if (from.startsWith('src/features/') && feature(to) && feature(from) !== feature(to))
    return 'cross-feature internal import';
  if (
    from.startsWith('src/shared/') &&
    (to.startsWith('src/features/') || to.startsWith('src/app/'))
  )
    return 'shared reverse dependency';
  if (
    to.startsWith('src/mocks/') &&
    !from.startsWith('src/mocks/') &&
    !from.startsWith('src/demo/') &&
    from !== 'src/app/bootstrap.tsx'
  )
    return 'mock accessed outside bootstrap/demo';
  if (from.startsWith('src/features/') && to.startsWith('src/demo/'))
    return 'feature depends on demo';
  return null;
}
export function imports(source, filename) {
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  const result = [];
  function walk(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      result.push(node.moduleSpecifier.text);
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        node.expression.getText(ast) === 'require')
    ) {
      if (node.arguments.length !== 1 || !ts.isStringLiteral(node.arguments[0]))
        throw new Error(`${filename}: non-literal module import is not allowed`);
      result.push(node.arguments[0].text);
    }
    ts.forEachChild(node, walk);
  }
  walk(ast);
  return result;
}
async function walkFiles(dir) {
  const files = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const child = path.join(dir, item.name);
    if (item.isDirectory()) files.push(...(await walkFiles(child)));
    else if (/\.[cm]?[jt]sx?$/.test(child)) files.push(child);
  }
  return files;
}
async function main() {
  const root = process.cwd();
  const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
  const errors = [];
  for (const file of await walkFiles('src')) {
    for (const specifier of imports(await readFile(file, 'utf8'), file)) {
      const resolved = ts.resolveModuleName(
        specifier,
        path.resolve(file),
        options,
        ts.sys,
      ).resolvedModule;
      if (!resolved || resolved.isExternalLibraryImport) continue;
      const to = path.relative(root, resolved.resolvedFileName).split(path.sep).join('/');
      const problem = violation(file.split(path.sep).join('/'), to);
      if (problem) errors.push(`${file} -> ${to}: ${problem}`);
    }
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else console.log('Module boundaries passed.');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main();
