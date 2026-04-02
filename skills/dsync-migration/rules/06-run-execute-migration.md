---
title: Execute the dsync Migration
step: 6
phase: run
impact: CRITICAL
tags: [execution, dsync, migration]
---

## Execute the dsync Migration

Run the dsync command to migrate data from SQL Server to Cosmos DB using the connector config generated in Steps 03-05.

### Inputs

- Completed dsync connector config file (from Steps 03-05)
- dsync binary or container image available on the system

### Procedure

1. Verify dsync is available:

   ```
   [DSYNC_COMMAND_PLACEHOLDER]

   <!-- Replace this placeholder with the actual dsync version/help command.
        Examples:
        - dsync --version
        - docker run <dsync-image> --version
        - npx dsync --version
   -->
   ```

2. If dsync is not installed, provide installation instructions:

   ```
   [DSYNC_COMMAND_PLACEHOLDER]

   <!-- Replace with the actual dsync installation command.
        Examples:
        - brew install dsync
        - docker pull <dsync-image>
        - npm install -g dsync
        - curl -sSL https://get.dsync.io | sh
   -->
   ```

3. Execute the migration:

   ```
   [DSYNC_COMMAND_PLACEHOLDER]

   <!-- Replace with the actual dsync run command.
        Example structure:
        dsync run \
          --config dsync-config.yaml \
          --source sqlserver \
          --target cosmosdb \
          --mode full \
          --log-level info
   -->
   ```

4. The agent should run this command and capture both stdout and stderr.

5. Watch for these signals in the output:
   - Migration started confirmation
   - Per-table/container progress indicators
   - Completion message with summary statistics
   - Any error messages or warnings

### Success Criteria

- dsync process exits with status code 0
- Output contains a completion summary
- No fatal errors in stderr

### Failure Modes

- **dsync not found**: Provide installation instructions specific to the user's platform.
- **Config file invalid**: dsync will report config validation errors. Fix the config and retry.
- **Connection error to source**: SQL Server may have dropped the connection. Verify connectivity (Step 02).
- **Connection error to target**: Cosmos DB endpoint may be unreachable. Check endpoint URL, key, and firewall rules.
- **Throughput exceeded (429)**: Cosmos DB is throttling writes. Increase provisioned RUs or reduce dsync parallelism.
- **Timeout**: Large tables may take a long time. Ensure the command is not killed by shell timeout.

### Next Step

Proceed to [07-run-monitor-progress](07-run-monitor-progress.md).
