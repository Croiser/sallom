import React from 'react';
import { X, HelpCircle, AlertTriangle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { helpContent, HelpContent } from '../../data/helpContent';

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
}

export default function HelpDrawer({ isOpen, onClose, activeTab }: HelpDrawerProps) {
  const content: HelpContent = helpContent[activeTab] || helpContent['default'];
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col border-l border-surface-200"
          >
            {/* Header */}
            <div className="h-20 border-b border-surface-200 flex items-center justify-between px-6 bg-surface-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-500">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-surface-900 text-lg">Ajuda Contextual</h2>
                  <p className="text-xs text-surface-500 font-medium">Você está em: {content.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-200 rounded-xl transition-colors text-surface-500 hover:text-surface-900"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-white">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-surface-900">{content.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{content.description}</p>
              </div>

              {content.faqs.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-surface-900 flex items-center gap-2">
                    <MessageSquare size={16} className="text-brand-500" />
                    Dúvidas Frequentes
                  </h4>
                  <div className="space-y-2">
                    {content.faqs.map((faq, index) => (
                      <div 
                        key={index} 
                        className="border border-surface-200 rounded-2xl overflow-hidden bg-surface-50"
                      >
                        <button
                          onClick={() => setOpenFaq(openFaq === index ? null : index)}
                          className="w-full px-4 py-3 text-left flex items-center justify-between text-sm font-bold text-surface-900 hover:bg-surface-100 transition-colors"
                        >
                          {faq.q}
                          {openFaq === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <AnimatePresence>
                          {openFaq === index && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-4 pb-4 text-sm text-surface-600 leading-relaxed bg-white"
                            >
                              <div className="pt-2 border-t border-surface-100">
                                {faq.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.troubleshooting.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-amber-600 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    Resolução de Problemas
                  </h4>
                  <div className="space-y-3">
                    {content.troubleshooting.map((ts, index) => (
                      <div key={index} className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                        <p className="text-xs font-bold text-amber-900 mb-1">Problema:</p>
                        <p className="text-sm text-amber-800 mb-3">{ts.problem}</p>
                        <p className="text-xs font-bold text-emerald-700 mb-1">Solução:</p>
                        <p className="text-sm text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-100">{ts.solution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-surface-200 bg-surface-50 flex-shrink-0">
              <p className="text-xs text-center text-surface-500 mb-3">
                Não encontrou o que procurava?
              </p>
              <button className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-brand-500/20">
                Falar com Suporte WhatsApp
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
