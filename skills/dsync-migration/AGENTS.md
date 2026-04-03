# dsync-migration -- Compiled Rules

> Auto-generated from 10 rule files. Do not edit directly.

---

## Phase: prereq

### Verify Migration Input Documents

**Step 1** | Impact: CRITICAL

## Verify Migration Input Documents

All four migration planning documents must exist and contain the expected sections before proceeding. This prevents running dsync against an incomplete or incorrect migration plan.

### Inputs

- Project directory containing `docs/` folder

### Procedure

1. Check that all four files exist:
   - `docs/cosmos-db-migration-assessment.md`
   - `docs/access-patterns.md`
   - `docs/volumetrics.md`
   - `docs/schema_and_access_patterns_conversion_plan.md`

2. Validate each document contains minimum required content:

   **cosmos-db-migration-assessment.md** must contain:
   - Source database name and server
   - List of tables with row counts
   - Data type inventory
   - Identified constraints and relationships (foreign keys)

   **access-patterns.md** must contain:
   - At least one documented query pattern
   - Read/write ratio estimates
   - Identified hot paths or frequently accessed entities

   **volumetrics.md** must contain:
   - Row counts per table
   - Estimated data size per table
   - Growth rate projections (if available)

   **schema_and_access_patterns_conversion_plan.md** must contain:
   - SQL table to Cosmos DB container mapping
   - Partition key selection for each container
   - Embedding vs referencing decisions
   - Any denormalization or schema transformation rules

3. If any document is missing or incomplete, report exactly which documents and sections are missing.

### Success Criteria

- All four files exist
- Each contains the minimum required sections listed above
- Agent has parsed and can reference the table-to-container mapping and partition key selections

### Failure Modes

- **Missing file**: Tell the user which file is missing and that Steps 1-4 must be completed first.
- **Empty or stub file**: Flag it as incomplete and list the missing sections.
- **Conflicting information**: If volumetrics row counts don't match assessment row counts, flag the discrepancy.

### Next Step

Proceed to [02-prereq-sql-connection](02-prereq-sql-connection.md).

### Verify SQL Server Connectivity

**Step 2** | Impact: CRITICAL

## Verify SQL Server Connectivity

Confirm that the agent can connect to the source SQL Server instance and enumerate the tables that will be migrated.

### Inputs

- SQL Server connection details: host, port, username, password, database name
- Table list from `docs/cosmos-db-migration-assessment.md`

### Procedure

1. Obtain the SQL Server connection string from the user. Accept any of these formats:
   - Explicit parameters: host, port, user, password, database
   - Connection string: `Server=<host>,<port>;Database=<db>;User Id=<user>;Password=<pass>;`
   - Docker container name + credentials (if running locally)

2. Test connectivity by executing a simple query:
   ```sql
   SELECT @@VERSION;
   ```

3. Enumerate all user tables in the database:
   ```sql
   SELECT TABLE_SCHEMA, TABLE_NAME
   FROM INFORMATION_SCHEMA.TABLES
   WHERE TABLE_TYPE = 'BASE TABLE'
   ORDER BY TABLE_SCHEMA, TABLE_NAME;
   ```

4. Cross-reference the enumerated tables against the table list in the migration assessment document. Flag any discrepancies:
   - Tables in the assessment but not in the database
   - Tables in the database but not in the assessment (these may be intentionally excluded)

5. For each table in scope, capture the row count:
   ```sql
   SELECT '[schema].[table]' AS TableName, COUNT(*) AS RowCount
   FROM [schema].[table];
   ```

6. Store these row counts -- they will be used in Step 08 for validation.

### Success Criteria

- SQL Server connection succeeds
- All tables listed in the migration assessment exist in the database
- Row counts are captured for every in-scope table

### Failure Modes

- **Connection refused**: Check that SQL Server is running, port is correct, and firewall allows the connection.
- **Authentication failure**: Verify username/password. For Docker containers, check the SA_PASSWORD environment variable.
- **Database not found**: Confirm the database name matches exactly (case-sensitive on some configurations).
- **Table missing**: A table listed in the assessment doesn't exist -- the assessment may be out of date.

