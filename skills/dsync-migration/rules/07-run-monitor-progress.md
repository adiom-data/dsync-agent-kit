---
title: Monitor Migration Progress
step: 7
phase: run
impact: HIGH
tags: [execution, monitoring, progress, errors]
---

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
