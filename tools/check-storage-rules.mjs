/**
 * Checks storage.rules against the local Storage emulator.
 *
 * Run the emulators first (`npm run emulators`), then `npm run test:rules`.
 * Everything happens against the local emulator - this never touches the live
 * project.
 *
 * It uses the real Firebase SDK on purpose: only the SDK sends object
 * metadata the way the app does. A hand-rolled curl upload stores the file
 * as application/octet-stream, which makes every contentType rule look
 * broken when it is not.
 */
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getStorage, connectStorageEmulator, ref, uploadBytes } from 'firebase/storage';

// Port comes from firebase.json so it cannot drift out of sync.
// (src/config/emulator.config.ts is TypeScript and not importable here.)
const STORAGE_PORT = JSON.parse(readFileSync('firebase.json', 'utf8')).emulators.storage.port;

const app = initializeApp({
  apiKey: 'demo',
  projectId: 'dabubble-1fb72',
  storageBucket: 'dabubble-1fb72.firebasestorage.app',
});
const storage = getStorage(app);
connectStorageEmulator(storage, '127.0.0.1', STORAGE_PORT);

const MB = 1024 * 1024;

/** @type {[string, string, number, 'allow'|'deny'][]} */
const cases = [
  // appendix: images and PDF, below 5 MB
  ['appendix/c1/ok.png', 'image/png', 1000, 'allow'],
  ['appendix/c1/ok.jpg', 'image/jpeg', 1000, 'allow'],
  ['appendix/c1/ok.webp', 'image/webp', 1000, 'allow'],
  ['appendix/c1/ok.pdf', 'application/pdf', 1000, 'allow'],
  ['appendix/c1/no.txt', 'text/plain', 1000, 'deny'],
  ['appendix/c1/no.zip', 'application/zip', 1000, 'deny'],
  ['appendix/c1/no.svg', 'image/svg+xml', 1000, 'deny'],
  ['appendix/c1/big.png', 'image/png', 6 * MB, 'deny'],
  ['appendix/c1/empty.png', 'image/png', 0, 'deny'],
  // profilePic: images only, below 2 MB
  ['profilePic/u1/ok.png', 'image/png', 1000, 'allow'],
  ['profilePic/u1/no.pdf', 'application/pdf', 1000, 'deny'],
  ['profilePic/u1/big.png', 'image/png', 3 * MB, 'deny'],
  // anything outside the two known prefixes
  ['hackme/x.png', 'image/png', 1000, 'deny'],
];

let failed = 0;

for (const [path, contentType, size, expected] of cases) {
  let actual;
  try {
    await uploadBytes(ref(storage, path), new Uint8Array(size), { contentType });
    actual = 'allow';
  } catch (error) {
    actual = error?.code === 'storage/unauthorized' ? 'deny' : `ERROR ${error?.code ?? error}`;
  }
  const passed = actual === expected;
  if (!passed) failed++;
  console.log(
    `${passed ? 'OK  ' : 'FAIL'}  ${path.padEnd(24)} ${contentType.padEnd(16)} ` +
    `${String(size).padStart(8)}B  expected ${expected}, got ${actual}`
  );
}

console.log(failed === 0 ? '\nAll cases behave as expected.' : `\n${failed} case(s) differ.`);
process.exit(failed === 0 ? 0 : 1);
