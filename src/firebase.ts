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
  appId: "1:709841479173:web:a28ea471b4db065e6a5e6c",
  firestoreDatabaseId: "ai-studio-59ef631a-9e74-4b2b-945c-dc4329fff494"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
