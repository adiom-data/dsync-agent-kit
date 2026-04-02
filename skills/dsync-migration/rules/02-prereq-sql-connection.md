---
title: Verify SQL Server Connectivity
step: 2
phase: prereq
impact: CRITICAL
tags: [prerequisites, sql-server, connection]
---

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
