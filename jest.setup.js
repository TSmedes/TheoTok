/**
 * Persisted zustand stores import AsyncStorage at module scope, which throws
 * outside a native runtime. The library ships a mock for exactly this; wiring
 * it here rather than per-test keeps store imports free of ceremony.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
