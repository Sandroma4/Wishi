# Connexion Google

Le bouton apparaît sur les pages Connexion et Inscription lorsque `AUTH_GOOGLE_ID` et `AUTH_GOOGLE_SECRET` sont configurés. Aucun secret n'est envoyé au navigateur. Les tables de comptes OAuth existent déjà : aucune migration supplémentaire.

1. Dans [Google Auth Platform](https://console.cloud.google.com/auth/overview), sélectionner le projet et renseigner l'identité de l'application Cadéoly ainsi que l'audience. En mode test, ajouter les utilisateurs autorisés dans Audience.
2. Créer un client OAuth de type **Application Web** dans Clients.
3. Ajouter les URI de redirection exactes des environnements utilisés :
   - `http://127.0.0.1:3000/api/auth/callback/google` pour la version locale actuelle ;
   - `http://localhost:3000/api/auth/callback/google` si l'application est ouverte avec localhost ;
   - `https://VOTRE-DOMAINE/api/auth/callback/google` pour la production.
4. Définir `AUTH_URL` avec l'origine utilisée, puis ajouter `AUTH_GOOGLE_ID` et `AUTH_GOOGLE_SECRET` dans le fichier `.env` local ou les variables privées de l'hébergeur. Ne pas utiliser de préfixe `NEXT_PUBLIC_`, ne pas publier ces valeurs dans Git ou le chat.
5. Redémarrer le serveur local ou redéployer, puis tester avec un compte autorisé. Vérifier la connexion, la déconnexion et le retour vers un lien partagé ou une invitation.

Seuls les droits `openid email profile` sont demandés. Google doit fournir une adresse e-mail vérifiée. Les comptes existants ne sont pas fusionnés automatiquement : se connecter d'abord par mot de passe, puis utiliser **Associer mon compte Google** dans le profil. Auth.js refuse un compte Google déjà associé à un autre utilisateur. Les nouvelles connexions Google conservent la vérification de révocation des sessions après changement de mot de passe.

Les tests locaux utilisent des réponses OAuth simulées et signées ; ils ne prouvent pas la validité des identifiants ni le paramétrage de la console Google. La validation réelle nécessite les identifiants du projet.

Références : [Auth.js Google](https://authjs.dev/getting-started/providers/google), [Google OAuth Web Server](https://developers.google.com/identity/protocols/oauth2/web-server).
