#!/bin/sh
# Builds xd-crossword-tools-parser as it was at b179f90, the last version which read pre-v4 syntax, so a new migrator
# fixture can get a reference of what the original file meant:
#
#   ./packages/xd-crossword-migrator/scripts/build-pre-v4-parser.sh /tmp/pre-v4-parser.cjs
#   WRITE_REFERENCES=/tmp/pre-v4-parser.cjs yarn test packages/xd-crossword-migrator/src/preV4Fixtures.test.ts
set -e
out=${1:-/tmp/pre-v4-parser.cjs}
dir=$(mktemp -d)
git worktree add -q --detach "$dir" b179f90
npx esbuild "$dir/packages/xd-crossword-tools-parser/src/index.ts" --bundle --platform=node --format=cjs --outfile="$out" --log-level=warning
git worktree remove --force "$dir"
echo "$out"
