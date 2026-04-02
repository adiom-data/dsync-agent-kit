---
title: Configure Partition Keys
step: 5
phase: config
impact: CRITICAL
tags: [configuration, partition-key, cosmosdb]
---

## Configure Partition Keys

Set the partition key for each Cosmos DB container based on the schema conversion plan. Partition key selection directly determines scalability, query performance, and cost.

### Inputs

- Schema conversion plan (`docs/schema_and_access_patterns_conversion_plan.md`)
- Access patterns (`docs/access-patterns.md`)
- dsync connector config (from Steps 03-04)

### Procedure

1. For each target Cosmos DB container, read the partition key from the schema conversion plan.

2. Validate each partition key choice against best practices:
   - **High cardinality**: The key should have many unique values (thousands+). Flag if the chosen key has fewer than 100 distinct values in the source data.
   - **Even distribution**: No single partition key value should hold a disproportionate amount of data. Query the source SQL table to check distribution:
     ```sql
     SELECT [partition_key_column], COUNT(*) AS cnt
     FROM [schema].[table]
     GROUP BY [partition_key_column]
     ORDER BY cnt DESC;
     ```
   - **Query alignment**: The most frequent queries from `access-patterns.md` should filter on the partition key to avoid cross-partition queries.

3. If the conversion plan specifies a **hierarchical partition key**, configure it with levels ordered broad-to-narrow (e.g., `/tenantId`, `/category`, `/id`).

4. If the conversion plan specifies a **synthetic partition key** (e.g., combining two columns), add the transformation rule to the dsync config.

5. Update the dsync config file with partition key settings for each container.

### Success Criteria

- Every target container has a partition key configured
- Partition key choices align with the conversion plan
- No obvious low-cardinality or hot-partition risks

### Failure Modes

- **Low cardinality key**: The chosen key has very few distinct values. Warn the user and suggest alternatives.
- **Hot partition detected**: One key value dominates (>20% of rows). Flag this with the actual distribution data.
- **Missing partition key in plan**: The conversion plan doesn't specify a key for a container. Ask the user.

### Next Step

Proceed to [06-run-execute-migration](06-run-execute-migration.md).
