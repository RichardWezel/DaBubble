/**
 * Writes the demo chats into the target Firestore, in the subcollection
 * layout the app is being restructured to:
 *
 *   user/{uid}
 *   channel/{channelId}/posts/{postId}/thread/{replyId}
 *   dm/{dmId}/posts/{postId}/thread/{replyId}
 *
 * Every document gets isSeed: true and no expiresAt, which is what keeps it
 * out of reach of the TTL policies that clear away visitor content.
 *
 * Document ids are derived from the content's position, not generated, so
 * running the seed twice produces the same documents instead of duplicates.
 *
 *   npm run seed                  -> emulator
 *   npm run seed:clear            -> wipe the emulator
 *   SEED_ALLOW_PRODUCTION=yes npm run seed -- --target=production
 *
 * Runs through the Admin SDK: the security rules forbid clients from
 * creating isSeed documents, which is the point of the flag.
 */
import { Timestamp } from 'firebase-admin/firestore';
import { connect, dmId } from './target.mjs';
import { clearAll } from './clear.mjs';
import { users, channels, dms, at, SEED_IDS } from './seed-data.mjs';

const seedBase = { isSeed: true, expiresAt: null };

/** Turns a seed post into its Firestore shape. */
function postDocument(post) {
  return {
    text: post.text,
    author: post.author,
    timestamp: at(post.daysAgo, post.time),
    emoticons: post.emoticons ?? [],
    threadCount: post.thread?.length ?? 0,
    lastThreadTimestamp: post.thread?.length
      ? at(post.thread.at(-1).daysAgo, post.thread.at(-1).time)
      : null,
    ...seedBase,
  };
}

/** Writes one post plus its thread replies under the given parent path. */
async function writePost(firestore, parentPath, index, post) {
  const postId = `p${String(index + 1).padStart(2, '0')}`;
  await firestore.doc(`${parentPath}/posts/${postId}`).set(postDocument(post));

  let replies = 0;
  for (const [replyIndex, reply] of (post.thread ?? []).entries()) {
    const replyId = `r${String(replyIndex + 1).padStart(2, '0')}`;
    await firestore.doc(`${parentPath}/posts/${postId}/thread/${replyId}`).set({
      text: reply.text,
      author: reply.author,
      timestamp: at(reply.daysAgo, reply.time),
      emoticons: reply.emoticons ?? [],
      ...seedBase,
    });
    replies++;
  }
  return replies;
}

async function seed(firestore) {
  const createdAt = Timestamp.now();

  for (const user of users) {
    const { id, ...fields } = user;
    await firestore.doc(`user/${id}`).set({ type: 'user', ...fields, ...seedBase });
  }
  console.log(`  user: ${users.length}`);

  for (const channel of channels) {
    await firestore.doc(`channel/${channel.id}`).set({
      type: 'channel',
      name: channel.name,
      description: channel.description,
      owner: channel.owner,
      user: channel.user,
      createdAt,
      ...seedBase,
    });
    let replies = 0;
    for (const [index, post] of channel.posts.entries()) {
      replies += await writePost(firestore, `channel/${channel.id}`, index, post);
    }
    console.log(`  channel/${channel.name}: ${channel.posts.length} post(s), ${replies} repl(ies)`);
  }

  for (const dm of dms) {
    const id = dmId(...dm.participants);
    await firestore.doc(`dm/${id}`).set({
      participants: [...new Set(dm.participants)],
      createdAt,
      ...seedBase,
    });
    let replies = 0;
    for (const [index, post] of dm.posts.entries()) {
      replies += await writePost(firestore, `dm/${id}`, index, post);
    }
    console.log(`  dm/${id}: ${dm.posts.length} post(s), ${replies} repl(ies)`);
  }
}

/**
 * The app hard-codes four document ids (see src/config/seed-ids.ts). If the
 * seed ever stops writing them, guest login and signup break silently - so
 * fail loudly here instead.
 */
async function verifyLoadBearingIds(firestore) {
  const required = [
    ['user', SEED_IDS.users.frederik, 'guest account'],
    ['user', SEED_IDS.users.steffen, 'welcome DM sender'],
    ['user', SEED_IDS.users.sofia, 'second DM contact'],
    ['channel', SEED_IDS.channels.lobby, 'default channel for new signups'],
  ];
  const missing = [];
  for (const [path, id, role] of required) {
    const snapshot = await firestore.doc(`${path}/${id}`).get();
    if (!snapshot.exists) missing.push(`${path}/${id} (${role})`);
  }
  if (missing.length) {
    console.error('\nSeed is missing load-bearing documents:');
    missing.forEach((entry) => console.error(`  - ${entry}`));
    process.exit(1);
  }
  console.log(`\nLoad-bearing ids present: ${required.length}/${required.length}`);
}

const firestore = connect(process.argv);
console.log('Clearing existing data...');
await clearAll(firestore);
console.log('\nSeeding...');
await seed(firestore);
await verifyLoadBearingIds(firestore);
console.log('\nDone.');
process.exit(0);
