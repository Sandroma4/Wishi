# Préparer les emails Wishi

Le compte Resend est créé. Aucun envoi réel n’a encore été testé. Pour commencer gratuitement, l’expéditeur local est configuré sur `Wishi <onboarding@resend.dev>` : ce domaine permet uniquement l’envoi à l’adresse associée au compte Resend, sans achat de domaine.

## Test gratuit sans domaine

1. Dans Resend, ouvrir **API Keys** et créer une clé limitée à l’envoi (**Sending access**). Renseigner sa valeur dans le fichier privé `.env` sous `RESEND_API_KEY`, jamais dans le chat. Ne pas remplacer les autres paramètres du fichier.
2. Conserver `MAIL_FROM="Wishi <onboarding@resend.dev>"` et `AUTH_URL="http://localhost:3000"` pour cet essai sur le PC. `MAIL_TRANSPORT=file` doit rester désactivé pour recevoir un email réel.
3. Exécuter `npm run email:check`, puis redémarrer Wishi. Ce contrôle vérifie seulement la configuration locale, sans envoyer ni valider la clé distante.
4. Utiliser « Mot de passe oublié » avec un compte Wishi dont l’adresse correspond exactement à celle du compte Resend. Le lien reçu ouvre Wishi sur ce PC ; il ne permet pas un accès depuis un autre appareil.

Les autres destinataires nécessitent un domaine vérifié : [limite officielle de resend.dev](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain). Aucun domaine ni hébergement payant n’est nécessaire pour ce test. Le domaine `updates.wishi.com` saisi précédemment n’est pas utilisable sans posséder `wishi.com`.

## Suivi privé des envois

`npm run email:status` affiche la dernière acceptation par Resend et le dernier échec. Les deux rapports dans `.local/email-status` conservent uniquement la date, le résultat, la catégorie et éventuellement le statut HTTP. Aucun destinataire, contenu, clé API ou lien de récupération n’est enregistré. Un succès ultérieur ne supprime pas le dernier échec. Les erreurs réseau, les refus du fournisseur et ses limitations sont distingués ; l’acceptation ne prouve pas la livraison en boîte de réception. Le mode fichier local ne produit pas de faux succès Resend. Ces rapports commencent avec les prochains envois, sans reconstituer les anciens essais.

En hébergement, définir `EMAIL_STATUS_DIR` sur un dossier privé persistant et consulter également les événements de livraison dans Resend. Si l’écriture du suivi échoue, le serveur émet un message sans données sensibles ; cela ne transforme pas un envoi accepté en échec.

## Envoi aux autres utilisateurs, plus tard

1. Créer un compte depuis [la page officielle Resend](https://resend.com/signup) et ajouter un domaine dont vous êtes propriétaire. La saisie du nouveau mot de passe et l’acceptation des conditions doivent être effectuées par vous. Si aucun domaine n’est encore acheté, choisir son nom et son budget avant tout achat. Suivre les enregistrements DNS indiqués par Resend et attendre que le domaine soit vérifié : [guide officiel](https://resend.com/docs/dashboard/domains/introduction).
2. Créer une clé API d’envoi et la renseigner uniquement dans `.env`, jamais dans le chat ni dans un fichier public.
3. Renseigner `RESEND_API_KEY`, `MAIL_FROM` avec une adresse du domaine vérifié, et `AUTH_URL` avec l’adresse HTTPS réelle de Wishi. Exemple d’expéditeur : `Wishi <bonjour@votre-domaine.fr>`. Retirer `MAIL_TRANSPORT=file` s’il était utilisé pour les tests.
4. Exécuter `npm run email:check`. Ce contrôle indique les paramètres manquants ou invalides, sans afficher leur valeur et sans envoyer d’email. Il ne valide pas la clé auprès de Resend ni les DNS.
5. Redémarrer Wishi puis utiliser « Mot de passe oublié » avec votre propre compte pour un essai réel. Vérifier la réception, la date d’expiration et l’ouverture du lien sur la bonne adresse de Wishi.

Sans fournisseur, le mode local reste disponible : ajouter `MAIL_TRANSPORT=file` avec `AUTH_URL=http://localhost:3000`. Les messages sont enregistrés dans `.local/mail` et aucun email n’est envoyé. Les fichiers contiennent des liens de récupération et doivent rester privés.

L’envoi utilise [l’API HTTPS Resend](https://resend.com/docs/api-reference/emails/send-email). Les réponses de récupération restent identiques pour un compte connu ou inconnu. La durée de validité est de 30 minutes et un lien ne peut être utilisé qu’une fois.
