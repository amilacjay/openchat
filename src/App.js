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
      <Sidebar>
        <Logo>CONVO</Logo>
        <SearchBar>
          <SearchInput placeholder="Search user or chat" />
        </SearchBar>
        <UsersList>
          {Object.entries(users)
            .filter(([uid]) => uid !== user.uid)
            .map(([uid, userData]) => (
              <UserItem
                key={uid}
                onClick={() => setSelectedUser({ uid, ...userData })}
                isSelected={selectedUser?.uid === uid}
              >
                <UserAvatar online={userData.online}>
                  {userData.email[0].toUpperCase()}
                </UserAvatar>
                <UserInfo>
                  <UserName>{userData.email}</UserName>
                  <LastMessage>
                    {userData.online ? 'Online' : 'Offline'}
                  </LastMessage>
                </UserInfo>
              </UserItem>
            ))}
        </UsersList>
      </Sidebar>

      {selectedUser ? (
        <ChatContainer>
          <ChatHeader>
            <ChatTitle>
              <UserAvatar online={selectedUser.online}>
                {selectedUser.email[0].toUpperCase()}
              </UserAvatar>
              <h2>{selectedUser.email}</h2>
            </ChatTitle>
            <HeaderActions>
              <IconButton>📞</IconButton>
              <IconButton>⚙️</IconButton>
            </HeaderActions>
          </ChatHeader>
          
          <MessageList>
            {messages.map((message, index) => (
              <MessageItem
                key={index}
                isOwnMessage={message.senderId === user.uid}
              >
                <MessageContent isOwnMessage={message.senderId === user.uid}>
                  <MessageText>{message.message}</MessageText>
                  <MessageTime isOwnMessage={message.senderId === user.uid}>
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
              placeholder="Type a message..."
            />
            <SendButton type="submit">Send</SendButton>
          </MessageForm>
        </ChatContainer>
      ) : (
        <ChatContainer>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#8E8E8E' 
          }}>
            Select a user to start chatting
          </div>
        </ChatContainer>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  height: 100vh;
  display: flex;
  background-color: #1E1F24;
  color: #FFFFFF;
`;

const Sidebar = styled.div`
  width: 280px;
  background-color: #1A1B1F;
  border-right: 1px solid #2D2E34;
  display: flex;
  flex-direction: column;
`;

const Logo = styled.div`
  padding: 20px;
  font-size: 24px;
  font-weight: bold;
  color: #FFFFFF;
  border-bottom: 1px solid #2D2E34;
`;

const SearchBar = styled.div`
  padding: 12px;
  border-bottom: 1px solid #2D2E34;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  background-color: #2D2E34;
  border: none;
  border-radius: 6px;
  color: #FFFFFF;
  font-size: 14px;
  
  &::placeholder {
    color: #8E8E8E;
  }
  
  &:focus {
    outline: none;
    background-color: #363840;
  }
`;

const UsersList = styled.div`
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #2D2E34;
    border-radius: 3px;
  }
`;

const UserItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${props => props.isSelected ? '#2D2E34' : 'transparent'};
  
  &:hover {
    background-color: #2D2E34;
  }
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.online ? '#4CAF50' : '#757575'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-size: 14px;
  color: #FFFFFF;
  margin-bottom: 4px;
`;

const LastMessage = styled.div`
  font-size: 12px;
  color: #8E8E8E;
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #1E1F24;
`;

const ChatHeader = styled.div`
  padding: 16px;
  background-color: #1A1B1F;
  border-bottom: 1px solid #2D2E34;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChatTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  h2 {
    font-size: 16px;
    font-weight: 500;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 16px;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #8E8E8E;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  
  &:hover {
    background-color: #2D2E34;
  }
`;

const MessageList = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #2D2E34;
    border-radius: 3px;
  }
`;

const MessageItem = styled.div`
  display: flex;
  justify-content: ${props => props.isOwnMessage ? 'flex-end' : 'flex-start'};
`;

const MessageContent = styled.div`
  background-color: ${props => props.isOwnMessage ? '#2196F3' : '#2D2E34'};
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 70%;
`;

const MessageText = styled.div`
  font-size: 14px;
  color: #FFFFFF;
`;

const MessageTime = styled.div`
  font-size: 12px;
  color: ${props => props.isOwnMessage ? 'rgba(255, 255, 255, 0.7)' : '#8E8E8E'};
  margin-top: 4px;
`;

const MessageForm = styled.form`
  padding: 16px;
  background-color: #1A1B1F;
  border-top: 1px solid #2D2E34;
  display: flex;
  gap: 12px;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  background-color: #2D2E34;
  border: none;
  border-radius: 8px;
  color: #FFFFFF;
  font-size: 14px;
  
  &::placeholder {
    color: #8E8E8E;
  }
  
  &:focus {
    outline: none;
    background-color: #363840;
  }
`;

const SendButton = styled.button`
  padding: 12px 24px;
  background-color: #2196F3;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  
  &:hover {
    background-color: #1976D2;
  }
`;

const AuthContainer = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1E1F24;
`;

const AuthBox = styled.div`
  background-color: #1A1B1F;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  text-align: center;
  color: #FFFFFF;
  
  h1 {
    margin-bottom: 2rem;
  }
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

export default App;
