---
title: Execute the dsync Migration
step: 6
phase: run
impact: CRITICAL
tags: [execution, dsync, migration]
---

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
