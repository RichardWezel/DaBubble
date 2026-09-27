/**
 * Removes all app data from the target Firestore.
 *
 * Deletes the `user`, `channel` and `dm` collections including every
 * subcollection (posts and their threads). Subcollections are NOT removed
 * when their parent document is deleted, so they have to be walked
 * explicitly.
 *
 * Does not touch Cloud Storage: the storage rules deny deletes, by design.
 * Attachments under appendix/ have to be cleared from the Firebase console
 * or with the Admin SDK.
 */
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { connect } from './target.mjs';

/** Deletes every document of a collection, walking the given subcollections first. */
async function deleteCollection(firestore, path, subcollections = []) {
  const snapshot = await getDocs(collection(firestore, path));
  let deleted = 0;
  for (const document of snapshot.docs) {
    for (const sub of subcollections) {
      deleted += await deleteCollection(firestore, `${path}/${document.id}/${sub.name}`, sub.children ?? []);
    }
    await deleteDoc(doc(firestore, path, document.id));
    deleted++;
  }
  return deleted;
}

export async function clearAll(firestore) {
  const postsWithThreads = [{ name: 'posts', children: [{ name: 'thread' }] }];
  let total = 0;
  for (const [path, subs] of [['channel', postsWithThreads], ['dm', postsWithThreads], ['user', []]]) {
    const count = await deleteCollection(firestore, path, subs);
    console.log(`  cleared ${path}: ${count} document(s)`);
    total += count;
  }
  return total;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const firestore = connect(process.argv);
  console.log('Clearing...');
  const total = await clearAll(firestore);
  console.log(`\nDone. ${total} document(s) removed.`);
  process.exit(0);
}
