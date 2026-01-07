#!/usr/bin/env bash


# RUN: PGPASSWORD=app_password bash export.sh

# Automated export of images and metadata volumes
set -euo pipefail

# -----------------------
# Config (edit these)
# -----------------------
NETWORK="selfie1_default"        # docker network where Postgres is reachable (e.g. <composeproject>_default)
PG_HOST="db"                    # compose service name for Postgres
PG_USER="app"
# PG_DB="selfie1-db-1"
PG_DB="selfie"

IMAGES_VOL="selfie1_selfie_images"     # docker volume name containing images

# Local output
OUT_DIR="./export"
STAMP="$(date +%Y%m%d_%H%M%S)"
FINAL_TAR="selfie_export_${STAMP}.tar.gz"

# Optional: pass PGPASSWORD via env when running:
  #PGPASSWORD=app_password ./export.sh
: "${PGPASSWORD:=}"

# -----------------------
# Helpers
# -----------------------
log() { printf "\n[%s] %s\n" "$(date '+%H:%M:%S')" "$*"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

# -----------------------
# Preflight
# -----------------------
require_cmd docker
require_cmd tar
mkdir -p "$OUT_DIR"

log "Checking Docker volume exists: ${IMAGES_VOL}"
docker volume inspect "$IMAGES_VOL" >/dev/null

log "Checking Docker network exists: ${NETWORK}"
docker network inspect "$NETWORK" >/dev/null

# -----------------------
# Write SQL (edit query here)
# -----------------------
SQL_FILE="${OUT_DIR}/export.sql"

cat > "$SQL_FILE" <<'SQL'
COPY (
  SELECT * 
    FROM patients p
    JOIN (
            SELECT *
            FROM lesions l
            JOIN images i
            ON l.id = i.lesion_id
    ) AS t1
    ON p.patient_id = t1.patient_id
) TO STDOUT WITH CSV HEADER;
SQL

# -----------------------
# Export DB -> CSV
# -----------------------
CSV_FILE="${OUT_DIR}/db_export.csv"
XLSX_FILE="${OUT_DIR}/db_export.xlsx"

log "Exporting Postgres JOIN output to CSV: ${CSV_FILE}"

# Note: we pass PGPASSWORD into the container if set
docker run --rm \
  --network "$NETWORK" \
  -e "PGPASSWORD=${PGPASSWORD}" \
  -v "$(pwd)/${OUT_DIR#./}:/export" \
  postgres:16 \
  sh -lc "psql -h '$PG_HOST' -U '$PG_USER' -d '$PG_DB' -f /export/export.sql" \
  > "$CSV_FILE"

log "CSV rows exported: $(($(wc -l < "$CSV_FILE") - 1)) (excluding header)"

# -----------------------
# CSV -> XLSX
# -----------------------
log "Converting CSV -> XLSX: ${XLSX_FILE}"

docker run --rm \
  -v "$(pwd)/${OUT_DIR#./}:/export" \
  python:3.11-slim \
  sh -lc "
    pip -q install pandas openpyxl >/dev/null &&
    python - <<'PY'
import pandas as pd
df = pd.read_csv('/export/db_export.csv')
df.to_excel('/export/db_export.xlsx', index=False)
print(f'Wrote XLSX with {len(df)} rows')
PY
  "

# -----------------------
# Export images volume -> images.tar.gz
# -----------------------
IMAGES_TAR="${OUT_DIR}/images.tar.gz"

log "Archiving images volume -> ${IMAGES_TAR}"

docker run --rm \
  -v "${IMAGES_VOL}:/images:ro" \
  -v "$(pwd)/${OUT_DIR#./}:/export" \
  alpine \
  sh -lc "tar -czf /export/images.tar.gz -C /images ."

# -----------------------
# Bundle everything -> final tar.gz
# -----------------------
log "Bundling ${OUT_DIR}/ into final archive: ${FINAL_TAR}"

tar -czf "$FINAL_TAR" -C . "$(basename "$OUT_DIR")"

log "Done."
log "Created: ${FINAL_TAR}"
log "Contents:"
tar -tzf "$FINAL_TAR" | sed -n '1,50p'
