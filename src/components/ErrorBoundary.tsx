import React from "react";
import { AlertOctagon, RotateCcw, Trash2 } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dragon Council encountered an unrecoverable render error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetLocalData = () => {
    const confirmed = window.confirm(
      "This will clear all locally stored alliance data (roster, snapshots, settings, notes) on this device and reload the app. This cannot be undone. Continue?"
    );
    if (!confirmed) return;

    const keys = [
      "dragon_council_players",
      "dragon_council_snapshots",
      "dragon_council_overrides",
      "dragon_council_notes",
      "dragon_council_settings",
      "dragon_council_sessions",
      "dragon_council_war_logs",
      "dragon_council_theme",
      "dragon_council_officer_profile",
      "discord_officer_user"
    ];
    keys.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (_) {}
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0F172A] p-6">
          <div className="max-w-lg w-full bg-[#1E293B] border border-[#475569] rounded-xl p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
              <AlertOctagon size={28} className="text-red-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-lg font-bold text-slate-50">Something Went Wrong</h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Dragon Council hit an unexpected error and couldn't continue rendering this page.
                Your alliance data on this device has not been affected.
              </p>
              {this.state.error?.message && (
                <p className="text-xs font-mono text-slate-500 bg-[#0F172A] border border-[#334155] rounded-lg p-3 text-left break-words">
                  {this.state.error.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw size={15} />
                Reload App
              </button>
              <button
                onClick={this.handleResetLocalData}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent hover:bg-[#334155] text-slate-400 hover:text-slate-200 border border-[#475569] font-semibold text-sm rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 size={15} />
                Clear Local Data & Reload
              </button>
            </div>

            <p className="text-[11px] text-slate-500 pt-1">
              If reloading doesn't resolve this, only use "Clear Local Data" as a last resort — it will remove your locally stored roster, settings, and notes on this device.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
