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
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

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
    requireAdminCredentials();
    initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID, storageBucket: STORAGE_BUCKET });
    console.log(`Target: PRODUCTION (${PROJECT_ID})\n`);
  } else {
    const port = JSON.parse(readFileSync('firebase.json', 'utf8')).emulators.firestore.port;
    // The Admin SDK talks to the emulator when this is set, and needs no
    // credentials in that case.
    const storagePort = JSON.parse(readFileSync('firebase.json', 'utf8')).emulators.storage.port;
    const authPort = JSON.parse(readFileSync('firebase.json', 'utf8')).emulators.auth.port;
    process.env['FIRESTORE_EMULATOR_HOST'] = `127.0.0.1:${port}`;
    process.env['STORAGE_EMULATOR_HOST'] = `http://127.0.0.1:${storagePort}`;
    process.env['FIREBASE_AUTH_EMULATOR_HOST'] = `127.0.0.1:${authPort}`;
    initializeApp({ projectId: PROJECT_ID, storageBucket: STORAGE_BUCKET });
    console.log(`Target: EMULATOR (firestore 127.0.0.1:${port}, storage 127.0.0.1:${storagePort})\n`);
  }

  return getFirestore();
}

/**
 * The Admin SDK needs credentials of its own - a `firebase login` is not
 * enough. Two ways to provide them, and this accepts either.
 */
function requireAdminCredentials() {
  const keyFile = process.env['GOOGLE_APPLICATION_CREDENTIALS'];
  if (keyFile) {
    if (!existsSync(keyFile)) {
      console.error(`GOOGLE_APPLICATION_CREDENTIALS points at ${keyFile}, which does not exist.`);
      process.exit(1);
    }
    return;
  }
  // gcloud writes its application default credentials here.
  if (existsSync(join(homedir(), '.config/gcloud/application_default_credentials.json'))) return;

  console.error(
    'Seeding production needs admin credentials. A `firebase login` is not enough.\n\n' +
    'Either download a service account key:\n' +
    `  https://console.firebase.google.com/project/${PROJECT_ID}/settings/serviceaccounts/adminsdk\n` +
    '  -> Generate new private key, then:\n' +
    '  export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json\n\n' +
    'or, if you would rather not have a key file lying around:\n' +
    '  brew install --cask google-cloud-sdk\n' +
    '  gcloud auth application-default login\n'
  );
  process.exit(1);
}


/**
 * Reads one document to confirm the credentials actually work, before any
 * destructive step gets a chance to run half way.
 */
export async function verifyAccess(firestore) {
  try {
    await firestore.collection('user').limit(1).get();
  } catch (error) {
    console.error(`\nCould not read the target database: ${error?.message ?? error}`);
    process.exit(1);
  }
}


/** The Cloud Storage bucket of the connected target. */
export function bucket() {
  return getStorage().bucket();
}


/**
 * Deletes every Firebase Auth account.
 *
 * Opt-in, never automatic: the seeded personas need no Auth accounts at all
 * (the guest login does not authenticate), so the only thing this can remove
 * is a real person's ability to sign in. A routine reset should leave that
 * alone; a deliberate `--with-auth` is how you say otherwise.
 */
export async function deleteAllAuthUsers() {
  const auth = getAuth();
  let removed = 0;
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    const uids = page.users.map(user => user.uid);
    if (uids.length) {
      const result = await auth.deleteUsers(uids);
      removed += result.successCount;
      if (result.failureCount) {
        console.warn(`  ${result.failureCount} auth account(s) could not be deleted`);
      }
    }
    pageToken = page.pageToken;
  } while (pageToken);
  return removed;
}


/** A direct message lives under one deterministic id shared by both sides. */
export function dmId(a, b) {
  return [a, b].sort().join('_');
}
