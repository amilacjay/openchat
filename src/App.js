import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { signInWithGoogle, auth, signInWithEmailPassword, createUserWithEmailPassword, signOut, updateUserStatus, subscribeToUsers, sendPrivateMessage, subscribeToPrivateMessages } from "./firebase-config";
import { onAuthStateChanged } from "firebase/auth";

const App = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  

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
          <h1>Simple Chat</h1>
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
            <button type="submit">
              {isLogin ? "Login" : "Sign Up"}
            </button>
          </AuthForm>
          <ToggleText onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
          </ToggleText>
          <GoogleButton onClick={signInWithGoogle}>
            Continue with Google
          </GoogleButton>
        </AuthBox>
      </AuthContainer>
    );
  }

  return (
    <Container>
      <AppWrapper>
        <Sidebar>
          <SidebarHeader>
            <AppTitle>Simple Chat</AppTitle>
            <MenuButton>☰</MenuButton>
          </SidebarHeader>
          
          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Search chats..."
            />
          </SearchContainer>

          <ChatList>
            {Object.entries(users)
              .filter(([uid]) => uid !== user.uid)
              .map(([uid, userData]) => (
                <ChatItem
                  key={uid}
                  onClick={() => setSelectedUser({ uid, ...userData })}
                  active={selectedUser?.uid === uid}
                >
                  <Avatar online={userData.online}>
                    {userData.email[0].toUpperCase()}
                  </Avatar>
                  <ChatInfo>
                    <ChatName>{userData.email}</ChatName>
                    <LastMessage>Click to start chatting</LastMessage>
                  </ChatInfo>
                </ChatItem>
              ))}
          </ChatList>
        </Sidebar>

        <ChatArea>
          {selectedUser ? (
            <>
              <ChatHeader>
                <HeaderLeft>
                  <Avatar online={selectedUser.online}>
                    {selectedUser.email[0].toUpperCase()}
                  </Avatar>
                  <div>
                    <HeaderName>{selectedUser.email}</HeaderName>
                    <HeaderStatus>{selectedUser.online ? 'Online' : 'Offline'}</HeaderStatus>
                  </div>
                </HeaderLeft>
                <HeaderActions>
                  <ActionButton>📞</ActionButton>
                  <ActionButton>📹</ActionButton>
                </HeaderActions>
              </ChatHeader>

              <MessageArea>
                {messages.map((message, index) => {
                  const isOwn = message.senderId === user.uid;
                  return (
                    <MessageWrapper key={index} isOwn={isOwn}>
                      {!isOwn && (
                        <Avatar small online={selectedUser.online}>
                          {selectedUser.email[0].toUpperCase()}
                        </Avatar>
                      )}
                      <MessageContent isOwn={isOwn}>
                        <MessageText>{message.message}</MessageText>
                        <MessageTime>
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </MessageTime>
                      </MessageContent>
                      {isOwn && (
                        <Avatar small>
                          {user.email[0].toUpperCase()}
                        </Avatar>
                      )}
                    </MessageWrapper>
                  );
                })}
              </MessageArea>

              <MessageForm onSubmit={handleSendMessage}>
                <MessageInput
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type something..."
                />
                <SendButton type="submit">Send</SendButton>
              </MessageForm>
            </>
          ) : (
            <EmptyState>Select a chat to start messaging</EmptyState>
          )}
        </ChatArea>
      </AppWrapper>
    </Container>
  );
};

// Styled Components with Frosted Glass Theme
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #ef4444 100%);
  padding: 1.5rem;
`;

const AppWrapper = styled.div`
  max-width: 1200px;
  height: calc(100vh - 3rem);
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const Sidebar = styled.div`
  width: 320px;
  background: rgba(255, 255, 255, 0.05);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
`;

const AppTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
`;

const SearchContainer = styled.div`
  padding: 1rem;
  backdrop-filter: blur(10px);
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.15);
  }
`;

const ChatList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ChatItem = styled.div`
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  transition: background-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Avatar = styled.div`
  width: ${props => props.small ? '2rem' : '2.5rem'};
  height: ${props => props.small ? '2rem' : '2.5rem'};
  background: linear-gradient(135deg, #9f7aea 0%, #e879f9 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  position: relative;

  ${props => props.online && `
    &:after {
      content: '';
      position: absolute;
      bottom: 0;
      right: 0;
      width: 0.625rem;
      height: 0.625rem;
      background-color: #10B981;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
    }
  `}
`;

const ChatInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChatName = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const LastMessage = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ChatHeader = styled.div`
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HeaderName = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
`;

const HeaderStatus = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MessageArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  ${props => props.isOwn && 'flex-direction: row-reverse;'}
`;

const MessageContent = styled.div`
  max-width: 70%;
  background: ${props => props.isOwn ? 'rgba(124, 58, 237, 0.9)' : 'rgba(255, 255, 255, 0.1)'};
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  ${props => props.isOwn ? 'border-bottom-right-radius: 0.25rem;' : 'border-bottom-left-radius: 0.25rem;'}
`;

const MessageText = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const MessageTime = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
`;

const MessageForm = styled.form`
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
`;

const MessageInput = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 1.5rem;
  padding: 0.75rem 1.25rem;
  color: white;
  font-size: 0.875rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SendButton = styled.button`
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
  border: none;
  border-radius: 1.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
`;

const AuthContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #ef4444 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

const AuthBox = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  padding: 2rem;
  border-radius: 1rem;
  width: 100%;
  max-width: 400px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);

  h1 {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1.5rem;
    margin-bottom: 2rem;
  }
`;

const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;

  input {
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 0.5rem;
    color: white;
    font-size: 0.875rem;

    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    &:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.15);
    }
  }

  button {
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.9;
    }
  }
`;

const ToggleText = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  cursor: pointer;
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;

  &:hover {
    color: rgba(255, 255, 255, 0.9);
  }
`;

const GoogleButton = styled.button`
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export default App;