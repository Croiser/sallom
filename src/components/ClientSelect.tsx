import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, User } from 'lucide-react';
import { Client } from '../types';

interface ClientSelectProps {
  clients: Client[];
  value: string;
  onChange: (clientId: string) => void;
  error?: boolean;
}

export default function ClientSelect({ clients, value, onChange, error }: ClientSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedClient = clients.find(c => c.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className={`w-full bg-zinc-50 border ${error ? 'border-rose-500' : 'border-zinc-200'} px-4 py-3 rounded-xl flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <User size={16} className="text-zinc-400 flex-shrink-0" />
          <span className={`text-sm truncate font-medium ${selectedClient ? 'text-zinc-900' : 'text-zinc-500'}`}>
            {selectedClient ? selectedClient.name : 'Selecione um cliente'}
          </span>
        </div>
        <ChevronDown size={16} className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-2 border-b border-zinc-100 bg-zinc-50/50 sticky top-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredClients.length === 0 ? (
              <div className="p-4 text-center text-sm text-zinc-500">
                Nenhum cliente encontrado.
              </div>
            ) : (
              filteredClients.map(client => (
                <div
                  key={client.id}
                  onClick={() => {
                    onChange(client.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2.5 rounded-lg cursor-pointer flex flex-col transition-colors ${
                    value === client.id 
                      ? 'bg-brand-50 text-brand-700' 
                      : 'hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <span className="text-sm font-semibold">{client.name}</span>
                  {client.phone && (
                    <span className="text-xs text-zinc-400 mt-0.5">{client.phone}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
