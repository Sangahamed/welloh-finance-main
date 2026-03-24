import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    getUserAccount,
    updateUserAccount,
    getAllUsers,
    addAnalysisHistory as dbAddAnalysisHistory,
    clearAnalysisHistory as dbClearAnalysisHistory,
    addAlert as dbAddAlert,
    removeAlert as dbRemoveAlert,
} from '../lib/database';
import type { User, UserAccount, HistoryItem, Alert } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface SignUpData {
    fullName: string;
    email: string;
    password: string;
}

interface AuthContextType {
    currentUser: User | null;
    currentUserAccount: UserAccount | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (signupData: Omit<SignUpData, 'password'> & {password: string}) => Promise<void>;
    logout: () => Promise<void>;
    updateCurrentUserAccount: (updates: Partial<UserAccount>) => Promise<void>;
    getAllUserAccounts: () => Promise<UserAccount[]>;
    getUserAccountById: (userId: string) => Promise<UserAccount | null>;
    addHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => Promise<void>;
    clearHistory: () => Promise<void>;
    addAlert: (alertData: Omit<Alert, 'id'>) => Promise<void>;
    removeAlert: (alertId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserAccount = useCallback(async (supabaseUser: SupabaseUser | null) => {
        if (supabaseUser) {
            try {
                const account = await getUserAccount(supabaseUser.id);
                
                if (account) {
                    setCurrentUser({
                        id: account.id,
                        email: supabaseUser.email,
                        fullName: account.fullName,
                        role: account.role,
                    });
                    setCurrentUserAccount({
                        ...account,
                        email: supabaseUser.email,
                    });
                } else {
                    console.error(`Compte introuvable pour ${supabaseUser.id}`);
                    setCurrentUser(null);
                    setCurrentUserAccount(null);
                }
            } catch (e: any) {
                console.error("Erreur de chargement du compte:", e.message);
                setCurrentUser(null);
                setCurrentUserAccount(null);
            }
        } else {
            setCurrentUser(null);
            setCurrentUserAccount(null);
        }
        setIsLoading(false);
    }, []);
    
    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        let initialised = false;

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'INITIAL_SESSION') {
                initialised = true;
                await fetchUserAccount(session?.user ?? null);
            } else if (event === 'SIGNED_IN') {
                setIsLoading(true);
                await fetchUserAccount(session?.user ?? null);
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setCurrentUserAccount(null);
                setIsLoading(false);
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                await fetchUserAccount(session.user);
            }
        });

        // Fallback: if onAuthStateChange never fires INITIAL_SESSION within 8s
        const fallbackTimer = setTimeout(() => {
            if (!initialised) {
                console.warn("INITIAL_SESSION non reçu, récupération manuelle de la session.");
                supabase.auth.getSession().then(({ data }) => {
                    fetchUserAccount(data?.session?.user ?? null);
                });
            }
        }, 8000);

        return () => {
            authListener?.subscription.unsubscribe();
            clearTimeout(fallbackTimer);
        };
    }, [fetchUserAccount]);

    const login = async (email: string, password: string) => {
        if (!supabase) throw new Error("Supabase client is not initialized.");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            if (error.message.includes("Invalid login credentials")) {
                throw new Error("L'adresse e-mail ou le mot de passe est incorrect.");
            }
            throw new Error(error.message);
        }
    };

    const signup = async (signupData: SignUpData) => {
        if (!supabase) throw new Error("Supabase client is not initialized.");
        const { fullName, email, password } = signupData;
        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        });
        if (signUpError) {
            if (signUpError.message.includes("User already registered")) {
                throw new Error("Un utilisateur avec cette adresse e-mail existe déjà.");
            }
            throw new Error(signUpError.message);
        }
    };

    const logout = async () => {
        if (!supabase) throw new Error("Supabase client is not initialized.");
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };
    
    const updateCurrentUserAccount = async (updates: Partial<UserAccount>) => {
        if (!currentUserAccount) return;
        const updatedAccount = await updateUserAccount(currentUserAccount.id, updates);
        if (updatedAccount) {
            setCurrentUserAccount({ ...updatedAccount, email: currentUserAccount.email });
        }
    };
    
    const getAllUserAccounts = async (): Promise<UserAccount[]> => getAllUsers();

    const getUserAccountById = async (userId: string): Promise<UserAccount | null> => getUserAccount(userId);

    const addHistoryItem = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
        if (!currentUser) return;
        const newItem = await dbAddAnalysisHistory(currentUser.id, item);
        if (newItem && currentUserAccount) {
            const updatedHistory = [newItem, ...currentUserAccount.analysisHistory].slice(0, 20);
            setCurrentUserAccount(prev => prev ? { ...prev, analysisHistory: updatedHistory } : null);
        }
    };

    const clearHistory = async () => {
        if (!currentUser) return;
        const success = await dbClearAnalysisHistory(currentUser.id);
        if (success) {
            setCurrentUserAccount(prev => prev ? { ...prev, analysisHistory: [] } : null);
        }
    };

    const addAlert = async (alertData: Omit<Alert, 'id'>) => {
        if (!currentUser) return;
        const newAlert = await dbAddAlert(currentUser.id, alertData);
        if (newAlert && currentUserAccount) {
            setCurrentUserAccount(prev => prev ? { ...prev, alerts: [...prev.alerts, newAlert] } : null);
        }
    };
    
    const removeAlert = async (alertId: string) => {
        if (!currentUser) return;
        const success = await dbRemoveAlert(alertId);
        if (success) {
            const updatedAlerts = currentUserAccount?.alerts.filter(a => a.id !== alertId) ?? [];
            setCurrentUserAccount(prev => prev ? { ...prev, alerts: updatedAlerts } : null);
        }
    };

    return (
        <AuthContext.Provider value={{
            currentUser,
            currentUserAccount,
            isLoading,
            login,
            signup,
            logout,
            updateCurrentUserAccount,
            getAllUserAccounts,
            getUserAccountById,
            addHistoryItem,
            clearHistory,
            addAlert,
            removeAlert,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
