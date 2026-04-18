import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBc0IgbcidVRV_zYeva8NHIBELOlKn7f5E",
  authDomain: "gen-lang-client-0489374911.firebaseapp.com",
  projectId: "gen-lang-client-0489374911",
  storageBucket: "gen-lang-client-0489374911.firebasestorage.app",
  messagingSenderId: "709841479173",
  appId: "1:709841479173:web:a28ea471b4db065e6a5e6c"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
