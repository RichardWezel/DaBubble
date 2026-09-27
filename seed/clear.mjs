/**
 * Removes all app data from the target Firestore.
 *
 * Uses the Admin SDK's recursive delete, which takes the subcollections with
 * it - deleting a document on its own would leave its posts and threads
 * behind as orphans.
 *
 * Also clears the uploads: message attachments under appendix/ and avatars
 * under profilePic/. The seeded personas use avatars shipped in src/assets,
 * so nothing in Storage belongs to the demo - everything there was uploaded
 * by a visitor and goes with the user documents it belonged to.
 */
import { bucket, connect, verifyAccess } from './target.mjs';

/** Deletes every document of a collection, subcollections included. */
async function deleteCollection(firestore, name) {
  const snapshot = await firestore.collection(name).get();
  for (const document of snapshot.docs) {
    await firestore.recursiveDelete(document.ref);
  }
  return snapshot.size;
}

/** Deletes every uploaded file under the given prefix. */
async function deleteUploads(prefix) {
  const [files] = await bucket().getFiles({ prefix });
  await Promise.all(files.map(file => file.delete()));
  return files.length;
}

export async function clearAll(firestore) {
  let total = 0;
  for (const name of ['channel', 'dm', 'user']) {
    const count = await deleteCollection(firestore, name);
    console.log(`  cleared ${name}: ${count} document(s) (subcollections included)`);
    total += count;
  }
  for (const prefix of ['appendix/', 'profilePic/']) {
    try {
      console.log(`  cleared ${prefix} ${await deleteUploads(prefix)} file(s)`);
    } catch (error) {
      console.warn(`  could not clear ${prefix}: ${error?.message ?? error}`);
    }
  }
  return total;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const firestore = connect(process.argv);
  await verifyAccess(firestore);
  console.log('Clearing...');
  const total = await clearAll(firestore);
  console.log(`\nDone. ${total} top-level document(s) removed.`);
  process.exit(0);
}
