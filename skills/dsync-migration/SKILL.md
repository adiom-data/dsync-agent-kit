---
name: dsync-migration
description: |
  SQL Server to Azure Cosmos DB migration and sync using dsync. Guides agents through
  generating a dsync connector config, executing the migration, and validating results.
  Use when migrating data from SQL Server to Cosmos DB as Step 5 of a database
  modernization workflow, after assessment, schema conversion, Bicep infra, and deployment.

license: MIT
metadata:
  author: Adiom Data
  version: "1.0.0"
---

# dsync Migration: SQL Server to Cosmos DB

Step-by-step procedural skill for migrating data from SQL Server to Azure Cosmos DB using dsync. This skill is designed for Step 5 of a database modernization workflow.

## Trigger Conditions

Activate this skill when ANY of the following are true:
- The user mentions "dsync", "data migration", or "SQL to Cosmos" in a migration context
- The project contains `docs/cosmos-db-migration-assessment.md` or `docs/schema_and_access_patterns_conversion_plan.md`
- The user asks to migrate, sync, or replicate data from SQL Server to Cosmos DB
- The user asks to generate a dsync config or run dsync

## Required Inputs

Before proceeding, the agent MUST verify all of the following exist:

1. **Migration assessment** -- `docs/cosmos-db-migration-assessment.md`
   Contains: source database analysis, table inventory, data types, constraints
2. **Access patterns** -- `docs/access-patterns.md`
   Contains: query patterns, read/write ratios, hot paths
3. **Volumetrics** -- `docs/volumetrics.md`
   Contains: row counts per table, data sizes, growth projections
4. **Schema conversion plan** -- `docs/schema_and_access_patterns_conversion_plan.md`
   Contains: SQL-to-NoSQL mapping decisions, embedding vs referencing, partition key choices
5. **SQL Server connection** -- a live connection string or host/port/user/password/database

If any input is missing, STOP and tell the user which inputs are needed before this step can proceed.

## Procedure

Follow the rules in numbered order. Each rule file contains the detailed procedure.

### Phase 1: Prerequisites (Rules 01-02)

- [01-prereq-check-inputs](rules/01-prereq-check-inputs.md) -- Verify all four migration docs exist and contain expected sections
- [02-prereq-sql-connection](rules/02-prereq-sql-connection.md) -- Test SQL Server connectivity and enumerate source tables

### Phase 2: Configuration (Rules 03-05)

- [03-config-generate-connector](rules/03-config-generate-connector.md) -- Generate the dsync connector configuration file
- [04-config-table-mapping](rules/04-config-table-mapping.md) -- Map SQL tables and columns to Cosmos DB containers and properties
- [05-config-partition-key](rules/05-config-partition-key.md) -- Configure partition keys per the schema conversion plan

### Phase 3: Execution (Rules 06-07)

- [06-run-execute-migration](rules/06-run-execute-migration.md) -- Execute the dsync migration command
- [07-run-monitor-progress](rules/07-run-monitor-progress.md) -- Monitor progress, handle errors, and retry failures

### Phase 4: Validation (Rules 08-10)

- [08-validate-row-counts](rules/08-validate-row-counts.md) -- Compare source and target row counts for every table/container
- [09-validate-data-integrity](rules/09-validate-data-integrity.md) -- Spot-check data integrity with sample record comparisons
- [10-validate-cosmos-queries](rules/10-validate-cosmos-queries.md) -- Run access pattern queries against Cosmos DB to confirm queryability

## Completion Criteria

The migration is considered successful when ALL of the following are true:
- dsync exited with status 0
- Row counts match between SQL Server and Cosmos DB for every table/container
- Sample records match between source and target
- Access pattern queries return expected results from Cosmos DB
