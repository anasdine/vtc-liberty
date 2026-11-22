// node --test "tests/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { verifier, fichiersPublies } from '../outils/verifier-avant-mise-en-ligne.mjs';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(RACINE, 'outils', 'verifier-avant-mise-en-ligne.mjs');

function copieDuSite() {
  const d = mkdtempSync(join(tmpdir(), 'vtc-garde-'));
  cpSync(RACINE, d, { recursive: true, filter: (s) => !relative(RACINE, s).split(sep).some((p) => p === '.git' || p === 'node_modules') });
  return d;
}

// Fausses valeurs, uniquement pour le test : jamais publiées.
function remplirDeFaussesValeurs(d) {
  for (const f of fichiersPublies(d)) {
    let t = readFileSync(f, 'utf8');
    t = t.replace(/<p class="muted">[^\n]*class="todo"[^\n]*<\/p>\n?/g, '');
    t = t.replace(/<span class="todo">[^<]*<\/span>/g, 'FAUX-TEST-0000');
    writeFileSync(f, t);
  }
}

test('la version actuelle est refusée, avec fichier et ligne', () => {
  const refus = verifier(RACINE);
  assert.ok(refus.length > 0);
  const fichiers = new Set(refus.map((r) => r.fichier));
  for (const f of ['mentions-legales.html', 'en/legal-notice.html', 'index.html', 'en/index.html']) assert.ok(fichiers.has(f), f);
  for (const r of refus) assert.ok(Number.isInteger(r.ligne) && r.ligne > 0);
  const r = spawnSync(process.execPath, [SCRIPT, RACINE], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /REFUS/);
  assert.match(r.stderr, /mentions-legales\.html:\d+/);
});

test('une copie remplie de fausses valeurs est acceptée', () => {
  const d = copieDuSite();
  try {
    remplirDeFaussesValeurs(d);
    assert.deepEqual(verifier(d), []);
    const r = spawnSync(process.execPath, [SCRIPT, d], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^OK/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('un seul « à confirmer » restant suffit à refuser', () => {
  const d = copieDuSite();
  try {
    remplirDeFaussesValeurs(d);
    const f = join(d, 'index.html');
    writeFileSync(f, readFileSync(f, 'utf8') + '\n<p>Délai à confirmer</p>\n');
    const refus = verifier(d);
    assert.equal(refus.length, 1);
    assert.equal(refus[0].fichier, 'index.html');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('les dossiers internes ne sont pas inspectés', () => {
  const pub = fichiersPublies(RACINE).map((f) => f.split(sep).join('/'));
  assert.ok(!pub.some((f) => /\/(\.palier|outils|tests|preuves|docs)\//.test(f)));
});
