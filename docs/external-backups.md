# Copier les sauvegardes hors du PC

Les sauvegardes locales sont déjà vérifiées, avec un essai de restauration. Pour protéger aussi les données contre une panne du PC, choisir un disque externe ou un dossier privé synchronisé avec un stockage cloud.

La destination choisie est [le dossier Google Drive Wishi](https://drive.google.com/drive/folders/15dlfXbvMoBhyr18RmxDdBFHOD70srxMv). Google Drive est connecté. Une [première sauvegarde](https://drive.google.com/file/d/1n8nr0jh-EJITS5owgA9gzdRhEIP7LQj6/view?usp=drivesdk) y a été déposée le 4 octobre 2026, avec contrôle du dossier parent et de la taille (7 628 octets). Son archive a été extraite et vérifiée localement avant transfert. Le contrôle distant ne constitue pas un essai de restauration depuis Drive.

L’automatisation Codex de 20 h crée une sauvegarde locale, exécute `npm run backup:package` pour compresser et vérifier sa restauration, puis utilise le connecteur Google Drive pour envoyer cette archive dans ce dossier précis. Elle contrôle les métadonnées du fichier envoyé et conserve son identifiant dans `.local/drive-backup-status.json`. Le PC doit rester allumé et Codex ouvert ; le connecteur doit rester disponible. Aucun partage public ni effacement automatique n’est activé.

Une URL Drive ne peut pas être utilisée comme `BACKUP_EXTERNAL_DIR`. Le réglage ci-dessous est une alternative pour un disque externe ou un dossier déjà synchronisé localement ; il n’est pas nécessaire au transfert par le connecteur.

1. Créer sur ce support un dossier réservé aux sauvegardes Wishi. Exemple : `E:/Wishi-backups`. Ce chemin est un exemple : ne pas l’utiliser si le disque correspondant n’existe pas.
2. Ajouter dans `.env` : `BACKUP_EXTERNAL_DIR="chemin-absolu-du-dossier"`.
3. Exécuter `npm run backup:daily`. Le script sauvegarde et vérifie d’abord en local, puis crée une copie complète dans un nouveau dossier externe et contrôle son intégrité. Il refuse d’écraser une copie existante et de copier dans le dossier du projet.
4. Vérifier que `.local/backup-status.json` indique `externalCopy: "verified"`. Avec un dossier cloud, vérifier également que le logiciel de synchronisation a terminé : le script contrôle la copie sur disque, pas son transfert vers le fournisseur.

La commande locale utilise ce réglage lorsqu’il est présent. Un disque absent, un dossier inaccessible ou une copie invalide fait échouer la commande et déclenche son signalement ; la sauvegarde locale est conservée. Sans `BACKUP_EXTERNAL_DIR`, la sauvegarde locale réussit mais indique explicitement que la copie externe n’est pas configurée.

Les copies contiennent des données personnelles et des empreintes de mots de passe. Utiliser un dossier privé, sans lien de partage public. Le fichier `.env` et ses secrets ne sont pas copiés. Aucun effacement automatique des sauvegardes n’est prévu.

Pour un contrôle de récupération indépendant, recopier une sauvegarde externe dans un nouveau dossier avec `npm run backup:restore -- "chemin-de-la-copie-externe" --target "chemin-dossier-neuf"`. Conserver les données d’origine pendant ce contrôle.
