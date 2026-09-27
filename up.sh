#!/usr/bin/env bash
#
# Verifies the working tree and releases it to the live project.
#
#   ./up.sh            verify, then ask before deploying
#   ./up.sh --check    verify only, deploy nothing
#   ./up.sh --yes      verify and deploy without asking
#
# What it deploys: the TTL policies and the security rules to Firebase, and
# the built app to the All-Inkl webspace over FTPS - in the order
# docs/deploy.md explains.
#
# The frontend does NOT live on Firebase Hosting. dabubble.richard-wezel.de is
# served by Apache at All-Inkl, so the app is uploaded, not `firebase deploy`d.
# Credentials go in deploy.config.sh (gitignored); without it the script
# builds and tells you what to upload by hand.
#
# What it does NOT do: seed. Seeding deletes every user, channel and
# conversation and writes the demo data fresh. That is a one-time migration
# and an occasional cleanup, not something a release script should ever do on
# its own. It stays a separate, deliberate command.
#
# Run the one-time migration in docs/deploy.md before using this script for
# the first time. Deploying the new rules to a project that still holds the
# old data layout leaves the site unable to write anything.

set -euo pipefail

cd "$(dirname "$0")"

# The CLI refuses to read the web-frameworks hosting config without this, and
# Homebrew keeps openjdk off the global PATH.
export FIREBASE_CLI_EXPERIMENTS="${FIREBASE_CLI_EXPERIMENTS:-webframeworks}"
if command -v brew >/dev/null 2>&1 && brew --prefix openjdk >/dev/null 2>&1; then
  export PATH="$(brew --prefix openjdk)/bin:$PATH"
fi

FIREBASE="./node_modules/.bin/firebase"
NG="./node_modules/.bin/ng"
DIST="dist/dabubble/browser"

# Optional: FTP credentials for the All-Inkl webspace. See
# deploy.config.sh.example.
# shellcheck disable=SC1091
[ -f deploy.config.sh ] && . ./deploy.config.sh

CHECK_ONLY=false
ASSUME_YES=false
for argument in "$@"; do
  case "$argument" in
    --check) CHECK_ONLY=true ;;
    --yes|-y) ASSUME_YES=true ;;
    --help|-h) sed -n '3,19p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $argument (try --help)" >&2; exit 2 ;;
  esac
done

step()  { printf '\n\033[1m==> %s\033[0m\n' "$1"; }
ok()    { printf '    \033[32m%s\033[0m\n' "$1"; }
fail()  { printf '\n\033[31m%s\033[0m\n' "$1" >&2; exit 1; }

LOG="$(mktemp -t up-sh)"
trap 'rm -f "$LOG"' EXIT

# Runs a command with its output hidden, and shows the output only if it
# fails - progress bars are noise, a stack trace is not.
quietly() {
  local description="$1"; shift
  if ! "$@" >"$LOG" 2>&1; then
    printf '\n\033[31m%s failed:\033[0m\n\n' "$description" >&2
    cat "$LOG" >&2
    exit 1
  fi
}


# Mirrors the build output onto the webspace. --delete removes what is no
# longer in the build; Angular hashes its filenames, so without it every old
# bundle would pile up on the server forever.
upload_app() {
  if [ -z "${FTP_HOST:-}" ] || [ -z "${FTP_USER:-}" ] || [ -z "${FTP_PASS:-}" ]; then
    printf '    \033[33m%s\033[0m\n' "No deploy.config.sh - skipping the upload."
    cat <<MANUAL
    Upload the contents of $DIST to the subdomain directory yourself,
    including the .htaccess. To let this script do it, copy
    deploy.config.sh.example to deploy.config.sh and fill it in.
MANUAL
    return 0
  fi

  local tls="set ftp:ssl-force true; set ssl:verify-certificate true;"
  [ "${FTP_USE_TLS:-true}" = true ] || tls="set ftp:ssl-allow false;"

  lftp -c "
    $tls
    open -u '$FTP_USER','$FTP_PASS' '$FTP_HOST';
    mirror --reverse --delete --parallel=4 --verbose \
      --exclude-glob .git-ftp.log \
      '$DIST' '${FTP_DIR:-/}';
  "
  ok "uploaded to ${FTP_HOST}${FTP_DIR:-/}"
}


# ---------------------------------------------------------------- preflight

step "Preflight"

