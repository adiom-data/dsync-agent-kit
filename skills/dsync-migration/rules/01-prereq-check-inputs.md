---
title: Verify Migration Input Documents
step: 1
phase: prereq
impact: CRITICAL
tags: [prerequisites, validation, documents]
---

## Verify Migration Input Documents

All four migration planning documents must exist and contain the expected sections before proceeding. This prevents running dsync against an incomplete or incorrect migration plan.

### Inputs

- Project directory containing `docs/` folder

### Procedure

1. Check that all four files exist:
   - `docs/cosmos-db-migration-assessment.md`
   - `docs/access-patterns.md`
   - `docs/volumetrics.md`
   - `docs/schema_and_access_patterns_conversion_plan.md`

2. Validate each document contains minimum required content:

   **cosmos-db-migration-assessment.md** must contain:
   - Source database name and server
   - List of tables with row counts
   - Data type inventory
   - Identified constraints and relationships (foreign keys)

   **access-patterns.md** must contain:
   - At least one documented query pattern
   - Read/write ratio estimates
   - Identified hot paths or frequently accessed entities

   **volumetrics.md** must contain:
   - Row counts per table
   - Estimated data size per table
   - Growth rate projections (if available)

   **schema_and_access_patterns_conversion_plan.md** must contain:
   - SQL table to Cosmos DB container mapping
   - Partition key selection for each container
   - Embedding vs referencing decisions
   - Any denormalization or schema transformation rules

3. If any document is missing or incomplete, report exactly which documents and sections are missing.

### Success Criteria

- All four files exist
- Each contains the minimum required sections listed above
- Agent has parsed and can reference the table-to-container mapping and partition key selections

### Failure Modes

- **Missing file**: Tell the user which file is missing and that Steps 1-4 must be completed first.
- **Empty or stub file**: Flag it as incomplete and list the missing sections.
- **Conflicting information**: If volumetrics row counts don't match assessment row counts, flag the discrepancy.

### Next Step

Proceed to [02-prereq-sql-connection](02-prereq-sql-connection.md).
