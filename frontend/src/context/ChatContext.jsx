import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { conversationApi, friendApi } from '../api/index.js';
import { useAuth } from './AuthContext.jsx';
import { useSocket, useSocketEvent } from './SocketContext.jsx';

const ChatContext = createContext(null);

/** Chats beyond this many (newest first) are shown in the archive inbox. */
export const INBOX_LIMIT = 10;

const sortByRecency = (list) =>
  [...list].sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [typing, setTyping] = useState({});

  const refreshConversations = useCallback(async () => {
    try {
      const { conversations: list } = await conversationApi.list({ scope: 'all' });
      setConversations(sortByRecency(list));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const refreshFriends = useCallback(async () => {
    const [friendsRes, requestsRes] = await Promise.allSettled([friendApi.list(), friendApi.requests()]);
    if (friendsRes.status === 'fulfilled') setFriends(friendsRes.value.friends);
    if (requestsRes.status === 'fulfilled') {
      setRequests({ incoming: requestsRes.value.incoming, outgoing: requestsRes.value.outgoing });
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setMessages([]);
      setFriends([]);
      setActiveId(null);
      return;
    }
    refreshConversations();
    refreshFriends();
  }, [user?._id, refreshConversations, refreshFriends]);

  const upsertConversation = useCallback((conversation, { unread = 0 } = {}) => {
    setConversations((prev) => {
      const index = prev.findIndex((item) => String(item._id) === String(conversation._id));
      const previous = index >= 0 ? prev[index] : null;
      const merged = {
        ...conversation,
        unreadCount: unread === 'reset' ? 0 : (previous?.unreadCount || 0) + (unread || 0),
      };
      const next = index >= 0 ? prev.map((item, i) => (i === index ? merged : item)) : [merged, ...prev];
      return sortByRecency(next);
    });
  }, []);

  const openConversation = useCallback(
    async (conversationId) => {
      if (!conversationId) {
        setActiveId(null);
        setMessages([]);
        return;
      }
      setActiveId(conversationId);
      setLoadingMessages(true);
      try {
        // Fetching the conversation keeps admins able to open a chat they are not in.
        const [{ conversation }, { messages: list }] = await Promise.all([
          conversationApi.get(conversationId),
          conversationApi.messages(conversationId, { limit: 100 }),
        ]);
        setMessages(list);
        upsertConversation(conversation, { unread: 'reset' });

        const member = conversation.members.some((m) => String(m._id) === String(user?._id));
        if (member) await conversationApi.markRead(conversationId);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoadingMessages(false);
      }
    },
    [upsertConversation, user?._id]
  );

  const sendMessage = useCallback(
    async (conversationId, payload) => {
      const { message } = await conversationApi.sendMessage(conversationId, payload);
      setMessages((prev) =>
        prev.some((item) => item._id === message._id) ? prev : [...prev, message]
      );
      return message;
    },
    []
  );

  const startDirectChat = useCallback(
    async (userId) => {
      const { conversation } = await conversationApi.openDirect(userId);
      upsertConversation(conversation, { unread: 'reset' });
      return conversation;
    },
    [upsertConversation]
  );

  const createGroup = useCallback(
    async (formData) => {
      const { conversation } = await conversationApi.createGroup(formData);
      upsertConversation(conversation, { unread: 'reset' });
      return conversation;
    },
    [upsertConversation]
  );

  const removeConversation = useCallback(
    async (conversationId) => {
      await conversationApi.remove(conversationId);
      setConversations((prev) => prev.filter((item) => String(item._id) !== String(conversationId)));
      setActiveId((current) => (String(current) === String(conversationId) ? null : current));
    },
    []
  );

  // --- realtime ---------------------------------------------------------
  useSocketEvent('message:new', ({ message, conversation }) => {
    const isActive = String(conversation._id) === String(activeId);
    const fromMe = String(message.sender?._id || message.sender) === String(user?._id);

    if (isActive) {
      setMessages((prev) => (prev.some((item) => item._id === message._id) ? prev : [...prev, message]));
      if (!fromMe) conversationApi.markRead(conversation._id).catch(() => null);
    }
    upsertConversation(conversation, { unread: isActive || fromMe ? 'reset' : 1 });
  });

  useSocketEvent('conversation:new', ({ conversation }) => {
    upsertConversation(conversation, { unread: 'reset' });
  });

  useSocketEvent('conversation:updated', (payload) => {
    if (payload.deleted) {
      setConversations((prev) => prev.filter((item) => String(item._id) !== String(payload.conversationId)));
      setActiveId((current) => (String(current) === String(payload.conversationId) ? null : current));
      return;
    }
    if (payload.deletedMessageId) {
      setMessages((prev) => prev.filter((item) => String(item._id) !== String(payload.deletedMessageId)));
      return;
    }
    if (payload.conversation) upsertConversation(payload.conversation);
  });

  useSocketEvent('friend:request', () => {
    refreshFriends();
    toast('New friend request', { icon: '👋' });
  });

  useSocketEvent('friend:update', () => {
    refreshFriends();
    refreshConversations();
  });

  useSocketEvent('presence', ({ userId, isOnline }) => {
    setFriends((prev) =>
      prev.map((friend) => (String(friend._id) === String(userId) ? { ...friend, isOnline } : friend))
    );
    setConversations((prev) =>
      prev.map((conversation) => ({
        ...conversation,
        members: conversation.members.map((member) =>
          String(member._id) === String(userId) ? { ...member, isOnline } : member
        ),
      }))
    );
  });

  useSocketEvent('typing', ({ conversationId, userId, isTyping }) => {
    setTyping((prev) => ({ ...prev, [conversationId]: isTyping ? userId : null }));
  });

  const emitTyping = useCallback(
    (conversation, isTyping) => {
      socket?.emit('typing', {
        conversationId: conversation._id,
        members: conversation.members.map((member) => member._id),
        isTyping,
      });
    },
    [socket]
  );

  const value = useMemo(() => {
    const recent = conversations.slice(0, INBOX_LIMIT);
    const archived = conversations.slice(INBOX_LIMIT);
    return {
      conversations,
      recent,
      archived,
      loadingConversations,
      activeConversation: conversations.find((item) => String(item._id) === String(activeId)) || null,
      activeId,
      messages,
      loadingMessages,
      friends,
      requests,
      typing,
      totalUnread: conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0),
      archivedUnread: archived.reduce((sum, item) => sum + (item.unreadCount || 0), 0),
      openConversation,
      sendMessage,
      startDirectChat,
      createGroup,
      removeConversation,
      refreshConversations,
      refreshFriends,
      upsertConversation,
      emitTyping,
      setMessages,
    };
  }, [
    conversations,
    loadingConversations,
    activeId,
    messages,
    loadingMessages,
    friends,
    requests,
    typing,
    openConversation,
    sendMessage,
    startDirectChat,
    createGroup,
    removeConversation,
    refreshConversations,
    refreshFriends,
    upsertConversation,
    emitTyping,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used inside ChatProvider');
  return context;
};
