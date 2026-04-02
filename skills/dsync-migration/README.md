# dsync-migration

SQL Server to Azure Cosmos DB migration skill using dsync. This is Step 5 of the database modernization workflow.

## When to Use

Use this skill when:
- You have a running SQL Server instance with data to migrate
- Steps 1-4 have produced the required migration planning documents
- A Cosmos DB target has been provisioned (via Bicep or manually)
- You need to generate a dsync connector config and run the migration

## Required Inputs

1. **Migration assessment** (`docs/cosmos-db-migration-assessment.md`)
2. **Access patterns** (`docs/access-patterns.md`)
3. **Volumetrics** (`docs/volumetrics.md`)
4. **Schema conversion plan** (`docs/schema_and_access_patterns_conversion_plan.md`)
5. **Live SQL Server connection string**

## Workflow Sequence

The rules are numbered to enforce execution order:

| Rule | Phase | Description |
|------|-------|-------------|
| 01 | Prereq | Check all four input documents exist and are valid |
| 02 | Prereq | Verify SQL Server connectivity and enumerate tables |
| 03 | Config | Generate the dsync connector configuration file |
| 04 | Config | Map SQL tables/columns to Cosmos DB containers/properties |
| 05 | Config | Configure partition keys per the schema conversion plan |
| 06 | Run | Execute the dsync migration command |
| 07 | Run | Monitor migration progress and handle errors |
| 08 | Validate | Compare source and target row counts |
| 09 | Validate | Verify data integrity with sample queries |
| 10 | Validate | Run Cosmos DB queries from the access patterns doc |
