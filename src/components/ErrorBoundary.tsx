import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error captured in Dragon Council ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gothic-void text-gothic-silver flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-gothic-velvet border border-red-500/30 rounded-2xl p-8 space-y-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
            
            <div className="w-16 h-16 bg-red-950/40 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold font-display uppercase tracking-wider text-gothic-silver">Council Sector Fault Detected</h2>
              <p className="text-xs text-gothic-rose/80 font-mono leading-relaxed">
                An unexpected exception occurred within the frontend rendering pipeline. The ledger state has been isolated to prevent corruption.
              </p>
              {this.state.error && (
                <div className="p-3 bg-gothic-ink border border-gothic-silver/20 rounded-lg text-[10px] font-mono text-red-300 text-left overflow-x-auto max-h-24">
                  {this.state.error.toString()}
                </div>
              )}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gothic-silver hover:bg-white text-[#111113] font-mono font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              <RefreshCw size={14} /> Reload Council Command Interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}