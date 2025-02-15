import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA6nTe3sipjXq2xGN7sz8KS71E9aQxpLUg",
  authDomain: "openchat-7d7db.firebaseapp.com",
  databaseURL: "https://openchat-7d7db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "openchat-7d7db",
  storageBucket: "openchat-7d7db.firebasestorage.app",
  messagingSenderId: "552774498436",
  appId: "1:552774498436:web:d467c815439607a93d2ad1",
  measurementId: "G-8YK5RCTGHD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const createUserWithEmailPassword = async (email, password) => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const signInWithEmailPassword = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}; 