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
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-field-base text-field-text dark:bg-slate-950 dark:text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-danger-500/15 border border-danger-500/30 text-danger-700 dark:text-rose-400 flex items-center justify-center mb-4">
            <AlertOctagon className="w-9 h-9" />
          </div>
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <p className="text-sm text-field-text/70 dark:text-slate-400 max-w-xs mb-6">
            The application encountered an unexpected issue. Your locally saved test records and herd data remain safe.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center space-x-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-2xl shadow-md transition-all min-h-[56px]"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Reload Application</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