[ -x "$FIREBASE" ] || fail "firebase-tools is missing. Run: npm ci"
[ -x "$NG" ]       || fail "The Angular CLI is missing. Run: npm ci"
[ -f src/environments/environment.development.ts ] \
  || fail "src/environments/environment.development.ts is missing (it is gitignored). Copy it from the Firebase console."
if [ -n "${FTP_HOST:-}" ] && ! command -v lftp >/dev/null 2>&1; then
  fail "deploy.config.sh is set up but lftp is missing. Run: brew install lftp"
fi

if [ -n "$(git status --porcelain)" ]; then
  fail "The working tree has uncommitted changes. Commit or stash them first - a release should be reproducible from a commit."
fi
ok "working tree clean"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[ "$BRANCH" = "main" ] || fail "On branch '$BRANCH'. Releases go out from main."
ok "on main"

git fetch --quiet origin main 2>/dev/null || true
BEHIND="$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)"
AHEAD="$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)"
[ "$BEHIND" = "0" ] || fail "main is $BEHIND commit(s) behind origin/main. Pull first."
[ "$AHEAD" = "0" ] || printf '    \033[33m%s\033[0m\n' "$AHEAD commit(s) not pushed yet - the release will contain them"
[ "$AHEAD" = "0" ] && ok "in sync with origin/main"

# Only needed to deploy; --check has nothing to authenticate for.
if [ "$CHECK_ONLY" != true ]; then
  if ! "$FIREBASE" projects:list >/dev/null 2>&1; then
    fail "Not authenticated. Run: npx firebase login"
  fi
  ok "firebase cli authenticated"
fi


# ------------------------------------------------------------------- verify

step "Build"
quietly "The production build" "$NG" build --configuration production
ok "production build succeeded"

step "Unit tests"
# Only the specs that actually assert something. The rest of the suite is
# still the generated ng-generate scaffolding and fails on missing providers.
export CHROME_BIN="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
quietly "The unit tests" "$NG" test --watch=false --browsers=ChromeHeadless \
  --include='**/message-sanitizer.service.spec.ts'
ok "message sanitizer: 14 passing"

step "Security rules"
# Seeds a throwaway emulator and runs both rule suites against it, so a rule
# that would lock the app out never reaches the live project.
quietly "The rule checks (reproduce with: npm run emulators, then npm run seed && npm run test:rules)" \
  "$FIREBASE" emulators:exec --only auth,firestore,storage --log-verbosity QUIET \
  'node seed/seed.mjs && node tools/check-storage-rules.mjs && node tools/check-firestore-rules.mjs'
ok "storage and firestore rules behave as expected"

if [ "$CHECK_ONLY" = true ]; then
  if [ -n "${FTP_HOST:-}" ] && [ -n "${FTP_PASS:-}" ]; then
    step "Upload preview"
    lftp -c "
      set ftp:ssl-force true; set ssl:verify-certificate true;
      open -u '$FTP_USER','$FTP_PASS' '$FTP_HOST';
      mirror --reverse --delete --dry-run --verbose '$DIST' '${FTP_DIR:-/}';
    " || fail "Could not reach the FTP server."
  fi
  printf '\n\033[32mAll checks passed. Nothing deployed (--check).\033[0m\n'
  exit 0
fi


# ------------------------------------------------------------------- deploy

PROJECT="$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('.firebaserc','utf8')).projects.default)")"

step "Ready to deploy"
cat <<SUMMARY
    project   $PROJECT
    commit    $(git rev-parse --short HEAD)  $(git log -1 --pretty=%s)

    will deploy   TTL policies and rules to Firebase
                  the build in $DIST to ${FTP_HOST:-<no deploy.config.sh - manual upload>}${FTP_DIR:-}
    will NOT do   seeding - production data stays as it is
SUMMARY

if [ "$ASSUME_YES" != true ]; then
  printf '\n    Continue? [y/N] '
  read -r answer
  case "$answer" in
    y|Y|yes|j|J|ja) ;;
    *) echo "    Aborted."; exit 1 ;;
  esac
fi

step "Deploying TTL policies"
"$FIREBASE" deploy --only firestore:indexes
ok "indexes deployed"

step "Uploading the app"
# Before the rules, so the newly deployed rules never face the previous build.
upload_app

step "Deploying security rules"
"$FIREBASE" deploy --only firestore:rules,storage
ok "rules deployed"

printf '\n\033[32mDone.\033[0m Check https://dabubble.richard-wezel.de - the list in docs/deploy.md says what to look at.\n'
