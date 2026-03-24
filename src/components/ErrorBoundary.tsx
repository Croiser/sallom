import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Ocorreu um erro inesperado.';
      let isPermissionError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isPermissionError = parsed.error.includes('permission-denied') || parsed.error.includes('insufficient permissions');
            errorMessage = isPermissionError 
              ? `Erro de Permissão: Você não tem autorização para realizar esta operação (${parsed.operationType} em ${parsed.path}).`
              : `Erro no Banco de Dados: ${parsed.error}`;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-zinc-200 text-center">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertCircle size={40} className="text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">Ops! Algo deu errado</h2>
            <div className="bg-zinc-50 rounded-2xl p-4 mb-8 text-sm text-zinc-600 text-left font-mono break-all">
              {errorMessage}
            </div>
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                Tentar Novamente
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full bg-white border border-zinc-200 text-zinc-900 py-4 rounded-2xl font-bold hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
              >
                <Home size={20} />
                Voltar para o Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
