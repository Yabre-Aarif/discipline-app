# Déployer Discipline sur Netlify

## 1. Mettre le code sur GitHub (ou GitLab/Bitbucket)

Netlify se connecte à un dépôt Git. Ce projet n'en a pas encore — pousse-le
sur GitHub (ou demande à Claude de le faire) avant l'étape suivante.

## 2. Créer un token Airtable

1. Va sur https://airtable.com/create/tokens
2. Crée un token nommé par ex. « Discipline backend »
3. Scopes : `data.records:read`, `data.records:write`
4. Accès : la base **Discipline** (`appJI9aGVi6MxVK2S`) uniquement
5. Copie le token — il ne sera plus jamais affiché

## 3. Connecter le site sur Netlify

1. https://app.netlify.com → **Add new site** → **Import an existing project**
2. Choisis le dépôt GitHub du projet
3. Netlify lit `netlify.toml` automatiquement :
   - Build command : `npx expo export --platform web`
   - Publish directory : `dist`
   - Functions directory : `netlify/functions`
4. Ne clique pas encore sur Deploy — passe à l'étape suivante

## 4. Variables d'environnement

Dans **Site configuration → Environment variables**, ajoute :

| Clé | Valeur |
|---|---|
| `AIRTABLE_API_KEY` | le token créé à l'étape 2 |
| `AIRTABLE_BASE_ID` | `appJI9aGVi6MxVK2S` |
| `JWT_SECRET` | une longue chaîne aléatoire (ex. générée avec `openssl rand -hex 32`) |

## 5. Déployer

Lance le déploiement. Une fois en ligne, l'app est servie à la racine et
l'API est accessible sur `/api/*` (proxyée vers les Netlify Functions par
`netlify.toml` — aucune configuration supplémentaire n'est nécessaire).

## Vérifier que ça marche

- Ouvre le site : l'écran d'inscription doit s'afficher.
- Crée un compte test → si tu vois une erreur, ouvre l'onglet **Functions**
  du dashboard Netlify pour lire les logs de `api`.
- Dans Airtable, la table **Users** doit contenir la nouvelle ligne.
- Depuis un autre navigateur (ou navigation privée), utilise « Se connecter »
  avec les mêmes identifiants : tes objectifs et ton historique doivent
  réapparaître.

## Notes de sécurité

- Le mot de passe n'est jamais stocké en clair : la fonction `signup` le
  hache avec bcrypt avant écriture dans Airtable (colonne `PasswordHash`).
- La clé Airtable et `JWT_SECRET` ne vivent que côté serveur (Netlify
  Functions) — jamais dans le code envoyé au navigateur.
- Les tokens de session expirent après 180 jours.
