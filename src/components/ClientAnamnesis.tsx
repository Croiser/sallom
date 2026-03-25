import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, Calendar as CalendarIcon, FileText, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import AnamnesisEditor from './AnamnesisEditor';

interface ClientAnamnesisProps {
  clientId: string;
}

export default function ClientAnamnesis({ clientId }: ClientAnamnesisProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const fetchRecords = async () => {
    try {
      const data = await api.get(`/clients/${clientId}/anamnesis`);
      setRecords(data);
    } catch (error) {
      console.error('Erro ao buscar fichas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [clientId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta ficha permanentemente?')) return;
    try {
      await api.delete(`/anamnesis/${id}`);
      setRecords(prev => prev.filter(r => r.id !== id));
      if (selectedRecord?.id === id) setSelectedRecord(null);
    } catch (error) {
      alert('Erro ao excluir ficha.');
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Carregando histórico...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ClipboardList size={20} className="text-rose-500" />
          Fichas de Anamnese
        </h3>
        <button 
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-500/20"
        >
          <Plus size={16} /> Nova Ficha
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.length === 0 ? (
          <div className="col-span-full p-12 border-2 border-dashed border-zinc-800 rounded-3xl text-center">
            <ClipboardList size={48} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500">Nenhuma ficha registrada para este cliente.</p>
          </div>
        ) : (
          records.map(record => (
            <motion.div 
              key={record.id}
              layoutId={record.id}
              onClick={() => setSelectedRecord(record)}
              className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white group-hover:text-rose-500 transition-colors">{record.procedure}</h4>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                    <CalendarIcon size={12} />
                    {new Date(record.createdAt).toLocaleDateString('pt-BR')} às {new Date(record.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                  className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Record Details Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-rose-500" size={24} />
                  <div>
                    <h3 className="text-lg font-bold">{selectedRecord.procedure}</h3>
                    <p className="text-xs text-zinc-500">Registrado em {new Date(selectedRecord.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="p-2 text-zinc-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <DetailItem label="Alergias" value={selectedRecord.content.alergias} />
                  <DetailItem label="Medicamentos" value={selectedRecord.content.medicamentos} />
                  <DetailItem label="Tipo de Pele / Cabelo" value={selectedRecord.content.tipoPele} />
                  <DetailItem label="Procedimentos Anteriores" value={selectedRecord.content.procedimentosAnteriores} />
                </div>
                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Observações Técnicas</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{selectedRecord.content.observacoes || 'Nenhuma observação adicional.'}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditor && (
          <AnamnesisEditor 
            clientId={clientId} 
            onClose={() => setShowEditor(false)} 
            onSave={fetchRecords} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold text-zinc-500 uppercase">{label}</p>
      <p className="text-sm text-white">{value || '---'}</p>
    </div>
  );
}

function X({ size }: { size: number }) {
    return <ChevronRight size={size} />; // Fallback for X icon mismatch in imports
}
