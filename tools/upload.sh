#!/usr/bin/env bash
#
# Uploads the built app to the webspace over FTPS.
#
#   ./tools/upload.sh              upload
#   ./tools/upload.sh --dry-run    show what would change, transfer nothing
#   ./tools/upload.sh --list       list the remote directory, to find the right path
#
# Credentials come from deploy.config.sh (gitignored). Copy
# deploy.config.sh.example and fill it in.

set -euo pipefail
cd "$(dirname "$0")/.."

DIST="dist/dabubble/browser"

[ -f deploy.config.sh ] || {
  echo "deploy.config.sh is missing. Create it with:" >&2
  echo "  cp deploy.config.sh.example deploy.config.sh && chmod 600 deploy.config.sh" >&2
  exit 1
}
# shellcheck disable=SC1091
. ./deploy.config.sh

command -v lftp >/dev/null 2>&1 || { echo "lftp is missing. Run: brew install lftp" >&2; exit 1; }

for required in FTP_HOST FTP_USER FTP_PASS; do
  [ -n "${!required:-}" ] || { echo "$required is not set in deploy.config.sh" >&2; exit 1; }
done

MODE="upload"
for argument in "$@"; do
  case "$argument" in
    --dry-run) MODE="dry-run" ;;
    --list) MODE="list" ;;
    *) echo "Unknown option: $argument" >&2; exit 2 ;;
  esac
done

# All-Inkl speaks FTP over TLS. Without this the password and the whole
# transfer would cross the network in the clear.
TLS="set ftp:ssl-force true; set ssl:verify-certificate true;"
[ "${FTP_USE_TLS:-true}" = true ] || TLS="set ftp:ssl-allow false;"

connect="$TLS open -u '$FTP_USER','$FTP_PASS' '$FTP_HOST';"

# lftp echoes the full ftp://user:password@host URL for every single file it
# touches. Everything it prints goes through here so the password cannot end
# up in a terminal scrollback, a log file, or a pasted bug report.
redact() {
  sed -E 's|://[^/@[:space:]]+:[^/@[:space:]]+@|://***:***@|g'
}

case "$MODE" in
  list)
    # Handy when you do not yet know which directory the subdomain points at.
    echo "Remote root:"
    lftp -c "$connect cls -l /;" 2>&1 | redact
    if [ -n "${FTP_DIR:-}" ] && [ "$FTP_DIR" != "/" ]; then
      echo
      echo "$FTP_DIR:"
      lftp -c "$connect cls -l '$FTP_DIR';" 2>&1 | redact || echo "  (does not exist)"
    fi
    ;;
  dry-run)
    [ -d "$DIST" ] || { echo "$DIST does not exist. Run: npm run build" >&2; exit 1; }
    echo "Dry run - nothing is transferred."
    lftp -c "$connect mirror --reverse --delete --dry-run --verbose '$DIST' '${FTP_DIR:-/}';" 2>&1 | redact
    ;;
  upload)
    [ -d "$DIST" ] || { echo "$DIST does not exist. Run: npm run build" >&2; exit 1; }
    echo "Uploading $DIST -> ${FTP_HOST}${FTP_DIR:-/}"
    # --delete removes what is no longer in the build; Angular hashes its
    # filenames, so without it every old bundle would pile up forever.
    lftp -c "$connect mirror --reverse --delete --parallel=4 --verbose '$DIST' '${FTP_DIR:-/}';" 2>&1 | redact
    echo "Done."
    ;;
esac
