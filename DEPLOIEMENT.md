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

## Situation au 22-11 (aucune commande passée)
- **Taille mesurée** : 19 fichiers publiés, 343 943 octets (336 Kio). Plus gros fichier : `assets/img/logo-vtc-liberty.png`, 67 Ko.
- **Compte Infomaniak du pilote** : un seul hébergement « Page Web basique / Starter » (10 Mo) sur `fresh-dream.fr`, sans Node.js,
  SSL possible, accès FTP/SSH à créer. Aucun domaine VTC dans ce compte.
- **Le domaine `vtc-liberty.fr` existe déjà** (RDAP public, https://rdap.nic.fr/domain/vtc-liberty.fr) : registrar **Infomaniak Network SA**,
  enregistré le 09-08-2026, expire le 09-08-2027, serveurs DNS `ns11/ns12.infomaniak.ch`, enregistrements A vers GitHub Pages
  (185.199.108-111.153). Il est donc dans **un autre compte Infomaniak, probablement celui d'Amir** : à lui demander.
- Conséquence : pas de domaine à acheter si Amir donne accès à son compte (ou ajoute le pilote comme utilisateur du compte).

## Les deux voies (coûts à vérifier, rien n'est commandé)

| | (1) Infomaniak Hébergement Web | (2) Cloudflare Pages, gratuit |
|---|---|---|
| Hébergement | payant, prix mensuel/annuel **non lisible** sur les pages officielles (rendues en JS) : à lire sur https://www.infomaniak.com/fr/hebergement/web-et-mail/hebergement-web ou au Manager. Essai gratuit annoncé. | 0 € : 500 builds/mois, 20 000 fichiers, 25 MiB par fichier, 100 domaines par projet, pas de plafond de bande passante pour le statique ([limites](https://developers.cloudflare.com/pages/platform/limits/)) |
| Domaine | `vtc-liberty.fr` déjà chez Infomaniak (compte d'Amir ?) : 0 € jusqu'au 09-08-2027, puis renouvellement .fr au tarif Infomaniak (**non lisible**, https://www.infomaniak.com/fr/domaines/tarifs) | le même domaine, gardé chez Infomaniak (renouvellement idem). Cloudflare Registrar : vente du .fr **non confirmée** |
| DNS | rien à déplacer si l'hébergement est dans le même compte que le domaine | apex `vtc-liberty.fr` : **les serveurs DNS doivent passer chez Cloudflare** (zone dans le même compte que le projet). Un simple CNAME ne marche que pour `www` ([domaines](https://developers.cloudflare.com/pages/configuration/custom-domains/)) |
| Envoi | `deployer.ps1` (SFTP) ou Git en SSH | `wrangler pages deploy` (envoi direct) ou intégration GitHub (dépôt privé) |
| 404, redirections, en-têtes | `.htaccess` (déjà écrit) | `404.html` reconnu ([serving](https://developers.cloudflare.com/pages/configuration/serving-pages/)) ; `_redirects` et `_headers` à écrire à la place du `.htaccess` ([redirects](https://developers.cloudflare.com/pages/configuration/redirects/), [headers](https://developers.cloudflare.com/pages/configuration/headers/)) |
| SSL | Let's Encrypt gratuit, à installer au Manager | automatique |
| Pour | cap du 19-11 (Infomaniak), tout chez un seul fournisseur, mails possibles | gratuit, CDN mondial, déploiement depuis GitHub |
| Contre | coût mensuel | DNS à déplacer (les mails éventuels du domaine doivent être recopiés dans la zone Cloudflare) ; un fournisseur de plus |

**Piste gratuite chez Infomaniak, à vérifier** : la page https://www.infomaniak.com/fr/domaines annonce « Gratuit avec votre domaine :
1 page web statique + 1 adresse mail starter ». Si le compte d'Amir a ce Starter (10 Mo), il suffit largement (336 Kio), à 0 €,
mais **sans SSH** : envoi par FTP (FileZilla/WinSCP) au lieu de `deployer.ps1`, et `.htaccess` à tester. Le Starter du pilote sur
`fresh-dream.fr` ne sert pas : un Starter est lié à son domaine (rattachement à un second domaine non confirmé).

**Ordre conseillé** : demander à Amir dans quel compte Infomaniak est `vtc-liberty.fr` et s'il y a un Starter ; si oui, voie Starter
(0 €) ; sinon (1) si le pilote accepte le prix lu au Manager, ou (2) si on accepte de déplacer les DNS. Aucune dépense sans le pilote.

## Offre retenue par défaut dans ce document
**Hébergement Web** (mutualisé) : FTP + SSH, multi-sites, `.htaccess` (Apache), Let's Encrypt gratuit, Git en SSH. Les gestes et
`deployer.ps1` ci-dessous la supposent ; pour la voie (2), il faudra un `_redirects`/`_headers` et un envoi `wrangler`, à écrire le jour venu.

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
