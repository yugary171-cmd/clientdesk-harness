export type Scenario = 'normal' | 'slow' | 'error-once' | 'empty-lists';
export type DemoState = { persistent: boolean; warning: string; scenario: Scenario };
export type DemoRuntime = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => DemoState;
  reset: () => Promise<void>;
  setScenario: (mode: Scenario) => void;
  dispose: () => Promise<void>;
};
