# Héberger Wishi avec ses données

Le test visuel a été déclaré terminé par l’utilisateur. Le parcours automatisé de partage et de réservation passe avec plusieurs comptes isolés.

## Chemin compatible avec l’application actuelle

Utiliser un serveur Node.js 24 ou ultérieur, avec un disque persistant privé et une seule instance de Wishi. La base SQLite, les photos et les rapports email doivent survivre aux redémarrages et aux nouvelles versions. Une adresse fournie par l’hébergeur peut éviter l’achat immédiat d’un domaine pour le site.

Renseigner `DATABASE_URL` avec un chemin absolu `file:/.../database.db`, `UPLOAD_DIR` avec le dossier absolu des photos, `EMAIL_STATUS_DIR` avec un dossier privé persistant, `AUTH_URL` avec l’adresse HTTPS finale et un nouveau `AUTH_SECRET` privé. Ne pas exposer ces dossiers comme fichiers publics. Ne pas recopier automatiquement le secret local vers la production.

Après `npm ci`, exécuter `npm run db:generate`, `npm run db:migrate`, `npm run build`, puis `npm start`. Ne pas exécuter le jeu de démonstration sur les données réelles. Restaurer une sauvegarde dans un dossier neuf avant de changer les chemins ; conserver la copie originale jusqu’à validation. Vérifier connexion, images, partage et réservations après un redémarrage du serveur.

## Hébergement avec stockage temporaire

Un environnement qui ne conserve pas son disque ne convient pas directement aux fichiers actuels. Il faut d’abord migrer SQLite vers une base persistante compatible, remplacer le stockage local des photos par un stockage objet privé, adapter les accès et la sauvegarde, puis tester les migrations et les droits d’accès. Aucun fournisseur n’est imposé et aucune migration destructive n’est engagée.

## Conditions restantes avant publication

- Choisir l’hébergeur selon le budget et sa capacité à conserver les données.
- Tester une restauration à partir d’une archive téléchargée de Drive, dans un dossier neuf.
- Configurer la sauvegarde depuis l’environnement hébergé : la tâche Codex actuelle ne sauvegarde que ce PC.
- Pour envoyer aux proches, fournir un expéditeur autorisé : `onboarding@resend.dev` reste limité à l’adresse du compte Resend. Le contrôle de lancement refuse désormais ce mode de test comme configuration de production.

Aucun compte hébergeur, achat ou déploiement n’a été effectué. Les étapes de lancement existantes sont dans `docs/launch-checklist.md`.
