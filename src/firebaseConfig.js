// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase, ref, push, onValue } from "firebase/database";

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
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const database = getDatabase(app);
