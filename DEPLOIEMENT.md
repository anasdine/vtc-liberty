# Déploiement de vtc-liberty.fr sur Infomaniak

Site statique (HTML, CSS, un peu de JS), sans PHP ni base de données. Rien n'est en ligne tant que la garde refuse.

## Sources officielles lues (22-11-2026)
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

## Offre
**Hébergement Web** (mutualisé) : FTP + SSH, multi-sites, `.htaccess` (Apache), Let's Encrypt gratuit, Git en SSH.
Le **Starter** gratuit (HTML seul, 10 Mo) suffirait en taille (le site pèse 337 Ko), mais il n'a pas de SSH et, d'après la recherche
(non confirmé sur page ouverte), il exige un domaine enregistré chez Infomaniak. Prix : à lire dans le Manager au moment de commander ;
aucune dépense sans l'accord du pilote.

## Ce qui part sur le serveur
`deployer.ps1 -Essai` en donne la liste exacte (19 fichiers, 337 Ko au 22-11). Exclus : `.git`, `.github`, `.palier`, `outils`, `tests`,
`preuves`, `docs`, `node_modules`, `CNAME` (propre à GitHub Pages), les fichiers cachés sauf `.htaccess`, et les fichiers de travail
(`deployer.ps1`, `DEPLOIEMENT.md`, `GESTES-PILOTE.md`).

`.htaccess` : page 404 (`ErrorDocument 404 /404.html`), pas de liste de dossiers, HTTPS forcé (règle de la FAQ 1961), `www` vers le
domaine nu, en-têtes de sécurité et cache. Le certificat doit exister **avant** le premier envoi, sinon la redirection HTTPS casse le site.

## Ordre
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

## Variante Git (documentée par Infomaniak, FAQ 2463)
Dépôt nu sur le serveur (`git init --bare ~/git_depot/vtc-liberty.git`, puis `git update-server-info`), `git push` depuis ici en SSH, puis
`git clone` / `git pull` dans le dossier du site. Inconvénient : tout le dépôt (outils, tests, `.palier`) arrive dans le dossier servi ;
il faudrait un `.htaccess` qui les refuse. L'envoi SFTP de la liste filtrée reste la voie retenue.

## Variante GitHub Actions (décrite, NON activée)
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
