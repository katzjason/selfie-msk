#!/usr/bin/env bash
set -euo pipefail

SECRET_DIR="/opt/selfie/secrets"
SECRET_FILE="$SECRET_DIR/mrn_hmac_key"

sudo mkdir -p "$SECRET_DIR"
sudo chmod 700 "$SECRET_DIR"

if [ ! -f "$SECRET_FILE" ]; then
  # 32 random bytes, base64 encoded (good as an HMAC key)
  sudo sh -c "umask 077; openssl rand -base64 32 > '$SECRET_FILE'"
  sudo chmod 400 "$SECRET_FILE"
  echo "Created: $SECRET_FILE"
else
  echo "Exists (unchanged): $SECRET_FILE"
fi
