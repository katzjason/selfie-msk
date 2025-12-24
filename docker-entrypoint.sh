#!/bin/sh
set -e

echo "PATH=$PATH"
which python3 || true
python3 -c "import sys; print(sys.executable)" || true
/opt/venv/bin/python3 -c "import sys; print(sys.executable)" || true

IMAGE_DIR="${IMAGE_DIR:-/data/images}"

# Ensure the directory exists (even if IMAGE_DIR is changed)
mkdir -p "$IMAGE_DIR"

# If running as root, fix ownership/permissions then drop privileges
if [ "$(id -u)" = "0" ]; then
  # Your Dockerfile creates: uid=1001, gid=1001 (nextjs:nodejs)
  APP_UID="${APP_UID:-1001}"
  APP_GID="${APP_GID:-1001}"

  # Only chown if needed (faster, avoids unnecessary recursion)
  CUR_UID="$(stat -c %u "$IMAGE_DIR" 2>/dev/null || echo 0)"
  CUR_GID="$(stat -c %g "$IMAGE_DIR" 2>/dev/null || echo 0)"

  if [ "$CUR_UID" != "$APP_UID" ] || [ "$CUR_GID" != "$APP_GID" ]; then
    chown -R "$APP_UID:$APP_GID" "$IMAGE_DIR"
  fi

  # Ensure group can write (helps in some mount scenarios)
  chmod -R g+rwX "$IMAGE_DIR" || true

  exec gosu "$APP_UID:$APP_GID" "$@"
fi

exec "$@"
