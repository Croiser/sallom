import React, { useState } from 'react';
import { 
  BookOpen, 
  Search,
  PlayCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { helpContent } from '../data/helpContent';

interface HelpGuideProps {
  onNavigate: (tab: string) => void;
}

export default function HelpGuide({ onNavigate }: HelpGuideProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Filter content based on search term
  const allEntries = Object.entries(helpContent).filter(([key]) => key !== 'default');

  const handleStartTour = () => {
    window.dispatchEvent(new Event('start-tour'));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-12">
      {/* Header & Search */}
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-brand-500/10 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
          <BookOpen className="text-brand-500" size={40} />
        </div>
        <div>
          <h2 className="text-4xl font-black text-surface-900 tracking-tight mb-4">Como podemos ajudar?</h2>
          <p className="text-surface-500 max-w-xl mx-auto text-lg">
            Pesquise por dúvidas, navegue pelas categorias abaixo ou inicie o tour guiado para conhecer o sistema.
          </p>
        </div>

        <div className="max-w-2xl mx-auto relative">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="text-surface-400" size={24} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ex: Como agendar um cliente? Como alterar o preço?"
            className="w-full pl-16 pr-6 py-5 bg-white border-2 border-surface-200 rounded-[2rem] text-lg focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <button
          onClick={handleStartTour}
          className="bg-white p-8 rounded-[2rem] border border-surface-200 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/10 transition-all group text-left flex items-center gap-6"
        >
          <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform">
            <PlayCircle size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-surface-900 mb-2 group-hover:text-brand-500 transition-colors">Tour Interativo</h3>
            <p className="text-surface-500 text-sm">Refaça o passo a passo inicial para aprender onde fica cada menu.</p>
          </div>
        </button>

        <a 
          href="https://wa.me/5511999999999" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-surface-900 p-8 rounded-[2rem] hover:bg-surface-800 transition-all group text-left flex items-center gap-6"
        >
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
            <MessageSquare size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Suporte Humano</h3>
            <p className="text-surface-400 text-sm">Fale com nossa equipe pelo WhatsApp de Seg a Sex, das 09h às 18h.</p>
          </div>
        </a>
      </div>

      {/* Categorized FAQs */}
      <div className="space-y-8 max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
          <HelpCircle className="text-brand-500" />
          Guias e Soluções por Módulo
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {allEntries.map(([key, content]) => {
            if (
              searchTerm &&
              !content.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
              !content.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
              !content.faqs.some(f => f.q.toLowerCase().includes(searchTerm.toLowerCase()) || f.a.toLowerCase().includes(searchTerm.toLowerCase())) &&
              !content.troubleshooting.some(t => t.problem.toLowerCase().includes(searchTerm.toLowerCase()) || t.solution.toLowerCase().includes(searchTerm.toLowerCase()))
            ) {
              return null;
            }

            const isOpen = openSection === key;

            return (
              <div key={key} className="bg-white border border-surface-200 rounded-3xl overflow-hidden shadow-sm hover:border-brand-500/30 transition-colors">
                <button
                  onClick={() => setOpenSection(isOpen ? null : key)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left"
                >
                  <div>
                    <h4 className="text-lg font-bold text-surface-900">{content.title}</h4>
                    <p className="text-surface-500 text-sm mt-1">{content.description}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-surface-50 flex items-center justify-center text-surface-400 flex-shrink-0 ml-4">
                    {isOpen ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-surface-100"
                    >
                      <div className="p-8 space-y-8 bg-surface-50">
                        {content.faqs.length > 0 && (
                          <div className="space-y-4">
                            <h5 className="font-bold text-surface-900 uppercase tracking-widest text-xs">Perguntas Frequentes</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {content.faqs.map((faq, index) => (
                                <div key={index} className="bg-white p-5 rounded-2xl border border-surface-200">
                                  <p className="font-bold text-surface-900 text-sm mb-2">{faq.q}</p>
                                  <p className="text-surface-600 text-sm leading-relaxed">{faq.a}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {content.troubleshooting.length > 0 && (
                          <div className="space-y-4">
                            <h5 className="font-bold text-amber-600 uppercase tracking-widest text-xs">Resolução de Problemas</h5>
                            <div className="space-y-4">
                              {content.troubleshooting.map((ts, index) => (
                                <div key={index} className="bg-amber-50 p-5 rounded-2xl border border-amber-200 flex flex-col sm:flex-row gap-4 sm:items-center">
                                  <div className="flex-1">
                                    <p className="font-bold text-amber-900 text-sm mb-1">{ts.problem}</p>
                                    <p className="text-amber-800 text-sm">{ts.solution}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-4 flex justify-end">
                           <button 
                             onClick={(e) => { e.stopPropagation(); onNavigate(key); }}
                             className="text-brand-500 font-bold text-sm hover:text-brand-600 transition-colors"
                           >
                             Acessar módulo de {content.title} &rarr;
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
