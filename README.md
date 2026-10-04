# Wishi

Application de listes de cadeaux familiales, disponible en français et en anglais.

## Installation locale

Node.js 24 ou supérieur et npm sont nécessaires (les tests utilisent SQLite intégré à Node).

1. Installer les dépendances : `npm ci`.
2. Copier `.env.example` vers `.env` et définir un `AUTH_SECRET` aléatoire. Ne jamais publier ce fichier.
3. Générer le client : `npm run db:generate`.
4. Appliquer les migrations : `npm run db:migrate`.
5. Lancer : `npm run dev` puis ouvrir http://localhost:3000/fr.

`DATABASE_URL` utilise SQLite. Le chemin relatif est résolu depuis le dossier prisma. Le client est généré dans node_modules/@wishi/prisma-client et ne doit pas être versionné. L’authentification utilise les identifiants et des sessions JWT ; aucun adaptateur de sessions en base n’est nécessaire.

## Comptes de démonstration

`npm run db:seed` ajoute Alice, Bob et Charlie sur une base locale. Il ne supprime aucune donnée et ne modifie rien si un compte de démonstration existe déjà. Emails : alice@example.com, bob@example.com, charlie@example.com. Mot de passe des nouveaux comptes : Wishi-demo-2026! Ne pas exécuter le seed en production. Les comptes créés avant cette révision conservent leurs mots de passe.

## Vérifications

- `npm run lint` : règles de qualité.
- `npm run typecheck` : vérification des types.
- `npm test` : tests sur une base SQLite temporaire indépendante (accès, confidentialité, réservation concurrente, invitations, validation, conversion des prix).
- `npm run build` puis `npm start` : compilation et serveur de production.

## Règles de partage

- PRIVATE : propriétaire uniquement.
- FAMILY : propriétaire et personnes appartenant à au moins une famille commune.
- LINK : propriétaire ou détenteur du jeton actif. Le propriétaire peut renouveler ou révoquer le lien. Un compte est requis pour réserver.
- PUBLIC : consultation par URL publique /fr/lists/[id] ou /en/lists/[id]. Un compte est requis pour réserver.

Les réservations restent cachées au propriétaire, y compris dans les données renvoyées au navigateur. Un cadeau peut avoir une seule réservation ; elle peut être annulée uniquement par son auteur. Les quantités multiples ne sont pas proposées dans cette version.

Les invitations sont personnelles, liées à l’email du compte connecté, valables sept jours et consommées dans une transaction après un clic explicite. L’application génère un lien à transmettre ; elle n’envoie pas d’email. Le parcours de connexion et d’inscription conserve le lien d’invitation ou de partage.

## Base existante et migrations

Les nouvelles installations appliquent les six migrations normalement. Pour une ancienne base sans historique de migrations, effectuer une sauvegarde cohérente, vérifier qu’elle correspond à la migration baseline et qu’il n’existe pas de réservations multiples pour un cadeau, puis exécuter `npx prisma migrate resolve --applied 202610030001_baseline` avant `npm run db:migrate`. Ne pas utiliser migrate reset sur des données à conserver.

La migration secure_wishlists convertit les prix en centimes avec arrondi, préserve les cadeaux et ajoute les jetons de partage et la contrainte de réservation unique. La migration query_indexes ajoute les index de lecture. La base locale de ce dossier a été migrée ; sa sauvegarde préalable est prisma/backups/before-20261003.db (non versionnée).

## Mise en ligne

Exécuter les vérifications et les migrations avant de démarrer le serveur. Configurer un secret distinct, HTTPS, un stockage persistant pour le fichier SQLite et des sauvegardes régulières. Le serveur doit avoir accès en écriture au dossier de la base. Pour plusieurs instances ou un hébergement sans disque persistant, prévoir une migration de fournisseur vers PostgreSQL ; les migrations SQLite ne s’y appliquent pas directement.

Les dictionnaires se trouvent dans messages/fr.json et messages/en.json. Les règles d’accès et la projection des données sont dans src/lib/wishlist-service.ts. Les formulaires sont validés côté serveur avec Zod. src/proxy.ts assure le routage des langues ; chaque action vérifie sa session et les autorisations métier.

## Notes de compatibilité et dépendances

