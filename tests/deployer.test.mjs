// node --test "tests/*.test.mjs"
// Vérifie la ligne de commande que deployer.ps1 passe à sftp, avec un sftp factice en tête du PATH : aucune connexion réelle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, chmodSync } from 'node:fs';
import { join, dirname, relative, sep, delimiter } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fichiersPublies } from '../outils/verifier-avant-mise-en-ligne.mjs';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const PWSH = spawnSync('pwsh', ['-NoProfile', '-Command', '1'], { encoding: 'utf8' }).status === 0 ? 'pwsh' : null;
const WIN = process.platform === 'win32';

function preparer() {
  const d = mkdtempSync(join(tmpdir(), 'vtc-deployer-'));
  const site = join(d, 'site');
  cpSync(RACINE, site, { recursive: true, filter: (s) => !relative(RACINE, s).split(sep).some((p) => p === '.git' || p === 'node_modules') });
  // Fausses valeurs, uniquement pour que la garde laisse passer : jamais publiées.
  for (const f of fichiersPublies(site)) {
    let t = readFileSync(f, 'utf8');
    t = t.replace(/<p class="muted">[^\n]*class="todo"[^\n]*<\/p>\n?/g, '');
    t = t.replace(/<span class="todo">[^<]*<\/span>/g, 'FAUX-TEST-0000');
    writeFileSync(f, t);
  }
  // sftp factice : écrit ses arguments (un par ligne) puis recopie le lot reçu par -b.
  const bin = join(d, 'bin');
  mkdirSync(bin);
  const faux = join(bin, 'faux-sftp.mjs');
  writeFileSync(faux, [
    "import { writeFileSync, readFileSync } from 'node:fs';",
    'const a = process.argv.slice(2);',
    "writeFileSync(process.env.FAUX_SFTP_ARGS, a.join('\\n'));",
    "const i = a.indexOf('-b');",
    "if (i >= 0) writeFileSync(process.env.FAUX_SFTP_LOT, readFileSync(a[i + 1], 'utf8'));",
  ].join('\n'));
  if (WIN) writeFileSync(join(bin, 'sftp.cmd'), `@"${process.execPath}" "${faux}" %*\r\n`);
  else { writeFileSync(join(bin, 'sftp'), `#!/bin/sh\nexec "${process.execPath}" "${faux}" "$@"\n`); chmodSync(join(bin, 'sftp'), 0o755); }
  return { d, site, bin };
}

function lancer({ site, bin, d }, env, essai = false) {
  const cle = Object.keys(process.env).find((k) => k.toLowerCase() === 'path') ?? 'PATH';
  const args = ['-NoProfile', '-File', join(site, 'deployer.ps1')];
  if (essai) args.push('-Essai');
  return spawnSync(PWSH, args, {
    encoding: 'utf8',
    env: { ...process.env, [cle]: bin + delimiter + process.env[cle], FAUX_SFTP_ARGS: join(d, 'args.txt'), FAUX_SFTP_LOT: join(d, 'lot.txt'), ...env },
  });
}

const ENV = {
  INFOMANIAK_SFTP_HOTE: 'hote.exemple.invalid',
  INFOMANIAK_SFTP_UTILISATEUR: 'compte-test',
  INFOMANIAK_SFTP_DOSSIER: 'sites/vtc-liberty.fr',
  INFOMANIAK_SFTP_CLE: 'C:/faux/cle',
  INFOMANIAK_SFTP_PORT: '2222',
};

test('deployer.ps1 passe à sftp le lot, le port, la clé et compte@hôte', { skip: !PWSH && 'pwsh absent' }, () => {
  const ctx = preparer();
  try {
    const r = lancer(ctx, ENV);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const a = readFileSync(join(ctx.d, 'args.txt'), 'utf8').split('\n');
    assert.equal(a[0], '-b');
    assert.ok(a[1], 'chemin du lot');
    assert.deepEqual(a.slice(2, 4), ['-P', '2222']);
    assert.ok(a.includes('StrictHostKeyChecking=accept-new'));
    const i = a.indexOf('-i');
    assert.ok(i > 0 && a[i + 1] === 'C:/faux/cle');
    assert.equal(a.at(-1), 'compte-test@hote.exemple.invalid');
    const lot = readFileSync(join(ctx.d, 'lot.txt'), 'utf8');
    assert.match(lot, /^-mkdir "sites\/vtc-liberty\.fr\/assets"$/m);
    assert.match(lot, /^put "[^"]+\/index\.html" "sites\/vtc-liberty\.fr\/index\.html"$/m);
    assert.match(lot, /^put "[^"]+\/\.htaccess" "sites\/vtc-liberty\.fr\/\.htaccess"$/m);
    assert.doesNotMatch(lot, /deployer\.ps1|\.palier|outils\/|tests\/|CNAME/);
    assert.match(lot.trim(), /bye$/);
  } finally { rmSync(ctx.d, { recursive: true, force: true }); }
});

test('sans variable d’accès, rien n’est appelé (code 2)', { skip: !PWSH && 'pwsh absent' }, () => {
  const ctx = preparer();
  try {
    const r = lancer(ctx, { ...ENV, INFOMANIAK_SFTP_HOTE: '' });
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.ok(!existsSync(join(ctx.d, 'args.txt')));
  } finally { rmSync(ctx.d, { recursive: true, force: true }); }
});

test('-Essai n’appelle jamais sftp', { skip: !PWSH && 'pwsh absent' }, () => {
  const ctx = preparer();
  try {
    const r = lancer(ctx, ENV, true);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.ok(!existsSync(join(ctx.d, 'args.txt')));
  } finally { rmSync(ctx.d, { recursive: true, force: true }); }
});

test('garde en refus : rien n’est appelé (code 1)', { skip: !PWSH && 'pwsh absent' }, () => {
  const ctx = preparer();
  try {
    const f = join(ctx.site, 'index.html');
    writeFileSync(f, readFileSync(f, 'utf8') + '\n<p>à confirmer</p>\n');
    const r = lancer(ctx, ENV);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.ok(!existsSync(join(ctx.d, 'args.txt')));
  } finally { rmSync(ctx.d, { recursive: true, force: true }); }
});
