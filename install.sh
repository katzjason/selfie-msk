#!/usr/bin/env bash
set -euo pipefail

echo "Running Selfie App installer"

# ---------- helpers ----------
need() { command -v "$1" >/dev/null 2>&1 || return 1; }

detect_lan_ip() {
  if need ip; then
    ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -n1
    return 0
  fi
  if need hostname; then
    hostname -I 2>/dev/null | awk '{print $1}' || true
    return 0
  fi
  echo ""
}

# ---------- prereqs ----------
if ! need curl; then
  echo "ERROR: curl is required. Install it and re-run."
  exit 1
fi

# Install Docker if missing
if ! need docker; then
  echo "Docker not found; installing..."
  curl -fsSL https://get.docker.com | sh
fi

# Ensure Compose is available
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin not found."
  echo "Install Docker Compose plugin via your distro package manager or Docker's official docs."
  exit 1
fi

# Ensure git + openssl exist
if ! need git; then
  echo "ERROR: git is required. Install it and re-run."
  exit 1
fi
if ! need openssl; then
  echo "ERROR: openssl is required. Install it and re-run."
  exit 1
fi

# ---------- inputs ----------
DEFAULT_LAN_IP="$(detect_lan_ip)"
read -r -p "Enter this server's LAN IP for Wi-Fi users (default: ${DEFAULT_LAN_IP}): " LAN_IP_INPUT
LAN_IP="${LAN_IP_INPUT:-$DEFAULT_LAN_IP}"

if [[ -z "${LAN_IP}" ]]; then
  echo "ERROR: Could not determine LAN IP. Please run this script again and provide it explicity (e.g., 192.168.1.50)."
  exit 1
fi


echo "Using LAN_IP=${LAN_IP}"

# ---------- clone repo ----------
# REPO_URL="https://github.mskcc.org/katzj2/selfie-app"   # TODO: set to public repo
# APP_DIR="selfie"                               

# if [[ ! -d "${APP_DIR}" ]]; then
#   echo "Cloning repo..."
#   git clone "${REPO_URL}" "${APP_DIR}"
# fi
# cd "${APP_DIR}"

# After getting LAN_IP and APP_DOMAIN, add:
read -r -p "Enter version identifier (default: dev, or MedUniWien): " VERSION_INPUT
VERSION="${VERSION_INPUT:-dev}"

# ---------- env + secrets ----------
ENV_FILE=".env"
CERT_DIR="./certs"
KEY_FILE="${CERT_DIR}/selfie.key"
CRT_FILE="${CERT_DIR}/selfie.crt"
SECRETS_DIR="/opt/selfie/secrets"
MRN_KEY_FILE="${SECRETS_DIR}/mrn_hmac_key"

mkdir -p "${CERT_DIR}"
chmod 700 "${CERT_DIR}"

# -- MRN HMAC Key --
if [[ ! -f "${MRN_KEY_FILE}" ]]; then
  echo "Generating MRN HMAC key..."
  sudo mkdir -p "${SECRETS_DIR}"
  sudo openssl rand -hex 32 | sudo tee "${MRN_KEY_FILE}" >/dev/null
  sudo chmod 600 "${MRN_KEY_FILE}"
  echo "Created: ${MRN_KEY_FILE}"
else
  echo "MRN HMAC key already exists; leaving as-is."
fi

# Generate DB password if not already set
DB_PASSWORD="$(openssl rand -hex 24)"

# Write to .env
cat > "${ENV_FILE}" <<EOF
LAN_IP=${LAN_IP}
DB_PASSWORD=${DB_PASSWORD}
VERSION=${VERSION}
EOF
chmod 600 "${ENV_FILE}"
echo "Wrote ${ENV_FILE}"

# ---------- cert generation ----------
regen="false"
if [[ ! -f "${KEY_FILE}" || ! -f "${CRT_FILE}" ]]; then
  regen="true"
else
  if ! openssl x509 -in "${CRT_FILE}" -noout -text | grep -q "IP Address:${LAN_IP}"; then
    regen="true"
  fi
fi

if [[ "${regen}" == "true" ]]; then
  echo "Generating self-signed cert for IP ${LAN_IP} ..."

  OPENSSL_CNF="$(mktemp)"
  cat > "${OPENSSL_CNF}" <<EOF
[ req ]
default_bits       = 2048
prompt             = no
default_md         = sha256
distinguished_name = dn
x509_extensions    = v3_req

[ dn ]
C  = US
ST = NY
L  = New York
O  = Selfie LAN
OU = Dev
CN = ${LAN_IP}

[ v3_req ]
basicConstraints = critical, CA:FALSE
subjectAltName = @alt_names
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[ alt_names ]
IP.1 = ${LAN_IP}
IP.2 = 127.0.0.1
EOF

  umask 077
  openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout "${KEY_FILE}" \
    -out "${CRT_FILE}" \
    -config "${OPENSSL_CNF}"

  rm -f "${OPENSSL_CNF}"

  chmod 600 "${KEY_FILE}"
  chmod 644 "${CRT_FILE}"

  echo "Created:"
  echo "  ${KEY_FILE}"
  echo "  ${CRT_FILE}"
else
  echo "Cert already exists and matches LAN_IP; leaving as-is."
fi

# ---------- start stack ----------
# Stop any existing containers and remove the old database volume to ensure password is correct
echo "Stopping any existing containers..."
docker compose down 2>/dev/null || true

# Check if postgres volume exists and ask to remove it
if docker volume ls | grep -q "selfie-app_postgres_data"; then
  echo "WARNING: Existing database volume found."
  read -r -p "Remove existing database? This will DELETE ALL DATA (y/N): " REMOVE_DB
  if [[ "${REMOVE_DB}" =~ ^[Yy]$ ]]; then
    echo "Removing existing database volume..."
    docker volume rm selfie-app_postgres_data
  else
    echo "Keeping existing database. Note: Password mismatch may cause issues."
  fi
fi

echo "Starting services..."
docker compose up -d

echo ""
echo "======================================"
echo "App is starting."
echo "Visit: https://${LAN_IP}/"
echo "Trust certificate: ${CRT_FILE}"
echo "======================================"
