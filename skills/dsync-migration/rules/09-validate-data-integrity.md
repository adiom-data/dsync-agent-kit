---
title: Validate Data Integrity
step: 9
phase: validate
impact: HIGH
tags: [validation, data-integrity, spot-check]
---

## Validate Data Integrity

Spot-check individual records to confirm data was migrated correctly, including data types, values, and relationships.

### Inputs

- SQL Server connection (from Step 02)
- Cosmos DB connection
- Table-to-container mapping (from Step 04)

### Procedure

1. For each migrated table/container pair, select 3-5 sample records from the SQL source:
   ```sql
   SELECT TOP 5 * FROM [schema].[table] ORDER BY NEWID();
   ```

2. For each sample record, query the corresponding document in Cosmos DB using the primary key / partition key:
   ```sql
   SELECT * FROM c WHERE c.id = '<id-value>'
   ```

3. Compare field-by-field:
   - String values match exactly
   - Numeric values match (accounting for precision differences in MONEY/DECIMAL types)
   - DateTime values are correctly formatted
   - NULL values in SQL are either absent or null in Cosmos DB
   - Boolean values (BIT -> bool) are correctly mapped

4. For embedded documents, verify:
   - Child records appear as nested arrays in the parent document
   - The count of embedded items matches the source child row count for that parent
   - Child field values match the source

5. For reference-based relationships, verify:
   - The reference ID in the child document matches a valid parent document ID
   - Cross-referencing works in both directions

### Success Criteria

- All sampled records match between source and target
- Data types are correctly transformed
- Embedded and referenced relationships are intact

### Failure Modes

- **Value mismatch**: Log the exact field, source value, and target value. May indicate a data type transformation error in the dsync config.
- **Missing fields**: A column exists in SQL but not in the Cosmos DB document. Check the column mapping in Step 04.
- **Encoding issues**: Special characters (unicode, accents) not preserved. Check encoding settings in the dsync config.

### Next Step

Proceed to [10-validate-cosmos-queries](10-validate-cosmos-queries.md).
