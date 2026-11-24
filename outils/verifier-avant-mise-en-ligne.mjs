#!/usr/bin/env node
// Garde de mise en ligne : refuse tant qu'une page publiée porte un champ non rempli.
// Usage : node outils/verifier-avant-mise-en-ligne.mjs [dossier du site]   (défaut : racine du dépôt)
// Sortie 0 = prêt, 1 = refus (chaque refus nomme le fichier et la ligne), 2 = erreur.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Marques interdites en ligne (FR, EN et DE), insensibles à la casse.
export const MARQUES = [
  /à compléter/i,
  /a completer/i,
  /à confirmer/i,
  /to be completed/i,
  /to be confirmed/i,
  /zu ergänzen/i,
  /zu bestätigen/i,
  /class="[^"]*\btodo\b[^"]*"/i,
];

// Ce qui n'est jamais publié (même liste que deployer.ps1).
export const EXCLUS = new Set(['.git', '.github', '.palier', 'node_modules', 'outils', 'tests', 'preuves', 'docs']);
const EXTENSIONS = /\.(html?|xml|txt|webmanifest|json)$/i;

export function fichiersPublies(racine) {
  const out = [];
  const marche = (dir) => {
    for (const nom of readdirSync(dir)) {
      if (EXCLUS.has(nom)) continue;
      const p = join(dir, nom);
      if (statSync(p).isDirectory()) marche(p);
      else if (EXTENSIONS.test(nom)) out.push(p);
    }
  };
  marche(racine);
  return out.sort();
}

export function verifier(racine) {
  const refus = [];
  for (const f of fichiersPublies(racine)) {
    const lignes = readFileSync(f, 'utf8').split(/\r?\n/);
    lignes.forEach((ligne, i) => {
      if (MARQUES.some((m) => m.test(ligne))) {
        const texte = ligne.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        refus.push({ fichier: relative(racine, f).split(sep).join('/'), ligne: i + 1, texte });
      }
    });
  }
  return refus;
}

const estPrincipal = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (estPrincipal) {
  const racine = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
  try {
    const refus = verifier(racine);
    if (refus.length) {
      console.error(`REFUS : ${refus.length} champ(s) à remplir avant la mise en ligne.`);
      for (const r of refus) console.error(`  ${r.fichier}:${r.ligne}  ${r.texte.slice(0, 160)}`);
      process.exit(1);
    }
    console.log(`OK : aucun « À compléter » ni « à confirmer » dans ${fichiersPublies(racine).length} fichiers publiés.`);
  } catch (e) {
    console.error(`ERREUR : ${e.message}`);
    process.exit(2);
  }
}
