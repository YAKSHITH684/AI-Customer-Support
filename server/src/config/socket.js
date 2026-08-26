const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer, clientUrl) => {
  const allowedOrigins = (clientUrl || 'http://localhost:3000')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // In development or when requested from local host variations
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Socket client connected: ${socket.id}`);

    // Join ticket-specific room
    socket.on('join_ticket', (ticketId) => {
      if (ticketId) {
        socket.join(`ticket:${ticketId}`);
        console.log(`⚡ Socket ${socket.id} joined room ticket:${ticketId}`);
      }
    });

    socket.on('leave_ticket', (ticketId) => {
      if (ticketId) {
        socket.leave(`ticket:${ticketId}`);
      }
    });

    // Join global agent feed
    socket.on('join_agent_feed', () => {
      socket.join('agent_feed');
      console.log(`⚡ Socket ${socket.id} joined agent_feed room`);
    });

    // Join user notifications room
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    // Real-time Chatbot Session Handlers
    socket.on('join_chat', (sessionId) => {
      if (sessionId) {
        socket.join(`chat:${sessionId}`);
        console.log(`💬 Socket ${socket.id} joined live chat session: ${sessionId}`);
      }
    });

    socket.on('send_chat_message', async ({ sessionId, message, history = [], userId }) => {
      if (!sessionId || !message) return;

      try {
        const { retrieveChatContext, streamGroqChat } = require('../services/chatService');
        
        // 1. Emit typing status
        socket.emit('chat_typing', { sessionId, isTyping: true });
        
        // 2. Perform RAG vector search
        const context = await retrieveChatContext(message);
        
        // 3. Emit matched citations immediately
        socket.emit('chat_context', {
          sessionId,
          sources: context.map(c => ({
            title: c.documentTitle,
            section: c.section,
            relevance: Math.round(c.relevanceScore * 100)
          }))
        });

        // 4. Stream Groq tokens in real-time
        let fullResponse = '';
        socket.emit('chat_start', { sessionId });

        await streamGroqChat({
          message,
          history,
          retrievedContext: context,
          onChunk: (token) => {
            fullResponse += token;
            socket.emit('chat_token', { sessionId, token });
          },
          onComplete: (completedText) => {
            socket.emit('chat_typing', { sessionId, isTyping: false });
            socket.emit('chat_complete', {
              sessionId,
              fullText: completedText || fullResponse,
              provider: 'groq'
            });
          }
        });

      } catch (chatError) {
        console.error('Socket chat message error:', chatError);
        socket.emit('chat_typing', { sessionId, isTyping: false });
        socket.emit('chat_error', {
          sessionId,
          error: 'Unable to generate real-time AI response. Please try again.'
        });
      }
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    // Return dummy broadcaster if not initialized yet (to prevent crashes during startup or test runs)
    return {
      to: () => ({ emit: () => {} }),
      emit: () => {}
    };
  }
  return io;
};

const emitAgentEvent = (ticketId, eventPayload) => {
  const socketIO = getIO();
  // Emit to ticket room and global agent feed
  socketIO.to(`ticket:${ticketId}`).emit('agent_event', eventPayload);
  socketIO.to('agent_feed').emit('agent_event', eventPayload);
};

const emitResolutionUpdate = (ticketId, resolution) => {
  const socketIO = getIO();
  socketIO.to(`ticket:${ticketId}`).emit('resolution_updated', resolution);
  socketIO.to('agent_feed').emit('resolution_updated', resolution);
};

const emitTicketUpdate = (ticket) => {
  const socketIO = getIO();
  socketIO.to(`ticket:${ticket._id || ticket.id}`).emit('ticket_updated', ticket);
  socketIO.to('agent_feed').emit('ticket_updated', ticket);
};

const emitNotification = (userId, notification) => {
  const socketIO = getIO();
  socketIO.to(`user:${userId}`).emit('notification', notification);
  socketIO.to('agent_feed').emit('notification', notification);
};

module.exports = {
  initSocket,
  getIO,
  emitAgentEvent,
  emitResolutionUpdate,
  emitTicketUpdate,
  emitNotification
};
