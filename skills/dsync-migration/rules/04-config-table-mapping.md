---
title: Configure Table-to-Container Mapping
step: 4
phase: config
impact: HIGH
tags: [configuration, mapping, tables, containers]
---

## Configure Table-to-Container Mapping

Define how each SQL Server table maps to a Cosmos DB container, including column-to-property mappings and any denormalization or embedding rules.

### Inputs

- Schema conversion plan (`docs/schema_and_access_patterns_conversion_plan.md`)
- SQL Server table schema (from Step 02)
- dsync connector config (from Step 03)

### Procedure

1. Read the table-to-container mapping from the schema conversion plan. For each SQL table, determine:
   - Target Cosmos DB container name
   - Whether the table is embedded into another container or stands alone
   - Which columns map to which Cosmos DB properties
   - Any column renames or type transformations

2. For tables that are **embedded** (denormalized into a parent document):
   - Identify the parent container
   - Define the embedding path (e.g., `order.lineItems[]`)
   - Specify the join key between parent and child tables

3. For tables that are **referenced** (separate containers with ID references):
   - Map the foreign key column to the reference property
   - Note that referential integrity is the application's responsibility in Cosmos DB

4. Handle data type mappings:
   - SQL `DATETIME` -> ISO 8601 string or Unix timestamp (per conversion plan)
   - SQL `MONEY`/`DECIMAL` -> number (note precision considerations)
   - SQL `UNIQUEIDENTIFIER` -> string
   - SQL `VARBINARY` -> base64 string or omit (per conversion plan)
   - SQL `BIT` -> boolean
   - SQL `NVARCHAR`/`VARCHAR` -> string

5. Update the dsync config file with these mappings.

### Success Criteria

- Every in-scope SQL table has a defined target container or embedding path
- Column-to-property mappings are complete
- Data type transformations are specified where needed

### Failure Modes

- **Unmapped table**: A table in scope has no mapping in the conversion plan. Ask the user for guidance.
- **Circular embedding**: Table A embeds B which embeds A. Flag this as an error.
- **Data type incompatibility**: Flag any SQL types that have no clean Cosmos DB equivalent.

### Next Step

Proceed to [05-config-partition-key](05-config-partition-key.md).
