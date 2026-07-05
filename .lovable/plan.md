## Problème
Dans Google (et les aperçus de lien Android), l'icône qui apparaît à côté de `sitdownvienna.app` est le logo Lovable (cœur ❤️) au lieu du logo Sitdown.

## Cause probable
`index.html` déclare bien `<link rel="icon" href="/sitdown-logo.png">`, mais il n'y a **aucun `favicon.ico`** dans `public/`. Les navigateurs et Googlebot demandent `/favicon.ico` par défaut. Sans ce fichier, la plateforme d'hébergement sert probablement un favicon Lovable par défaut, qui écrase la déclaration explicite.

## Plan de correction

1. **Générer un `favicon.ico`** à partir du logo existant `public/sitdown-logo.png`
2. **Placer `favicon.ico` dans `public/`** pour qu'il soit servi à la racine `/favicon.ico`
3. **Mettre à jour `index.html`** pour ajouter explicitement :
   ```html
   <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
   ```
   Cela garantit que Google et tous les navigateurs voient le logo Sitdown.

4. **Vérifier l'aperçu** en testant la réponse de `/favicon.ico` localement.

---

*Note : Google met en cache les favicons plusieurs semaines. Une fois le fichier déployé, il faut attendre le prochain crawl de Google pour que le changement apparaisse dans les résultats de recherche. Le client peut forcer la mise à jour via l'outil "Fetch as Google" ou en modifiant l'URL dans la Search Console.*