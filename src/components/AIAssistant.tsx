import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

// We lazy-initialize the client to prevent "process is not defined" errors in browser builds
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    // Check both Vite client-side env and Node-side process env dynamically
    // @ts-ignore
    const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please add VITE_GEMINI_API_KEY=your_key to your local .env file.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your AI HR Assistant powered by Gemini. I can help you draft job descriptions, summarize policies, write performance reviews, or answer HR-related questions. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const history = messages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n\n');
      const prompt = `Conversation History:\n${history}\n\nUser: ${userMessage.content}\nAssistant:`;

      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert HR Assistant. Be professional, helpful, and concise. Provide actionable advice and well-formatted drafts. Use markdown for formatting lists, bold text, and headers.',
        }
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || 'I apologize, but I was unable to generate a response.'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error while trying to process your request. Please check your connection or try again later.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] overflow-hidden"
    >
      <div className="p-6 border-b border-[#F0F2F5] flex items-center gap-3 bg-[#FAFBFC]">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A90E2] to-[#9013FE] flex items-center justify-center text-white shadow-sm">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-[#333]">AI HR Assistant</h2>
          <p className="text-[13px] text-[#718096]">Powered by Gemini</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
              message.role === 'user' ? 'bg-[#4A90E2] text-white' : 'bg-[#EBF8FF] text-[#2B6CB0]'
            }`}>
              {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={`max-w-[80%] rounded-[8px] p-4 text-[14px] leading-relaxed ${
              message.role === 'user' 
                ? 'bg-[#4A90E2] text-white rounded-tr-none' 
                : 'bg-[#F7FAFC] border border-[#E2E8F0] text-[#333] rounded-tl-none'
            }`}>
              {message.role === 'user' ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <div className="markdown-body prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-white prose-pre:border prose-pre:border-[#E2E8F0] prose-a:text-[#4A90E2]">
                  <Markdown>{message.content}</Markdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#EBF8FF] text-[#2B6CB0] flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-[8px] rounded-tl-none p-4 flex items-center gap-2 text-[#718096]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[14px]">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[#F0F2F5] bg-[#FAFBFC]">
        {messages.length === 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
            <button type="button" onClick={() => handleSuggestion("Draft a job description for a Senior Frontend Developer")} className="whitespace-nowrap px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-full text-[12px] text-[#4A5568] hover:border-[#4A90E2] hover:text-[#4A90E2] transition-colors">
              Draft a job description
            </button>
            <button type="button" onClick={() => handleSuggestion("Write a polite rejection email for candidates")} className="whitespace-nowrap px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-full text-[12px] text-[#4A5568] hover:border-[#4A90E2] hover:text-[#4A90E2] transition-colors">
              Write a rejection email
            </button>
            <button type="button" onClick={() => handleSuggestion("Create an outline for a new employee onboarding process")} className="whitespace-nowrap px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-full text-[12px] text-[#4A5568] hover:border-[#4A90E2] hover:text-[#4A90E2] transition-colors">
              Onboarding process outline
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to draft a job description, write a policy, or summarize employee feedback..."
            className="w-full pl-4 pr-12 py-3 border border-[#E2E8F0] rounded-[8px] bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent transition-all shadow-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#4A90E2] hover:bg-[#EBF8FF] rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
