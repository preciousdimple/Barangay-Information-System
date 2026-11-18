# Barangay Information System — React + Firebase

## Included
- React + Vite + Bootstrap 5 responsive interface
- Email/password Login, Sign up, Forgot password, and Google Sign-In (Firebase Authentication)
- Firestore account profiles and role-based routes
- Automatic Admin profile creation on first Google sign-in
- Super Admin dashboard and Admin Management
- PWA manifest, service worker, and offline fallback page

## 1. Install and run
```bash
npm install
npm run dev
```
Open `http://localhost:5173`.

## 2. Enable Firebase services
In Firebase Console for `barangay-information-sys-e0159`:
1. Open **Authentication → Sign-in method** and enable **Email/Password** and **Google**.
2. Open **Authentication → Settings → Authorized domains** and ensure `localhost` and your deployed domain are listed.
3. Create/enable **Cloud Firestore**.
4. In Firestore Rules, publish the contents of `firestore.rules`.

## 3. Create the first Super Admin (manual one-time setup)
A Super Admin cannot be self-assigned by the normal Google sign-in flow.

1. Register/sign in once using the account that should become Super Admin.
2. In Firebase Console → Authentication → Users, copy that account's **UID**.
3. In Firestore, create a collection named `admin_accounts`.
4. Create a document whose document ID is exactly that UID.
5. Add these fields:
   - `uid` (string): same UID
   - `name` (string): Super Admin display name
   - `email` (string): exact Google email
   - `photoURL` (string): profile photo URL, or empty string
   - `role` (string): `superadmin`
   - `status` (string): `Active`

Then sign out and sign in again. That account will be routed to `/superadmin`.

## 4. Automatic Admin registration
Every account (email/password sign-up or Google) that signs in for the first time and does not already have an `admin_accounts/{uid}` document is automatically given:
- `role: admin`
- `status: Active`

It will then appear in Super Admin → Admin Management. The Super Admin can edit the display name, activate/deactivate, or delete the Firestore admin profile.

**Important:** Deleting an Admin profile here deletes the Firestore authorization/profile document only. It does not delete the person's Google account from Firebase Authentication. If the person signs in again after deletion, the automatic-registration rule will create a new Admin profile again. For permanent blocking, use a server-side Firebase Admin SDK / Cloud Functions process and a separate blocked-user list.

## 5. Important security and product notes
- Automatic Admin registration means anyone who can access the sign-in page and use a Google account can become an Admin. This is exactly the selected behavior. If the portal is intended only for barangay personnel, consider changing to Super Admin approval or domain/email allowlisting before production.
- Firestore rules protect the `superadmin` role from being created or changed by ordinary clients. Do not loosen the rules.
- Do not put Firebase Admin SDK service-account credentials in this frontend project.
- The Residents, Households, Officials, Blotter, Certificates, Announcements, and Reports pages are responsive module shells in this version. Their CRUD forms and Firestore data schemas still need to be implemented according to the barangay's required fields.
- PWA caching stores the app shell/static resources only. Google sign-in and live Firestore data still require an internet connection. Offline data editing/synchronization is not implemented yet.
- Deploy the app over HTTPS for production PWA support.

## 6. Build
```bash
npm run build
npm run preview
```
