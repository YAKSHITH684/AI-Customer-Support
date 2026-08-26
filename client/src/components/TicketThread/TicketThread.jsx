import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  Send,
  Bot,
  User,
  ShieldCheck,
  Sparkles,
  BookOpen,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function TicketThread({
  ticket,
  messages = [],
  onSendMessage,
  isSending = false
}) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [selectedSource, setSelectedSource] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;
    onSendMessage(content.trim());
    setContent('');
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // Helper to parse source citations in message text
  const renderMessageContent = (text, sourceRefs = []) => {
    if (!text) return null;

    // Look for [Source: XYZ] pattern
    const regex = /\[Source:\s*([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const sourceTitle = match[1].trim();
      const matchedSource = sourceRefs.find((s) =>
        s.title?.toLowerCase().includes(sourceTitle.toLowerCase())
      ) || { title: sourceTitle };

      parts.push(
        <button
          key={match.index}
          type="button"
          onClick={() => setSelectedSource(matchedSource)}
          className="source-citation-badge mx-1 align-baseline inline-flex"
        >
          <BookOpen className="w-3 h-3 text-indigo-400" />
          <span>{sourceTitle}</span>
        </button>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed text-sm">
        {parts.length > 0 ? parts : text}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-dark-surface rounded-2xl border border-dark-border overflow-hidden">
      {/* Header Info */}
      <div className="p-4 border-b border-dark-border bg-dark-card/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-display font-semibold text-white text-base">
            Conversation Thread
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          Ticket #{ticket?.ticketNumber || 'TICK-NEW'}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5">
        {messages.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Bot className="w-10 h-10 mx-auto text-gray-600 mb-2" />
            <p className="text-sm">No messages yet. Send a response to begin.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCustomer = msg.sender === 'customer';
            const isAI = msg.sender === 'ai' || msg.sender === 'system';
            const isAgent = msg.sender === 'agent';

            return (
              <div
                key={msg._id || index}
                className={`flex gap-3.5 ${isCustomer ? 'justify-start' : 'justify-end'}`}
              >
                {/* Left Avatar for customer */}
                {isCustomer && (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`
                    max-w-2xl rounded-2xl p-4 border shadow-sm space-y-2
                    ${isCustomer
                      ? 'bg-dark-card border-dark-border text-gray-200'
                      : isAI
                        ? msg.isAIDraft
                          ? 'bg-purple-950/20 border-purple-500/30 text-purple-100'
                          : 'bg-brand-950/25 border-brand-500/30 text-indigo-100'
                        : 'bg-indigo-600 text-white border-indigo-500'
                    }
                  `}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-3 text-xs opacity-80 border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1.5 font-medium">
                      {isCustomer && <span>Customer ({msg.senderUser?.name || 'Alex Rivera'})</span>}
                      {isAgent && (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-200" />
                          <span>Support Agent ({msg.senderUser?.name || user?.name || 'Agent'})</span>
                        </>
                      )}
                      {isAI && (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                          <span className="font-semibold text-brand-300">
                            {msg.isAIDraft ? 'ResolveFlow AI (Draft)' : 'ResolveFlow AI (Auto-Resolved)'}
                          </span>
                          {msg.confidenceScore && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 ml-1">
                              {(msg.confidenceScore * 100).toFixed(0)}% Confidence
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <span className="text-[10px] font-mono opacity-70">
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div>{renderMessageContent(msg.content, msg.sourceRefs)}</div>

                  {/* Source References Pills */}
                  {msg.sourceRefs && msg.sourceRefs.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[11px] text-gray-400 font-medium">Citations:</span>
                      {msg.sourceRefs.map((src, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedSource(src)}
                          className="source-citation-badge"
                        >
                          <BookOpen className="w-3 h-3 text-indigo-300" />
                          <span>{src.title}</span>
                          {src.relevanceScore && (
                            <span className="text-[10px] opacity-75">
                              ({(src.relevanceScore * 100).toFixed(0)}%)
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Avatar for Agent / AI */}
                {!isCustomer && (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                      isAI
                        ? 'bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-glow-brand'
                        : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {isAI ? <Bot className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Source Citation Modal Popup */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full glass-panel rounded-2xl p-6 border border-brand-500/30 shadow-glass space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <div className="flex items-center gap-2 text-brand-300">
                <BookOpen className="w-5 h-5 text-brand-400" />
                <h4 className="font-display font-semibold text-white">
                  Knowledge Base Source
                </h4>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded bg-dark-card"
              >
                Close
              </button>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{selectedSource.title}</div>
              {selectedSource.section && (
                <div className="text-xs text-gray-400 mt-0.5">Section: {selectedSource.section}</div>
              )}
              {selectedSource.relevanceScore && (
                <div className="text-xs text-emerald-400 font-mono mt-1">
                  Semantic Relevance Match: {(selectedSource.relevanceScore * 100).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="p-3 rounded-xl bg-dark-bg/80 border border-dark-border text-xs text-gray-300 leading-relaxed font-mono max-h-48 overflow-y-auto">
              {selectedSource.content || 'Retrieved from verified enterprise knowledge document vector store.'}
            </div>
          </div>
        </div>
      )}

      {/* Reply Composer */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-dark-border bg-dark-card/60">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder={
              user?.role === 'customer'
                ? 'Type your message or follow-up question here (Press Ctrl+Enter to send)...'
                : 'Write a response to the customer or leave internal notes (Press Ctrl+Enter to send)...'
            }
            className="w-full p-3 pr-12 text-sm rounded-xl glass-input placeholder-gray-500 resize-none focus:outline-none"
          />
          <button
            type="submit"
            disabled={!content.trim() || isSending}
            className="absolute bottom-3 right-3 p-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white transition-all shadow-glow-brand"
            title="Send Message (Ctrl+Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500">
          <span>
            {user?.role === 'customer' ? 'AI will automatically analyze your query.' : 'Customer will receive this reply via their channel.'}
          </span>
          <span className="font-mono">Ctrl + Enter to send</span>
        </div>
      </form>
    </div>
  );
}
