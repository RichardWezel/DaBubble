/**
 * Reports what is in the target database, without changing anything.
 *
 * Run this before a production reset: `npm run seed` deletes everything and
 * writes the demo data fresh, so anyone who registered on the live app loses
 * their account, their channels and their conversations. This says how many
 * that would be.
 *
 *   npm run inspect
 *   GOOGLE_APPLICATION_CREDENTIALS=... SEED_ALLOW_PRODUCTION=yes npm run inspect -- --target=production
 */
import { readFileSync } from 'node:fs';
import { bucket, connect, verifyAccess } from './target.mjs';

const IDS = JSON.parse(readFileSync('src/config/seed-ids.json', 'utf8'));
const KNOWN_SEED_USERS = new Set(Object.values(IDS.users));

const firestore = connect(process.argv);
await verifyAccess(firestore);

/** Counts documents in a collection and splits them by their isSeed flag. */
async function summarise(name) {
  const snapshot = await firestore.collection(name).get();
  const seeded = snapshot.docs.filter(entry => entry.data().isSeed === true).length;
  return { total: snapshot.size, seeded, other: snapshot.size - seeded, docs: snapshot.docs };
}

/** Counts messages and thread replies below a set of parent documents. */
async function countMessages(docs) {
  let posts = 0;
  let replies = 0;
  for (const parent of docs) {
    const postDocs = await parent.ref.collection('posts').get();
    posts += postDocs.size;
    for (const post of postDocs.docs) {
      replies += (await post.ref.collection('thread').get()).size;
    }
  }
  return { posts, replies };
}

const users = await summarise('user');
const channels = await summarise('channel');
const dms = await summarise('dm');

const channelMessages = await countMessages(channels.docs);
const dmMessages = await countMessages(dms.docs);

console.log('Collections');
console.log(`  user     ${String(users.total).padStart(4)}  (${users.seeded} seeded, ${users.other} other)`);
console.log(`  channel  ${String(channels.total).padStart(4)}  (${channels.seeded} seeded, ${channels.other} other)`);
console.log(`  dm       ${String(dms.total).padStart(4)}  (${dms.seeded} seeded, ${dms.other} other)`);

console.log('\nMessages');
console.log(`  in channels  ${channelMessages.posts} post(s), ${channelMessages.replies} repl(ies)`);
console.log(`  in dms       ${dmMessages.posts} post(s), ${dmMessages.replies} repl(ies)`);

try {
  const [files] = await bucket().getFiles();
  const bySection = files.reduce((counts, file) => {
    const section = file.name.split('/')[0] || '(root)';
    counts[section] = (counts[section] ?? 0) + 1;
    return counts;
  }, {});
  console.log('\nUploads');
  const entries = Object.entries(bySection);
  if (entries.length === 0) console.log('  none');
  entries.forEach(([section, count]) => console.log(`  ${section.padEnd(12)} ${count} file(s)`));
} catch (error) {
  console.log(`\nUploads: could not read the bucket (${error?.message ?? error})`);
}

// Accounts that are neither the demo personas nor marked as seed data are the
// ones a reset would actually cost someone something.
const strangers = users.docs.filter(entry => !KNOWN_SEED_USERS.has(entry.id) && entry.data().isSeed !== true);
console.log('\nAccounts that are not part of the demo');
if (strangers.length === 0) {
  console.log('  none - a reset destroys nothing but the demo itself');
} else {
  console.log(`  ${strangers.length} - a reset deletes these accounts and everything they wrote:`);
  strangers.forEach(entry => console.log(`    ${entry.id}  ${entry.data().name ?? '(no name)'}  ${entry.data().email ?? ''}`));
}

process.exit(0);
