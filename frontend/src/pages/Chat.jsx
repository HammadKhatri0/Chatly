import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatWindow from '../components/chat/ChatWindow.jsx';
import { useChat } from '../context/ChatContext.jsx';

/** Keeps the open conversation in sync with the :id route param. */
const Chat = () => {
  const { id } = useParams();
  const { activeId, openConversation } = useChat();

  useEffect(() => {
    if (String(id || '') !== String(activeId || '')) openConversation(id || null);
  }, [id, activeId, openConversation]);

  return <ChatWindow />;
};

export default Chat;
