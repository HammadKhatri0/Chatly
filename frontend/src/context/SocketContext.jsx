import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL, getToken } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext({ socket: null, connected: false });

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      setConnected(false);
      return undefined;
    }

    const instance = io(API_URL, {
      auth: { token: getToken() },
      transports: ['websocket', 'polling'],
    });
    instance.on('connect', () => setConnected(true));
    instance.on('disconnect', () => setConnected(false));
    setSocket(instance);

    return () => {
      instance.removeAllListeners();
      instance.disconnect();
    };
  }, [user?._id]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);

/** Subscribes to a socket event for the lifetime of the calling component. */
export const useSocketEvent = (event, handler) => {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return undefined;
    const listener = (...args) => handlerRef.current?.(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [socket, event]);
};
