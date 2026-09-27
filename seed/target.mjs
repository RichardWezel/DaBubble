/**
 * Picks which Firestore the seed scripts talk to.
 *
 * Default is the local emulator. Production needs BOTH an explicit
 * `--target=production` flag and SEED_ALLOW_PRODUCTION=yes in the
 * environment, so it cannot happen by a stray keystroke.
 */
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const ENV_FILE = 'src/environments/environment.development.ts';

/** Pulls the firebase config out of the (gitignored) Angular environment file. */
function readFirebaseConfig() {
  let source;
  try {
    source = readFileSync(ENV_FILE, 'utf8');
  } catch {
    throw new Error(`${ENV_FILE} not found. It is gitignored - copy it from the Firebase console.`);
  }
  const config = Object.fromEntries(
    [...source.matchAll(/(\w+)\s*:\s*"([^"]+)"/g)].map(([, key, value]) => [key, value])
  );
  if (!config['apiKey'] || !config['projectId']) {
    throw new Error(`Could not read apiKey/projectId from ${ENV_FILE}.`);
  }
  return config;
}

export function connect(argv) {
  const production = argv.includes('--target=production');

  if (production && process.env['SEED_ALLOW_PRODUCTION'] !== 'yes') {
    console.error(
      'Refusing to touch production.\n' +
      'Re-run with:  SEED_ALLOW_PRODUCTION=yes npm run seed -- --target=production'
    );
    process.exit(1);
  }

  const config = readFirebaseConfig();
  const firestore = getFirestore(initializeApp(config));

  if (!production) {
    const port = JSON.parse(readFileSync('firebase.json', 'utf8')).emulators.firestore.port;
    connectFirestoreEmulator(firestore, '127.0.0.1', port);
    console.log(`Target: EMULATOR (127.0.0.1:${port})\n`);
  } else {
    console.log(`Target: PRODUCTION (${config['projectId']})\n`);
  }

  return firestore;
}

/** A direct message lives under one deterministic id shared by both sides. */
export function dmId(a, b) {
  return [a, b].sort().join('_');
}
