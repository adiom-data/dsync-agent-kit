# dsync Migration: SQL Server to Cosmos DB -- Compiled Rules

> This is the compiled version of all rules. For the structured index, see [SKILL.md](SKILL.md).

---

## Phase 1: Prerequisites

### Step 01: Verify Migration Input Documents

All four migration planning documents must exist before proceeding:
- `docs/cosmos-db-migration-assessment.md` -- source database analysis, table inventory, constraints
- `docs/access-patterns.md` -- query patterns, read/write ratios, hot paths
- `docs/volumetrics.md` -- row counts, data sizes, growth projections
- `docs/schema_and_access_patterns_conversion_plan.md` -- table-to-container mapping, partition keys, embedding decisions

If any are missing, STOP and tell the user which inputs are needed.

### Step 02: Verify SQL Server Connectivity

Test the connection and enumerate source tables:
```sql
SELECT @@VERSION;
SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';
```
Capture row counts for every in-scope table. Cross-reference against the migration assessment.

---

## Phase 2: Configuration

### Step 03: Generate dsync Connector Configuration

Create the dsync connector config file with source (SQL Server) and target (Cosmos DB) connections.

```
[DSYNC_CONFIG_PLACEHOLDER]
```

Do not hardcode credentials. Prefer environment variable references.

### Step 04: Configure Table-to-Container Mapping

For each SQL table, define:
- Target Cosmos DB container (or embedding path for denormalized tables)
- Column-to-property mappings
- Data type transformations (DATETIME->ISO8601, MONEY->number, BIT->boolean, UNIQUEIDENTIFIER->string)

### Step 05: Configure Partition Keys

For each container, set the partition key from the conversion plan. Validate:
- High cardinality (thousands+ unique values)
- Even distribution (no value >20% of rows)
- Query alignment (most frequent queries filter on partition key)

---

## Phase 3: Execution

### Step 06: Execute the dsync Migration

```
[DSYNC_COMMAND_PLACEHOLDER]
```

Watch for: migration started confirmation, per-table progress, completion summary, errors.

### Step 07: Monitor Migration Progress

Handle transient errors with up to 3 retries (30s delay). Log data errors and continue. Capture the final migration summary.

---

## Phase 4: Validation

### Step 08: Validate Row Counts

Compare source and target counts for every table/container. For embedded tables, verify via parent document inspection.

### Step 09: Validate Data Integrity

Spot-check 3-5 records per table. Compare field-by-field: strings, numbers (precision), dates, NULLs, booleans. Verify embedded and referenced relationships.

### Step 10: Validate Cosmos DB Queries

Translate each access pattern from `docs/access-patterns.md` into a Cosmos DB query. Execute and verify results are non-empty, RU cost is reasonable (<100 RU), and response time is acceptable (<5s).

---

## Completion Criteria

The migration is successful when:
- dsync exited with status 0
- Row counts match between source and target
- Sample records match field-by-field
- All access pattern queries return expected results
