import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  Mic, 
  Check, 
  CheckCheck,
  Circle,
  ArrowLeft,
  Search
} from 'lucide-react';
import { WhatsAppChatMessage, WhatsAppChat } from '../../types';
import { whatsappChatService } from '../../services/whatsappChatService';

interface WhatsAppChatViewProps {
  chat: WhatsAppChat;
  onBack: () => void;
}

export default function WhatsAppChatView({ chat, onBack }: WhatsAppChatViewProps) {
  const [messages, setMessages] = useState<WhatsAppChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const newMessage: WhatsAppChatMessage = {
      id: Date.now().toString(),
      fromMe: true,
      content: inputText.trim(),
      timestamp: new Date(),
      status: 'sent',
      chatId: chat.chatId,
      contactName: chat.contactName
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsSending(true);

    try {
      const response = await whatsappChatService.sendMessage({
        chatId: chat.chatId,
        text: inputText.trim()
      });

      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: response.error ? 'failed' : 'sent' }
          : msg
      ));
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: 'failed' }
          : msg
      ));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sent':
        return <Check size={14} className="text-zinc-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-zinc-400" />;
      case 'read':
        return <CheckCheck size={14} className="text-blue-500" />;
      case 'failed':
        return <Circle size={14} className="text-red-500" fill="currentColor" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#efe7dd] dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#075e54] dark:bg-zinc-800 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
            {chat.contactName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{chat.contactName}</h3>
            <p className="text-xs text-white/70">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Phone size={20} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Search size={20} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#efe7dd] dark:bg-zinc-900">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center mb-4">
              <Send size={32} className="text-zinc-400" />
            </div>
            <p className="text-sm">Envie uma mensagem para {chat.contactName}</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                  message.fromMe 
                    ? 'bg-[#d9fdd3] dark:bg-brand-500 text-zinc-900 dark:text-white rounded-br-md' 
                    : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${
                  message.fromMe ? 'text-zinc-500' : 'text-zinc-400'
                }`}>
                  <span className="text-[10px]">{formatTime(message.timestamp)}</span>
                  {message.fromMe && getStatusIcon(message.status)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#f0f2f5] dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
        <button className="p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
          <Paperclip size={20} />
        </button>
        <button className="p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
          <Mic size={20} />
        </button>
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Mensagem"
            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white dark:placeholder-zinc-400"
            disabled={isSending}
          />
        </div>
        <button 
          onClick={handleSend}
          disabled={!inputText.trim() || isSending}
          className={`p-3 rounded-full transition-all ${
            inputText.trim() && !isSending
              ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-lg'
              : 'bg-zinc-200 dark:bg-zinc-600 text-zinc-400 dark:text-zinc-500'
          }`}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}