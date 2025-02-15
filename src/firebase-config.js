import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { getDatabase, ref, onValue, set, push, serverTimestamp } from 'firebase/database';

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

const database = getDatabase(app);

// Update user status
export const updateUserStatus = (userId, isOnline) => {
  const userStatusRef = ref(database, `users/${userId}`);
  set(userStatusRef, {
    email: auth.currentUser.email,
    online: isOnline,
    lastSeen: serverTimestamp()
  });
};

// Get all users
export const subscribeToUsers = (callback) => {
  const usersRef = ref(database, 'users');
  return onValue(usersRef, (snapshot) => {
    const users = snapshot.val() || {};
    callback(users);
  });
};

// Send private message
export const sendPrivateMessage = async (senderId, receiverId, message) => {
  const chatId = [senderId, receiverId].sort().join('_');
  const messagesRef = ref(database, `private_messages/${chatId}`);
  await push(messagesRef, {
    senderId,
    message,
    timestamp: serverTimestamp()
  });
};

// Subscribe to private messages
export const subscribeToPrivateMessages = (senderId, receiverId, callback) => {
  const chatId = [senderId, receiverId].sort().join('_');
  const messagesRef = ref(database, `private_messages/${chatId}`);
  return onValue(messagesRef, (snapshot) => {
    const messages = snapshot.val() || {};
    callback(messages);
  });
};

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