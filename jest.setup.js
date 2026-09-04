/**
 * Persisted zustand stores import AsyncStorage at module scope, which throws
 * outside a native runtime. The library ships a mock for exactly this; wiring
 * it here rather than per-test keeps store imports free of ceremony.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

/*
 * Reanimated needs no mock here, but it does need the `resolver` entry in this
 * package's jest config. Reanimated 4 imports `react-native-worklets`, whose
 * `NativeWorklets.native.ts` throws outside a native runtime — and its own
 * shipped mock re-imports the real module, so it crashes in the same way.
 * `react-native-worklets/jest/resolver.js` is the supported answer: it drops the
 * `.native` extension when resolving that package, so the stub is picked up and
 * the real JS runs.
 */
