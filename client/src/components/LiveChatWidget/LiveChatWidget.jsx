import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Zap,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Minimize2,
  Maximize2,
  HelpCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function LiveChatWidget() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! 👋 I'm **ResolveFlow AI**, your 24/7 intelligent assistant powered by **Groq Cloud** and semantic knowledge retrieval. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStreamId, setCurrentStreamId] = useState(null);
  const [latestSources, setLatestSources] = useState([]);
  const [expandedSources, setExpandedSources] = useState({});
  const [sessionId, setSessionId] = useState('');
  const [escalating, setEscalating] = useState(false);
  const [escalatedTicket, setEscalatedTicket] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize session ID
  useEffect(() => {
    const sid = 'chat_' + Math.random().toString(36).substring(2, 9);
    setSessionId(sid);
  }, []);

  // Connect Socket.IO listeners for real-time streaming
  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join_chat', sessionId);

    const onTyping = (data) => {
      if (data.sessionId === sessionId) {
        setIsTyping(data.isTyping);
      }
    };

    const onContext = (data) => {
      if (data.sessionId === sessionId && data.sources) {
        setLatestSources(data.sources);
      }
    };

    const onToken = (data) => {
      if (data.sessionId === sessionId) {
        setIsTyping(false);
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, content: lastMsg.content + data.token }
            ];
          } else {
            return [
              ...prev,
              {
                id: 'stream_' + Date.now(),
                role: 'assistant',
                content: data.token,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isStreaming: true,
                sources: latestSources
              }
            ];
          }
        });
      }
    };

    const onComplete = (data) => {
      if (data.sessionId === sessionId) {
        setIsTyping(false);
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMsg,
                content: data.fullText || lastMsg.content,
                isStreaming: false,
                sources: latestSources
              }
            ];
          }
          return prev;
        });
      }
    };

    const onError = (data) => {
      if (data.sessionId === sessionId) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'err_' + Date.now(),
            role: 'assistant',
            content: `⚠️ ${data.error || 'Sorry, I encountered an issue connecting to Groq. Please try again.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    };

    socket.on('chat_typing', onTyping);
    socket.on('chat_context', onContext);
    socket.on('chat_token', onToken);
    socket.on('chat_complete', onComplete);
    socket.on('chat_error', onError);

    return () => {
      socket.off('chat_typing', onTyping);
      socket.off('chat_context', onContext);
      socket.off('chat_token', onToken);
      socket.off('chat_complete', onComplete);
      socket.off('chat_error', onError);
    };
  }, [sessionId, latestSources]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (customText) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isTyping) return;

    const userMsg = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputMessage('');
    setIsTyping(true);
    setLatestSources([]);

    const socket = getSocket();

    // Prefer real-time WebSocket connection
    if (socket && socket.connected) {
      socket.emit('send_chat_message', {
        sessionId,
        message: textToSend.trim(),
        history: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
        userId: user?.id
      });
    } else {
      // Fallback: REST API
      try {
        const res = await api.post('/chat/message', {
          message: textToSend.trim(),
          history: updatedHistory.map((m) => ({ role: m.role, content: m.content }))
        });

        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_' + Date.now(),
            role: 'assistant',
            content: res.data.response,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sources: res.data.sources || [],
            confidence: res.data.confidence
          }
        ]);
      } catch (err) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'err_' + Date.now(),
            role: 'assistant',
            content: "I'm having trouble reaching the knowledge engine right now. Please try again or create a support ticket.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEscalateToTicket = async () => {
    setEscalating(true);
    try {
      const res = await api.post('/chat/escalate', {
        customerEmail: user?.email || 'guest@resolveflow.ai',
        customerName: user?.name || 'Live Chat Visitor',
        title: `Chat Escalation: ${messages.find((m) => m.role === 'user')?.content?.slice(0, 45) || 'Inquiry'}...`,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        priority: 'high'
      });

      setEscalatedTicket(res.data.ticket);
      setMessages((prev) => [
        ...prev,
        {
          id: 'escalated_' + Date.now(),
          role: 'assistant',
          content: `✅ **Ticket #${res.data.ticket?.ticketNumber || 'Created'}** has been assigned to our human support queue. A representative will follow up with you directly.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      alert('Unable to escalate to ticket automatically. Please use the tickets desk.');
    } finally {
      setEscalating(false);
    }
  };

  const clearChat = () => {
    const sid = 'chat_' + Math.random().toString(36).substring(2, 9);
    setSessionId(sid);
    setEscalatedTicket(null);
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        content: "Chat cleared! How else can I assist you today with **ResolveFlow AI**?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: []
      }
    ]);
  };

  const quickPrompts = [
    'How do I reset my password?',
    'What is your refund policy?',
    'How do I track my package?',
    'What are the API rate limits?'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-full shadow-2xl hover:shadow-brand-500/40 transform hover:-translate-y-0.5 transition-all duration-300 border border-brand-400/30"
          aria-label="Open AI Live Chat"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-brand-700 rounded-full animate-pulse"></span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-200 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-300 animate-pulse" />
              Groq Real-Time AI
            </div>
            <div className="text-sm font-bold">Ask AI Support</div>
          </div>
          <span className="sm:hidden font-semibold text-sm">Chat</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className={`bg-dark-card border border-dark-border rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
            isMinimized
              ? 'w-80 h-16'
              : 'w-[92vw] sm:w-[420px] h-[600px] max-h-[85vh]'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15)'
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-dark-surface via-brand-950/40 to-dark-surface p-4 border-b border-dark-border flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 border border-brand-400/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white">ResolveFlow AI</h3>
                  <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  Groq 120B • Vector RAG
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Restart chat"
                className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-dark-surface rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-dark-surface rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-dark-surface rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar bg-dark-bg/60">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-end gap-2 max-w-[88%]">
                        {!isUser && (
                          <div className="w-6 h-6 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center shrink-0 mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                          </div>
                        )}
                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isUser
                              ? 'bg-gradient-to-br from-brand-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-brand-600/20'
                              : 'bg-dark-surface border border-dark-border text-gray-200 rounded-bl-none shadow-sm'
                          }`}
                        >
                          <div className="whitespace-pre-wrap font-normal">
                            {msg.content}
                            {msg.isStreaming && (
                              <span className="inline-block w-1.5 h-3.5 ml-1 bg-brand-400 animate-pulse"></span>
                            )}
                          </div>

                          {/* Sources Accordion */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-dark-border/60">
                              <button
                                onClick={() =>
                                  setExpandedSources((prev) => ({
                                    ...prev,
                                    [msg.id]: !prev[msg.id]
                                  }))
                                }
                                className="text-[11px] text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
                              >
                                <BookOpen className="w-3 h-3" />
                                {msg.sources.length} Cited {msg.sources.length === 1 ? 'Source' : 'Sources'}
                                {expandedSources[msg.id] ? (
                                  <ChevronUp className="w-3 h-3 ml-0.5" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 ml-0.5" />
                                )}
                              </button>

                              {expandedSources[msg.id] && (
                                <div className="mt-1.5 space-y-1">
                                  {msg.sources.map((s, idx) => (
                                    <div
                                      key={idx}
                                      className="p-1.5 rounded bg-dark-bg/80 border border-dark-border/60 text-[10px] text-gray-300 flex items-center justify-between"
                                    >
                                      <span className="font-semibold text-gray-200 truncate max-w-[200px]">
                                        {s.title} {s.section ? `• ${s.section}` : ''}
                                      </span>
                                      {s.relevance && (
                                        <span className="text-emerald-400 font-mono">
                                          {s.relevance}% Match
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex items-center gap-2 text-gray-400 text-xs py-1 px-2">
                    <div className="w-6 h-6 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                    </div>
                    <div className="flex gap-1 items-center bg-dark-surface border border-dark-border px-3 py-2 rounded-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce [animation-delay:0.4s]"></span>
                      <span className="text-[11px] text-gray-400 ml-1">Groq reasoning...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Suggestions */}
              {messages.length <= 2 && (
                <div className="px-3 py-2 bg-dark-surface/40 border-t border-dark-border flex gap-1.5 overflow-x-auto no-scrollbar">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="px-2.5 py-1 text-[11px] bg-dark-surface hover:bg-brand-600/20 hover:border-brand-500/40 border border-dark-border rounded-full text-gray-300 hover:text-white transition-all whitespace-nowrap"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Human Escalation Bar */}
              <div className="px-3 py-1.5 bg-dark-surface/80 border-t border-dark-border flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Verified Knowledge RAG
                </span>
                <button
                  onClick={handleEscalateToTicket}
                  disabled={escalating || escalatedTicket}
                  className="text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <Headphones className="w-3 h-3" />
                  {escalatedTicket ? 'Ticket Created' : escalating ? 'Escalating...' : 'Talk to Human'}
                </button>
              </div>

              {/* Input Footer */}
              <div className="p-3 bg-dark-surface border-t border-dark-border">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question..."
                    disabled={isTyping}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2.5 pr-11 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isTyping}
                    className="absolute right-1.5 p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-brand-600"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
