# Installer Cadéoly sur téléphone

La version web installable utilise les mêmes comptes et données que le site. Elle ne produit pas encore de fichier APK ou IPA.

- Android : ouvrir le site HTTPS dans Chrome, puis utiliser Installer Cadéoly dans Options ou le menu du navigateur.
- iPhone : ouvrir le site dans Safari, puis Partager → Sur l’écran d’accueil. Choisir l’ouverture comme application lorsque proposée.
- Si le navigateur propose uniquement un raccourci, vérifier son support de l’installation et les critères du manifeste.

Le service worker est activé uniquement en production. En développement, le menu fournit les instructions, sans modifier le cache du navigateur.

Hors connexion, une navigation complète affiche une page explicative en français ou anglais. Les listes, photos personnelles, réponses API et actions de formulaire ne sont jamais mises en cache par ce service worker. Les modifications nécessitent Internet. Les transitions internes et les envois de formulaire restent gérés par Next.js.

Le cache ne contient que les deux pages publiques hors connexion et le logo. Toute modification de ces fichiers doit incrémenter le nom de cache dans public/sw.js.

Avant publication : compiler, vérifier le manifeste et les icônes, puis tester l’installation sur un appareil Android et un iPhone. Un contrôle local ne confirme pas l’installation réelle sur téléphone.
