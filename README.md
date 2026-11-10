# THE BOSS — par Malik Eudy

Site vitrine statique du podcast **THE BOSS** (HTML / CSS / JavaScript, sans dépendance ni étape de build).

## Aperçu local

Ouvrez `index.html` dans un navigateur, ou lancez un petit serveur :

```bash
python3 -m http.server 8000
```

## Configuration

En haut de `script.js` :

```js
const CONFIG = {
  youtubeUrl: "https://www.youtube.com/",   // lien de la chaîne YouTube
  contactEmail: "contact@example.com",      // adresse qui reçoit les propositions d'invités
};
```

## Structure

```
index.html          Page unique (hero, bienvenue, concept, esprit, présentateur, épisodes, contact)
styles.css          Styles et responsive
script.js           Menu mobile, animations, formulaire (mailto), configuration
assets/img/         Logo, portrait, favicon, image de partage (Open Graph)
```

## Mise en ligne

Le site est 100 % statique : il peut être hébergé tel quel sur GitHub Pages, Netlify, Vercel, OVH, etc.
