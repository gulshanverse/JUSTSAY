# BACKUP AND RESTORE PROCEDURES

## Overview
This document outlines the backup and restore procedures for JUSTSAY PostgreSQL database instances.

## Database Backup (`database/backup.sh`)
The automated backup script dumps the PostgreSQL database into compressed SQL format and uploads it to private cloud object storage.

### Execution:
```bash
./database/backup.sh
```

### Script Verification Matrix:
- **PGDATABASE**: `justsay_db` (or `justsay_prod`)
- **Format**: Compressed tar/custom format (`pg_dump -F c`)
- **Encryption**: AES-256 server-side encryption enabled for cloud storage uploads
- **Retention**: Daily backups kept for 30 days; weekly backups kept for 90 days.

---

## Restore Procedure

### 1. Identify Target Snapshot
Retrieve the desired backup archive from object storage:
```bash
gsutil cp gs://justsay-db-backups-prod/backup_2026_09_08.tar.gz ./backup.tar.gz
```

### 2. Prepare Isolated Target Database
Create a clean PostgreSQL database instance:
```bash
createdb -h postgres-host -U postgres justsay_restore_db
```

### 3. Restore Database Schema & Data
```bash
pg_restore -h postgres-host -U postgres -d justsay_restore_db -v backup.tar.gz
```

### 4. Integrity Verification
Run sanity checks against restored instance:
```sql
SELECT count(*) FROM users;
SELECT count(*) FROM messages;
SELECT count(*) FROM cards;
```

### 5. Point Application to Restored Instance
Update `DATABASE_URL` in environment variables and restart API services.
