import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Circle,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import { WhatsAppChat, WhatsAppChatMessage } from '../../types';
import WhatsAppChatView from './WhatsAppChatView';

interface WhatsAppChatListProps {
  onBack: () => void;
}

export default function WhatsAppChatList({ onBack }: WhatsAppChatListProps) {
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/chats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.contactName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date?: Date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return d.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (selectedChat) {
    return <WhatsAppChatView chat={selectedChat} onBack={() => setSelectedChat(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#075e54] dark:bg-zinc-800 text-white">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-semibold">Mensagens</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <MessageSquare size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 bg-[#f0f2f5] dark:bg-zinc-800">
        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-700 rounded-full">
          <Search size={18} className="text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar conversas"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none dark:text-white dark:placeholder-zinc-400"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-4">
            <MessageSquare size={48} className="text-zinc-300 dark:text-zinc-600 mb-4" />
            <p className="text-sm text-center">
              {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </p>
            <p className="text-xs text-zinc-400 mt-1 text-center">
              As conversas aparecerão aqui quando clientes.enviarem mensagens
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.chatId}
              onClick={() => setSelectedChat(chat)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-700"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                {chat.contactName.charAt(0).toUpperCase()}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-white truncate">
                    {chat.contactName}
                  </h3>
                  <span className="text-xs text-zinc-400 flex-shrink-0">
                    {formatTime(chat.lastMessageTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    {chat.lastMessage || 'Sem mensagens'}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="min-w-[20px] h-5 bg-brand-500 rounded-full flex items-center justify-center text-xs text-white font-bold px-1.5">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}