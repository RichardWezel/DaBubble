# Local development against the Firebase emulators

The app can run against local Firebase emulators instead of the live project
`dabubble-1fb72`. Use this for anything that writes data — restructuring
collections, testing seed data, trying out security rules — so production stays
untouched.

## Prerequisites

| Tool | Why | Install |
|---|---|---|
| Firebase CLI | runs the emulators, deploys rules | already a devDependency (`firebase-tools`) |
| Java | the Firestore and Storage emulators are Java processes | `brew install openjdk` |
| `src/environments/environment.development.ts` | holds the Firebase config; **gitignored**, so a fresh clone has to recreate it | copy from the Firebase console |

## Running

Two terminals:

```bash
npm run emulators     # emulators + UI on http://localhost:4000
npm run start:emu     # ng serve --configuration emulator -> app on http://localhost:4200
```

Homebrew installs `openjdk` keg-only, so `java` is not on the global PATH.
`npm run emulators` prepends it itself via `$(brew --prefix openjdk)/bin`, so
there is nothing to add to `~/.zshrc`. On a machine without Homebrew, put
`java` on the PATH and drop that prefix from the script.

The script also carries two flags that are not obvious:

- `--only auth,firestore,storage` - the Hosting emulator is not needed,
  `ng serve` handles that.
- `FIREBASE_CLI_EXPERIMENTS=webframeworks` - `firebase.json` uses the
  web-frameworks style hosting config (`"source": "."`), and the CLI refuses to
  read that config at all without this experiment, even when Hosting is
  excluded. Passing it as an env var keeps the experiment out of the global CLI
  config.

The emulators start with an **empty** database. That is intentional: the seed
script (stage 1) fills it with a defined data set in seconds.

Ports are declared twice and have to stay in sync:
`firebase.json` (`emulators` block) and `src/config/emulator.config.ts`.

| Service | Port |
|---|---|
| Firestore | 8080 |
| Auth | 9099 |
| Storage | 9199 |
| Emulator UI | 4000 |

## How the switch works

`src/config/use-emulator.ts` exports `USE_EMULATOR = false`. The `emulator`
build configuration in `angular.json` replaces that file with
`use-emulator.emulator.ts`, which exports `true`. `app.config.ts` reads the flag
and calls `connectAuthEmulator` / `connectFirestoreEmulator` /
`connectStorageEmulator` accordingly.

Because the flag is a build-time constant, a normal `ng build` compiles the
emulator calls down to `false && connect…()` — they can never run in
production, and the flag cannot be left switched on by accident.

## Rules

`firestore.rules` and `storage.rules` now live in the repository.

**`firestore.rules` is a placeholder.** This project previously had no rules
file, so the live rules exist only in the Firebase console. Copy them into the
file and commit that as the baseline *before* ever running
`firebase deploy --only firestore:rules`, otherwise the deploy overwrites them.

`storage.rules` is complete and restricts uploads to images (plus PDF for
message attachments) with a size cap — 5 MB under `appendix/`, 2 MB under
`profilePic/`.

## Seeding the demo data

```bash
npm run seed          # wipe the emulator and write the demo chats
npm run seed:clear    # wipe only
```

The content lives in `seed/seed-data.mjs` - six people, four channels, four
direct message threads, 53 messages with reactions and threads. Timestamps are
relative to the run (`daysAgo` + time of day), so the conversations never read
as stale.

The scripts run through the **Admin SDK**, which bypasses security rules. They
have to: the rules forbid any client from creating a document with
`isSeed: true`, since otherwise a visitor could mint content that cannot be
deleted.

The seed writes the **new** subcollection layout, which the app does not use
yet:

```
user/{uid}
channel/{channelId}/posts/{postId}/thread/{replyId}
dm/{dmId}/posts/{postId}/thread/{replyId}
```

`dmId` is both participant ids sorted and joined with `_`, so one conversation
has exactly one document that both sides read and write.

Everything written by the seed carries `isSeed: true` and `expiresAt: null`.
Visitor content will carry the opposite, which is what lets the TTL policies
(stage 5) clear it away without touching the demo.

### Load-bearing ids

Four document ids are referenced from application code and must exist, or
guest login and signup break. They live in `src/config/seed-ids.json`, are
re-exported as named constants from `src/config/seed-ids.ts`, and the seed
verifies all four at the end of every run.

| Constant | Used for |
|---|---|
| `GUEST_USER_ID` | the account behind the "Gäste-Login" button |
| `WELCOME_DM_SENDER_ID` | sender of the welcome DM every new user receives |
| `SECOND_DM_CONTACT_ID` | second DM contact every new user receives |
| `DEFAULT_CHANNEL_ID` | channel every new signup is added to |

### Seeding production

Deliberately awkward - it needs the flag *and* the environment variable:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json \
  SEED_ALLOW_PRODUCTION=yes npm run seed -- --target=production
```

The key comes from the Firebase console under Project settings -> Service
accounts -> Generate new private key. Keep the file out of the repository.

This wipes and rewrites the live data, so it belongs in stage 6 and nowhere
else. Note that it does not clear Cloud Storage: the storage rules deny
deletes on purpose, so old attachments under `appendix/` have to go via the
Firebase console or the Admin SDK.
