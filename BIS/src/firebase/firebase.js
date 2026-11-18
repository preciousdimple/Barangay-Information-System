import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration supplied for barangay-information-sys-e0159.
const firebaseConfig = {
  apiKey: "AIzaSyCkIRCuMOUgOSK3iyyg1CssPm8gD82NDtc",
  authDomain: "barangay-information-sys-e0159.firebaseapp.com",
  projectId: "barangay-information-sys-e0159",
  storageBucket: "barangay-information-sys-e0159.firebasestorage.app",
  messagingSenderId: "464819381352",
  appId: "1:464819381352:web:2b12523b045c8113a747dd",
  measurementId: "G-QX92XBWW2F"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  }).catch(() => {});
}

export default app;
