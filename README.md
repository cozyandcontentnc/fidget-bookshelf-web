This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Firebase: Anonymous Auth + Firestore Rules + App Check (Fidget Bookshelf)

## What we use
- Firebase Auth: **Anonymous sign-in** (no UI, per-device identity)
- Firestore: user data stored under **/users/{uid}/...**
- Firestore Rules: **owner-only access** (each user can only read/write their own subtree)
- App Check: **reCAPTCHA v3** for bot/script abuse mitigation

---

## Data model (current)
- /users/{uid}/fidgetShelves/default (shelf metadata)
- /users/{uid}/fidgetShelves/default/books/{itemId} (books + decor items)

---

## Firestore security rules (current intent)
Only the signed-in user can access their own documents:

- /users/{uid} and all subcollections: read/write only if `request.auth.uid == uid`
- everything else: denied

If the app stops reading/writing, check:
- Anonymous Auth is enabled in Firebase Auth
- The user is signed in (anonymous uid exists)
- Rules still match the storage path (/users/{uid}/...)

---

## App Check (Production)
### reCAPTCHA setup
- Created a reCAPTCHA v3 key in Google reCAPTCHA admin
- Allowed domain:
  - fidget-bookshelf-web.vercel.app
  - (optional for local dev) localhost

### Firebase Console setup
- Firebase Console → App Check → Apps
  - Web app registered with **reCAPTCHA**
  - Entered **reCAPTCHA secret key** in Firebase (NOT the site key)
- Firebase Console → App Check → APIs
  - Cloud Firestore: set to **Enforced** (after verifying traffic)

### App code setup
Vercel Environment Variable (Production):
- NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=<site key>

In `src/lib/firebase.js` (client only):
```js
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const app = createFirebaseApp();

if (typeof window !== "undefined") {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(
        process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY
      ),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    // ignore "already exists" (dev/hot reload)
  }
}
