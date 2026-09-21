import * as fs from 'fs';
import * as path from 'path';

/**
 * The guard that keeps this library movable.
 *
 * Portability is easy to claim and easy to lose — usually to one convenient
 * import six months from now. Reviewers do not reliably catch a stray
 * `@app/shared`; this does.
 */

const SRC = path.resolve(__dirname);

/** Package specifiers permitted, and where. */
const DEPENDENCY_BUDGET: readonly { pattern: RegExp; allowedIn: RegExp }[] = [
  { pattern: /^exceljs$/, allowedIn: /^export[\\/]xlsx\.ts$/ },
  { pattern: /^typeorm$/, allowedIn: /^typeorm[\\/]/ },
  { pattern: /^@nestjs\//, allowedIn: /^typeorm[\\/]/ },
];

/**
 * This file is excluded from its own scan.
 *
 * It is a scanner: its source necessarily contains the very patterns it looks
 * for — `process.env` in an assertion message, import-matching regexes, the
 * forbidden `@app/*` specifiers — and matching those would be a false positive
 * every time. Nothing else is exempt.
 */
const SELF = 'portability.spec.ts';

const FORBIDDEN_ANYWHERE = [/^@app\/shared/, /^@app\/core/, /^@app\/cadtrust/];

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      sourceFiles(full, acc);
    } else if (entry.name.endsWith('.ts')) {
      acc.push(full);
    }
  }
  return acc;
}

function importsOf(contents: string): string[] {
  const specifiers: string[] = [];
  const patterns = [
    /import\s+(?:type\s+)?[^'"]*from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    let match = pattern.exec(contents);
    while (match !== null) {
      specifiers.push(match[1]);
      match = pattern.exec(contents);
    }
  }
  return specifiers;
}

describe('portability', () => {
  const files = sourceFiles(SRC)
    .map((file) => ({
      relative: path.relative(SRC, file),
      contents: fs.readFileSync(file, 'utf8'),
    }))
    .filter((file) => file.relative !== SELF);

  it('finds source files to check', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('never imports from the host registry', () => {
    const offenders: string[] = [];

    for (const file of files) {
      for (const specifier of importsOf(file.contents)) {
        if (FORBIDDEN_ANYWHERE.some((pattern) => pattern.test(specifier))) {
          offenders.push(`${file.relative} imports ${specifier}`);
        }
      }
    }

    // A single one of these turns "movable library" into "part of this repo".
    expect(offenders).toEqual([]);
  });

  it('keeps heavy dependencies inside their budgeted directories', () => {
    const offenders: string[] = [];

    for (const file of files) {
      // The placement rule governs shipped code. A spec may use anything already
      // budgeted somewhere — the ExcelJS writer has to be testable — but it still
      // cannot reach for a package the library does not otherwise depend on, and
      // the host-registry ban below applies to specs unconditionally.
      const isSpec = file.relative.endsWith('.spec.ts');

      for (const specifier of importsOf(file.contents)) {
        if (specifier.startsWith('.')) {
          continue;
        }
        const rule = DEPENDENCY_BUDGET.find((entry) => entry.pattern.test(specifier));
        if (!rule) {
          offenders.push(`${file.relative} imports unbudgeted package "${specifier}"`);
          continue;
        }
        if (!isSpec && !rule.allowedIn.test(file.relative)) {
          offenders.push(`${file.relative} may not import "${specifier}"`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('never escapes the library with a relative import', () => {
    const offenders: string[] = [];

    for (const file of files) {
      for (const specifier of importsOf(file.contents)) {
        if (!specifier.startsWith('.')) {
          continue;
        }
        const resolved = path.resolve(path.dirname(path.join(SRC, file.relative)), specifier);
        if (!resolved.startsWith(SRC)) {
          offenders.push(`${file.relative} imports outside the library: ${specifier}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('reads the wall clock only through the clock seam', () => {
    const offenders = files
      .filter((file) => file.relative !== 'clock.ts' && !file.relative.endsWith('.spec.ts'))
      .filter((file) => /new Date\(\s*\)/.test(file.contents))
      .map((file) => `${file.relative} constructs new Date()`);

    // `snapshotHoldingsForYear`'s 31 December boundary and the bootstrap's
    // "previous calendar year" both depend on now, and both must be assertable
    // against a fixed instant rather than the test machine's clock.
    expect(offenders).toEqual([]);
  });

  it('never reads process.env', () => {
    const offenders = files
      .filter((file) => /process\.env/.test(file.contents))
      .map((file) => `${file.relative} reads process.env`);

    // Configuration is passed in. A library that reaches for ambient env cannot
    // be dropped into a host that configures itself differently.
    expect(offenders).toEqual([]);
  });
});
