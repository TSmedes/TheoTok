/**
 * Persisted zustand stores import AsyncStorage at module scope, which throws
 * outside a native runtime. The library ships a mock for exactly this; wiring
 * it here rather than per-test keeps store imports free of ceremony.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

/**
 * Same story for Reanimated: importing it outside a native runtime fails on the
 * missing native module, and `jest-expo` ships no mock of its own. The library's
 * own mock returns inert animated components, which is all the tests here need —
 * they cover the pure arithmetic behind the animations, never the frames.
 */
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
