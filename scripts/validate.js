const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const matter = require('gray-matter');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');

const REQUIRED_FRONTMATTER = ['title', 'step', 'phase', 'impact'];

async function validate() {
  const skillDirs = fs.readdirSync(SKILLS_DIR).filter(f =>
    fs.statSync(path.join(SKILLS_DIR, f)).isDirectory()
  );

  let errors = 0;

  for (const skillName of skillDirs) {
    const skillDir = path.join(SKILLS_DIR, skillName);
    const rulesDir = path.join(skillDir, 'rules');

    // Check required skill files
    for (const required of ['SKILL.md', 'AGENTS.md', 'README.md', 'metadata.json']) {
      const filePath = path.join(skillDir, required);
      if (!fs.existsSync(filePath)) {
        console.error(`MISSING: ${skillName}/${required}`);
        errors++;
      }
    }

    if (!fs.existsSync(rulesDir)) {
      console.error(`MISSING: ${skillName}/rules/ directory`);
      errors++;
      continue;
    }

    const ruleFiles = await glob('*.md', { cwd: rulesDir });
    const rules = ruleFiles.filter(f => !f.startsWith('_'));

    for (const file of rules) {
      const content = fs.readFileSync(path.join(rulesDir, file), 'utf-8');
      const { data } = matter(content);

      for (const field of REQUIRED_FRONTMATTER) {
        if (!data[field]) {
          console.error(`MISSING FRONTMATTER: ${skillName}/rules/${file} -> ${field}`);
          errors++;
        }
      }

      if (data.step && typeof data.step !== 'number') {
        console.error(`INVALID: ${skillName}/rules/${file} -> step must be a number`);
        errors++;
      }
    }

    // Check step numbering is sequential
    const steps = rules
      .map(f => {
        const { data } = matter(fs.readFileSync(path.join(rulesDir, f), 'utf-8'));
        return data.step;
      })
      .filter(s => typeof s === 'number')
      .sort((a, b) => a - b);

    for (let i = 0; i < steps.length; i++) {
      if (steps[i] !== i + 1) {
        console.error(`GAP: ${skillName} step numbering has a gap at step ${i + 1}`);
        errors++;
        break;
      }
    }

    console.log(`${skillName}: ${rules.length} rules, ${errors === 0 ? 'OK' : errors + ' errors'}`);
  }

  if (errors > 0) {
    console.error(`\nValidation failed with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log('\nAll validations passed.');
  }
}

validate().catch(console.error);
