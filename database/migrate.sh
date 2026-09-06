#!/usr/bin/env bash
# JUSTSAY Production Database Migration Entrypoint

set -euo pipefail

echo "[$(date)] Running JUSTSAY database migrations..."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  exit 1
fi

MIGRATIONS_DIR="$(dirname "$0")/migrations"

for sql_file in "${MIGRATIONS_DIR}"/*.sql; do
  if [ -f "$sql_file" ]; then
    echo "[$(date)] Applying migration: $(basename "$sql_file")..."
    psql "${DATABASE_URL}" -f "$sql_file"
  fi
done

echo "[$(date)] All database migrations applied successfully."
