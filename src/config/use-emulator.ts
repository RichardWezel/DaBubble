/**
 * Whether the app talks to the local Firebase emulators instead of the real
 * project. Always false in this file - the `emulator` build configuration in
 * angular.json swaps it for use-emulator.emulator.ts, so the flag can never
 * be left switched on by accident.
 *
 * Run `npm run start:emu` to develop against the emulators.
 */
export const USE_EMULATOR = false;
