---
title: Generate dsync Connector Configuration
step: 3
phase: config
impact: CRITICAL
tags: [configuration, dsync, connector]
---

## Generate dsync Connector Configuration

dsync uses two separate components for SQL Server -> Cosmos DB NoSQL migrations:
1. **SQL Batch connector** (source): configured via a YAML config file
2. **Cosmos DB NoSQL connector** (sink): a separate Java/gRPC process

### Inputs

- SQL Server connection details (from Step 02)
- Cosmos DB NoSQL account URL and read-write key
- Schema conversion plan (`docs/schema_and_access_patterns_conversion_plan.md`)

### Procedure

1. Obtain the Cosmos DB target connection details from the user:
   - Cosmos DB NoSQL account URL (e.g., `https://<account>.documents.azure.com:443/`)
   - Cosmos DB primary read-write key
   - Target database and container names (must be pre-created)

2. Generate the SQL Batch connector YAML config file (`dsync-sqlbatch-config.yml`):

   ```yaml
   # dsync SQL Batch Connector Configuration
   # Docs: https://docs.adiom.io/reference/connectors/sql-batch

   id: sqlserver-source
   driver: sqlserver
   connectionstring: "sqlserver://${SQL_USER}:${SQL_PASSWORD}@${SQL_HOST}:${SQL_PORT}?database=${SQL_DATABASE}"
   mappings:
     # One mapping entry per SQL table to migrate.
     # Repeat this block for each table in scope.
     - namespace: "dbo.Products"
       query: "SELECT ProductID, Name, ProductNumber, Color, ListPrice FROM SalesLT.Product"
       partitionquery: "SELECT ProductID FROM SalesLT.Product WHERE ProductID % 4 = 0 ORDER BY ProductID"
       cols: [ProductID]
       limit: 5000

     - namespace: "dbo.SalesOrderHeader"
       query: "SELECT SalesOrderID, OrderDate, CustomerID, TotalDue FROM SalesLT.SalesOrderHeader"
       partitionquery: "SELECT SalesOrderID FROM SalesLT.SalesOrderHeader WHERE SalesOrderID % 4 = 0 ORDER BY SalesOrderID"
       cols: [SalesOrderID]
       limit: 5000

     # Add additional mappings for each table from the schema conversion plan.
     # See Step 04 for the complete table-to-container mapping procedure.
   ```

   **Key fields explained:**
   - `driver`: Use `sqlserver` for SQL Server sources
   - `connectionstring`: ADO.NET-style connection string; use env vars for credentials
   - `namespace`: Logical name for this dataset (used in `--namespace` remapping)
   - `query`: SQL SELECT that returns all columns to migrate
   - `partitionquery`: Returns partition boundary values for parallel reads (must match `cols`, sorted ascending, no duplicates)
   - `cols`: Primary key column(s) used for partitioning and row identification
   - `limit`: Batch size per read operation

3. Write the config file to the project directory as `dsync-sqlbatch-config.yml`.

4. Do NOT hardcode credentials in the config file. Use environment variables:
   ```bash
   export SQL_USER="sa"
   export SQL_PASSWORD="<your-password>"
   export SQL_HOST="localhost"
   export SQL_PORT="1433"
   export SQL_DATABASE="AdventureWorksLT"
   ```

5. Note: The Cosmos DB NoSQL destination is NOT configured in this file. It runs as a separate gRPC connector process (configured in Step 06).

### Success Criteria

- `dsync-sqlbatch-config.yml` is written to disk
- Connection string uses environment variable references (not hardcoded credentials)
- Every in-scope table has a mapping entry with query, partitionquery, cols, and limit
- The `driver` field is set to `sqlserver`

### Failure Modes

- **Missing Cosmos DB credentials**: Prompt the user to provide the account URL and key (needed in Step 06).
- **Invalid YAML**: Ensure proper indentation and quoting of connection strings.
- **Missing partition query**: Every mapping MUST include a `partitionquery` for parallel reads.
- **Credentials in plaintext**: Warn the user if SQL credentials are written directly into the YAML file.

### Reference

- [SQL Batch Connector Docs](https://docs.adiom.io/reference/connectors/sql-batch)
- [dsync GitHub](https://github.com/adiom-data/dsync)

### Next Step

Proceed to [04-config-table-mapping](04-config-table-mapping.md).
