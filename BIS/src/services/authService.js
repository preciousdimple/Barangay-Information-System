import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/firebase.js';

/**
 * While a new email/password account is being registered, Firebase fires
 * onAuthStateChanged immediately after the user is created -- before the
 * display name is saved and before the Firestore profile exists.
 * AuthContext awaits this gate so the profile is created exactly once,
 * with the correct name.
 */
export const registrationGate = { promise: null };

/** Reads admin_accounts/{uid}; creates an ordinary Admin profile if missing. */
export async function ensureAccountProfile(firebaseUser, fallbackName) {
  const ref = doc(db, 'admin_accounts', firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();

  await setDoc(ref, {
    uid: firebaseUser.uid,
    name: fallbackName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New Admin',
    email: firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || '',
    role: 'admin',
    status: 'Active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  // Re-read so the caller gets real timestamps instead of FieldValue sentinels.
  return (await getDoc(ref)).data();
}

export function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function registerWithEmail({ name, email, password }) {
  let release;
  registrationGate.promise = new Promise((resolve) => { release = resolve; });
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: name.trim() });
    await ensureAccountProfile(cred.user, name.trim());
    sendEmailVerification(cred.user).catch(() => {}); // best effort
    return cred.user;
  } finally {
    registrationGate.promise = null;
    release();
  }
}

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function sendResetEmail(email) {
  return sendPasswordResetEmail(auth, email.trim());
}

export function logout() {
  return signOut(auth);
}

/** Turns Firebase error codes into readable messages. Returns '' for silent cases. */
export function friendlyAuthError(err) {
  const code = err?.code || '';
  const map = {
    'auth/invalid-email': 'The email address is not valid.',
    'auth/missing-email': 'Please enter your email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact the Super Admin.',
    'auth/user-not-found': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/invalid-login-credentials': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
    'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/network-request-failed': 'Network error. Check your internet connection and try again.',
    'auth/popup-blocked': 'The sign-in popup was blocked. Allow popups for this site and try again.',
    'auth/unauthorized-domain': 'This domain is not authorized in Firebase (Authentication → Settings → Authorized domains).',
    'auth/configuration-not-found': 'Firebase Authentication is not set up yet. In the Firebase Console open Authentication, click "Get started", then enable the Email/Password and Google sign-in methods.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled in the Firebase Console (Authentication → Sign-in method).',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
    'permission-denied': 'Permission denied by Firestore. Make sure the latest firestore.rules are published.',
    'auth/popup-closed-by-user': '',
    'auth/cancelled-popup-request': ''
  };
  if (code in map) return map[code];
  return err?.message || 'Something went wrong. Please try again.';
}