### Next Step

Proceed to [03-config-generate-connector](03-config-generate-connector.md).

---

## Phase: config

### Generate dsync Connector Configuration

**Step 3** | Impact: CRITICAL

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

### Configure Table-to-Container Mapping

**Step 4** | Impact: HIGH

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

### Configure Partition Keys

**Step 5** | Impact: CRITICAL

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

---

## Phase: run

### Execute the dsync Migration

**Step 6** | Impact: CRITICAL

## Execute the dsync Migration

Run dsync to migrate data from SQL Server to Cosmos DB NoSQL. This requires two processes:
1. The **Cosmos DB NoSQL sink connector** (Java/gRPC process)
2. The **dsync engine** with the SQL Batch source config

### Inputs

- Completed SQL Batch config file `dsync-sqlbatch-config.yml` (from Steps 03-05)
- dsync binary available on the system
- Cosmos DB NoSQL account URL and read-write key

### Procedure

#### Step A: Verify dsync is installed

```bash
dsync --help
```

If dsync is not installed, install it using one of these methods:

```bash
# Option 1: Homebrew (macOS)
brew install adiom-data/homebrew-tap/dsync

# Option 2: Docker
docker pull markadiom/dsync

# Option 3: Build from source (requires Go)
git clone https://github.com/adiom-data/dsync.git
cd dsync
go build
```

#### Step B: Build and start the Cosmos DB NoSQL sink connector

The Cosmos DB NoSQL connector is a separate Java process that receives data via gRPC and writes to Cosmos DB using the optimized Java SDK for bulk operations.

```bash
# Set Cosmos DB credentials as environment variables
export COSMOS_URL="https://<your-account>.documents.azure.com:443/"
export COSMOS_KEY="<your-read-write-key>"

# Option 1: Using Docker (recommended)
docker network create dsync-net 2>/dev/null || true

docker run -d \
  --network dsync-net \
  --name cosmosnosqlconnector \
  -e OTEL_SDK_DISABLED=true \
  markadiom/cosmosnosqlconnector 8089 "$COSMOS_URL" "$COSMOS_KEY"

# Option 2: Using locally built JAR (requires Java 21+)
# cd dsync/java && mvn clean install
# java -jar target/cosmos-connector-1-jar-with-dependencies.jar 8089 "$COSMOS_URL" "$COSMOS_KEY" &
```

Wait a few seconds for the connector to start, then verify it is running:
```bash
docker logs cosmosnosqlconnector 2>&1 | tail -5
```

#### Step C: Execute dsync with the SQL Batch source

```bash
# Using local dsync binary:
dsync \
  --progress \
  --logfile dsync.log \
  --namespace "dbo.Products:TargetDB.ProductsContainer,dbo.SalesOrderHeader:TargetDB.OrdersContainer" \
  "sqlbatch --config=dsync-sqlbatch-config.yml" \
  grpc://localhost:8089 --insecure

# Using Docker (if source is also in Docker):
docker run \
  --network dsync-net \
  --name dsync \
  -v "$(pwd)/dsync-sqlbatch-config.yml:/config.yml:ro" \
  -p 8080:8080 \
  markadiom/dsync \
  --progress \
  --web-host 0.0.0.0 \
  --logfile /tmp/dsync.log \
  --namespace "dbo.Products:TargetDB.ProductsContainer" \
  "sqlbatch --config=/config.yml" \
  grpc://cosmosnosqlconnector:8089 --insecure
```

**Key flags explained:**
- `--progress`: Show real-time progress in terminal
- `--logfile dsync.log`: Write detailed logs to file
- `--namespace "SRC:DST"`: Remap source namespace to target `Database.Container` (comma-separated for multiple tables)
- `--insecure`: Required because the gRPC connection to the Cosmos NoSQL connector is not TLS-encrypted
- `--web-host 0.0.0.0`: (Optional) Enable web UI for progress monitoring on port 8080

