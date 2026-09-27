# Going live with the restructured app

The live project `dabubble-1fb72` still holds the old data layout: messages
inside a `posts` array on the channel document, conversations inside a `dm`
array on the user document. The deployed app expects exactly that. The new
app expects subcollections. There is no migration - the demo data is
disposable, so production gets cleared and seeded fresh.

Everything below touches production. Nothing here has been run.

## Before you start

```bash
npx firebase login
```

Seeding needs admin credentials, which are separate from the CLI login:
Firebase console → Project settings → Service accounts → **Generate new
private key**. Save it outside the repository (it is a full-access
credential) and export the path:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

## 1. Look before you wipe

```bash
SEED_ALLOW_PRODUCTION=yes npm run inspect -- --target=production
```

Read-only. It prints how many users, channels, conversations, messages and
uploads exist, and - the part that matters - **which accounts are not part of
the demo**. Those are people who registered on the live app. A reset deletes
them and everything they wrote.

If that list is not empty, stop and decide what to do with them before
continuing.

## 2. Deploy the TTL policies

```bash
npm run deploy:indexes
```

Safe at any point: it only declares that `expiresAt` on the `posts` and
`thread` collection groups marks documents for deletion. Nothing in the old
data carries that field, so nothing is affected yet.

Firestore is not punctual about TTL - expect hours of lag after a document
expires, not minutes.

## 3. Upload the app

The frontend is **not** on Firebase Hosting. `dabubble.richard-wezel.de` is
served by Apache at All-Inkl, so the build gets uploaded to the webspace.

```bash
npm run build
```

Then upload everything in `dist/dabubble/browser/` into the subdomain's
directory - **including the `.htaccess`**, which is what makes reloading a
route other than `/` work instead of returning a 404. It is generated into
the build now (see the `assets` entry in `angular.json`), so it can no longer
be forgotten.

`./up.sh` does this step over FTPS once `deploy.config.sh` is filled in; see
deploy.config.sh.example.

`git-ftp` is the wrong tool here even though it is installed: it uploads what
is tracked in git, and `dist/` is generated and gitignored. `lftp mirror`
compares the local folder against the server and transfers the difference,
which is what a build directory needs.

The new app against the old data shows an empty workspace: the `posts`
subcollections and the `dm` collection do not exist yet. Nothing breaks, it
is just empty.

This is deliberately done **before** the reset. The other order - old app
against new data - makes the old code read `user.dm`, which no longer
exists, and that throws.

## 4. Clear and seed

```bash
SEED_ALLOW_PRODUCTION=yes npm run seed -- --target=production
```

This deletes the `user`, `channel` and `dm` collections including all
subcollections, deletes the uploads under `appendix/` and `profilePic/`, and
writes the demo data. It goes through the Admin SDK and so is not affected by
the security rules - which is necessary, because the rules forbid clients
from creating `isSeed` documents.

The site is live and usable again as soon as this finishes. The window in
which it shows an empty workspace is between step 3 and here - a couple of
minutes.

## 5. Deploy the security rules

```bash
npm run deploy:rules
```

Last on purpose. Until now production has been running with
`allow read, write: if true`, so nothing during steps 3 and 4 could be
rejected. From here on:

- seeded content cannot be renamed, rewritten or deleted
- every visitor message must carry `expiresAt`, which the new app writes and
  the old one does not

That last point is why this comes after the app deploy. Deploying the rules
first would make the still-deployed old app unable to post anything.

## 6. Check

Open https://dabubble.richard-wezel.de, click **Gäste-Login** and confirm:

- the four channels and the direct messages are there, with their messages
- a thread opens and shows its replies
- a new message can be sent, in a channel and in a direct message
- a reaction on a seeded message works
- search finds a message from a channel that is not currently open
- the profile dialog of the guest shows **no** Bearbeiten button, and neither
  does a seeded channel (that is the rules working, not a bug)

Then in the Firestore console, open one message you just wrote and confirm it
has `isSeed: false` and an `expiresAt` about a day out. Come back a day later
and check it is gone - that is the only way to see TTL actually fire, since
the emulator does not run it.

## If something goes wrong

- **Rules**: the previous, fully open ruleset is in git as commit `e2513d5`.
  `git show e2513d5:firestore.rules > firestore.rules && npm run deploy:rules`
  puts it back.
- **Hosting**: the Firebase console keeps previous releases under Hosting →
  Release history, and can roll back to one in a click.
- **Data**: there is no backup. Step 1 exists so you know that before step 4,
  not after. If the demo data itself gets damaged, re-run step 4 - that is
  the whole point of keeping the seed in the repository.

## Afterwards: releasing again

Once the one-time migration above is done, later releases are one command:

```bash
./up.sh
```

It verifies before it deploys - production build, the unit tests, and both
rule suites against a throwaway emulator - then deploys the indexes, the app
and the rules in the order described above, asking first. `./up.sh --check`
runs the verification and stops.

It never seeds. That stays the separate, deliberate command below.

## Afterwards: the recurring reset

The original reason for all of this was unwanted content sticking around
forever. Most of that now takes care of itself: every message a visitor
writes expires after a day, and seeded content cannot be defaced.

What does *not* clean itself up:

- user accounts created through sign-up, and their uploaded avatars
- channels created by visitors
- conversations created by visitors (the documents, not the messages in them)

A full reset clears those:

```bash
SEED_ALLOW_PRODUCTION=yes npm run seed -- --target=production
```

Monthly by hand is fine. It only takes the one command, and step 1 tells you
beforehand whether anyone would lose an account. Automating it later means a
scheduled Cloud Function or a GitHub Actions cron with the service account
key as a secret - worth doing only if the manual run starts to feel like a
chore.
