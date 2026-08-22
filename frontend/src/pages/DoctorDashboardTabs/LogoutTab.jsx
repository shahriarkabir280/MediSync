import React, { useState, useEffect } from "react";
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const LogoutTab = () => {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sessionInfo, setSessionInfo] = useState({
    loginTime: null,
    sessionDuration: null,
    lastActivity: null
  });

  useEffect(() => {
    let loginTime = localStorage.getItem('loginTime');
    const now = new Date();

    if (!loginTime) {
      // Fallback: Use current time as login time if not found
      loginTime = now.toISOString();
      localStorage.setItem('loginTime', loginTime);
    }

    const loginDate = new Date(loginTime);
    const duration = Math.max(0, Math.floor((now - loginDate) / 1000 / 60)); // minutes
    setSessionInfo({
      loginTime: loginDate,
      sessionDuration: duration,
      lastActivity: now
    });
  }, []);

  const handleLogoutClick = () => setShowConfirmation(true);
  const cancelLogout = () => setShowConfirmation(false);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      localStorage.removeItem('loginTime'); // Cleanup on logout
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatTime = (date) => {
    return date?.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-xl z-40 py-3 -mx-6 px-6 border-b border-border/40 transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-xl">
            <LogOut className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Logout session</h1>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wide mt-0.5">End your current session safely</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto py-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {!showConfirmation ? (
          <div className="space-y-6">
            {/* Current Session Info */}
            <div className="bg-card/40 backdrop-blur-3xl border border-border/60 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-500" />
                Current session details
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Account holder</p>
                    <p className="text-[13px] font-semibold text-foreground">{user?.name || 'Dr. John Doe'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Login time</p>
                    <p className="text-[13px] font-semibold text-foreground">{formatTime(sessionInfo.loginTime)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Session status</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/10">
                      <CheckCircle className="h-3 w-3" /> Active
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Active duration</p>
                    <p className="text-[14px] font-bold text-indigo-500">{formatDuration(sessionInfo.sessionDuration)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Logout Action */}
            <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-6 text-center">
              <h3 className="text-sm font-bold text-foreground mb-2">Ready to end your session?</h3>
              <p className="text-xs text-muted-foreground mb-6">You will be securely signed out of your MediSync dashboard.</p>
              <button
                onClick={handleLogoutClick}
                className="w-full max-w-[240px] px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-[11px] hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout now
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation View */
          <div className="bg-card/40 backdrop-blur-3xl border border-border/60 rounded-xl p-8 shadow-xl text-center space-y-6">
            <div className="flex items-center justify-center w-14 h-14 mx-auto bg-rose-500/10 rounded-full animate-bounce">
              <AlertTriangle className="h-7 w-7 text-rose-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Confirm logout?</h2>
              <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
                Are you sure you want to end your session? Any unsaved changes in your tabs may be lost.
              </p>
            </div>

            {sessionInfo.loginTime && (
              <div className="bg-background/40 border border-border/40 rounded-xl p-4 max-w-[320px] mx-auto space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-medium">Session duration</span>
                  <span className="text-foreground font-bold">{formatDuration(sessionInfo.sessionDuration)}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-medium">Last activity</span>
                  <span className="text-foreground font-bold">Just now</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={cancelLogout}
                disabled={isLoggingOut}
                className="flex-1 max-w-[140px] px-4 py-2 border border-border rounded-xl text-foreground font-bold text-[11px] hover:bg-muted transition-all disabled:opacity-50"
              >
                Go back
              </button>
              <button
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="flex-1 max-w-[140px] px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-[11px] hover:bg-rose-700 shadow-md shadow-rose-500/10 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Closing...
                  </>
                ) : (
                  <>
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogoutTab;