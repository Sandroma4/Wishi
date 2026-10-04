# Préparer l’utilisation réelle de Wishi

## Configuration à compléter

- Suivre [la préparation des emails](email-setup.md) : compte Resend, domaine vérifié, clé dans `.env`, essai sur votre propre compte.
- Suivre [la copie des sauvegardes hors du PC](external-backups.md) et vérifier la récupération depuis cette copie.
- Exécuter `npm run launch:check` pour connaître les paramètres manquants. Ce contrôle reste local et n’effectue aucun envoi ni publication.

## Essai avec quelques proches

Créer une famille de test et transmettre vous-même les liens d’invitation aux participants. Utiliser des listes et cadeaux clairement nommés « Test ».

1. Accepter une invitation depuis un téléphone, après connexion ou inscription.
2. Créer une liste, ajouter un cadeau avec photo, taille, couleur et prix.
3. Consulter cette liste depuis le compte d’un proche et réserver un cadeau. Vérifier que le destinataire ne voit aucune réservation.
4. Annuler la réservation, puis réserver à nouveau.
5. Retirer le cadeau et le restaurer ; vérifier la photo et la réservation depuis leurs comptes respectifs.
6. Archiver la liste, la restaurer en privé, puis vérifier que les anciens liens ne donnent plus accès.
7. Oublier volontairement le mot de passe du compte de test et suivre un lien reçu par email après activation du service.

Noter pour chaque essai : téléphone et navigateur, étape bloquante, résultat attendu, résultat observé. Aucun message aux proches n’est envoyé automatiquement.

## Avant une mise en ligne

Choisir d’abord l’hébergement et le domaine public. Prévoir un stockage persistant pour SQLite et les photos, un secret de session propre à la production et HTTPS. Renseigner les chemins et l’adresse publique dans la configuration privée de cet environnement. Les identifiants de démonstration ne doivent pas être ajoutés en production.

Exécuter les tests et la compilation, effectuer une sauvegarde, appliquer les migrations et vérifier la connexion, les droits de partage, les photos et la récupération du mot de passe sur l’adresse finale. Définir la consultation des erreurs côté hébergeur et vérifier que les logs n’exposent ni secrets ni liens de récupération.

L’automatisation quotidienne configurée dans Codex concerne ce PC. Pour une application hébergée, prévoir aussi les sauvegardes sur l’hébergement et tester leur restauration. Aucun hébergement ni compte externe n’a été créé ou publié par cette préparation.
