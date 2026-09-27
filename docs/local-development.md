# Local development against the Firebase emulators

The app can run against local Firebase emulators instead of the live project
`dabubble-1fb72`. Use this for anything that writes data — restructuring
collections, testing seed data, trying out security rules — so production stays
untouched.

## Prerequisites

| Tool | Why | Install |
|---|---|---|
| Firebase CLI | runs the emulators, deploys rules | `npm i -g firebase-tools` |
| Java 11+ | the Firestore and Storage emulators are Java processes | `brew install --cask temurin` |
| `src/environments/environment.development.ts` | holds the Firebase config; **gitignored**, so a fresh clone has to recreate it | copy from the Firebase console |

## Running

Two terminals:

```bash
npm run emulators     # firebase emulators:start  -> UI on http://localhost:4000
npm run start:emu     # ng serve --configuration emulator -> app on http://localhost:4200
```

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