Le compilateur @swc/core est fixé à 1.16.2 dans les overrides pour éviter un échec de chargement du cache natif Windows rencontré avec 1.16.13. Ce choix reste compatible avec la plage demandée par next-intl. Les polices système évitent un téléchargement Google Fonts à la compilation.

L’audit du 3 octobre 2026 signale la chaîne de développement ESLint → fast-glob → micromatch → braces (5 alertes liées à la même vulnérabilité). L’avis [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) ne publie pas de version corrigée. Ne pas rétrograder eslint-config-next vers Next.js 14 avec audit fix --force. Cette chaîne n’est pas utilisée dans les actions de l’application ; conserver des motifs de lint contrôlés et revérifier lors des mises à jour.

Sous Windows, arrêter le serveur avant de régénérer le client Prisma si une erreur EPERM indique que sa bibliothèque est utilisée. `npm run format` remet les sources au format commun.

## Cadeaux réservés et photos

La page `/fr/dashboard/reservations` (également en anglais) présente uniquement les réservations du compte connecté. Elle affiche le destinataire, l’événement, les précisions et le prix, et permet d’annuler. Une liste devenue privée, une sortie de famille ou un lien renouvelé/révoqué masque ses détails sans empêcher l’annulation. Les anciennes réservations par lien, créées sans empreinte de jeton, restent masquées par précaution ; les réservations famille/publiques restent consultables si l’accès est encore autorisé.

Les cadeaux peuvent préciser taille, couleur et modèle. Les photos JPEG, PNG ou WebP sont limitées à 5 Mo et 25 millions de pixels, réencodées en WebP et redimensionnées à 1600 pixels maximum. Les métadonnées sont retirées. Les fichiers sont stockés dans `UPLOAD_DIR` (par défaut `uploads/gifts`), hors du dossier public. Leur route de lecture vérifie les mêmes droits que la liste et utilise un cache privé sans stockage. Une nouvelle photo remplace l’ancienne ; un cadeau retiré conserve sa photo ; une liste mise à la corbeille conserve ses photos. Sauvegarder ce dossier avec SQLite et le rendre persistant en production.

La migration `202610030004_gift_details_password_reset` conserve les données existantes et ajoute les précisions, les empreintes des accès par lien et la récupération du mot de passe. Une sauvegarde locale supplémentaire est conservée dans `prisma/backups/before-priorities-20261003.db`.

## Récupération du mot de passe

Le lien « Mot de passe oublié ? » donne accès au parcours français/anglais. Les jetons aléatoires sont stockés sous forme d’empreinte SHA-256, expirent après 30 minutes et sont utilisables une seule fois. Une nouvelle demande remplace le précédent lien. Les demandes sont limitées à trois par email sur une tranche de 15 minutes et 100 au total par heure. La réponse ne révèle pas si le compte existe. Le nouveau mot de passe doit avoir au moins 12 caractères (72 octets maximum) et être confirmé ; les sessions précédentes sont invalidées.

Aucun service email n’est configuré dans ce dossier : le formulaire indique que l’envoi est indisponible. Pour tester localement sans envoyer d’email, définir `MAIL_TRANSPORT=file` dans `.env`, garder `AUTH_URL` sur localhost et redémarrer le serveur. Les emails de test sont enregistrés dans `.local/mail` (ou `EMAIL_OUTBOX_DIR`), hors du dossier public et ignorés par Git. Ouvrir le lien du fichier JSON pour poursuivre le test. Ces fichiers contiennent des liens de récupération sensibles : ne pas les partager et les supprimer après les tests. Le mode fichier est refusé si `AUTH_URL` désigne un site public.

