#!/usr/bin/env bash
# Frees the ports the Firebase Local Emulator Suite binds to, before starting
# it. Needed because if the emulator process is ever killed abruptly (a crashed
# terminal, an IDE stopping the task without letting firebase-tools shut down
# its child JVMs), the underlying Auth/Firestore/Storage/Hub Java processes can
# survive as orphans and keep holding their ports — causing the next
# `firebase emulators:start` to fail with "port taken" even though nothing
# using it is visible in the current session.
set -euo pipefail

PORTS=(9099 8080 9199 4000 4400 4500 9150)

for port in "${PORTS[@]}"; do
  pid=$(lsof -ti "tcp:${port}" 2>/dev/null || true)
  if [ -n "${pid}" ]; then
    echo "Freeing port ${port} (killing pid ${pid})"
    kill -9 ${pid} 2>/dev/null || true
  fi
done
