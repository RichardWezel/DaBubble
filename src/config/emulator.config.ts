/**
 * Host and ports of the local Firebase emulators.
 * These MUST stay in sync with the "emulators" block in firebase.json.
 */
export const EMULATOR_HOST = 'localhost';

export const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  storage: 9199,
} as const;
