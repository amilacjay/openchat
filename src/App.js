import React, { useState, useEffect } from "react";
import { signInWithGoogle, auth, signInWithEmailPassword, createUserWithEmailPassword, signOut, updateUserStatus, subscribeToUsers, sendPrivateMessage, subscribeToPrivateMessages } from "./firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import styled from "styled-components";

const App = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        updateUserStatus(user.uid, true);
        // Set offline status when user closes tab/window
        window.addEventListener('beforeunload', () => {
          updateUserStatus(user.uid, false);
        });
      } else {
        setUser(null);
        setSelectedUser(null);
      }
    });

    return () => {
      unsubscribe();
      if (user) {
        updateUserStatus(user.uid, false);
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToUsers((users) => {
      setUsers(users);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && selectedUser) {
      const unsubscribe = subscribeToPrivateMessages(
        user.uid,
        selectedUser.uid,
        (messages) => {
          setMessages(Object.values(messages || {}));
        }
      );
      return () => unsubscribe();
    }
  }, [user, selectedUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    await sendPrivateMessage(user.uid, selectedUser.uid, newMessage);
    setNewMessage("");
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailPassword(email, password);
      } else {
        await createUserWithEmailPassword(email, password);
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert(error.message);
    }
  };

  if (!user) {
    return (
      <AuthContainer>
        <AuthBox>
          <h1>Welcome to ChatApp</h1>
          <AuthForm onSubmit={handleAuth}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <AuthButton type="submit">
              {isLogin ? "Login" : "Sign Up"}
            </AuthButton>
          </AuthForm>
          <ToggleAuth onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
          </ToggleAuth>
          <GoogleButton onClick={signInWithGoogle}>
            Continue with Google
          </GoogleButton>
        </AuthBox>
      </AuthContainer>
    );
  }

  return (
    <Container>
      <Header>
        <h1>ChatApp</h1>
        <UserInfo>
          <span>{user.email}</span>
          <LogoutButton onClick={signOut}>Logout</LogoutButton>
        </UserInfo>
      </Header>
      <ChatLayout>
        <UsersList>
          <UsersHeader>Online Users</UsersHeader>
          {Object.entries(users)
            .filter(([uid]) => uid !== user.uid)
            .map(([uid, userData]) => (
              <UserItem
                key={uid}
                onClick={() => setSelectedUser({ uid, ...userData })}
                isSelected={selectedUser?.uid === uid}
                isOnline={userData.online}
              >
                <UserEmail>{userData.email}</UserEmail>
                <UserStatus isOnline={userData.online}>
                  {userData.online ? "Online" : "Offline"}
                </UserStatus>
              </UserItem>
            ))}
        </UsersList>
        
        {selectedUser ? (
          <ChatContainer>
            <ChatHeader>
              <span>{selectedUser.email}</span>
              <UserStatus isOnline={selectedUser.online}>
                {selectedUser.online ? "Online" : "Offline"}
              </UserStatus>
            </ChatHeader>
            <MessageList>
              {messages.map((message, index) => (
                <MessageItem
                  key={index}
                  isOwnMessage={message.senderId === user.uid}
                >
                  <MessageContent isOwnMessage={message.senderId === user.uid}>
                    <MessageText>{message.message}</MessageText>
                    <MessageTime>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </MessageTime>
                  </MessageContent>
                </MessageItem>
              ))}
            </MessageList>
            <MessageForm onSubmit={handleSendMessage}>
              <MessageInput
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message ${selectedUser.email}...`}
              />
              <SendButton type="submit">Send</SendButton>
            </MessageForm>
          </ChatContainer>
        ) : (
          <SelectUserPrompt>
            Select a user to start chatting
          </SelectUserPrompt>
        )}
      </ChatLayout>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
`;

const Header = styled.header`
  background-color: #2196f3;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LogoutButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #1976d2;
  color: white;
  cursor: pointer;
  
  &:hover {
    background-color: #1565c0;
  }
`;

const ChatLayout = styled.div`
  display: flex;
  flex: 1;
  gap: 1rem;
  padding: 1rem;
  height: calc(100vh - 64px);
`;

const UsersList = styled.div`
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
`;

const UsersHeader = styled.div`
  padding: 1rem;
  font-weight: bold;
  border-bottom: 1px solid #eee;
`;

const UserItem = styled.div`
  padding: 1rem;
  cursor: pointer;
  background: ${props => props.isSelected ? '#f0f7ff' : 'white'};
  border-left: 4px solid ${props => props.isSelected ? '#2196f3' : 'transparent'};
  
  &:hover {
    background: #f5f5f5;
  }
`;

const UserEmail = styled.div`
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
`;

const UserStatus = styled.div`
  font-size: 0.8rem;
  color: ${props => props.isOnline ? '#4caf50' : '#757575'};
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const ChatHeader = styled.div`
  padding: 1rem;
  background: white;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageItem = styled.div`
  display: flex;
  justify-content: ${props => props.isOwnMessage ? "flex-end" : "flex-start"};
`;

const MessageContent = styled.div`
  background-color: ${props => props.isOwnMessage ? "#2196f3" : "white"};
  color: ${props => props.isOwnMessage ? "white" : "black"};
  padding: 0.8rem;
  border-radius: 12px;
  max-width: 70%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const MessageText = styled.div`
  word-break: break-word;
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  margin-top: 0.3rem;
  opacity: 0.7;
  text-align: right;
`;

const MessageForm = styled.form`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

const SendButton = styled.button`
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  background-color: #2196f3;
  color: white;
  cursor: pointer;
  
  &:hover {
    background-color: #1976d2;
  }
`;

const AuthContainer = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
`;

const AuthBox = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.5rem 0;
  
  input {
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: #2196f3;
    }
  }
`;

const AuthButton = styled.button`
  padding: 0.8rem;
  border: none;
  border-radius: 4px;
  background-color: #2196f3;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  
  &:hover {
    background-color: #1976d2;
  }
`;

const GoogleButton = styled.button`
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  color: #757575;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  margin-top: 1rem;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const ToggleAuth = styled.button`
  background: none;
  border: none;
  color: #2196f3;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const SelectUserPrompt = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #757575;
`;

export default App;
