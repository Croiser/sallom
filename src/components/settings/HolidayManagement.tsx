import { Calendar as CalendarIcon, Plus as PlusIcon, Trash2 as TrashIcon, Sparkles as SparklesIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Holiday } from '../../types';

interface HolidayManagementProps {
  holidays: Holiday[];
  newHolidayName: string;
  setNewHolidayName: (name: string) => void;
  newHolidayDate: string;
  setNewHolidayDate: (date: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export default function HolidayManagement({ 
  holidays, 
  newHolidayName, 
  setNewHolidayName, 
  newHolidayDate, 
  setNewHolidayDate, 
  onAdd, 
  onDelete 
}: HolidayManagementProps) {
  return (
    <section className="bg-white rounded-[2rem] border border-surface-200 overflow-hidden shadow-premium">
      <div className="p-8 border-b border-surface-100 bg-surface-50/50">
        <h3 className="text-xl font-display font-black flex items-center gap-3 text-surface-900">
          <div className="p-2 bg-brand-50 text-brand-500 rounded-xl">
            <CalendarIcon size={24} />
          </div>
          Feriados e Datas Especiais
        </h3>
      </div>
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-50 rounded-[1.5rem] border border-surface-100">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Descrição</label>
            <input
              type="text"
              value={newHolidayName}
              onChange={e => setNewHolidayName(e.target.value)}
              className="input-premium bg-white"
              placeholder="Ex: Natal, Recesso..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Data</label>
            <div className="flex gap-3">
              <input
                type="date"
                value={newHolidayDate}
                onChange={e => setNewHolidayDate(e.target.value)}
                className="input-premium bg-white"
              />
              <button
                onClick={onAdd}
                className="btn-primary shrink-0 group"
              >
                <PlusIcon size={20} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {holidays.map((holiday, index) => (
              <motion.div 
                key={holiday.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-5 border border-surface-100 rounded-2xl bg-white hover:border-brand-500/20 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-500 shadow-sm">
                    <CalendarIcon size={24} />
                  </div>
                  <div>
                    <p className="font-display font-black text-surface-900 uppercase tracking-tight">{holiday.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                      <p className="text-xs font-bold text-zinc-400">
                        {new Date(holiday.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(holiday.id)}
                  className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all"
                >
                  <TrashIcon size={20} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {holidays.length === 0 && (
            <div className="p-12 text-center border-2 border-dashed border-surface-200 rounded-[2rem] bg-surface-50/50">
              <SparklesIcon size={32} className="mx-auto text-zinc-200 mb-4" />
              <p className="text-zinc-400 font-display font-black uppercase tracking-widest text-xs">Nenhuma data especial cadastrada</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