#### Step D: Monitor output

The agent should run this command and capture both stdout and stderr. Watch for:
- Migration started confirmation
- Per-table progress indicators (rows migrated, percentage)
- Completion message with summary statistics
- Any error messages or warnings

### Success Criteria

- Cosmos DB NoSQL connector process is running and accepting connections on port 8089
- dsync process exits with status code 0
- Output contains a completion summary with row counts
- No fatal errors in stderr

### Failure Modes

- **dsync not found**: Provide installation instructions specific to the user's platform (see Step A).
- **Cosmos NoSQL connector fails to start**: Check that `COSMOS_URL` and `COSMOS_KEY` are correct. Verify the Cosmos DB account exists and is accessible.
- **Config file invalid**: dsync will report config validation errors. Verify YAML syntax and all required fields in `dsync-sqlbatch-config.yml`.
- **Connection error to source**: SQL Server may have dropped the connection. Verify connectivity (Step 02). Check that the SQL Server host is reachable from where dsync is running.
- **Connection error to gRPC sink**: Ensure the Cosmos NoSQL connector is running on port 8089. Check `docker logs cosmosnosqlconnector`.
- **Throughput exceeded (429)**: Cosmos DB is throttling writes. Increase provisioned RUs or reduce dsync parallelism.
- **Timeout**: Large tables may take a long time. Ensure the command is not killed by shell timeout. Use `nohup` or `screen` for long-running migrations.

### Reference

- [dsync GitHub](https://github.com/adiom-data/dsync)
- [SQL Batch Connector Docs](https://docs.adiom.io/reference/connectors/sql-batch)
- [DynamoDB to Cosmos DB NoSQL Quickstart](https://docs.adiom.io/getting-started/quickstart/dynamo-cosmos) (architecture reference for Cosmos NoSQL sink)
- [Cosmos NoSQL Connector Build Instructions](https://github.com/adiom-data/dsync/blob/main/java/README.md)

### Next Step

Proceed to [07-run-monitor-progress](07-run-monitor-progress.md).

### Monitor Migration Progress

**Step 7** | Impact: HIGH

## Monitor Migration Progress

Track the dsync migration while it runs, handle transient errors, and decide whether to retry or escalate.

### Inputs

- Running dsync process (from Step 06)
- Expected row counts per table (from Step 02)

### Procedure

1. While dsync is running, monitor its output for:
   - **Progress indicators**: Tables being processed, rows migrated, percentage complete
   - **Warnings**: Non-fatal issues like data type coercions or skipped rows
   - **Errors**: Connection drops, throttling, or data validation failures

2. For transient errors (connection drops, 429 throttling):
   - dsync may auto-retry depending on configuration
   - If dsync exits with a retryable error, wait 30 seconds and re-run the same command
   - Maximum 3 retries before escalating to the user

3. For data errors (e.g., a row violates Cosmos DB constraints):
   - Log the specific row/table that failed
   - Continue with remaining tables if possible
   - Report all data errors to the user after migration completes

4. Capture the final migration summary, which should include:
   - Total rows migrated per table/container
   - Total time elapsed
   - Any errors or skipped rows

### Success Criteria

- dsync migration completes (exit code 0)
- Migration summary is captured and displayed to the user
- Any warnings or non-fatal errors are reported

### Failure Modes

- **Repeated 429 errors**: Cosmos DB throughput is insufficient. Advise the user to scale up RUs temporarily.
- **Consistent timeout on large table**: Suggest breaking the migration into smaller batches.
- **dsync hangs**: Check system resources (memory, disk). Kill and retry with reduced parallelism.

### Next Step

Proceed to [08-validate-row-counts](08-validate-row-counts.md).

---

## Phase: validate

### Validate Row Counts

**Step 8** | Impact: CRITICAL

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

### Validate Data Integrity

**Step 9** | Impact: HIGH

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

### Validate Cosmos DB Queries

**Step 10** | Impact: HIGH

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

