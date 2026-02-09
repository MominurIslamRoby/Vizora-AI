
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SearchResultItem } from '../types';
import { streamChatWithGrounding } from '../services/geminiService';
import { Send, MessageSquare, User, Bot, Loader2, Globe, Sparkles, AlertTriangle, ChevronRight } from 'lucide-react';

interface ChatPanelProps {
  topic: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ topic }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const formatMessageText = (text: string) => {
    // Basic Markdown-lite formatter
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) {
        return <h4 key={i} className="text-sm md:text-base font-bold mt-3 mb-1 text-purple-600 dark:text-purple-400">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-base md:text-lg font-bold mt-4 mb-2 text-slate-900 dark:text-white">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={i} className="flex gap-2 mb-1 ml-2 text-sm md:text-base">
            <ChevronRight className="w-3.5 h-3.5 mt-1 text-purple-500 shrink-0 opacity-70" />
            <span className="text-slate-700 dark:text-slate-300">{line.replace(/^[-*]\s/, '')}</span>
          </div>
        );
      }
      
      // Handle Bold text **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedLine = parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-black text-slate-950 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return line.trim() === '' ? <div key={i} className="h-2" /> : <p key={i} className="mb-2 last:mb-0 text-sm md:text-base">{renderedLine}</p>;
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setStreamingText('');
    setQuotaExceeded(false);

    try {
      const currentHistory = [...messages, userMessage];
      await streamChatWithGrounding(
        topic,
        currentHistory,
        (chunk) => {
          setStreamingText(chunk);
        },
        (finalText, sources) => {
          setMessages(prev => [...prev, { role: 'model', text: finalText || "Internal Processing Error", sources }]);
          setStreamingText('');
          setIsTyping(false);
        }
      );
    } catch (err: any) {
      console.error(err);
      const isQuota = err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED");
      
      if (isQuota) {
        setQuotaExceeded(true);
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: "The Vizora universe is currently at peak capacity. My neural pathways are temporarily saturated. Please wait a minute before sending another query." 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: "I encountered a synchronization error with the Vizora core. Please try again." 
        }]);
      }
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto mt-24 md:mt-40 animate-in fade-in slide-in-from-bottom-12 duration-1000 px-4 mb-32">
      <div className="flex items-center gap-6 mb-12">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 text-purple-600 dark:text-purple-400 shadow-xl">
          <MessageSquare className="w-7 h-7" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-1">Neural Dialogue</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Grounded Interactive Intelligence</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl border border-slate-200 dark:border-white/5 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] dark:shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col h-[600px] md:h-[700px]">
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
              <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse">
                <Sparkles className="w-12 h-12 text-purple-500" />
              </div>
              <div className="max-w-xs">
                <p className="text-lg font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-widest text-[10px]">Matrix Ready</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">"Ask me anything about {topic}. I'm connected to the live Vizora data stream."</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex items-start gap-4 md:gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-purple-500'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5 md:w-6 md:h-6" /> : <Bot className="w-5 h-5 md:w-6 md:h-6" />}
              </div>
              <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-6 py-4 rounded-[1.5rem] shadow-sm text-sm md:text-base leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/5 rounded-tl-none'}`}>
                  {msg.role === 'model' ? formatMessageText(msg.text) : msg.text}
                </div>
              </div>
            </div>
          ))}

          {isTyping && streamingText && (
            <div className="flex items-start gap-4 md:gap-6 animate-in fade-in duration-300">
               <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 bg-slate-100 dark:bg-slate-800 text-purple-500">
                <Bot className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="flex flex-col max-w-[85%] md:max-w-[70%] items-start">
                <div className="px-6 py-4 rounded-[1.5rem] shadow-sm text-sm md:text-base leading-relaxed bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/5 rounded-tl-none">
                  {formatMessageText(streamingText)}
                  <span className="inline-block w-1.5 h-4 bg-purple-500 ml-1 animate-pulse align-middle"></span>
                </div>
              </div>
            </div>
          )}

          {isTyping && !streamingText && (
            <div className="flex items-center gap-3 text-slate-400 px-16 py-4 animate-pulse">
               <Loader2 className="w-4 h-4 animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-widest">Querying Vizora Matrix...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-200 dark:border-white/5">
          {quotaExceeded && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-600 dark:text-amber-400 animate-in fade-in slide-in-from-bottom-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Capacity Alert: Please wait 60 seconds</span>
            </div>
          )}
          <form onSubmit={handleSend} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl blur opacity-10 group-focus-within:opacity-20 transition-opacity duration-500"></div>
            <div className="relative flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-2 pl-6 rounded-3xl shadow-xl transition-all group-focus-within:border-purple-500/50">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={quotaExceeded ? "Capacity reached..." : `Ask a question about ${topic}...`}
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 py-4 font-bold md:text-lg"
                disabled={isTyping || quotaExceeded}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping || quotaExceeded}
                className={`p-4 rounded-2xl transition-all active:scale-95 ${input.trim() && !isTyping && !quotaExceeded ? 'bg-purple-600 text-white shadow-lg hover:brightness-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700'}`}
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </form>
          <div className="mt-4 flex justify-center items-center gap-6 opacity-40">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Search Grounding Active</span>
             </div>
             <div className="w-[1px] h-3 bg-slate-300 dark:bg-slate-800"></div>
             <div className="flex items-center gap-2">
                <Bot className="w-3 h-3 text-purple-500" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Gemini 3.0 Pro</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
