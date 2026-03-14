import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function Auth({ onBack, onLoginSuccess }: { onBack?: () => void, onLoginSuccess?: (user: any) => void }) {
  const [view, setView] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = view === 'login' ? '/auth/login' : '/auth/register';
      const body = view === 'login' 
        ? { email, password } 
        : { name, email, password, shopName };

      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      // Save token
      localStorage.setItem('token', data.token);
      
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setError('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setSuccess('Token de recuperação enviado! Verifique seu console (em produção seria seu e-mail).');
      setView('reset-password');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, token, newPassword })
      });
      setSuccess('Senha alterada com sucesso! Faça login.');
      setView('login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose-900/20 via-zinc-950 to-zinc-950 relative">
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar para o site
        </button>
      )}
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Sparkles className="text-white" size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2 bg-gradient-to-r from-rose-400 to-rose-600 bg-clip-text text-transparent">Salão Pro Manager</h1>
          <p className="text-zinc-400">Gestão profissional para seu salão de beleza</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">
          {view === 'forgot-password' ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <h2 className="text-xl font-bold text-white mb-2">Recuperar Senha</h2>
              <p className="text-sm text-zinc-400 mb-6">Insira seu e-mail para receber um token de recuperação.</p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">{error}</p>}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold py-4 rounded-xl transition-all"
              >
                {loading ? 'Processando...' : 'Enviar Token'}
              </button>

              <button
                type="button"
                onClick={() => setView('login')}
                className="w-full text-zinc-500 text-sm hover:text-white transition-colors"
              >
                Voltar para o Login
              </button>
            </form>
          ) : view === 'reset-password' ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <h2 className="text-xl font-bold text-white mb-2">Definir Nova Senha</h2>
              <p className="text-sm text-zinc-400 mb-6">Insira o token recebido e sua nova senha.</p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 ml-1">Token</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
                  placeholder="6 dígitos"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 ml-1">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">{error}</p>}
              {success && <p className="text-emerald-400 text-sm bg-emerald-400/10 p-3 rounded-lg">{success}</p>}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold py-4 rounded-xl transition-all"
              >
                {loading ? 'Processando...' : 'Alterar Senha'}
              </button>

              <button
                type="button"
                onClick={() => setView('login')}
                className="w-full text-zinc-500 text-sm hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {view === 'register' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400 ml-1">Nome Completo</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-zinc-800/50 border border-zinc-700 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
                        placeholder="Seu nome"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400 ml-1">Nome do Salão</label>
                    <div className="relative">
                      <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input
                        type="text"
                        required
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        className="w-full bg-zinc-800/50 border border-zinc-700 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
                        placeholder="Ex: Studio Glow Beauty"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-medium text-zinc-400">Senha</label>
                  {view === 'login' && (
                    <button
                      type="button"
                      onClick={() => setView('forgot-password')}
                      className="text-xs text-rose-500 hover:text-rose-400 font-medium"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-emerald-400 text-sm bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20">
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? 'Processando...' : view === 'login' ? 'Entrar' : 'Criar Conta'}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          )}

          {view !== 'forgot-password' && view !== 'reset-password' && (
            <p className="mt-8 text-center text-zinc-500 text-sm">
              {view === 'login' ? 'Não tem uma conta?' : 'Já possui uma conta?'}
              <button
                onClick={() => setView(view === 'login' ? 'register' : 'login')}
                className="ml-2 text-rose-500 font-semibold hover:text-rose-400"
              >
                {view === 'login' ? 'Cadastre-se' : 'Faça Login'}
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
