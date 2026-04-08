import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Clock, X, Save, Loader2, Edit2, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Service, ServiceCombo } from '../../types';
import { api } from '../../services/api';

interface ComboManagerProps {
  services: Service[];
  onRefresh?: () => void;
}

interface DraftComboItem {
  serviceId: string;
  order: number;
}

const emptyDraft = () => ({
  name: '',
  description: '',
  price: '',
  services: [] as DraftComboItem[]
});

export default function ComboManager({ services, onRefresh }: ComboManagerProps) {
  const [combos, setCombos] = useState<ServiceCombo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [toast, setToast] = useState<string | null>(null);

  const fetchCombos = async () => {
    try {
      const data = await api.get('/combos');
      setCombos(data || []);
    } catch (err) {
      console.error('Failed to fetch combos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const totalDuration = draft.services.reduce((acc, item) => {
    const svc = services.find(s => s.id === item.serviceId);
    return acc + (svc?.duration || 0);
  }, 0);

  const formatDuration = (min: number) => {
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h${m}min` : `${h}h`;
  };

  const handleAddService = (serviceId: string) => {
    if (!serviceId || draft.services.some(s => s.serviceId === serviceId)) return;
    setDraft(prev => ({
      ...prev,
      services: [...prev.services, { serviceId, order: prev.services.length + 1 }]
    }));
  };

  const handleRemoveService = (serviceId: string) => {
    setDraft(prev => ({
      ...prev,
      services: prev.services
        .filter(s => s.serviceId !== serviceId)
        .map((s, i) => ({ ...s, order: i + 1 }))
    }));
  };

  const handleMoveService = (index: number, direction: 'up' | 'down') => {
    const newServices = [...draft.services];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newServices.length) return;
    [newServices[index], newServices[target]] = [newServices[target], newServices[index]];
    setDraft(prev => ({
      ...prev,
      services: newServices.map((s, i) => ({ ...s, order: i + 1 }))
    }));
  };

  const openCreate = () => {
    setDraft(emptyDraft());
    setEditingId(null);
    setIsFormOpen(true);
  };

  const openEdit = (combo: ServiceCombo) => {
    setDraft({
      name: combo.name,
      description: combo.description || '',
      price: combo.price?.toString() || '',
      services: combo.items.map(item => ({ serviceId: item.serviceId, order: item.order }))
    });
    setEditingId(combo.id);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim() || draft.services.length === 0) {
      alert('Preencha o nome e adicione ao menos 1 serviço.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: draft.name,
        description: draft.description,
        price: draft.price ? parseFloat(draft.price) : undefined,
        services: draft.services
      };
      if (editingId) {
        await api.put(`/combos/${editingId}`, payload);
        showToast('Combo atualizado com sucesso!');
      } else {
        await api.post('/combos', payload);
        showToast('Combo criado com sucesso!');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setDraft(emptyDraft());
      fetchCombos();
      onRefresh?.();
    } catch (err: any) {
      alert(`Erro ao salvar combo: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir o combo "${name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/combos/${id}`);
      showToast('Combo excluído.');
      fetchCombos();
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete combo:', err);
    }
  };

  const availableServices = services.filter(
    s => !draft.services.some(d => d.serviceId === s.id)
  );

  return (
    <section className="bg-white rounded-[2rem] border border-zinc-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-8 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Package className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-950 tracking-tight">Combos de Serviços</h2>
              <p className="text-zinc-500 text-sm font-medium">Pacotes com duração automática calculada</p>
            </div>
          </div>
          <button
            id="combo-create-btn"
            onClick={openCreate}
            className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20"
          >
            <Plus size={18} />
            Novo Combo
          </button>
        </div>
      </div>

      <div className="p-8 space-y-4">
        {/* Form */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-zinc-50 rounded-3xl border border-zinc-200 p-6 space-y-5"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-zinc-900 text-lg">
                  {editingId ? 'Editar Combo' : 'Novo Combo'}
                </h3>
                <button
                  onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                  className="p-2 hover:bg-zinc-200 rounded-xl transition-colors text-zinc-400"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Name & Price row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Nome do Combo *</label>
                  <input
                    id="combo-name-input"
                    type="text"
                    placeholder="Ex: Combo Noiva"
                    value={draft.name}
                    onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Preço Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Opcional"
                    value={draft.price}
                    onChange={e => setDraft(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-white border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Descrição</label>
                <input
                  type="text"
                  placeholder="Breve descrição do combo"
                  value={draft.description}
                  onChange={e => setDraft(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                />
              </div>

              {/* Service items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-zinc-700">Serviços do Combo *</label>
                  {totalDuration > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                      <Clock size={12} />
                      Duração total: {formatDuration(totalDuration)}
                    </span>
                  )}
                </div>

                {/* Current items */}
                <div className="space-y-2">
                  {draft.services.map((item, idx) => {
                    const svc = services.find(s => s.id === item.serviceId);
                    return (
                      <div
                        key={item.serviceId}
                        className="flex items-center gap-3 bg-white p-3 rounded-xl border border-zinc-200 group"
                      >
                        <GripVertical size={16} className="text-zinc-300" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-800 truncate">{svc?.name}</p>
                          <p className="text-xs text-zinc-400">{svc?.duration}min · R$ {svc?.price?.toFixed(2)}</p>
                        </div>
                        <span className="w-6 h-6 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveService(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 disabled:opacity-30"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveService(idx, 'down')}
                            disabled={idx === draft.services.length - 1}
                            className="p-1 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 disabled:opacity-30"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(item.serviceId)}
                            className="p-1 hover:bg-rose-50 rounded-lg transition-colors text-zinc-300 hover:text-rose-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add service select */}
                {availableServices.length > 0 && (
                  <select
                    id="combo-add-service"
                    value=""
                    onChange={e => { handleAddService(e.target.value); e.target.value = ''; }}
                    className="w-full bg-white border border-dashed border-zinc-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm text-zinc-500"
                  >
                    <option value="">+ Adicionar serviço ao combo</option>
                    {availableServices.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.duration}min)
                      </option>
                    ))}
                  </select>
                )}
                {draft.services.length === 0 && (
                  <p className="text-xs text-rose-500 font-medium">* Adicione ao menos 1 serviço</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setDraft(emptyDraft()); }}
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-semibold hover:bg-zinc-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  id="combo-save-btn"
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20 text-sm disabled:opacity-70"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Salvando...' : 'Salvar Combo'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Combo list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-rose-500" />
          </div>
        ) : combos.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum combo criado ainda.</p>
            <p className="text-xs mt-1">Crie pacotes para oferecer serviços combinados às suas clientes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {combos.map(combo => (
              <motion.div
                key={combo.id}
                layout
                className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:border-rose-200 transition-all"
              >
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === combo.id ? null : combo.id)}
                >
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package size={20} className="text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-900 truncate">{combo.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock size={11} />
                        {formatDuration(combo.totalDurationMin)}
                      </span>
                      <span className="text-xs text-zinc-300">·</span>
                      <span className="text-xs text-zinc-400">{combo.items.length} serviços</span>
                      {combo.price && (
                        <>
                          <span className="text-xs text-zinc-300">·</span>
                          <span className="text-xs font-bold text-emerald-600">
                            R$ {combo.price.toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      id={`combo-edit-${combo.id}`}
                      onClick={e => { e.stopPropagation(); openEdit(combo); }}
                      className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-700"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      id={`combo-delete-${combo.id}`}
                      onClick={e => { e.stopPropagation(); handleDelete(combo.id, combo.name); }}
                      className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-zinc-400 hover:text-rose-500"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronDown
                      size={16}
                      className={`text-zinc-400 transition-transform ${expandedId === combo.id ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === combo.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-2 border-t border-zinc-100 pt-4">
                        {combo.description && (
                          <p className="text-xs text-zinc-500 mb-3">{combo.description}</p>
                        )}
                        {combo.items.map((item, idx) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <span className="w-5 h-5 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="flex-1 flex items-center justify-between">
                              <span className="text-sm font-medium text-zinc-700">{item.service.name}</span>
                              <span className="text-xs text-zinc-400">{item.service.duration}min</span>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 pt-3 border-t border-zinc-100">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span className="text-xs text-zinc-500">
                            Bloco contínuo de <strong>{formatDuration(combo.totalDurationMin)}</strong> na agenda do profissional
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-emerald-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold"
          >
            <CheckCircle2 size={18} className="text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
