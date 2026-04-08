import React, { useState } from 'react';
import {
  Calendar, Clock, Repeat, User, Layers, X, Loader2,
  AlertCircle, ChevronRight, Package, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Service, Staff, ServiceCombo, RecurrenceValidationResult, ResolvedDate } from '../types';
import { api } from '../services/api';
import ConflictResolutionModal from './ConflictResolutionModal';

interface RecurringAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  services: Service[];
  staff: Staff[];
  combos: ServiceCombo[];
  onSuccess: (message: string) => void;
}

const DAYS_PT = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

type ServiceMode = 'service' | 'combo';

export default function RecurringAppointmentModal({
  isOpen,
  onClose,
  clients,
  services,
  staff,
  combos,
  onSuccess
}: RecurringAppointmentModalProps) {
  const [step, setStep] = useState<'form' | 'validating' | 'conflicts'>('form');

  // Form state
  const [clientId, setClientId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [serviceMode, setServiceMode] = useState<ServiceMode>('service');
  const [serviceId, setServiceId] = useState('');
  const [comboId, setComboId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState(2); // Tuesday default
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly'>('weekly');
  const [seriesStartDate, setSeriesStartDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [seriesEndDate, setSeriesEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });

  // Validation state
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<RecurrenceValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedClient = clients.find(c => c.id === clientId);
  const selectedStaff = staff.find(s => s.id === staffId);
  const selectedService = services.find(s => s.id === serviceId);
  const selectedCombo = combos.find(c => c.id === comboId);

  const isFormValid =
    clientId &&
    staffId &&
    (serviceMode === 'service' ? serviceId : comboId) &&
    startTime &&
    seriesStartDate &&
    seriesEndDate &&
    seriesEndDate > seriesStartDate;

  // ── Step 1: Validate ──────────────────────────────────────────
  const handleValidate = async () => {
    if (!isFormValid) return;
    setValidating(true);
    setError(null);
    try {
      const result = await api.post('/appointments/recurring/validate', {
        staffId,
        serviceId: serviceMode === 'service' ? serviceId : undefined,
        comboId: serviceMode === 'combo' ? comboId : undefined,
        startTime,
        dayOfWeek,
        frequency,
        seriesStartDate,
        seriesEndDate
      });

      setValidationResult(result);

      if (result.hasConflicts) {
        setStep('conflicts');
      } else {
        // No conflicts — directly save
        await saveWithDates(
          result.validDatesList.map((d: string) => ({ date: d, startTime }))
        );
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao validar a série.');
    } finally {
      setValidating(false);
    }
  };

  // ── Step 2: Save ──────────────────────────────────────────────
  const saveWithDates = async (resolvedDates: ResolvedDate[]) => {
    await api.post('/appointments/recurring', {
      staffId,
      staffName: selectedStaff?.name || '',
      clientId,
      clientName: selectedClient?.name || '',
      clientPhone: selectedClient?.phone || '',
      serviceId: serviceMode === 'service' ? serviceId : undefined,
      serviceName: serviceMode === 'service' ? selectedService?.name : selectedCombo?.name,
      comboId: serviceMode === 'combo' ? comboId : undefined,
      price: serviceMode === 'service' ? selectedService?.price : selectedCombo?.price,
      frequency,
      dayOfWeek,
      seriesStartDate,
      seriesEndDate,
      resolvedDates
    });

    const totalCreated = resolvedDates.filter(d => !d.skipped).length;
    onSuccess(`✅ Série criada com sucesso! ${totalCreated} agendamentos confirmados.`);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setStep('form');
    setClientId('');
    setStaffId('');
    setServiceId('');
    setComboId('');
    setStartTime('09:00');
    setDayOfWeek(2);
    setFrequency('weekly');
    setValidationResult(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && step !== 'conflicts' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <Repeat className="text-white" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-zinc-950 tracking-tight">Agendamento Recorrente</h2>
                    <p className="text-xs text-zinc-500 font-medium">Série anual com validação automática de conflitos</p>
                  </div>
                </div>
                <button
                  onClick={() => { onClose(); resetForm(); }}
                  className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Client */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                    <User size={14} className="text-zinc-400" />
                    Cliente *
                  </label>
                  <select
                    id="recurring-client"
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Staff */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                    <Users size={14} className="text-zinc-400" />
                    Profissional *
                  </label>
                  <select
                    id="recurring-staff"
                    value={staffId}
                    onChange={e => setStaffId(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                  >
                    <option value="">Selecione um profissional</option>
                    {staff.filter(s => s.active).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Service or Combo */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                    <Layers size={14} className="text-zinc-400" />
                    Serviço ou Combo *
                  </label>

                  {/* Mode toggle */}
                  <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setServiceMode('service')}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                        serviceMode === 'service'
                          ? 'bg-white shadow-sm text-zinc-900'
                          : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      Serviço Único
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceMode('combo')}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        serviceMode === 'combo'
                          ? 'bg-white shadow-sm text-zinc-900'
                          : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      <Package size={13} />
                      Combo
                    </button>
                  </div>

                  {serviceMode === 'service' ? (
                    <select
                      id="recurring-service"
                      value={serviceId}
                      onChange={e => setServiceId(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                    >
                      <option value="">Selecione um serviço</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.duration}min)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <>
                      {combos.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                          <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-amber-700 font-semibold">Nenhum combo cadastrado</p>
                            <p className="text-xs text-amber-600">Crie combos na aba Agenda das Configurações.</p>
                          </div>
                        </div>
                      ) : (
                        <select
                          id="recurring-combo"
                          value={comboId}
                          onChange={e => setComboId(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                        >
                          <option value="">Selecione um combo</option>
                          {combos.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.totalDurationMin}min)
                            </option>
                          ))}
                        </select>
                      )}
                    </>
                  )}

                  {/* Duration preview */}
                  {(selectedService || selectedCombo) && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-100">
                      <Clock size={12} className="text-rose-400" />
                      <span>
                        Bloco bloqueado na agenda:{' '}
                        <strong className="text-rose-600">
                          {serviceMode === 'service'
                            ? `${selectedService?.duration}min`
                            : `${selectedCombo?.totalDurationMin}min`}
                        </strong>
                        {' '}por agendamento
                      </span>
                    </div>
                  )}
                </div>

                {/* Schedule */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                    <Calendar size={14} className="text-zinc-400" />
                    Recorrência *
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-400 font-medium">Dia da semana</label>
                      <select
                        id="recurring-day"
                        value={dayOfWeek}
                        onChange={e => setDayOfWeek(Number(e.target.value))}
                        className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                      >
                        {DAYS_PT.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-400 font-medium">Frequência</label>
                      <select
                        value={frequency}
                        onChange={e => setFrequency(e.target.value as 'weekly' | 'biweekly')}
                        className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                      >
                        <option value="weekly">Semanal</option>
                        <option value="biweekly">Quinzenal</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-zinc-400 font-medium">Horário do agendamento</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-400 font-medium">Início da série</label>
                      <input
                        type="date"
                        value={seriesStartDate}
                        onChange={e => setSeriesStartDate(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-zinc-400 font-medium">Fim da série</label>
                      <input
                        type="date"
                        value={seriesEndDate}
                        min={seriesStartDate}
                        onChange={e => setSeriesEndDate(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
                    <p className="text-sm text-rose-700 font-medium">{error}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between gap-4">
                <div className="text-xs text-zinc-400 font-medium">
                  O sistema irá validar cada data automaticamente antes de salvar.
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { onClose(); resetForm(); }}
                    className="px-5 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-semibold hover:bg-zinc-100 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    id="recurring-validate-btn"
                    type="button"
                    onClick={handleValidate}
                    disabled={!isFormValid || validating}
                    className="bg-rose-500 hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20 text-sm"
                  >
                    {validating ? (
                      <><Loader2 size={16} className="animate-spin" /> Validando...</>
                    ) : (
                      <>Validar Série <ChevronRight size={16} /></>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conflict Resolution Modal */}
      {validationResult && step === 'conflicts' && (
        <ConflictResolutionModal
          isOpen={step === 'conflicts'}
          onClose={() => setStep('form')}
          validationResult={validationResult}
          defaultStartTime={startTime}
          onConfirm={saveWithDates}
        />
      )}
    </>
  );
}
