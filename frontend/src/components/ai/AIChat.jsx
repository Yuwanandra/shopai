import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, RotateCcw, Bot, ChevronDown } from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: `Hi there! 👋 I'm **ShopBot**, your AI shopping assistant powered by advanced AI.\n\nI can help you:\n• 🔍 Find the perfect products\n• 💰 Shop within your budget\n• ⚖️ Compare items side by side\n• 🎁 Pick great gifts\n\nWhat are you looking for today?`,
};

function parseContent(text) {
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Line breaks
  text = text.replace(/\n/g, '<br/>');
  // Action tags — render as clickable chips
  text = text.replace(
    /<action type="(\w+)"[^>]*>(.*?)<\/action>/g,
    '<button class="action-chip" data-type="$1" data-content="$2">🔗 $2</button>'
  );
  return text;
}

export default function AIChat() {
  const { chatOpen, toggleChat } = useUIStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [messages,     setMessages]     = useState([INITIAL_MESSAGE]);
  const [input,        setInput]        = useState('');
  const [streaming,    setStreaming]     = useState(false);
  const [suggestions,  setSuggestions]  = useState([]);
  const [showSuggest,  setShowSuggest]  = useState(true);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const sessionKey = useRef(`ai_${Date.now()}`);

  // Load suggestions
  useEffect(() => {
    api.get('/ai/suggestions').then(r => setSuggestions(r.data.suggestions)).catch(() => {});
  }, []);

  useEffect(() => {
    if (chatOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [chatOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text = input.trim()) => {
    if (!text || streaming) return;
    setInput('');
    setShowSuggest(false);

    const userMsg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setStreaming(true);

    // Add placeholder assistant message
    const aiPlaceholder = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, aiPlaceholder]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/ai/chat`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('shopai_token')
            ? { Authorization: `Bearer ${localStorage.getItem('shopai_token')}` }
            : {}),
        },
        body: JSON.stringify({
          messages:   history.map(m => ({ role: m.role, content: m.content })),
          session_id: sessionKey.current,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data:'));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(5));
            if (data.text) {
              full += data.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: full };
                return updated;
              });
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting right now. Please try again! 🙏",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleActionChip = (e) => {
    if (e.target.classList.contains('action-chip')) {
      const type    = e.target.dataset.type;
      const content = e.target.dataset.content;
      if (type === 'search') navigate(`/shop?q=${encodeURIComponent(content)}`);
      if (type === 'filter') navigate(`/shop?${new URLSearchParams(content).toString()}`);
    }
  };

  const reset = () => {
    setMessages([INITIAL_MESSAGE]);
    setShowSuggest(true);
    setInput('');
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!chatOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={toggleChat}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-coral text-white shadow-xl shadow-coral/30 flex items-center justify-center hover:scale-110 transition-transform"
            aria-label="Open AI Chat"
          >
            <Sparkles size={22} />
            <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-teal rounded-full border-2 border-white animate-pulse-slow" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
            style={{ height: 540 }}
          >
            {/* Header */}
            <div className="bg-ink flex items-center gap-3 px-4 py-3.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-coral flex items-center justify-center shadow-md shadow-coral/30">
                <Sparkles size={17} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">ShopBot</p>
                <p className="text-white/40 text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse-slow inline-block" />
                  AI Shopping Assistant
                </p>
              </div>
              <button onClick={reset} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Reset chat">
                <RotateCcw size={14} />
              </button>
              <button onClick={toggleChat} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-cream"
              onClick={handleActionChip}
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-coral/15 flex items-center justify-center mr-2 shrink-0 mt-1">
                      <Bot size={12} className="text-coral" />
                    </div>
                  )}
                  <div
                    className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
                    dangerouslySetInnerHTML={{ __html: parseContent(msg.content) }}
                    style={{}}
                  />
                </div>
              ))}

              {streaming && messages[messages.length - 1]?.content === '' && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-coral/15 flex items-center justify-center mr-2 shrink-0">
                    <Bot size={12} className="text-coral" />
                  </div>
                  <div className="chat-bubble-ai flex gap-1 items-center py-3 px-4">
                    {[0, 1, 2].map(i => (
                      <motion.span key={i} className="w-1.5 h-1.5 bg-coral rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            <AnimatePresence>
              {showSuggest && suggestions.length > 0 && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="bg-cream border-t border-gray-100 overflow-hidden shrink-0"
                >
                  <div className="px-3 py-2 flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-medium mr-1 whitespace-nowrap">Try:</span>
                    {suggestions.slice(0, 4).map((s, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(s)}
                        className="chip text-[11px] py-1 px-2.5"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="bg-white border-t border-gray-100 p-3 flex gap-2 shrink-0">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask me anything…"
                disabled={streaming}
                className="flex-1 text-sm bg-cream rounded-xl px-3 py-2.5 outline-none border border-gray-100 focus:border-coral transition-colors placeholder:text-gray-400"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || streaming}
                className="w-10 h-10 rounded-xl bg-coral text-white flex items-center justify-center hover:bg-red-500 transition-colors disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action chip styles */}
      <style>{`
        .action-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          margin: 2px 2px;
          border-radius: 999px;
          background: #FFF0EE;
          border: 1px solid #FF6B6B30;
          color: #FF6B6B;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .action-chip:hover { background: #FF6B6B; color: white; }
      `}</style>
    </>
  );
}
