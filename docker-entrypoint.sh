#!/bin/sh
set -e

mkdir -p /data/images

# If running as root, fix ownership for the node user, then drop privileges.
# If not root, just continue.
if [ "$(id -u)" = "0" ]; then
  chown -R node:node /data/images
  exec su-exec node "$@"
fi

exec "$@"
