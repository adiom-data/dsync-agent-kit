---
title: Validate Cosmos DB Queries
step: 10
phase: validate
impact: HIGH
tags: [validation, queries, access-patterns, cosmosdb]
---

## Validate Cosmos DB Queries

Run the access pattern queries from the migration planning documents against Cosmos DB to confirm the migrated data supports the application's query needs.

### Inputs

- Access patterns (`docs/access-patterns.md`)
- Cosmos DB connection
- Schema conversion plan (`docs/schema_and_access_patterns_conversion_plan.md`)

### Procedure

1. Extract each documented access pattern from `docs/access-patterns.md`. For each pattern:
   - Translate the original SQL query into a Cosmos DB SQL API query
   - Ensure the query filters on the partition key where possible (to avoid cross-partition scans)

2. Execute each query against Cosmos DB and verify:
   - The query returns results (not empty)
   - The result count is plausible given the source data
   - The query completes within a reasonable time

3. For each query, capture the RU charge from the response headers:
   ```
   x-ms-request-charge: <RU value>
   ```
   Log these for the user to review. High RU queries may indicate:
   - Missing or incorrect partition key filter
   - Need for a composite index
   - Cross-partition fan-out

4. Build a summary table:

   | Access Pattern | Cosmos DB Query | Results | RU Cost | Status |
   |---------------|----------------|---------|---------|--------|
   | Get customer by ID | `SELECT * FROM c WHERE c.id = '123'` | 1 doc | 3.5 RU | OK |
   | List orders by customer | `SELECT * FROM c WHERE c.customerId = '123'` | 5 docs | 12.1 RU | OK |

5. Flag any access pattern that:
   - Returns zero results when data is expected
   - Has an RU cost above 100 (likely a cross-partition scan)
   - Takes more than 5 seconds to execute

### Success Criteria

- All documented access patterns return expected results
- No access pattern has an unexpectedly high RU cost
- The migrated data fully supports the application's query needs

### Failure Modes

- **Query returns no results**: Check the partition key filter and document structure. The schema transformation may have renamed or restructured the queried fields.
- **High RU cost**: Add a composite index or adjust the query to include the partition key.
- **Query syntax error**: Cosmos DB SQL is a subset of ANSI SQL. Features like JOINs, GROUP BY, and subqueries work differently. Translate accordingly.

### Migration Complete

If all validations pass, the migration is complete. Report the final summary to the user:
- Total tables/containers migrated
- Total rows/documents migrated
- Any warnings or issues encountered
- RU cost summary for access pattern queries
- Connection details for the Cosmos DB target
