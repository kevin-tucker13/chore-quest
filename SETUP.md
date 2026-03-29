# Dean & Emma's Chore Quest — Setup Guide

## Quick Start (Demo Mode)

The app works immediately without any setup. In demo mode, data is stored in the browser's **localStorage** — this means it only works on one device. To sync between parent and children's tablets, you need Firebase (free).

---

## Setting Up Firebase (Free — Recommended)

Firebase gives you real-time sync so parents can add chores on their device and children see them instantly on their tablets.

### Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Name it `chore-quest` (or anything you like)
4. Disable Google Analytics (not needed)
5. Click **"Create project"**

### Step 2 — Enable Firestore Database

1. In your project, click **"Firestore Database"** in the left menu
2. Click **"Create database"**
3. Choose **"Start in test mode"** (you can secure it later)
4. Select a region close to you (e.g. `europe-west2` for UK)
5. Click **"Enable"**

### Step 3 — Get Your Config Keys

1. Click the gear icon → **"Project settings"**
2. Scroll down to **"Your apps"** and click **"Add app"** → Web (`</>`)
3. Register the app (any nickname)
4. Copy the `firebaseConfig` object — it looks like this:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "chore-quest.firebaseapp.com",
  projectId: "chore-quest",
  storageBucket: "chore-quest.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 4 — Add Config to the App

Create a file called `.env` in the project root folder:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=chore-quest.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=chore-quest
VITE_FIREBASE_STORAGE_BUCKET=chore-quest.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Step 5 — Secure Your Database (Optional but Recommended)

In the Firebase Console → Firestore → Rules, replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

This keeps it open for family use. For extra security you can add authentication later.

---

## Changing the Parent PIN

The default PIN is `130615`. To change it:

**Option A — Through the app:**
1. Log in with the current PIN
2. Go to Parent Dashboard → Settings tab
3. Enter and confirm your new 6-digit PIN

**Option B — In the code:**
Open `client/src/lib/firebase.ts` and find:
```ts
export const defaultSettings: AppSettings = {
  parentPin: "130615",
  ...
};
```
Change `"130615"` to your preferred PIN. This only affects fresh installs.

---

## Hosting on GitHub Pages

### Step 1 — Build the App

```bash
pnpm build
```

### Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/chore-quest.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages

1. Go to your repository on GitHub
2. Settings → Pages
3. Source: **GitHub Actions**
4. The app will be available at `https://YOUR_USERNAME.github.io/chore-quest/`

### Step 4 — Add Firebase Secrets to GitHub

In your repository: Settings → Secrets and variables → Actions → New repository secret

Add each of your Firebase environment variables as secrets.

### Step 5 — Add to Tablet Home Screen

On the tablet browser:
- **Chrome/Android:** Menu → "Add to Home screen"
- **Safari/iPad:** Share button → "Add to Home Screen"

---

## Migrating to Heart Internet Hosting

If you want to move from Firebase to your own Heart Internet hosting:

### What You Need on Heart Internet
- PHP 7.4+ hosting
- MySQL database
- SSL certificate (usually included)

### Migration Steps

1. **Create a MySQL database** on Heart Internet cPanel
2. **Import the schema** from `migration/heart-internet-schema.sql`
3. **Replace `client/src/lib/firebase.ts`** with `migration/heart-internet-api.ts`
4. **Update the API endpoint** in the new file to point to your Heart Internet domain
5. **Upload the PHP files** from `migration/php/` to your Heart Internet hosting

The function signatures in the API file are identical to the Firebase version — only the transport layer changes. All React components remain unchanged.

---

## Weekly Reset

The app does **not** auto-reset — a parent must manually reset each week:

1. Log into the Parent Dashboard
2. Go to Dean or Emma's tab
3. Scroll to the bottom and tap **"Reset Week"**

This clears all completed tasks, resets stars to 0, and clears the above & beyond entries.

---

## Troubleshooting

**"App shows demo mode" warning:**
→ Your `.env` file is missing or the Firebase config is incorrect.

**Changes not syncing between devices:**
→ Check that all devices have internet access and Firebase is configured.

**Forgot the parent PIN:**
→ Open browser DevTools → Application → Local Storage → find `chorechart_settings` and edit the `parentPin` value directly.
