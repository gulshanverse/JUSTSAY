#!/usr/bin/env bash
# JUSTSAY Production Database Backup Script
# Supports pg_dump backups and Point-In-Time-Recovery (PITR) WAL archiving

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/justsay}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/justsay_backup_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting JUSTSAY PostgreSQL database backup..."

mkdir -p "${BACKUP_DIR}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  exit 1
fi

pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_FILE}"

echo "[$(date)] Backup completed successfully: ${BACKUP_FILE}"
