# JUSTSAY Disaster Recovery & Backup Policy

## Overview
JUSTSAY disaster recovery procedures ensure high availability and minimal data loss in catastrophic failure scenarios.

## Recovery Targets
- **Recovery Point Objective (RPO)**: < 5 minutes (via automated PostgreSQL Point-in-Time Recovery WAL archiving).
- **Recovery Time Objective (RTO)**: < 30 minutes (container redeployment + database snapshot restore).

## Backup Strategy
- **PostgreSQL**: Daily automated full snapshot + continuous write-ahead log (WAL) archiving to encrypted multi-region bucket.
- **Media Object Storage**: Multi-region object replication with versioning enabled.
- **Restore Test Verification**: Automated staging restore verification run monthly.
