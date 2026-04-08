import React, { useState } from 'react';
import {
  AlertTriangle, Calendar, Clock, X, Check, ChevronRight,
  Ban, SkipForward, Loader2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RecurrenceConflict, RecurrenceValidationResult, ResolvedDate } from '../types';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationResult: RecurrenceValidationResult;
  defaultStartTime: string; // "HH:MM"
  onConfirm: (resolvedDates: ResolvedDate[]) => Promise<void>;
}

const REASON_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  holiday: {
    label: 'Feriado',
    color: 'bg-amber-100 text-amber-700',
    icon: <Ban size={12} />
  },
  closed_day: {
    label: 'Dia Fechado',
    color: 'bg-zinc-100 text-zinc-600',
    icon: <X size={12} />
  },
  overlap: {
    label: 'Conflito de Horário',
    color: 'bg-rose-100 text-rose-700',
    icon: <AlertTriangle size={12} />
  }
};

const formatDisplayDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
};

export default function ConflictResolutionModal({
  isOpen,
  onClose,
  validationResult,
  defaultStartTime,
  onConfirm
}: ConflictResolutionModalProps) {
  // Initialize resolutions: each conflict starts with the original date and default time, not skipped
  const initResolutions = (): Record<string, { date: string; startTime: string; skipped: boolean }> => {
    const map: Record<string, { date: string; startTime: string; skipped: boolean }> = {};
    validationResult.conflicts.forEach(c => {
      map[c.originalDate] = {
        date: c.originalDate,
        startTime: defaultStartTime,
        skipped: false
      };
    });
    return map;
  };

  const [resolutions, setResolutions] = useState(initResolutions);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const allResolved = validationResult.conflicts.every(
    c => resolutions[c.originalDate]?.skipped || resolutions[c.originalDate]?.date !== c.originalDate
  );

  const handleConfirm = async () => {
    setSaving(true);
    try {
      // Build the full resolvedDates array:
      // 1. Valid dates from validation (original, no conflict)
      const validDates: ResolvedDate[] = validationResult.validDatesList.map(d => ({
        date: d,
        startTime: defaultStartTime
      }));

      // 2. Conflict resolutions (adjusted or skipped)
      const conflictResolved: ResolvedDate[] = validationResult.conflicts.map(c => {
        const res = resolutions[c.originalDate];
        return {
          date: res.date,
          startTime: res.startTime,
          skipped: res.skipped
        };
      });

      const all = [...validDates, ...conflictResolved].sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      await onConfirm(all);
    } finally {
      setSaving(false);
    }
  };

  const pendingCount = validationResult.conflicts.filter(c => {
    const res = resolutions[c.originalDate];
    return !res?.skipped && res?.date === c.originalDate;
  }).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 bg-amber-50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                  <AlertTriangle className="text-white" size={22} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-zinc-950 tracking-tight">
                    Conflitos Detectados
                  </h2>
                  <p className="text-amber-700 text-sm font-medium mt-0.5">
                    {validationResult.summary.conflictDates} datas precisam de ajuste antes de confirmar a série
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-amber-100 rounded-xl transition-colors text-zinc-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Summary bar */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-3 text-center border border-amber-100">
                  <p className="text-2xl font-black text-zinc-900">{validationResult.summary.totalDates}</p>
                  <p className="text-xs font-medium text-zinc-500 mt-0.5">Total de Datas</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-3 text-center border border-emerald-100">
                  <p className="text-2xl font-black text-emerald-700">{validationResult.summary.validDates}</p>
                  <p className="text-xs font-medium text-emerald-600 mt-0.5">Confirmadas</p>
                </div>
                <div className="bg-rose-50 rounded-2xl p-3 text-center border border-rose-100">
                  <p className="text-2xl font-black text-rose-700">{validationResult.summary.conflictDates}</p>
                  <p className="text-xs font-medium text-rose-600 mt-0.5">Com Conflito</p>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
              <Info size={14} className="text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-700 font-medium">
                Para cada data com conflito, escolha uma nova data/horário ou marque como "Pular".
                A série só será salva após resolver todos os conflitos.
              </p>
            </div>

            {/* Conflict list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {validationResult.conflicts.map(conflict => {
                const res = resolutions[conflict.originalDate];
                const reasonInfo = REASON_LABELS[conflict.reason];
                const isSkipped = res?.skipped;
                const isResolved = isSkipped || res?.date !== conflict.originalDate;

                return (
                  <div
                    key={conflict.originalDate}
                    className={`rounded-2xl border p-5 transition-all ${
                      isSkipped
                        ? 'bg-zinc-50 border-zinc-200 opacity-60'
                        : isResolved
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-rose-200 shadow-sm'
                    }`}
                  >
                    {/* Original date info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold ${reasonInfo.color}`}>
                          {reasonInfo.icon}
                          {reasonInfo.label}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-800 capitalize">
                            {formatDisplayDate(conflict.originalDate)}
                          </p>
                          {conflict.holidayName && (
                            <p className="text-xs text-amber-600">Feriado: {conflict.holidayName}</p>
                          )}
                        </div>
                      </div>
                      {isResolved && !isSkipped && (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                          <Check size={14} />
                          Resolvido
                        </div>
                      )}
                    </div>

                    {/* Resolution controls */}
                    {!isSkipped && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <ChevronRight size={14} className="text-zinc-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-zinc-500">Nova data/horário:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs text-zinc-400 font-medium">Data</label>
                            <input
                              type="date"
                              value={res?.date || conflict.originalDate}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={e => setResolutions(prev => ({
                                ...prev,
                                [conflict.originalDate]: {
                                  ...prev[conflict.originalDate],
                                  date: e.target.value
                                }
                              }))}
                              className="w-full bg-white border border-zinc-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-zinc-400 font-medium">Horário</label>
                            <input
                              type="time"
                              value={res?.startTime || defaultStartTime}
                              onChange={e => setResolutions(prev => ({
                                ...prev,
                                [conflict.originalDate]: {
                                  ...prev[conflict.originalDate],
                                  startTime: e.target.value
                                }
                              }))}
                              className="w-full bg-white border border-zinc-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Skip toggle */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100">
                      <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                        <SkipForward size={12} />
                        Pular esta data (não criar agendamento)
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isSkipped}
                          onChange={e => setResolutions(prev => ({
                            ...prev,
                            [conflict.originalDate]: {
                              ...prev[conflict.originalDate],
                              skipped: e.target.checked
                            }
                          }))}
                        />
                        <div className="w-10 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-700" />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between gap-4">
              <div className="text-sm text-zinc-500">
                {pendingCount > 0 ? (
                  <span className="text-amber-600 font-semibold">
                    ⚠ {pendingCount} conflito{pendingCount > 1 ? 's' : ''} ainda sem resolução
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                    <Check size={14} />
                    Todos os conflitos resolvidos
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-semibold hover:bg-zinc-100 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  id="conflict-confirm-btn"
                  onClick={handleConfirm}
                  disabled={pendingCount > 0 || saving}
                  className="bg-rose-500 hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20 text-sm"
                >
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin" /> Salvando...</>
                  ) : (
                    <>
                      <Calendar size={16} />
                      Confirmar Série ({validationResult.summary.totalDates - validationResult.conflicts.filter(c => resolutions[c.originalDate]?.skipped).length} agendamentos)
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
