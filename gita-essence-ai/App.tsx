import React, { useState, useEffect, useRef } from 'react';
import { Send, Menu, RefreshCw, Info } from 'lucide-react';
import { Message, Role } from './types';
import { INITIAL_GREETING } from './constants';
import { sendMessageStream, resetSession } from './services/geminiService';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting
  useEffect(() => {
    if (messages.length === 0 && !showIntro) {
      setMessages([
        {
          id: 'init-1',
          role: Role.MODEL,
          text: INITIAL_GREETING,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [showIntro, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleStart = () => {
    setShowIntro(false);
  };

  const handleSendMessage = async (text: string) => {
    const userMsgId = Date.now().toString();
    const userMsg: Message = {
      id: userMsgId,
      role: Role.USER,
      text: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Create placeholder for model response
      const modelMsgId = (Date.now() + 1).toString();
      const initialModelMsg: Message = {
        id: modelMsgId,
        role: Role.MODEL,
        text: '',
        isStreaming: true,
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, initialModelMsg]);

      const stream = await sendMessageStream(text);
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk;
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === modelMsgId 
              ? { ...msg, text: fullText } 
              : msg
          )
        );
      }

      // Finalize message
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === modelMsgId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: Role.MODEL,
        text: "I apologize, but I encountered a disturbance in my connection. Please try asking again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Start a new conversation? Current history will be cleared.")) {
      resetSession();
      setMessages([
        {
          id: Date.now().toString(),
          role: Role.MODEL,
          text: INITIAL_GREETING,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  if (showIntro) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-10">
            <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-saffron-400 blur-[100px]"></div>
            <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] rounded-full bg-orange-300 blur-[80px]"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="w-20 h-20 bg-saffron-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
             <span className="text-4xl">🕉️</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-6">
            Gita Essence AI
          </h1>
          
          <p className="text-lg text-stone-600 mb-8 font-serif leading-relaxed">
            "You have the right to work, but for the work's sake only. You have no right to the fruits of work."
          </p>

          <p className="text-stone-500 mb-10 text-sm">
            Connect with the wisdom of the Bhagavad Gita.<br/>
            Based on Sir Edwin Arnold's translation.
          </p>

          <button
            onClick={handleStart}
            className="group relative px-8 py-4 bg-saffron-600 text-white text-lg font-medium rounded-full shadow-xl hover:bg-saffron-700 transition-all hover:-translate-y-1 hover:shadow-2xl active:translate-y-0"
          >
            <span className="flex items-center gap-2">
              Begin Journey <Send size={20} className="group-hover:translate-x-1 transition-transform"/>
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-stone-50 text-stone-800 font-sans">
      {/* Header */}
      <header className="flex-none bg-white border-b border-stone-200 px-4 py-3 shadow-sm z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-saffron-500 rounded-lg flex items-center justify-center text-white shadow-sm">
              <span className="text-lg">🕉️</span>
            </div>
            <div>
              <h1 className="font-serif font-bold text-stone-800">Gita Essence</h1>
              <p className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">Wisdom Guide</p>
            </div>
          </div>
          <button 
            onClick={handleReset}
            className="p-2 text-stone-400 hover:text-saffron-600 hover:bg-saffron-50 rounded-full transition-colors"
            title="Restart Conversation"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="max-w-3xl mx-auto px-4 py-8">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none bg-stone-50/80 backdrop-blur-sm z-20">
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </footer>
    </div>
  );
};

export default App;