L’envoi réel est préparé pour [l’API HTTPS Resend](https://resend.com/docs/api-reference/emails/send-email), sans bibliothèque email supplémentaire. Après avoir configuré un domaine expéditeur chez ce service, renseigner `RESEND_API_KEY`, `MAIL_FROM` et l’URL HTTPS canonique `AUTH_URL`, puis retirer `MAIL_TRANSPORT=file`. Les clés restent côté serveur ; aucun email réel n’a été envoyé pendant les vérifications. Les paramètres se trouvent dans `.env.example`.

## Recherche, événements et invitations

Les listes disposent d’une recherche par nom, description et variantes, insensible aux accents, de filtres de priorité et de prix maximum, ainsi que de tris par nom, priorité et prix. Les visiteurs peuvent filtrer les cadeaux disponibles ou ceux réservés par leur compte ; le propriétaire ne reçoit aucun état réel de réservation. Le total concerne les cadeaux affichés avec un prix renseigné et indique combien n’ont pas de prix. Les devises sont comptées séparément, sans conversion ; le filtre de budget est proposé uniquement lorsqu’une seule devise est utilisée.

Les événements à venir et passés sont consultables depuis l’espace familial. Leur page de détail présente uniquement les listes auxquelles le compte a accès, sans révéler le nombre de listes privées. Les membres peuvent créer un événement ; les administrateurs de sa famille peuvent modifier sa date, son nom et sa description, ou le supprimer. La suppression détache les listes sans supprimer leurs cadeaux ni leurs réservations.

Les administrateurs retrouvent les invitations actives dans la page Famille, avec le destinataire, la date d’expiration, le lien à ouvrir ou copier et un bouton de révocation. Une nouvelle invitation pour la même adresse dans la même famille remplace les précédentes ; les membres déjà présents ne peuvent pas être réinvités. Les jetons et adresses des invitations ne sont jamais transmis aux membres ordinaires. Toutes ces opérations vérifient les droits côté serveur ; elles ne nécessitent pas de migration supplémentaire.

## Comptes et membres

Les connexions sont limitées à dix tentatives par email et par tranche de 15 minutes (plafond global de 1 000). Les inscriptions sont limitées à cinq tentatives par email et 100 au total par heure. Les identités des compteurs sont protégées par HMAC ; les compteurs anciens sont nettoyés après 24 heures. Le profil permet de changer le mot de passe avec vérification du mot de passe actuel, confirmation et limitation des tentatives. Le changement invalide toutes les sessions et les liens de récupération ; il fonctionne sans service email.

Un membre peut quitter une famille. Les administrateurs peuvent retirer d’autres membres ou les nommer administrateurs. Seul le propriétaire peut transmettre la responsabilité ; il devient alors membre. Le propriétaire doit transmettre avant de partir et le dernier administrateur est protégé. Les changements sont sérialisés dans une transaction SQLite. Le départ conserve les listes et leurs réservations, détache les listes des événements de cette famille et révoque les invitations destinées au membre concerné. L’accès aux listes familiales peut subsister si les personnes partagent une autre famille.

## Archives, corbeille et copies

La page Mes listes propose les onglets Actives, Archives et Corbeille. Une liste archivée reste lisible par son propriétaire mais ne peut plus être modifiée ou partagée. La corbeille conserve les cadeaux, photos et réservations sans effacement automatique. Une restauration rend la liste active et privée ; les anciens liens ne sont jamais réactivés. Les cadeaux retirés individuellement disposent aussi d’une corbeille dans leur liste active.

Une liste active ou archivée peut être dupliquée avec un nouveau nom. La copie est privée, sans événement, jeton de partage ni réservation ; ses cadeaux et photos ont leurs propres identifiants. Ces fonctions utilisent la migration `202610030005_accounts_families_list_lifecycle`.

## Sauvegarder et restaurer

`npm run backup:create` crée un dossier daté dans `prisma/backups` avec un instantané SQLite cohérent (y compris les données du journal WAL), les photos locales référencées par cet instantané et un manifest SHA-256. Les listes archivées et dans la corbeille sont incluses. Les secrets de `.env` ne sont pas copiés. Une photo manquante fait échouer la sauvegarde ; un dossier incomplet ne doit pas être utilisé. Les noms de photos sont immuables : une sauvegarde peut s’effectuer en ligne, mais privilégier une période sans modification pour éviter une suppression de photo pendant sa copie.

Pour vérifier : `npm run backup:verify -- "chemin/vers/la-sauvegarde"`. La vérification contrôle les empreintes, les tailles, l’intégrité SQLite, les clés étrangères et la correspondance entre photos et base. Elle refuse les chemins de traversée et les liens symboliques dans les fichiers référencés.

Pour tester la restauration : `npm run backup:restore -- "chemin/vers/la-sauvegarde" --target "chemin/vers/un-dossier-neuf"`. Le dossier cible doit ne pas exister ; l’outil refuse tout écrasement et vérifie le résultat. Pour utiliser cette restauration, arrêter le serveur, définir `DATABASE_URL` vers le nouveau `database.db` et `UPLOAD_DIR` vers son dossier `photos`, appliquer `npm run db:migrate` puis redémarrer. Utiliser des chemins absolus, surtout sous Windows. Conserver l’original jusqu’à validation de l’application restaurée.

Les sauvegardes contiennent des données personnelles et des empreintes de mots de passe : les conserver sur un stockage privé, hors de `public`, avec des permissions d’accès adaptées. Sous Windows, vérifier également les permissions du dossier. La sauvegarde précédant cette migration est `prisma/backups/backup-2026-10-03T21-16-27-818Z-586f3a08`.

## Cadeaux retirés et confort mobile

« Retirer le cadeau » masque désormais le cadeau sans supprimer sa photo ni sa réservation. Le propriétaire d’une liste active peut le restaurer dans « Cadeaux retirés », sans recevoir d’information sur les réservations. Les visiteurs, les compteurs de cadeaux, les recherches et les copies de listes ignorent les cadeaux retirés. Leur réservation reste annulable par son auteur, mais ses détails sont masqués jusqu’à restauration. Les photos sont conservées dans les sauvegardes. La migration `202610030006_gift_trash` préserve les données existantes ; elle ne récupère pas des cadeaux effacés définitivement avant sa mise en place.

La navigation indique la rubrique active, l’en-tête suit la page affichée et le profil reste accessible sur mobile. Les cartes s’adaptent aux écrans étroits, les boutons disposent d’une cible de 44 pixels minimum, les onglets sélectionnés sont visibles et la barre mobile tient compte de la zone de sécurité du téléphone. Le formulaire de duplication utilise les mêmes champs que le reste de l’application.

## Sauvegarde quotidienne avec essai de restauration

`npm run backup:daily` effectue une sauvegarde, la restaure dans un nouveau dossier temporaire, vérifie cette restauration puis supprime uniquement ce dossier de contrôle. Les sauvegardes sont conservées sans suppression automatique. Le dernier résultat se trouve dans `.local/backup-status.json` ; un échec donne un code de sortie non nul et conserve les dossiers incomplets pour diagnostic. Ne pas utiliser une sauvegarde sans manifest vérifié.

L’automatisation Codex « Sauvegarde quotidienne Wishi » est active chaque jour à 20 h, heure de Bruxelles, dans ce chat. Elle exécute cette commande et avertit en cas d’échec ou de besoin d’intervention. Garder le PC allumé, Codex ouvert et le dossier du projet disponible pour l’exécution locale : [documentation officielle des tâches planifiées](https://learn.chatgpt.com/docs/automations?surface=app). Elle peut être modifiée ou arrêtée depuis les automatisations de l’application.

La préparation des emails réels, leur contrôle sans envoi et l’essai local sont décrits dans [docs/email-setup.md](docs/email-setup.md). Aucun fournisseur n’est encore configuré ; `npm run email:check` liste les paramètres manquants sans exposer leurs valeurs.

## Copie externe et préparation au lancement

`BACKUP_EXTERNAL_DIR` peut désigner un dossier absolu déjà existant sur un disque externe ou dans un stockage privé synchronisé, hors du projet. `npm run backup:daily` y copie ensuite la sauvegarde et vérifie son intégrité. Les sauvegardes précédentes ne sont jamais écrasées. Un support inaccessible fait échouer la commande, tout en conservant la sauvegarde locale. Le rapport distingue `externalCopy: "verified"`, `"failed"` et `"notConfigured"` ; une copie non configurée n’est pas une sauvegarde cloud réussie.

Google Drive est connecté et une première sauvegarde privée a été téléversée. L’automatisation de 20 h prévoit maintenant la création d’une archive vérifiée et son transfert dans le dossier choisi : [guide de copie externe](docs/external-backups.md). `npm run launch:check` vérifie les paramètres de préparation sans envoyer d’email ni publier l’application. Le [parcours de test avec les proches et la préparation à la mise en ligne](docs/launch-checklist.md) complète ces contrôles.

## Suivi email et hébergement

`npm run email:status` affiche la dernière acceptation et le dernier échec, sans adresse ni lien secret. Voir [le suivi privé](docs/email-setup.md) et [la préparation du stockage en hébergement](docs/hosting-preparation.md). Le mode `resend.dev` est réservé aux tests et ne satisfait pas le contrôle de lancement pour les proches.
