const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { main } = require('./agentic-pw.cjs');

function withDirectory(run) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'agentic-pw-'));
  try {
    run(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function complete(prompt, status = 'success') {
  const lines = prompt.split('\n');
  const file = JSON.parse(lines[lines.length - 2]);
  writeFileSync(file, status);
}

test('stops without starting Copilot when features are absent or empty', () => {
  withDirectory(directory => {
    const calls = [];
    const run = (...args) => calls.push(args);
    assert.equal(main(run, path.join(directory, 'missing')), 1);
    assert.equal(main(run, directory), 1);
    assert.equal(calls.length, 0);
  });
});

test('starts Copilot for a feature even when no test directory exists', () => {
  withDirectory(directory => {
    const features = path.join(directory, 'features');
    mkdirSync(path.join(features, 'nested'), { recursive: true });
    writeFileSync(path.join(features, 'nested', 'example.feature'), 'Scenario: [EX-01] Example\n');
    const calls = [];
    const result = main((command, args, options) => {
      calls.push({ command, args, options });
      if (calls.length === 1) complete(args.at(-1));
      return { status: 0 };
    }, features);
    assert.equal(result, 0);
    assert.equal(calls.length, 2);
    assert.match(calls[0].command, /^copilot(?:\.exe)?$/);
    assert.ok(calls[0].args.includes('--prompt'));
    assert.ok(calls[0].args.includes('--trust-folder'));
    assert.ok(calls[0].args.includes('--allow-all-tools'));
    assert.ok(calls[0].args.includes('--allow-all-urls'));
    assert.ok(calls[0].args.includes('--no-ask-user'));
    assert.match(calls[0].args.at(-1), /spec-driven-playwright/);
    assert.deepEqual(calls[0].options.stdio, ['ignore', 'inherit', 'inherit']);
    assert.equal(calls[1].args.at(-1), process.platform === 'win32' ? 'npm test' : 'test');
  });
});

test('starts Copilot even when an existing feature changes without changing its ID', () => {
  withDirectory(directory => {
    const feature = path.join(directory, 'example.feature');
    const run = (command, args) => {
      if (/^copilot(?:\.exe)?$/.test(command)) complete(args.at(-1));
      return { status: 0 };
    };
    writeFileSync(feature, 'Scenario: [EX-01] Example\n  Then value is 1\n');
    assert.equal(main(run, directory), 0);
    writeFileSync(feature, 'Scenario: [EX-01] Example\n  Then value is 2\n');
    let calls = 0;
    assert.equal(main((command, args) => { calls++; return run(command, args); }, directory), 0);
    assert.equal(calls, 2);
  });
});

test('limits a selected SUT to its feature folder, prompt, and Playwright project', () => {
  withDirectory(directory => {
    mkdirSync(path.join(directory, 'first'));
    mkdirSync(path.join(directory, 'second'));
    writeFileSync(path.join(directory, 'first', 'example.feature'), 'Scenario: [A-01] Example\n');
    writeFileSync(path.join(directory, 'second', 'example.feature'), 'Scenario: [B-01] Example\n');
    const calls = [];
    assert.equal(main((command, args) => {
      calls.push({ command, args });
      if (calls.length === 1) complete(args.at(-1));
      return { status: 0 };
    }, directory, ['--sut', 'second']), 0);
    assert.match(calls[0].args.at(-1), /only SUT "second"/);
    assert.match(calls[0].args.at(-1), /features\/second\//);
    assert.match(calls[1].args.join(' '), /--project=second/);
  });
});

test('processes all SUTs and runs all projects by default', () => {
  withDirectory(directory => {
    for (const sut of ['first', 'second']) {
      mkdirSync(path.join(directory, sut));
      writeFileSync(path.join(directory, sut, 'example.feature'), 'Scenario: [A-01] Example\n');
    }
    const calls = [];
    assert.equal(main((command, args) => {
      calls.push({ command, args });
      if (calls.length === 1) complete(args.at(-1));
      return { status: 0 };
    }, directory), 0);
    assert.match(calls[0].args.at(-1), /all SUTs/);
    assert.doesNotMatch(calls[1].args.join(' '), /--project/);
  });
});

test('rejects invalid selection and missing SUT features before starting Copilot', () => {
  withDirectory(directory => {
    const run = () => { throw new Error('Copilot should not start'); };
    assert.throws(() => main(run, directory, ['--sut', '../outside']), /Usage:/);
    assert.throws(() => main(run, directory, ['--sut']), /Usage:/);
    assert.equal(main(run, directory, ['--sut', 'missing']), 1);
  });
});

test('fails closed without confirmation and propagates independent test failures', () => {
  withDirectory(directory => {
    writeFileSync(path.join(directory, 'example.feature'), 'Feature: Example\n');
    assert.throws(() => main(() => ({ status: 0 }), directory), /did not confirm successful completion/);
    assert.throws(() => main((command, args) => {
      complete(args.at(-1), 'failure');
      return { status: 0 };
    }, directory), /invalid completion status/);
    let calls = 0;
    assert.equal(main((command, args) => {
      calls++;
      if (calls === 1) complete(args.at(-1));
      return { status: calls === 1 ? 0 : 4 };
    }, directory), 4);
    assert.equal(calls, 2);
  });
});

test('surfaces Copilot failures', () => {
  withDirectory(directory => {
    writeFileSync(path.join(directory, 'example.feature'), 'Feature: Example\n');
    assert.equal(main(() => ({ status: 7 }), directory), 7);
    assert.throws(() => main(() => ({ error: new Error('Copilot not found') }), directory), /Copilot not found/);
  });
});
