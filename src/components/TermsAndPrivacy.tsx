import React, { useState } from 'react';
import { ArrowLeft, Shield, FileText, Lock, Globe } from 'lucide-react';
import SEO from './SEO';

export default function TermsAndPrivacy({ initialTab = 'terms', onBack }: { initialTab?: 'terms' | 'privacy', onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-rose-500/30 selection:text-white relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose-900/10 via-zinc-950 to-zinc-950">
      <SEO 
        title={activeTab === 'terms' ? 'Termos de Uso | SallonProManager by dodilesistemas' : 'Política de Privacidade | SallonProManager by dodilesistemas'}
        description="Termos de Uso e Política de Privacidade do sistema SallonProManager by dodilesistemas."
      />
      
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/10 w-[500px] h-[500px] bg-rose-500/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-1/4 right-1/10 w-[400px] h-[400px] bg-rose-500/3 blur-[120px] rounded-full -z-10" />

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="group mb-10 text-zinc-400 hover:text-white flex items-center gap-2 transition-all duration-300"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para o site</span>
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Documentos Legais</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent mb-4">
            Termos de Uso &amp; Privacidade
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
            Transparência e segurança jurídica para você e suas clientes. Saiba como gerenciamos os dados e as regras de utilização da plataforma SallonProManager by dodilesistemas.
          </p>
        </div>

        {/* Tabs Control */}
        <div className="flex bg-zinc-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-850 max-w-md mx-auto mb-12">
          <button 
            onClick={() => setActiveTab('terms')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${activeTab === 'terms' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-zinc-400 hover:text-white'}`}
          >
            <FileText size={18} />
            <span>Termos de Uso</span>
          </button>
          <button 
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${activeTab === 'privacy' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-zinc-400 hover:text-white'}`}
          >
            <Shield size={18} />
            <span>Privacidade</span>
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-850 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative">
          
          {activeTab === 'terms' ? (
            <div className="space-y-8 text-zinc-300 leading-relaxed text-sm md:text-base">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Globe className="text-rose-500" size={22} />
                  1. Visão Geral e Aceitação
                </h2>
                <p>
                  Bem-vindo ao <strong>SallonProManager</strong> (uma marca operada sob licenciamento e suporte tecnológico pela <strong>DodileSistemas</strong>). Ao acessar nosso site, criar uma conta de teste grátis ou assinar um de nossos planos mensais/anuais, você concorda expressamente em estar vinculado a estes Termos de Uso e a todas as leis e regulamentos aplicáveis.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="text-rose-500" size={22} />
                  2. Licenciamento de Software (SaaS)
                </h2>
                <p>
                  O SallonProManager by dodilesistemas fornece a você uma licença limitada, revogável, não exclusiva e intransferível para acessar a plataforma de gerenciamento. É estritamente proibido tentar realizar engenharia reversa, sublicenciar, comercializar ou copiar elementos estruturais do sistema sem o consentimento prévio por escrito dos proprietários e da DodileSistemas.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Lock className="text-rose-500" size={22} />
                  3. Cadastro e Segurança de Contas
                </h2>
                <p>
                  Para utilizar os recursos administrativos do sistema (agendamentos, financeiro, split de pagamentos e estoque), você deve fornecer dados cadastrais verídicos e completos. A guarda das credenciais de acesso é de sua inteira responsabilidade, devendo reportar qualquer vazamento ou uso indevido imediatamente ao nosso suporte técnico.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="text-rose-500" size={22} />
                  4. Disponibilidade do Serviço (SLA)
                </h2>
                <p>
                  Nossa infraestrutura busca manter um índice de disponibilidade (SLA) de pelo menos 99,9%. Eventuais janelas de manutenção serão programadas prioritariamente de madrugada para minimizar o impacto na operação dos salões.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">5. Modificações dos Termos</h2>
                <p>
                  Reservamo-nos o direito de revisar estes Termos a qualquer momento. Caso ocorram mudanças significativas na política de cobrança ou no uso de recursos do sistema, os usuários serão notificados diretamente pelo painel administrativo ou por e-mail.
                </p>
              </div>

              <div className="pt-6 border-t border-zinc-800 text-xs text-zinc-500">
                Última atualização: 19 de Maio de 2026. Em conformidade com a legislação civil brasileira.
              </div>
            </div>
          ) : (
            <div className="space-y-8 text-zinc-300 leading-relaxed text-sm md:text-base">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="text-rose-500" size={22} />
                  1. Nosso Compromisso com a Privacidade
                </h2>
                <p>
                  Sua privacidade é prioridade máxima. Nós coletamos apenas as informações estritamente necessárias para a operação da sua agenda digital, emissão de relatórios de comissão, controle de fluxo de caixa e envio de lembretes via WhatsApp.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Lock className="text-rose-500" size={22} />
                  2. Coleta e Uso de Informações
                </h2>
                <p>
                  Os dados fornecidos por suas clientes (Nome, Telefone e Histórico de Serviços) pertencem integralmente ao seu salão de beleza. O SallonProManager by dodilesistemas atua apenas como <strong>operador técnico dos dados</strong>, nunca comercializando ou compartilhando essas informações com terceiros para fins publicitários.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="text-rose-500" size={22} />
                  3. Segurança de Dados e Criptografia
                </h2>
                <p>
                  Todas as conexões e requisições à nossa API de produção utilizam criptografia SSL (HTTPS) de última geração. Nossos bancos de dados operam de forma isolada (multi-tenant), garantindo total proteção contra acessos externos ou vazamentos de dados entre contas de salões de beleza parceiros.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Globe className="text-rose-500" size={22} />
                  4. Conformidade com a LGPD
                </h2>
                <p>
                  A plataforma foi estruturada respeitando os pilares da <strong>Lei Geral de Proteção de Dados (LGPD)</strong>. A qualquer momento, você ou seus clientes finais podem solicitar a exclusão total ou exportação dos registros através dos canais de suporte técnico oficiais.
                </p>
              </div>

              <div className="pt-6 border-t border-zinc-800 text-xs text-zinc-500">
                Última atualização: 19 de Maio de 2026. Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/18).
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
