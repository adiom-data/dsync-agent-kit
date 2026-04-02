---
title: Generate dsync Connector Configuration
step: 3
phase: config
impact: CRITICAL
tags: [configuration, dsync, connector]
---

## Generate dsync Connector Configuration

Create the dsync connector configuration file that defines the source (SQL Server) and target (Cosmos DB) connections, plus the transformation rules.

### Inputs

- SQL Server connection details (from Step 02)
- Cosmos DB connection string or endpoint + key
- Schema conversion plan (`docs/schema_and_access_patterns_conversion_plan.md`)

### Procedure

1. Obtain the Cosmos DB target connection details from the user:
   - Cosmos DB endpoint URL
   - Cosmos DB primary key or connection string
   - Target database name

2. Generate the dsync connector configuration file:

   ```
   [DSYNC_CONFIG_PLACEHOLDER]

   <!-- Replace this placeholder with the actual dsync connector config format.
        The config should include:
        - Source connector: SQL Server connection (host, port, database, credentials)
        - Target connector: Cosmos DB connection (endpoint, key, database)
        - Transformation rules: table-to-container mappings (from Step 04)
        - Partition key mappings (from Step 05)
        - Any data type transformations
        - Batch size and parallelism settings
   -->
   ```

3. Write the config file to the project directory (e.g., `dsync-config.yaml` or `dsync-config.json`).

4. Do NOT hardcode credentials in the config file if avoidable. Prefer environment variable references or prompt the user to supply them at runtime.

### Success Criteria

- Config file is written to disk
- Source and target connections are correctly specified
- The config file passes dsync's config validation (if available)

### Failure Modes

- **Missing Cosmos DB credentials**: Prompt the user to provide endpoint and key.
- **Invalid config format**: Refer to dsync documentation for the correct schema.
- **Credentials in plaintext**: Warn the user if credentials are written directly into the config file.

### Next Step

Proceed to [04-config-table-mapping](04-config-table-mapping.md).
