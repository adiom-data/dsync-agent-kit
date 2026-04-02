# dsync-agent-kit

SQL Server to Azure Cosmos DB migration skill for AI coding agents, powered by [dsync](https://github.com/AdiomData/dsync) and following the [Agent Skills](https://agentskills.io) specification.

## Overview

This skill guides AI coding agents through a complete SQL Server to Cosmos DB migration using dsync. It is designed to be Step 5 of a database modernization workflow, consuming outputs from prior assessment and planning steps.

| Step | Phase | Description |
|------|-------|-------------|
| 1 | Prerequisites | Verify migration docs and SQL Server connectivity |
| 2 | Configuration | Generate dsync connector config from schema and access patterns |
| 3 | Execution | Run the dsync migration command |
| 4 | Validation | Verify row counts, data integrity, and Cosmos DB queryability |

### Required Inputs

This skill expects the following artifacts from prior workflow steps:

- `docs/cosmos-db-migration-assessment.md` -- migration assessment report
- `docs/access-patterns.md` -- query and access pattern analysis
- `docs/volumetrics.md` -- data volume and throughput estimates
- `docs/schema_and_access_patterns_conversion_plan.md` -- schema conversion plan
- A live SQL Server connection string

## Installation

### Using add-skill (Recommended)

```bash
npx skills add AdiomData/dsync-agent-kit
```

### Manual Installation

```bash
git clone https://github.com/AdiomData/dsync-agent-kit.git
cp -r dsync-agent-kit/skills/dsync-migration ~/.copilot/skills/
```

### Claude Code

```bash
cp -r skills/dsync-migration ~/.claude/skills/
```

## File Structure

```
skills/dsync-migration/
├── SKILL.md              # Skill definition (triggers, procedure, validation)
├── AGENTS.md             # Compiled rules (what agents read)
├── README.md             # Skill-level documentation
├── metadata.json         # Version and metadata
└── rules/
    ├── _template.md
    ├── 01-prereq-check-inputs.md
    ├── 02-prereq-sql-connection.md
    ├── 03-config-generate-connector.md
    ├── 04-config-table-mapping.md
    ├── 05-config-partition-key.md
    ├── 06-run-execute-migration.md
    ├── 07-run-monitor-progress.md
    ├── 08-validate-row-counts.md
    ├── 09-validate-data-integrity.md
    └── 10-validate-cosmos-queries.md
```

## How It Works

When an AI agent detects a SQL-to-Cosmos migration context, it:

1. Activates based on `SKILL.md` trigger conditions
2. Follows the numbered rules in sequence (01 through 10)
3. Generates a dsync connector config from the migration docs and live SQL schema
4. Produces the exact dsync command to execute the migration
5. Validates the migration completed successfully

## Compiling Rules

To rebuild `AGENTS.md` from individual rules:

```bash
npm run build
```

## Compatibility

This skill follows the [Agent Skills](https://agentskills.io) open standard and is compatible with:

- Claude Code
- VS Code (GitHub Copilot)
- GitHub.com
- Gemini CLI
- Factory / Droid
- OpenCode
- OpenAI Codex

## License

MIT
