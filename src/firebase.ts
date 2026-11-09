import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Web app's Firebase configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyDxDJaAwBq_WVWeSrhiNXMM9S1rQqLtuaA",
  authDomain: "gen-lang-client-0421408721.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0421408721-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gen-lang-client-0421408721",
  storageBucket: "gen-lang-client-0421408721.firebasestorage.app",
  messagingSenderId: "323750725817",
  appId: "1:323750725817:android:593699b2c5d6420514f368"
};

// Initialize Firebase once
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
