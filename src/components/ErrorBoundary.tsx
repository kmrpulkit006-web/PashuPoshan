import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PashuPoshan Uncaught Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    try {
      window.history.replaceState({ tab: 'scan' }, '', '/scan');
    } catch {}
    window.location.href = '/scan';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="min-h-screen bg-field-base text-field-text dark:bg-slate-950 dark:text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-danger-500/15 border border-danger-500/30 text-danger-700 dark:text-rose-400 flex items-center justify-center mb-4">
            <AlertOctagon className="w-9 h-9" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-black mb-2">
            Something went wrong • कुछ गलत हो गया
          </h2>
          <p className="text-sm text-field-text/70 dark:text-slate-300 max-w-sm mb-6 leading-relaxed">
            The application encountered an unexpected issue. Your locally saved test records and cattle data remain safe.<br />
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              चिंता न करें, आपके पहले से सहेजे गए सभी टेस्ट रिकॉर्ड व पशु डेटा फोन में सुरक्षित हैं।
            </span>
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center space-x-2 px-6 py-3.5 bg-[#1F5D3B] hover:bg-[#184a2f] text-white text-sm font-black rounded-2xl shadow-lg transition-all min-h-[56px] active:scale-95"
            aria-label="Reload application"
          >
            <RotateCcw className="w-5 h-5" aria-hidden="true" />
            <span>Reload App • ऐप दोबारा शुरू करें</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
