# everyday altar

A public archive of a daily creative practice. Something made, documented, every day.

Instagram archive: [@everydayaltar](https://instagram.com/everydayaltar)

---

## What it is

- Static site hosted on GitHub Pages
- Posts stored in Firebase Firestore (collection: `entries`, auto-generated doc IDs)
- Images stored in Firebase Storage under `entries/`
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
  "imgPaths":  ["https://firebasestorage.googleapis.com/v0/b/...entries%2Ffilename.jpg?alt=media&token=..."]
}
```

`imgPaths` stores full Firebase Storage download URLs (with `?alt=media&token=...`). The feed uses them directly as `img.src` — no SDK resolution needed.

Storage layout:

```
entries/
  filename.jpg
  another-image.jpg
```

---

## Firebase authorized domains

For Auth to work (needed for the future write page), add these to:

> Firebase Console → Authentication → Settings → Authorized domains

- `localhost`
- `{your-github-username}.github.io`
- The custom domain, once configured

---

## Adding posts via Apple Shortcuts

New entries are created from an Apple Shortcut that talks directly to the Firestore REST API using Firebase email/password authentication. No backend or build step required.

### One-time Firebase setup

1. Firebase Console → Authentication → Sign-in method → enable **Email/Password**.
2. Authentication → Users → **Add user** → your email + a strong password.
3. In `firestore.rules`, replace `YOUR_OWNER_EMAIL` with that email, then paste the updated rules into the Firebase Console (Firestore → Rules tab).

### One-time: get your refresh token

Make this HTTP call once (curl, Insomnia, Postman, etc.) to get a long-lived refresh token:

```
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY
Content-Type: application/json

{ "email": "you@example.com", "password": "yourpassword", "returnSecureToken": true }
```

`YOUR_API_KEY` is the `apiKey` value from `js/firebase.js`. Save the `refreshToken` from the response — store it as a text variable inside your Shortcut (not in the repo).

### How the Shortcut works (two HTTP calls per post)

**Call 1 — exchange the refresh token for a fresh ID token** (ID tokens expire after 1 hour; this keeps the Shortcut evergreen):

```
POST https://securetoken.googleapis.com/v1/token?key=YOUR_API_KEY
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=YOUR_REFRESH_TOKEN
```

Parse `id_token` from the JSON response.

**Call 2 — create the Firestore document:**

```
POST https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/entries
Authorization: Bearer {id_token from Call 1}
Content-Type: application/json

{
  "fields": {
    "date":      { "timestampValue": "<ISO8601 timestamp for the entry date>" },
    "createdAt": { "timestampValue": "<ISO8601 timestamp for now>" },
    "caption":   { "stringValue": "<your caption text>" },
    "imgPaths":  { "arrayValue": { "values": [] } }
  }
}
```

Firestore auto-generates the document ID because the POST targets the collection path, not a specific document. Image upload support can be added later as a third call to the Firebase Storage REST API.

`YOUR_PROJECT_ID` is the `projectId` value from `js/firebase.js`.
