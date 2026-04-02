const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const matter = require('gray-matter');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const OUTPUT_DIR = path.join(__dirname, '..');

async function compile() {
  const skillDirs = fs.readdirSync(SKILLS_DIR).filter(f =>
    fs.statSync(path.join(SKILLS_DIR, f)).isDirectory()
  );

  for (const skillName of skillDirs) {
    const skillDir = path.join(SKILLS_DIR, skillName);
    const rulesDir = path.join(skillDir, 'rules');

    if (!fs.existsSync(rulesDir)) continue;

    const ruleFiles = await glob('*.md', { cwd: rulesDir });
    const rules = ruleFiles
      .filter(f => !f.startsWith('_'))
      .sort()
      .map(f => {
        const content = fs.readFileSync(path.join(rulesDir, f), 'utf-8');
        const { data, content: body } = matter(content);
        return { file: f, frontmatter: data, body: body.trim() };
      });

    let compiled = `# ${skillName} -- Compiled Rules\n\n`;
    compiled += `> Auto-generated from ${rules.length} rule files. Do not edit directly.\n\n`;

    let currentPhase = '';
    for (const rule of rules) {
      const phase = rule.frontmatter.phase || 'unknown';
      if (phase !== currentPhase) {
        currentPhase = phase;
        compiled += `---\n\n## Phase: ${phase}\n\n`;
      }
      compiled += `### ${rule.frontmatter.title || rule.file}\n\n`;
      compiled += `**Step ${rule.frontmatter.step || '?'}** | Impact: ${rule.frontmatter.impact || 'MEDIUM'}\n\n`;
      compiled += rule.body + '\n\n';
    }

    const skillAgentsPath = path.join(skillDir, 'AGENTS.md');
    fs.writeFileSync(skillAgentsPath, compiled);
    console.log(`Compiled ${rules.length} rules -> ${skillAgentsPath}`);

    const topAgentsPath = path.join(OUTPUT_DIR, 'AGENTS.md');
    const topContent = `# dsync Agent Kit -- Compiled Rules\n\nSee [skills/${skillName}/AGENTS.md](skills/${skillName}/AGENTS.md) for the full compiled document.\n`;
    fs.writeFileSync(topAgentsPath, topContent);
  }

  console.log('Done.');
}

compile().catch(console.error);
