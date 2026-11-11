const { spawnSync } = require('node:child_process');
const { mkdtempSync, readFileSync, readdirSync, rmSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function findFeatures(directory, isRoot = true) {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if (isRoot && error.code === 'ENOENT') return [];
    throw error;
  }
  return entries.flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return findFeatures(file, false);
    return entry.isFile() && entry.name.endsWith('.feature') ? [file] : [];
  });
}

function main(run = spawnSync, featureDirectory = path.join(root, 'features'), args = []) {
  if (args.length && (args.length !== 2 || args[0] !== '--sut' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(args[1]))) {
    throw new Error('Usage: npm run agentic-pw -- [--sut <project-name>]');
  }
  const sut = args[1];
  const selectedFeatures = sut ? path.join(featureDirectory, sut) : featureDirectory;
  const features = findFeatures(selectedFeatures);
  if (!features.length) {
    console.error(`No .feature files found under ${sut ? `features/${sut}/` : 'features/'}. Add a feature file before running agentic-pw.`);
    return 1;
  }

  const testCommand = sut ? `npm test -- --project=${sut}` : 'npm test';
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), 'agentic-pw-'));
  const completionFile = path.join(temporaryDirectory, 'complete.txt');
  try {
    console.log(`Found ${features.length} feature file(s). Starting Copilot in unattended mode.`);
    const prompt = [
      sut
        ? `Use the /spec-driven-playwright skill to synchronize only SUT "${sut}": features/${sut}/ and the matching Playwright project and tests. Do not modify or run tests for other SUTs.`
        : 'Use the /spec-driven-playwright skill to synchronize all SUTs and their matching Playwright projects.',
      'This run is unattended. Do not ask questions or guess missing requirements.',
      `Only after the entire task is complete and ${testCommand} passes, write exactly success to this completion file:`,
      JSON.stringify(completionFile),
      'If anything is unclear or fails, explain the problem and do not write the completion file.',
    ].join('\n');
    const result = run(process.platform === 'win32' ? 'copilot.exe' : 'copilot', [
      '--trust-folder',
      '--allow-all-tools',
      '--allow-all-urls',
      '--no-ask-user',
      '--secret-env-vars=COPILOT_GITHUB_TOKEN,GH_TOKEN,GITHUB_TOKEN',
      '--prompt',
      prompt,
    ], { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] });
    if (result.error) throw result.error;
    if (result.status === null) throw new Error(`Copilot terminated by ${result.signal}.`);
    if (result.status !== 0) return result.status;

    let completion;
    try {
      completion = readFileSync(completionFile, 'utf8').trim();
    } catch (error) {
      if (error.code === 'ENOENT') throw new Error('Copilot did not confirm successful completion. Review its output.');
      throw error;
    }
    if (completion !== 'success') throw new Error('Copilot returned an invalid completion status. Review its output.');

    console.log('Verifying the generated tests.');
    const executable = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'npm';
    const testArgs = process.platform === 'win32'
      ? ['/d', '/s', '/c', testCommand]
      : sut ? ['test', '--', `--project=${sut}`] : ['test'];
    const verification = run(executable, testArgs, { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] });
    if (verification.error) throw verification.error;
    if (verification.status === null) throw new Error(`Test verification terminated by ${verification.signal}.`);
    return verification.status;
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    process.exitCode = main(spawnSync, path.join(root, 'features'), process.argv.slice(2));
  } catch (error) {
    console.error(`Unable to run agentic-pw: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { findFeatures, main };
