# Gestes du pilote : mise en ligne de vtc-liberty.fr

À faire ensemble avec CLANK. Aucun geste ici n'est fait sans toi.

**Important** : le site est déjà en ligne par GitHub Pages, servi depuis la branche `main` du dépôt (public). **Fusionner la PR #1,
c'est publier le nouveau site aussitôt.** CLANK ne fusionne que sur ton « publie », et seulement quand la garde répond OK.

## Voie 1 (en place, gratuite) : GitHub Pages
Rien à commander, rien à changer au DNS ni au certificat.
1. Tu donnes les 5 informations ci-dessous (section A) et tu tranches les 2 « à confirmer ».
2. CLANK les reporte dans les mentions, rejoue la garde et les tests sur la tête exacte de la PR.
3. Tu relis le site de la PR (captures ou serveur local que CLANK t'ouvre), puis tu dis « publie ».
4. CLANK fusionne ; quelques minutes plus tard, tu ouvres https://vtc-liberty.fr/ sur ton téléphone : accueil, EN, mentions, bouton Appeler.
   En cas de souci : CLANK annule la fusion (`git revert`), l'ancien site revient.

## A. Les 5 informations à donner (obligatoires, mentions légales)
1. **Nom de famille d'Amir** (éditeur et directeur de la publication).
2. **Numéro EVTC** (registre des exploitants de voitures de transport avec chauffeur).
3. **TVA** : numéro intracommunautaire, ou « TVA non applicable, art. 293 B du CGI » (micro-entreprise en franchise).
4. **Assurance RC professionnelle** : nom de l'assureur et zone couverte (France, Allemagne, Suisse ?).
5. **Médiateur de la consommation** : nom, site web, adresse postale.

À confirmer aussi (sinon on retire la phrase) : le délai « généralement sous une heure » ; la durée Colmar → Zurich (sinon « sur devis » reste, sans marque).
Tant qu'un de ces points manque, `node outils/verifier-avant-mise-en-ligne.mjs` refuse et rien ne part.

## Option Infomaniak (seulement si tu la choisis à la place de la voie 1)
- `vtc-liberty.fr` est déjà enregistré chez Infomaniak (RDAP public : depuis le 09-08-2026, expire le 09-08-2027), dans le compte
  qui porte le domaine (sans doute celui d'Amir) : l'hébergement devrait être dans ce même compte. Lui demander s'il t'y ajoute comme
  utilisateur (pas de mot de passe partagé) et s'il y a déjà un Starter gratuit lié au domaine.
- Coûts et comparaison : `DEPLOIEMENT.md`, section « Option : Infomaniak ». Rien n'est commandé sans toi.
- Si tu la prends : la ligne « Hébergement » des mentions change, et GitHub Pages n'est coupé qu'**après** la bascule DNS.

## Option Infomaniak : dans le Manager (https://manager.infomaniak.com)

### 1. Créer l'hébergement
- Commander un **Hébergement Web** (pas le Starter : pas de SSH). Le prix s'affiche à la commande : tu décides, rien n'est payé sans toi.
- Doc : https://www.infomaniak.com/en/support/faq/2019/discover-infomaniaks-web-hosting-offers

### 2. Ajouter le site vtc-liberty.fr
- Gestion des hébergements et sites > ouvrir l'hébergement > bouton **Ajouter** (Add) > site > domaine existant `vtc-liberty.fr`.
- Noter le **dossier du site** affiché (options avancées), du type `/sites/vtc-liberty.fr/` : c'est `INFOMANIAK_SFTP_DOSSIER`.
- Noter l'**adresse IP** du site (pour le DNS, étape 3).
- Doc (vue en extrait) : https://www.infomaniak.com/en/support/faq/1988/add-a-site-to-a-web-hosting

### 3. DNS du domaine
Au 22-11 : registrar Infomaniak, DNS `ns11/ns12.infomaniak.ch`, enregistrements A vers **GitHub Pages** (185.199.108.153, .109, .110, .111) ;
lecture publique, rien changé. Si l'hébergement est dans le même compte que le domaine, Infomaniak peut mettre la zone à jour seul.
- **Domaine ailleurs, on garde le registrar** : chez lui, remplacer les enregistrements A (et CNAME `www`) par l'IP du site Infomaniak.
- **Ou** passer aux serveurs DNS Infomaniak : il faut alors une zone DNS commandée chez Infomaniak (changer les NS seuls ne suffit pas).
- Propagation : jusqu'à 48 h. Le site actuel reste servi par l'ancien hôte pendant ce temps.
- Doc : https://www.infomaniak.com/en/support/faq/2025/link-a-domain-name-to-infomaniak-web-hosting

### 4. Certificat SSL (Let's Encrypt, gratuit)
- **Après** que le DNS pointe vers Infomaniak : gestion des hébergements et sites > menu **⋮** à droite du site > **Installer un certificat**
  (Install a certificate) > Let's Encrypt > Suivant > cocher `vtc-liberty.fr` et `www.vtc-liberty.fr` > Installer. Quelques minutes.
- Le `.htaccess` du site force HTTPS : le certificat doit être là **avant** le premier envoi.
- Doc : https://www.infomaniak.com/en/support/faq/2130/installer-un-certificat-ssl-gratuit-lets-encrypt-sur-un-site

### 5. Compte FTP + SSH
- Ouvrir l'hébergement > menu de gauche **FTP / SSH** > **Ajouter** > type **FTP + SSH**.
- Noter : **hôte** (`xxxx.ftp.infomaniak.com`) et **nom du compte**. Le mot de passe reste chez toi, jamais dans le dépôt ni dans un message.
- Pour l'envoi automatique : ouvrir la console **Web SSH** du Manager et coller la clé publique que CLANK te donne dans `~/.ssh/authorized_keys`.
- Doc : https://www.infomaniak.com/en/support/faq/1982/manage-ftp-ssh-accounts et https://www.infomaniak.com/en/support/faq/1941/connect-via-ssh-and-use-command-line-tools

### 6. Envoi et contrôle (avec CLANK)
- CLANK lance `pwsh ./deployer.ps1 -Essai`, tu valides la liste, puis l'envoi réel (voir `DEPLOIEMENT.md`).
- Tu ouvres https://vtc-liberty.fr/ sur ton téléphone : accueil, EN, mentions légales, bouton Appeler.

## Ce que tu donnes à CLANK, en résumé
| Quoi | Où le trouver |
|---|---|
| Les 5 mentions (+ 2 à confirmer) | toi / Amir |
| Ton « publie » (voie 1) | après relecture du site de la PR |
| Hôte SFTP, nom du compte | Manager > hébergement > FTP / SSH |
| Dossier du site | Manager > ajout du site (options avancées) |
| Choix DNS (registrar actuel ou DNS Infomaniak) | chez le registrar du domaine |
