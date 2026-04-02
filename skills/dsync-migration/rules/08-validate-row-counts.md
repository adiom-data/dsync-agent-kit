---
title: Validate Row Counts
step: 8
phase: validate
impact: CRITICAL
tags: [validation, row-counts, completeness]
---

## Validate Row Counts

Compare row counts between the source SQL Server tables and the target Cosmos DB containers to confirm all data was migrated.

### Inputs

- Source row counts (captured in Step 02)
- Cosmos DB connection details
- Table-to-container mapping (from Step 04)

### Procedure

1. For each source SQL table, query the current row count:
   ```sql
   SELECT COUNT(*) FROM [schema].[table];
   ```

2. For the corresponding Cosmos DB container, query the document count:
   ```sql
   SELECT VALUE COUNT(1) FROM c
   ```
   Or use the container metrics if available via SDK/REST API.

3. Compare source and target counts. Build a summary table:

   | Source Table | Source Rows | Target Container | Target Docs | Match |
   |-------------|-------------|-----------------|-------------|-------|
   | SalesLT.Customer | 847 | Customers | 847 | YES |
   | SalesLT.Product | 295 | Products | 295 | YES |

4. For tables that were **embedded** into parent documents, the container document count will NOT match the source row count. Instead, verify:
   - The parent container doc count matches the parent table row count
   - A sample parent document contains the expected number of embedded child items

5. Flag any mismatches with the exact delta.

### Success Criteria

- All standalone table row counts match exactly
- Embedded table counts are verified via parent document inspection
- Zero unexplained missing rows

### Failure Modes

- **Count mismatch**: Re-run the dsync migration for the specific table/container that has a delta.
- **Cosmos DB count query slow**: For large containers, `COUNT(1)` can be expensive. Use container metrics instead.
- **Source data changed during migration**: If the source is live, rows may have been added/deleted during migration. Note the timestamp and accept small deltas.

### Next Step

Proceed to [09-validate-data-integrity](09-validate-data-integrity.md).
