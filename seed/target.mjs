/**
 * Picks which Firestore the seed scripts talk to.
 *
 * The seed writes documents marked `isSeed: true`, which the security rules
 * forbid any client from creating - otherwise a visitor could mint content
 * that cannot be deleted. Seeding is an administrative job, so these scripts
 * use the Admin SDK, which bypasses rules.
 *
 * Default target is the local emulator. Production needs BOTH an explicit
 * `--target=production` flag and SEED_ALLOW_PRODUCTION=yes in the
 * environment, so it cannot happen by a stray keystroke.
 */
import { readFileSync } from 'node:fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const PROJECT_ID = JSON.parse(readFileSync('.firebaserc', 'utf8')).projects.default;

/** Matches storageBucket in src/environments/environment.development.ts. */
export const STORAGE_BUCKET = `${PROJECT_ID}.firebasestorage.app`;

export function connect(argv) {
  const production = argv.includes('--target=production');

  if (production && process.env['SEED_ALLOW_PRODUCTION'] !== 'yes') {
    console.error(
      'Refusing to touch production.\n' +
      'Re-run with:  SEED_ALLOW_PRODUCTION=yes npm run seed -- --target=production'
    );
    process.exit(1);
  }

  if (production) {
    if (!process.env['GOOGLE_APPLICATION_CREDENTIALS']) {
      console.error(
        'Seeding production needs admin credentials.\n' +
        'Create a service account key in the Firebase console\n' +
        '(Project settings -> Service accounts -> Generate new private key)\n' +
        'and point GOOGLE_APPLICATION_CREDENTIALS at the downloaded file.\n' +
        'Keep that file out of the repository.'
      );
      process.exit(1);
    }
    initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID, storageBucket: STORAGE_BUCKET });
    console.log(`Target: PRODUCTION (${PROJECT_ID})\n`);
  } else {
    const port = JSON.parse(readFileSync('firebase.json', 'utf8')).emulators.firestore.port;
    // The Admin SDK talks to the emulator when this is set, and needs no
    // credentials in that case.
    const storagePort = JSON.parse(readFileSync('firebase.json', 'utf8')).emulators.storage.port;
    process.env['FIRESTORE_EMULATOR_HOST'] = `127.0.0.1:${port}`;
    process.env['STORAGE_EMULATOR_HOST'] = `http://127.0.0.1:${storagePort}`;
    initializeApp({ projectId: PROJECT_ID, storageBucket: STORAGE_BUCKET });
    console.log(`Target: EMULATOR (firestore 127.0.0.1:${port}, storage 127.0.0.1:${storagePort})\n`);
  }

  return getFirestore();
}

/** The Cloud Storage bucket of the connected target. */
export function bucket() {
  return getStorage().bucket();
}


/** A direct message lives under one deterministic id shared by both sides. */
export function dmId(a, b) {
  return [a, b].sort().join('_');
}
