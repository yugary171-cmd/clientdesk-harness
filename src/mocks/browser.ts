import { setupWorker } from 'msw/browser';
import { createHandlers, type ScenarioState } from './handlers';
import { createRepository } from './repository';
import { createSeed, type Snapshot } from './seed';
import { loadSnapshot, saveSnapshot } from './storage';
import type { DemoState, Scenario } from '../shared/demo';
export async function initializeDemo(mode: 'stored' | 'reset' | 'memory' = 'stored') {
  let seed: Snapshot;
  let storage: Storage | undefined;
  if (mode === 'memory') seed = createSeed();
  else {
    storage = window.localStorage;
    seed = mode === 'reset' ? createSeed() : loadSnapshot(storage);
  }
  let state: DemoState = {
    persistent: mode !== 'memory',
    warning: mode === 'memory' ? '当前为内存模式，刷新后数据不保留；原有存储未修改。' : '',
    scenario: 'normal',
  };
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<DemoState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };
  const persist = (value: Snapshot) => {
    if (!state.persistent || !storage) return;
    try {
      saveSnapshot(storage, value);
    } catch {
      publish({
        persistent: false,
        warning: '本地存储不可写，已切换内存模式；刷新可能丢失本次更改。',
      });
    }
  };
  const repository = createRepository({ seed, onChange: persist });
  const scenario: ScenarioState = {
    current: 'normal',
    onConsumed: () => publish({ scenario: 'normal' }),
  };
  const worker = setupWorker(...createHandlers(repository, scenario));
  await worker.start({
    quiet: true,
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api/')) print.error();
    },
  });
  persist(seed);
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
    async reset() {
      scenario.current = 'normal';
      repository.reset();
      publish({ scenario: 'normal' });
    },
    setScenario(mode: Scenario) {
      scenario.current = mode;
      publish({ scenario: mode });
    },
    dispose: async () => {
      worker.stop();
    },
  };
}
export type DemoRuntime = Awaited<ReturnType<typeof initializeDemo>>;
