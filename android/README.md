# Cadéoly Android

Application Android installable (Android 8 ou plus), ouvrant le site HTTPS de production. Les comptes et les listes sont partagés avec le site ; Internet est nécessaire. Ce premier client ne fournit pas encore de notifications ni de données hors connexion.

Le domaine autorisé est défini dans MainActivity.java. Les liens produits HTTPS sont ouverts dans le navigateur, sans pont JavaScript natif. L'application ne demande que l'accès Internet et utilise le sélecteur système pour les photos.

## Compilation locale

Les outils officiels vérifiés se trouvent dans `.local/android-tools` : Temurin 17, Android platform 35 et Build Tools 35.0.0. Aucune modification globale de Java ou du SDK n'est nécessaire.

Exécuter `node android/build-apk.cjs`. Le résultat est `.local/apk/cadeoly-1.1.0.apk`. La compilation vérifie la signature et produit une empreinte SHA-256.

La clé privée et son mot de passe se trouvent dans `.local/android-signing`, exclus de Git. Conserver ce dossier dans un stockage privé sécurisé et le transférer sur le PC principal pour signer les prochaines versions. Ne pas publier ou partager ce dossier avec l'APK. Sans la même clé, les utilisateurs ne peuvent pas installer une mise à jour par-dessus cette version.

Avant chaque nouvelle version, augmenter versionCode et versionName dans AndroidManifest.xml et ajuster le nom de sortie. Cette APK est destinée aux installations directes ; une publication Google Play demande une préparation supplémentaire (AAB, fiche, confidentialité et tests physiques).

Pour installer : transférer l'APK sur le téléphone, l'ouvrir, et autoriser temporairement cette source d'installation si Android le demande. La compilation ne remplace pas un test sur un appareil réel.
