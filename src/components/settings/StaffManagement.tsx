import { UserPlus, Plus, Trash2, Crown, ShieldCheck, CheckCircle2, DollarSign, Group as UsersIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Staff, Plan } from '../../types';

interface StaffManagementProps {
  staff: Staff[];
  newStaffName: string;
  setNewStaffName: (name: string) => void;
  newStaffEmail: string;
  setNewStaffEmail: (email: string) => void;
  newStaffPassword: string;
  setNewStaffPassword: (password: string) => void;
  plan: Plan | null;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Staff>) => void;
}

export default function StaffManagement({
  staff,
  newStaffName,
  setNewStaffName,
  newStaffEmail,
  setNewStaffEmail,
  newStaffPassword,
  setNewStaffPassword,
  plan,
  onAdd,
  onDelete,
  onUpdate
}: StaffManagementProps) {
  const staffLimit = plan?.features?.staffLimit;

  return (
    <section className="bg-white rounded-[2rem] border border-surface-200 overflow-hidden shadow-premium">
      <div className="p-8 border-b border-surface-100 bg-surface-50/50 flex items-center justify-between">
        <h3 className="text-xl font-display font-black flex items-center gap-3 text-surface-900">
          <div className="p-2 bg-brand-50 text-brand-500 rounded-xl">
            <UserPlus size={24} />
          </div>
          Equipe de Profissionais
        </h3>
        {staffLimit !== undefined && (
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-100 border border-surface-200 rounded-full">
            <ShieldCheck size={12} className="text-brand-500" />
            <span className="text-[10px] font-black text-surface-900 uppercase tracking-widest leading-none">
              {staff.length} / {staffLimit} Slots
            </span>
          </div>
        )}
      </div>
      <div className="p-8 space-y-8">
        <div className="flex flex-col gap-4 p-4 bg-surface-50 rounded-[1.5rem] border border-surface-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <input
                type="text"
                value={newStaffName}
                onChange={e => setNewStaffName(e.target.value)}
                className="input-premium bg-white"
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">E-mail (Para Login)</label>
              <input
                type="email"
                value={newStaffEmail}
                onChange={e => setNewStaffEmail(e.target.value)}
                className="input-premium bg-white"
                placeholder="joao@email.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Senha Inicial</label>
              <input
                type="password"
                value={newStaffPassword}
                onChange={e => setNewStaffPassword(e.target.value)}
                className="input-premium bg-white"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="flex justify-between items-center bg-brand-50/50 p-4 rounded-2xl border border-brand-100/50">
            <p className="text-[11px] text-brand-600 font-medium">
              <span className="font-black uppercase tracking-widest mr-2">Dica:</span> 
              Ao preencher e-mail e senha, um acesso será criado automaticamente para o profissional.
            </p>
            <button
              onClick={onAdd}
              className="btn-primary shrink-0 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              Adicionar Profissional
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <AnimatePresence>
            {staff.map((member, index) => (
              <motion.div 
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 border border-surface-100 rounded-3xl bg-white hover:border-brand-500/20 transition-all group shadow-sm hover:shadow-lg"
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-surface-100 to-surface-200 rounded-2xl flex items-center justify-center text-surface-900 font-black shadow-inner">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-lg font-display font-black text-surface-900 uppercase tracking-tight">{member.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CheckCircle2 size={12} className={member.active ? 'text-emerald-500' : 'text-zinc-300'} />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{member.active ? 'Em Atividade' : 'Pausado'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(member.id)}
                    className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all"
                    title="Remover Profissional"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Comissão sobre Vendas (%)</label>
                    <div className="relative group">
                      <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" />
                      <input
                        type="number"
                        value={member.commissionPercentage}
                        onChange={e => onUpdate(member.id, { commissionPercentage: Number(e.target.value) })}
                        className="input-premium pl-10 font-bold"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Status de Disponibilidade</label>
                    <button
                      onClick={() => onUpdate(member.id, { active: !member.active })}
                      className={`w-full h-[50px] rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                        member.active 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white' 
                          : 'bg-brand-50 text-brand-500 border-brand-100 hover:bg-brand-500 hover:text-white'
                      }`}
                    >
                      {member.active ? 'Ativo na Agenda' : 'Inativo / Férias'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {staff.length === 0 && (
            <div className="p-16 text-center border-2 border-dashed border-surface-200 rounded-[2.5rem] bg-surface-50/50">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-surface-100">
                <UsersIcon size={32} className="text-zinc-200" />
              </div>
              <p className="text-zinc-400 font-display font-black uppercase tracking-widest text-sm">Monte sua equipe de estrelas</p>
              <p className="text-xs text-zinc-400 px-12 mt-2">Adicione seu primeiro profissional acima para começar a gerenciar agendamentos e comissões.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
