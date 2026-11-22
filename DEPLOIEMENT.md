# Déploiement de vtc-liberty.fr

Site statique (HTML, CSS, un peu de JS), sans PHP ni base de données : 19 fichiers publiés, 343 943 octets (336 Kio) mesurés le 22-11.

## ⚠ À lire d'abord : fusionner dans `main` = publier
Le dépôt `anasdine/vtc-liberty` est **public** et **GitHub Pages** sert la branche `main` (racine) sur https://vtc-liberty.fr
(constructeur « legacy », c'est-à-dire Jekyll ; domaine porté par `CNAME` ; HTTPS imposé). **Toute fusion dans `main` est en ligne
en quelques minutes.** Aucune fusion sans l'accord du pilote, et jamais tant que la garde refuse.

## Voie 1 (en place, gratuite) : GitHub Pages
| | |
|---|---|
| Coût | 0 € (Pages est gratuit pour un dépôt public) |
| Domaine | `vtc-liberty.fr`, déjà enregistré chez Infomaniak (RDAP public https://rdap.nic.fr/domain/vtc-liberty.fr : depuis le 09-08-2026, expire le 09-08-2027), DNS `ns11/ns12.infomaniak.ch`, enregistrements A vers GitHub Pages (185.199.108-111.153). Rien à changer. Renouvellement .fr au tarif Infomaniak (non lu). |
| SSL | certificat GitHub, « Enforce HTTPS » déjà actif |
| 404 | `404.html` à la racine, reconnu par Pages |
| `.htaccess` | **ignoré** par Pages (pas d'Apache). Il ne sert que pour l'option Infomaniak. Les redirections `http`→`https` et `www`→domaine nu sont faites par Pages. |
| Ce qui est publié | tout le dépôt, sauf ce que `_config.yml` exclut (`exclude:` de Jekyll) : `outils/`, `tests/`, `DEPLOIEMENT.md`, `GESTES-PILOTE.md`, `deployer.ps1`, `.htaccess`, `.palier/`. Sans cette liste, Jekyll publierait les `.md` en pages HTML. Le dépôt étant public, ces fichiers restent lisibles sur GitHub : **rien de privé dans le dépôt**. |
| Hébergeur dans les mentions | GitHub Pages (GitHub, Inc.), tant que c'est la voie |

**Mettre en ligne par la voie 1** :
1. Le pilote donne les 5 mentions et tranche les 2 « à confirmer » (`GESTES-PILOTE.md`).
2. CLANK les reporte sur `palier/refonte`, puis sur la **tête exacte** : `node outils/verifier-avant-mise-en-ligne.mjs` répond `OK`
   (code 0) et `node --test "tests/*.test.mjs"` est vert.
3. Le pilote dit « publie ». CLANK fusionne la PR #1 dans `main`.
4. Contrôles : https://vtc-liberty.fr/, `/en/`, les mentions, une URL absente (404 maison), `http://` et `www.` redirigés.
   Retour arrière : `git revert` du commit de fusion sur `main` (republication de l'ancien site en quelques minutes).

## Option : Infomaniak Hébergement Web (seulement si le pilote le choisit)
Payant (prix **non lisible** sur les pages officielles rendues en JS : https://www.infomaniak.com/fr/hebergement/web-et-mail/hebergement-web,
ou au Manager ; essai gratuit annoncé). Intérêt : `.htaccess` (en-têtes, cache), SFTP/SSH, tout chez Infomaniak avec le domaine.
Le domaine étant déjà chez Infomaniak, il faudrait l'hébergement dans le compte qui porte le domaine (à demander à Amir). La page
https://www.infomaniak.com/fr/domaines annonce aussi un Starter gratuit (1 page statique, 10 Mo) avec chaque domaine : il suffirait en
taille, mais sans SSH (envoi FTP) ; à vérifier dans ce compte. Si cette option est prise : mentions « Hébergement » à changer, `CNAME`
et Pages à couper **après** bascule DNS, puis gestes et `deployer.ps1` ci-dessous.

Autre option, non retenue : Cloudflare Pages (gratuit, mais le domaine nu impose de passer les serveurs DNS chez Cloudflare,
https://developers.cloudflare.com/pages/configuration/custom-domains/ ; limites https://developers.cloudflare.com/pages/platform/limits/).
Elle n'apporte rien de plus que la voie 1 déjà en place.

## Option Infomaniak : sources officielles lues (22-11-2026)
| Sujet | Page Infomaniak |
|---|---|
| Offres d'hébergement | https://www.infomaniak.com/en/support/faq/2019/discover-infomaniaks-web-hosting-offers |
| Comptes FTP / SSH | https://www.infomaniak.com/en/support/faq/1982/manage-ftp-ssh-accounts |
| Hôte FTP/SFTP | https://www.infomaniak.com/en/support/faq/1083/access-the-server-via-ftp-with-an-application |
| SSH | https://www.infomaniak.com/en/support/faq/1941/connect-via-ssh-and-use-command-line-tools |
| Git et GitHub | https://www.infomaniak.com/en/support/faq/2463/using-git-and-github-with-web-hosting |
| Let's Encrypt | https://www.infomaniak.com/en/support/faq/2130/installer-un-certificat-ssl-gratuit-lets-encrypt-sur-un-site |
| Forcer HTTPS | https://www.infomaniak.com/en/support/faq/1961/force-https-ssl-for-the-url-displayed-by-the-web-browser |
| Domaine externe vers l'hébergement | https://www.infomaniak.com/en/support/faq/2025/link-a-domain-name-to-infomaniak-web-hosting |
| .htaccess | https://www.infomaniak.com/en/support/faq/2210/create-and-use-a-htaccess-file-and-userini |

Vu seulement en extrait de recherche, à vérifier dans le Manager : ajout d'un site (faq/1988), Starter (faq/2002), prix (hosting/prices-and-characteristics), transfert de domaine (faq/447).

## Option Infomaniak : ce qui part sur le serveur
`deployer.ps1 -Essai` en donne la liste exacte (19 fichiers, 337 Ko au 22-11). Exclus : `.git`, `.github`, `.palier`, `outils`, `tests`,
`preuves`, `docs`, `node_modules`, `CNAME` (propre à GitHub Pages), les fichiers cachés sauf `.htaccess`, et les fichiers de travail
(`deployer.ps1`, `DEPLOIEMENT.md`, `GESTES-PILOTE.md`).

`.htaccess` : page 404 (`ErrorDocument 404 /404.html`), pas de liste de dossiers, HTTPS forcé (règle de la FAQ 1961), `www` vers le
domaine nu, en-têtes de sécurité et cache. Le certificat doit exister **avant** le premier envoi, sinon la redirection HTTPS casse le site.

## Option Infomaniak : ordre
1. Pilote : remplir les 5 mentions (et les 2 « à confirmer »), voir `GESTES-PILOTE.md`. Puis `node outils/verifier-avant-mise-en-ligne.mjs` doit répondre `OK`.
2. Pilote + CLANK : hébergement, site `vtc-liberty.fr`, compte « FTP + SSH », DNS, certificat (gestes dans `GESTES-PILOTE.md`).
3. CLANK : `pwsh ./deployer.ps1 -Essai`, relire la liste, puis l'envoi réel :

```powershell
$env:INFOMANIAK_SFTP_HOTE        = 'xxxx.ftp.infomaniak.com'   # Manager > hébergement > FTP / SSH
$env:INFOMANIAK_SFTP_UTILISATEUR = '<compte FTP + SSH>'
$env:INFOMANIAK_SFTP_DOSSIER     = 'sites/vtc-liberty.fr'      # dossier du site, à vérifier par `ls` en SSH
$env:INFOMANIAK_SFTP_CLE         = "$HOME\.ssh\infomaniak_vtc" # facultatif ; sinon l'agent SSH
pwsh ./deployer.ps1
```

4. Contrôles : `https://vtc-liberty.fr/`, `/en/`, une URL absente (404 maison), `http://` et `www.` redirigés en 301, certificat valide.

`deployer.ps1` refuse d'envoyer si la garde refuse (code 1) ou si une variable manque (code 2). Il utilise `sftp` d'OpenSSH en mode lot
(`-b`), qui exige une clé SSH : la clé publique est à déposer dans `~/.ssh/authorized_keys` du compte par la console Web SSH du Manager
(le support des clés n'est pas décrit dans les pages lues : à vérifier au premier essai ; à défaut, WinSCP ou FileZilla avec le mot de
passe, même liste de fichiers). Port : 22 par défaut (non écrit dans les pages lues, `INFOMANIAK_SFTP_PORT` sinon).

Dossier racine : la FAQ 1982/1988 parle de `/sites/<domaine>/`, la FAQ Git de `~/web/`. Lire le chemin affiché dans le Manager à l'ajout
du site, ou `ls ~` en SSH, avant de régler `INFOMANIAK_SFTP_DOSSIER`.

## Option Infomaniak : variante Git (documentée par Infomaniak, FAQ 2463)
Dépôt nu sur le serveur (`git init --bare ~/git_depot/vtc-liberty.git`, puis `git update-server-info`), `git push` depuis ici en SSH, puis
`git clone` / `git pull` dans le dossier du site. Inconvénient : tout le dépôt (outils, tests, `.palier`) arrive dans le dossier servi ;
il faudrait un `.htaccess` qui les refuse. L'envoi SFTP de la liste filtrée reste la voie retenue.

## Option Infomaniak : variante GitHub Actions (décrite, NON activée)
Aucun fichier n'est posé dans `.github/workflows/`. Pour l'activer plus tard, avec l'accord du pilote :
- Secrets du dépôt (Settings > Secrets and variables > Actions) : `INFOMANIAK_SFTP_HOTE`, `INFOMANIAK_SFTP_UTILISATEUR`,
  `INFOMANIAK_SFTP_DOSSIER`, `INFOMANIAK_SFTP_CLE` (clé privée dédiée, sans phrase), `INFOMANIAK_SFTP_HOTE_CLE` (ligne `known_hosts`).
- Flux `deployer-infomaniak.yml`, déclenché à la main (`workflow_dispatch`) ou sur `main` :

```yaml
name: deployer-infomaniak
on: { workflow_dispatch: {} }
jobs:
  deployer:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: node --test "tests/*.test.mjs"
      - shell: pwsh
        env:
          INFOMANIAK_SFTP_HOTE: ${{ secrets.INFOMANIAK_SFTP_HOTE }}
          INFOMANIAK_SFTP_UTILISATEUR: ${{ secrets.INFOMANIAK_SFTP_UTILISATEUR }}
          INFOMANIAK_SFTP_DOSSIER: ${{ secrets.INFOMANIAK_SFTP_DOSSIER }}
          CLE: ${{ secrets.INFOMANIAK_SFTP_CLE }}
          HOTE_CLE: ${{ secrets.INFOMANIAK_SFTP_HOTE_CLE }}
        run: |
          New-Item -ItemType Directory -Force ~/.ssh | Out-Null
          Set-Content ~/.ssh/known_hosts $env:HOTE_CLE
          Set-Content ~/.ssh/infomaniak $env:CLE
          $env:INFOMANIAK_SFTP_CLE = (Resolve-Path ~/.ssh/infomaniak).Path
          ./deployer.ps1
```

La garde joue aussi dans le flux : un « À compléter » bloque le déploiement automatique comme le manuel.

## Garde
`node outils/verifier-avant-mise-en-ligne.mjs` : refuse (code 1) tant qu'un fichier publié contient « À compléter », « à confirmer »,
« To be completed », « to be confirmed » ou une marque `class="todo"`, en nommant fichier et ligne. Tests : `node --test "tests/*.test.mjs"`.
Une mention légale ne s'invente pas : on remplit avec les vraies informations du pilote, on ne retire jamais une marque sans la valeur.
