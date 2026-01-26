#!/usr/bin/env bash

# RUN: PGPASSWORD=app_password bash export.sh

# Automated export of images and metadata volumes
set -euo pipefail

# -----------------------
# Config
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

# Optional filter parameters (passed from API)
: "${LAST_MONTHS:=all}"           # 'all' or number like 1, 2, 3, 6
: "${PHI_ALLOWED:=false}"         # 'true' or 'false'
: "${GOOD_QUALITY_ONLY:=false}"   # 'true' or 'false'

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
FEEDBACK_SQL_FILE="${OUT_DIR}/feedback.sql"

# Build WHERE clause based on filters
WHERE_CLAUSES=""

# Date filter
if [ "$LAST_MONTHS" != "all" ]; then
  WHERE_CLAUSES="${WHERE_CLAUSES} AND i.captured_at >= NOW() - INTERVAL '${LAST_MONTHS} months'"
fi

# PHI filter
if [ "$PHI_ALLOWED" = "false" ]; then
  WHERE_CLAUSES="${WHERE_CLAUSES} AND i.contains_phi = false"
fi

# Quality filter
if [ "$GOOD_QUALITY_ONLY" = "true" ]; then
  WHERE_CLAUSES="${WHERE_CLAUSES} AND i.poor_quality = false"
fi

# Remove leading ' AND' if exists
WHERE_CLAUSES="${WHERE_CLAUSES# AND }"

# Build the WHERE clause
if [ -n "$WHERE_CLAUSES" ]; then
  WHERE_CLAUSE="WHERE ${WHERE_CLAUSES}"
else
  WHERE_CLAUSE=""
fi

log "Applying filters - Months: ${LAST_MONTHS}, PHI Allowed: ${PHI_ALLOWED}, Good Quality Only: ${GOOD_QUALITY_ONLY}"

cat > "$SQL_FILE" <<SQL
COPY (
  SELECT * 
    FROM patients p
    JOIN (
            SELECT *
            FROM lesions l
            JOIN images i
            ON l.id = i.lesion_id
            ${WHERE_CLAUSE}
    ) AS t1
    ON p.patient_id = t1.patient_id
) TO STDOUT WITH CSV HEADER;
SQL

# feedback
cat > "$FEEDBACK_SQL_FILE" <<'SQL'
COPY (
  SELECT * FROM bug_reports b
) TO STDOUT WITH CSV HEADER;
SQL

# -----------------------
# Export DB -> CSV
# -----------------------
CSV_FILE="${OUT_DIR}/db_export.csv"
XLSX_FILE="${OUT_DIR}/db_export.xlsx"

FEEDBACK_CSV="${OUT_DIR}/feedback_export.csv"
FEEDBACK_XLSX="${OUT_DIR}/feedback_export.xlsx"

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

log "Exporting feedback to CSV: ${FEEDBACK_CSV}"

# Note: we pass PGPASSWORD into the container if set
docker run --rm \
  --network "$NETWORK" \
  -e "PGPASSWORD=${PGPASSWORD}" \
  -v "$(pwd)/${OUT_DIR#./}:/export" \
  postgres:16 \
  sh -lc "psql -h '$PG_HOST' -U '$PG_USER' -d '$PG_DB' -f /export/feedback.sql" \
  > "$FEEDBACK_CSV"

log "CSV rows exported: $(($(wc -l < "$FEEDBACK_CSV") - 1)) (excluding header)"

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

  log "Converting CSV -> XLSX: ${FEEDBACK_XLSX}"

docker run --rm \
  -v "$(pwd)/${OUT_DIR#./}:/export" \
  python:3.11-slim \
  sh -lc "
    pip -q install pandas openpyxl >/dev/null &&
    python - <<'PY'
import pandas as pd
df = pd.read_csv('/export/feedback_export.csv')
df.to_excel('/export/feedback_export.xlsx', index=False)
print(f'Wrote XLSX with {len(df)} rows')
PY
  "

# -----------------------
# Export images volume -> images.tar.gz
# -----------------------
IMAGES_TAR="${OUT_DIR}/images.tar.gz"
IMAGE_LIST="${OUT_DIR}/image_list.txt"

log "Extracting image filepaths from CSV"

# Extract filepaths column from CSV (assumes there's a 'filepath' column)
# Parse CSV to get all image paths, handle multiple paths per row (comma-separated in the filepaths field)
docker run --rm \
  -v "$(pwd)/${OUT_DIR#./}:/export" \
  python:3.11-slim \
  sh -lc "
    pip -q install pandas >/dev/null &&
    python - <<'PY'
import pandas as pd
import sys

try:
    df = pd.read_csv('/export/db_export.csv')
    
    # Check if file_path, filepaths, or filepath column exists
    if 'file_path' not in df.columns and 'filepaths' not in df.columns and 'filepath' not in df.columns:
        print('Warning: No filepath column found in CSV', file=sys.stderr)
        sys.exit(1)
    
    # Try different column name variations
    if 'file_path' in df.columns:
        filepath_col = 'file_path'
    elif 'filepaths' in df.columns:
        filepath_col = 'filepaths'
    else:
        filepath_col = 'filepath'
    
    # Extract and flatten all filepaths
    all_paths = set()
    for paths in df[filepath_col].dropna():
        # Handle comma-separated paths
        if isinstance(paths, str):
            for path in paths.split(', '):
                path = path.strip()
                if path and path != 'N/A':
                    # Strip /data/images/ prefix if present (database stores full path)
                    # but Docker volume has files at root
                    if path.startswith('/data/images/'):
                        path = path[len('/data/images/'):]
                    all_paths.add(path)
    
    # Write to file (one path per line)
    with open('/export/image_list.txt', 'w') as f:
        for path in sorted(all_paths):
            f.write(path + '\n')
    
    print(f'Found {len(all_paths)} unique image paths')
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)
PY
  "

if [ ! -f "$IMAGE_LIST" ] || [ ! -s "$IMAGE_LIST" ]; then
  log "No images to export or image list is empty, creating empty archive"
  docker run --rm \
    -v "$(pwd)/${OUT_DIR#./}:/export" \
    alpine \
    sh -lc "tar -czf /export/images.tar.gz -T /dev/null"
else
  log "Archiving $(wc -l < "$IMAGE_LIST") images from volume -> ${IMAGES_TAR}"
  
  docker run --rm \
    -v "${IMAGES_VOL}:/images:ro" \
    -v "$(pwd)/${OUT_DIR#./}:/export" \
    alpine \
    sh -lc "tar -czf /export/images.tar.gz -C /images -T /export/image_list.txt 2>/dev/null || echo 'Some files may not exist in volume'"
fi

# -----------------------
# Bundle everything -> final tar.gz
# -----------------------
log "Bundling ${OUT_DIR}/ into final archive: ${FINAL_TAR}"

tar -czf "$FINAL_TAR" -C . --exclude='*.csv' --exclude='*.sql' --exclude='image_list.txt' "$(basename "$OUT_DIR")"

log "Done."
log "Created: ${FINAL_TAR}"
log "Contents:"
tar -tzf "$FINAL_TAR" | sed -n '1,50p'
