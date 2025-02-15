import React, { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider, database } from "./firebaseConfig";
import { ref, push, onValue } from "firebase/database";

function App() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // Sign in with Google
  const login = async () => {
    const result = await signInWithPopup(auth, provider);
    setUser(result.user);
  };

  // Logout
  const logout = () => {
    signOut(auth);
    setUser(null);
  };

  // Send Message
  const sendMessage = () => {
    if (message.trim()) {
      push(ref(database, "messages"), {
        text: message,
        sender: user.displayName,
        timestamp: Date.now(),
      });
      setMessage("");
    }
  };

  // Fetch Messages
  useEffect(() => {
    const messagesRef = ref(database, "messages");
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      setMessages(data ? Object.values(data) : []);
    });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      {!user ? (
        <button onClick={login}>Login with Google</button>
      ) : (
        <>
          <button onClick={logout}>Logout</button>
          <h3>Welcome, {user.displayName}</h3>
          <div>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
          <div>
            {messages.map((msg, index) => (
              <p key={index}>
                <strong>{msg.sender}:</strong> {msg.text}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
