# dsync Agent Kit -- Compiled Rules

This is the top-level compiled rules file. For the full version, see [skills/dsync-migration/AGENTS.md](skills/dsync-migration/AGENTS.md).

## Skills

### dsync-migration

SQL Server to Azure Cosmos DB migration using dsync.

**Phases:**
1. Prerequisites -- Verify input docs and SQL Server connectivity
2. Configuration -- Generate dsync connector config, table mappings, partition keys
3. Execution -- Run dsync migration and monitor progress
4. Validation -- Row counts, data integrity, access pattern queries

**10 sequential rules:** 01-prereq-check-inputs through 10-validate-cosmos-queries.

See [skills/dsync-migration/SKILL.md](skills/dsync-migration/SKILL.md) for the full procedure.
