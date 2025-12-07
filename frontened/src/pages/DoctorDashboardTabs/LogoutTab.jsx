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
        // Get session information from localStorage or calculate
        const loginTime = localStorage.getItem('loginTime');
        const now = new Date();
        
        if (loginTime) {
            const loginDate = new Date(loginTime);
            const duration = Math.floor((now - loginDate) / 1000 / 60); // minutes
            setSessionInfo({
                loginTime: loginDate,
                sessionDuration: duration,
                lastActivity: now
            });
        }
    }, []);

    const handleLogoutClick = () => {
        setShowConfirmation(true);
    };

    const confirmLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            // The logout function in AuthContext will handle navigation
        } catch (error) {
            console.error('Logout error:', error);
            setIsLoggingOut(false);
        }
    };

    const cancelLogout = () => {
        setShowConfirmation(false);
    };

    const formatDuration = (minutes) => {
        if (minutes < 60) {
            return `${minutes} minutes`;
        }
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

    if (showConfirmation) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Confirm Logout</h1>
                    <p className="text-muted-foreground">Are you sure you want to end your session?</p>
                </div>

                {/* Confirmation Dialog */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-center mb-2">End Session</h3>
                    <p className="text-gray-600 text-center mb-6">
                        You will be logged out of your CareConnect account. Any unsaved changes will be lost.
                    </p>

                    {/* Session Info */}
                    {sessionInfo.loginTime && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Session started:</span>
                                <span className="font-medium">{formatTime(sessionInfo.loginTime)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Session duration:</span>
                                <span className="font-medium">{formatDuration(sessionInfo.sessionDuration)}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={cancelLogout}
                            disabled={isLoggingOut}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmLogout}
                            disabled={isLoggingOut}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoggingOut ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Signing out...
                                </>
                            ) : (
                                <>
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Logout</h1>
                <p className="text-muted-foreground">End your current session and return to the login page.</p>
            </div>

            <div className="max-w-2xl">
                {/* Current Session Info */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Current Session
                    </h2>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-medium text-gray-900 mb-3">Account Information</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Name:</span>
                                    <span className="font-medium">{user?.name || 'Dr. User'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Email:</span>
                                    <span className="font-medium">{user?.email || 'user@example.com'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Role:</span>
                                    <span className="font-medium">Doctor</span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-gray-900 mb-3">Session Details</h3>
                            <div className="space-y-2 text-sm">
                                {sessionInfo.loginTime && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Login time:</span>
                                            <span className="font-medium">{formatTime(sessionInfo.loginTime)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Duration:</span>
                                            <span className="font-medium">{formatDuration(sessionInfo.sessionDuration)}</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className="font-medium text-green-600 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logout Actions */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <LogOut className="h-5 w-5 text-red-600" />
                        Ready to Logout?
                    </h2>
                    
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            You will be signed out of your CareConnect account and redirected to the login page.
                        </p>

                        <button
                            onClick={handleLogoutClick}
                            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogoutTab;