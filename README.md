# everyday altar

A public archive of a daily creative practice. Something made, documented, every day.

Instagram archive: [@everydayaltar](https://instagram.com/everydayaltar)

---

## What it is

- Static site hosted on GitHub Pages
- Posts stored in Firebase Firestore (collection: `posts`, doc ID = `YYYY-MM-DD`)
- Images stored in Firebase Storage under `posts/{date}/`
- No server, no build step, no framework

---

## Setup

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project.
2. Enable **Firestore** (native mode).
3. Enable **Storage**.
4. Register a **Web app** inside the project.

### 2. Add the Firebase config

Open `js/firebase.js` and replace all `"REPLACE_ME"` values with the config object from:

> Firebase Console → Project Settings → Your apps → Web app → SDK setup and configuration

```js
const firebaseConfig = {
  apiKey:            "...",
  authDomain:        "....firebaseapp.com",
  projectId:         "...",
  storageBucket:     "....appspot.com",
  messagingSenderId: "...",
  appId:             "..."
};
```

The web config object is intentionally public and safe to commit.

### 3. Deploy Firebase rules

Install the Firebase CLI if you haven't:

```sh
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
```

Then deploy rules:

```sh
firebase deploy --only firestore,storage
```

---

## Running locally

No build step. Just open `index.html` in a browser. Since the Firebase SDK is loaded
over CDN and uses ESM modules, you need a local HTTP server (not `file://`):

```sh
# Python
python3 -m http.server 8000

# Node (npx)
npx serve .
```

Then open `http://localhost:8000`.

---

## Deploying to GitHub Pages

Push to the `main` branch. The GitHub Actions workflow at `.github/workflows/deploy.yml`
automatically publishes the site to the `gh-pages` branch via `peaceiris/actions-gh-pages`.

Enable Pages in repo settings:

> Settings → Pages → Source: Deploy from branch → Branch: `gh-pages` / `/ (root)`

The site will be available at `https://{your-github-username}.github.io/{repo-name}/`.

---

## DNS (custom domain — do this at your registrar)

To serve from a custom domain, add a `CNAME` file to the repo root containing the domain,
and add a DNS record at your registrar:

| Type  | Name      | Value                        |
|-------|-----------|------------------------------|
| CNAME | everyday  | {your-github-username}.github.io |

Then in GitHub repo settings:

> Settings → Pages → Custom domain → enter the domain → Save → Enforce HTTPS (after cert is ready)

Do not touch the apex domain records for your primary site.

---

## Data model

Firestore collection `entries`, document ID = auto-generated:

```json
{
  "date":      "Timestamp",
  "createdAt": "Timestamp",
  "caption":   "Caption or writing. Can be empty.",
  "imgPaths":  ["posts/2026-09-06/0.jpg", "posts/2026-09-06/1.jpg"]
}
```

`imgPaths` stores Storage paths (not download URLs). The feed resolves them at render time via `getDownloadURL`.

Storage layout:

```
posts/
  2026-09-06/
    0.jpg
    1.jpg
  2026-09-07/
    0.jpg
```

---

## Firebase authorized domains

For Auth to work (needed for the future write page), add these to:

> Firebase Console → Authentication → Settings → Authorized domains

- `localhost`
- `{your-github-username}.github.io`
- The custom domain, once configured

---

## Future: adding posts

The write page (`/write`) is not yet built. Posts can currently be added via:

- The Firebase Console (manual Firestore document entry + Storage upload)
- The import script (`scripts/import.mjs`, not yet implemented) for historical archive
