# Gestes du pilote : mise en ligne de vtc-liberty.fr chez Infomaniak

À faire ensemble avec CLANK. Aucun geste ici n'est fait sans toi : commande, DNS, certificat, envoi.
Les libellés de menus viennent de la doc officielle (en anglais) ; le Manager en français peut les nommer un peu autrement.

## A. Les 5 informations à donner (obligatoires, mentions légales)
1. **Nom de famille d'Amir** (éditeur et directeur de la publication).
2. **Numéro EVTC** (registre des exploitants de voitures de transport avec chauffeur).
3. **TVA** : numéro intracommunautaire, ou « TVA non applicable, art. 293 B du CGI » (micro-entreprise en franchise).
4. **Assurance RC professionnelle** : nom de l'assureur et zone couverte (France, Allemagne, Suisse ?).
5. **Médiateur de la consommation** : nom, site web, adresse postale.

À confirmer aussi (sinon on retire la phrase) : le délai « généralement sous une heure » ; la durée Colmar → Zurich (sinon « sur devis » reste, sans marque).
Tant qu'un de ces points manque, `node outils/verifier-avant-mise-en-ligne.mjs` refuse et rien ne part.

## B. Dans le Manager Infomaniak (https://manager.infomaniak.com)

### 1. Créer l'hébergement
- Commander un **Hébergement Web** (pas le Starter : pas de SSH). Le prix s'affiche à la commande : tu décides, rien n'est payé sans toi.
- Doc : https://www.infomaniak.com/en/support/faq/2019/discover-infomaniaks-web-hosting-offers

### 2. Ajouter le site vtc-liberty.fr
- Gestion des hébergements et sites > ouvrir l'hébergement > bouton **Ajouter** (Add) > site > domaine existant `vtc-liberty.fr`.
- Noter le **dossier du site** affiché (options avancées), du type `/sites/vtc-liberty.fr/` : c'est `INFOMANIAK_SFTP_DOSSIER`.
- Noter l'**adresse IP** du site (pour le DNS, étape 3).
- Doc (vue en extrait) : https://www.infomaniak.com/en/support/faq/1988/add-a-site-to-a-web-hosting

### 3. DNS du domaine
Où est enregistré vtc-liberty.fr aujourd'hui ? Au 22-11, le domaine pointe vers **GitHub Pages** (A : 185.199.108.153, .109, .110, .111 ; lecture DNS publique, rien changé).
Le registrar est à lire dans ton compte (le DNS ne le dit pas).
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

## C. Ce que tu donnes à CLANK, en résumé
| Quoi | Où le trouver |
|---|---|
| Les 5 mentions (+ 2 à confirmer) | toi / Amir |
| Hôte SFTP, nom du compte | Manager > hébergement > FTP / SSH |
| Dossier du site | Manager > ajout du site (options avancées) |
| Choix DNS (registrar actuel ou DNS Infomaniak) | chez le registrar du domaine |
