# Sauvegardes de Wishi sur Railway

L’offre d’essai du projet ne donne pas accès à la création de sauvegardes natives du volume : l’interface exige Pro. Wishi dispose donc d’un processus de sauvegarde inclus dans `npm start`, sans nouvel abonnement.

Lorsque `RAILWAY_VOLUME_MOUNT_PATH` est présent, Wishi crée un premier instantané s’il n’existe aucun résultat valide, puis sauvegarde à partir de 20 h, heure de Bruxelles, une fois par jour. Il tient compte de l’heure d’été et rattrape l’exécution lors d’un redémarrage après 20 h. L’application ne doit utiliser qu’une instance avec ce volume. L’horloge est vérifiée chaque minute ; ce n’est pas une garantie d’exécution à la seconde.

Les fichiers sont dans `/data/backups` et le rapport dans `/data/backup-status.json`. Chaque sauvegarde contient l’instantané SQLite et les photos référencées, y compris celles des cadeaux retirés. Elle est vérifiée puis restaurée dans un dossier de contrôle neuf ; seul ce contrôle est supprimé. Les anciennes sauvegardes restent conservées. Le processus refuse une nouvelle sauvegarde si moins de 32 Mo sont libres et attend quinze minutes après un échec. Surveiller la capacité du petit volume avant d’ajouter beaucoup de photos.

Les logs indiquent `Wishi hosted backup and restoration verified` en cas de réussite. Les erreurs sont signalées sans contenu personnel. Les logs ne notifient pas automatiquement l’utilisateur. Les rapports email sont également conservés sur le volume, dans `/data/email-status`.

Ces instantanés sont sur le même volume que les données : ils protègent contre des modifications accidentelles, mais pas contre la disparition du volume. La copie Drive quotidienne existante concerne toujours le PC, pas Railway. Une exportation indépendante du volume hébergé vers Drive reste nécessaire pour cette protection supplémentaire ; aucune route publique donnant accès à toutes les données n’est créée.

Pour vérifier un instantané sur le serveur : `node scripts/backup.cjs verify /data/backups/nom-du-dossier`. Pour un essai indépendant : `node scripts/backup.cjs restore /data/backups/nom-du-dossier --target /data/dossier-de-controle-neuf`. Ne pas modifier les chemins de production pendant cet essai. `WISHI_AUTO_BACKUP=off` permet de désactiver explicitement le processus.

Le processus utilise les fonctions de sauvegarde et restauration couvertes par les tests. Le premier instantané hébergé doit être confirmé dans les logs du déploiement, avant d’annoncer que sa restauration est vérifiée.
