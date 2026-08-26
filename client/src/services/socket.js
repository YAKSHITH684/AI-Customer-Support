import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

export const getSocket = () => {
  if (typeof window === 'undefined') return null;

  if (!socketInstance) {
    socketInstance = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket.IO connected:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('⚠️ Socket.IO disconnected');
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('Socket connection warning:', err.message);
    });
  }

  return socketInstance;
};

export const joinTicketRoom = (ticketId) => {
  const socket = getSocket();
  if (socket && ticketId) {
    socket.emit('join_ticket', ticketId);
  }
};

export const leaveTicketRoom = (ticketId) => {
  const socket = getSocket();
  if (socket && ticketId) {
    socket.emit('leave_ticket', ticketId);
  }
};

export const joinAgentFeedRoom = () => {
  const socket = getSocket();
  if (socket) {
    socket.emit('join_agent_feed');
  }
};

export const joinUserRoom = (userId) => {
  const socket = getSocket();
  if (socket && userId) {
    socket.emit('join_user', userId);
  }
};
