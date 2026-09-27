/**
 * Removes all app data from the target Firestore.
 *
 * Uses the Admin SDK's recursive delete, which takes the subcollections with
 * it - deleting a document on its own would leave its posts and threads
 * behind as orphans.
 *
 * Does not touch Cloud Storage. Attachments under appendix/ have to be
 * cleared from the Firebase console.
 */
import { connect } from './target.mjs';

/** Deletes every document of a collection, subcollections included. */
async function deleteCollection(firestore, name) {
  const snapshot = await firestore.collection(name).get();
  for (const document of snapshot.docs) {
    await firestore.recursiveDelete(document.ref);
  }
  return snapshot.size;
}

export async function clearAll(firestore) {
  let total = 0;
  for (const name of ['channel', 'dm', 'user']) {
    const count = await deleteCollection(firestore, name);
    console.log(`  cleared ${name}: ${count} document(s) (subcollections included)`);
    total += count;
  }
  return total;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const firestore = connect(process.argv);
  console.log('Clearing...');
  const total = await clearAll(firestore);
  console.log(`\nDone. ${total} top-level document(s) removed.`);
  process.exit(0);
}
