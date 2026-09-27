#!/usr/bin/env bash
#
# Uploads the built app to the webspace over FTPS.
#
#   ./tools/upload.sh              upload
#   ./tools/upload.sh --dry-run    show what would change, transfer nothing
#   ./tools/upload.sh --list       list the remote directory, to find the right path
#   ./tools/upload.sh --fix-perms  only repair the permissions on the server
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

# lftp mirrors local file modes onto the server. Files copied out of
# src/assets inherit this machine's restrictive permissions (0600), and a
# 0600 file on the webspace is unreadable for Apache, which answers 403 -
# the page then loads but every image is missing. Widening read access on the
# build output before every transfer keeps that from happening again.
normalise_permissions() {
  chmod -R u+rwX,go+rX "$DIST"
}

# Repairs the modes of what is already on the server.
#
# mirror only chmods files it actually transfers, so a file that was uploaded
# with the wrong mode and has not changed since keeps it - and stays
# unreadable for Apache. This walks the remote tree and sets 755 on
# directories, 644 on files, regardless of what was transferred.
fix_remote_permissions() {
  local base="${FTP_DIR:-/}"
  echo "Repairing permissions under ${FTP_HOST}${base}"

  local listing
  listing="$(lftp -c "$connect cd '$base'; find;" 2>/dev/null | redact)"

  local commands=""
  while IFS= read -r entry; do
    [ -z "$entry" ] && continue
    entry="${entry#./}"
    [ -z "$entry" ] && continue
    if [ "${entry%/}" != "$entry" ]; then
      commands+="chmod 755 \"${entry%/}\";"
    else
      commands+="chmod 644 \"$entry\";"
    fi
  done <<< "$listing"

  # The directory the subdomain points at needs to be traversable too.
  commands+="chmod 755 .;"

  lftp -c "$connect cd '$base'; $commands" 2>&1 | redact
  echo "Permissions repaired."
}

MODE="upload"
for argument in "$@"; do
  case "$argument" in
    --dry-run) MODE="dry-run" ;;
    --list) MODE="list" ;;
    --fix-perms) MODE="fix-perms" ;;
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
  fix-perms)
    fix_remote_permissions
    ;;
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
    normalise_permissions
    echo "Dry run - nothing is transferred."
    lftp -c "$connect mirror --reverse --delete --dry-run --verbose '$DIST' '${FTP_DIR:-/}';" 2>&1 | redact
    ;;
  upload)
    [ -d "$DIST" ] || { echo "$DIST does not exist. Run: npm run build" >&2; exit 1; }
    normalise_permissions
    echo "Uploading $DIST -> ${FTP_HOST}${FTP_DIR:-/}"
    # --delete removes what is no longer in the build; Angular hashes its
    # filenames, so without it every old bundle would pile up forever.
    lftp -c "$connect mirror --reverse --delete --parallel=4 --verbose '$DIST' '${FTP_DIR:-/}';" 2>&1 | redact
    # Unconditional: mirror skips unchanged files, and an unchanged file that
    # went up with the wrong mode would stay unreadable.
    fix_remote_permissions
    echo "Done."
    ;;
esac
