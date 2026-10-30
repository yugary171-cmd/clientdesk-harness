import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imports, violation } from './check-boundaries.mjs';
test('checks feature, shared and mock boundaries', () => {
  assert.ok(violation('src/features/tickets/Page.tsx', 'src/features/customers/queries.ts'));
  assert.ok(violation('src/shared/a.ts', 'src/features/tickets/queries.ts'));
  assert.ok(violation('src/features/tickets/a.ts', 'src/mocks/repository.ts'));
  assert.equal(violation('src/features/tickets/a.ts', 'src/shared/api/resources.ts'), null);
  assert.equal(violation('src/app/bootstrap.tsx', 'src/mocks/browser.ts'), null);
});
test('finds relative, alias, dynamic and re-export paths', () => {
  assert.deepEqual(
    imports(
      'import x from "../mocks/a"; export { y } from "@/features/x"; import("./dynamic");',
      'a.ts',
    ),
    ['../mocks/a', '@/features/x', './dynamic'],
  );
  assert.throws(() => imports('import(variable)', 'a.ts'));
});
