/**
 * Checks firestore.rules against the local Firestore emulator.
 *
 * Run the emulators and the seed first, then `npm run test:rules`.
 * Everything happens against 127.0.0.1 - this never touches the live project.
 *
 * The cases mirror what the app and a visitor actually do: reacting to a
 * seeded message must work, rewriting its text must not.
 */
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, connectFirestoreEmulator, doc, collection, getDoc, getDocs,
  setDoc, updateDoc, deleteDoc, arrayUnion, Timestamp
} from 'firebase/firestore';

const FIRESTORE_PORT = JSON.parse(readFileSync('firebase.json', 'utf8')).emulators.firestore.port;
const IDS = JSON.parse(readFileSync('src/config/seed-ids.json', 'utf8'));

const db = getFirestore(initializeApp({ apiKey: 'demo', projectId: 'dabubble-1fb72' }));
connectFirestoreEmulator(db, '127.0.0.1', FIRESTORE_PORT);

const LOBBY = IDS.channels.lobby;
const SOFIA = IDS.users.sofia;
const hour = (n) => Timestamp.fromMillis(Date.now() + n * 3600_000);

/** A well-formed message written by a visitor. */
const visitorPost = (text = 'hallo') => ({
  text, author: SOFIA, timestamp: Date.now(), emoticons: [],
  threadCount: 0, lastThreadTimestamp: null,
  isSeed: false, expiresAt: hour(24),
});

/** Id of the first seeded post in the Lobby, so the tests hit real data. */
async function firstSeedPostId() {
  const snapshot = await getDocs(collection(db, `channel/${LOBBY}/posts`));
  const seeded = snapshot.docs.find(entry => entry.data().isSeed === true);
  if (!seeded) throw new Error('No seeded post found - run `npm run seed` first.');
  return seeded.id;
}

const seedPostId = await firstSeedPostId();
const seedPostRef = doc(db, `channel/${LOBBY}/posts/${seedPostId}`);
const originalEmoticons = (await getDoc(seedPostRef)).data()?.emoticons ?? [];

/** @type {[string, 'allow'|'deny', () => Promise<unknown>][]} */
const cases = [
  // --- seeded content is protected ---
  ['delete a seeded channel', 'deny', () => deleteDoc(doc(db, 'channel', LOBBY))],
  ['rename a seeded channel', 'deny', () => updateDoc(doc(db, 'channel', LOBBY), { name: 'gekapert' })],
  // arrayUnion, not a replacement: the checks run against the seeded data and
  // must leave it as they found it.
  ['join a seeded channel', 'allow', () => updateDoc(doc(db, 'channel', LOBBY), { user: arrayUnion(SOFIA) })],
  ['rename a seeded persona', 'deny', () => updateDoc(doc(db, 'user', SOFIA), { name: 'gekapert' })],
  ['set a seeded persona online', 'allow', () => updateDoc(doc(db, 'user', SOFIA), { online: true })],
  ['delete a seeded persona', 'deny', () => deleteDoc(doc(db, 'user', SOFIA))],
  ['rewrite a seeded message', 'deny', () => updateDoc(seedPostRef, { text: 'gekapert' })],
  ['react to a seeded message', 'allow', () => updateDoc(seedPostRef, { emoticons: originalEmoticons.concat({ type: '🧪', count: 1, name: [SOFIA] }) })],
  ['delete a seeded message', 'deny', () => deleteDoc(seedPostRef)],
  ['unmark a seeded message', 'deny', () => updateDoc(seedPostRef, { isSeed: false })],

  // --- visitor messages must be able to expire ---
  ['write a message with expiry', 'allow', () => setDoc(doc(db, `channel/${LOBBY}/posts/visitor-ok`), visitorPost())],
  ['write a message without expiry', 'deny', () => setDoc(doc(db, `channel/${LOBBY}/posts/visitor-no-ttl`), { ...visitorPost(), expiresAt: null })],
  ['write a message marked as seed', 'deny', () => setDoc(doc(db, `channel/${LOBBY}/posts/visitor-fake-seed`), { ...visitorPost(), isSeed: true })],
  ['write an oversized message', 'deny', () => setDoc(doc(db, `channel/${LOBBY}/posts/visitor-huge`), visitorPost('x'.repeat(5001)))],
  ['write a thread reply with expiry', 'allow', () => setDoc(doc(db, `channel/${LOBBY}/posts/${seedPostId}/thread/visitor-ok`), visitorPost())],
  ['write a thread reply without expiry', 'deny', () => setDoc(doc(db, `channel/${LOBBY}/posts/${seedPostId}/thread/visitor-no-ttl`), { ...visitorPost(), expiresAt: null })],

  // --- visitor content stays editable ---
  ['edit an own message', 'allow', () => updateDoc(doc(db, `channel/${LOBBY}/posts/visitor-ok`), { text: 'korrigiert' })],
  ['promote an own message to seed', 'deny', () => updateDoc(doc(db, `channel/${LOBBY}/posts/visitor-ok`), { isSeed: true })],
  ['delete an own message', 'allow', () => deleteDoc(doc(db, `channel/${LOBBY}/posts/visitor-ok`))],
];

let failed = 0;
for (const [label, expected, run] of cases) {
  let actual;
  try {
    await run();
    actual = 'allow';
  } catch (error) {
    actual = error?.code === 'permission-denied' ? 'deny' : `ERROR ${error?.code ?? error}`;
  }
  const passed = actual === expected;
  if (!passed) failed++;
  console.log(`${passed ? 'OK  ' : 'FAIL'}  ${label.padEnd(38)} expected ${expected}, got ${actual}`);
}

// Put the seeded data back the way it was.
await updateDoc(seedPostRef, { emoticons: originalEmoticons });
await deleteDoc(doc(db, `channel/${LOBBY}/posts/${seedPostId}/thread/visitor-ok`));

console.log(failed === 0 ? '\nAll cases behave as expected.' : `\n${failed} case(s) differ.`);
process.exit(failed === 0 ? 0 : 1);
