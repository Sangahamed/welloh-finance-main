
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

// Import views
import LandingView from './components/LandingView';
import LoginView from './components/LoginView';
import SignUpView from './components/SignUpView';
import DashboardView from './components/DashboardView';
import AnalysisView from './components/AnalysisView';
import StrategyView from './components/StrategyView';
import EducationView from './components/EducationView';
import AdminDashboardView from './components/AdminDashboardView';
import ProfileView from './components/ProfileView';
import PublicTendersView from './components/PublicTendersView';
import LeaderboardView from './components/LeaderboardView';
import PredictionsView from './components/PredictionsView';
import BadgesView from './components/BadgesView';
import QuizView from './components/QuizView';

const App: React.FC = () => {
    const { currentUser, isLoading } = useAuth();
    const [currentPage, setCurrentPage] = useState('landing');
    const [pageId, setPageId] = useState<string | null>(null);

    const handleNavigate = useCallback((page: string) => {
        const currentHash = window.location.hash.replace('#', '');
        if (currentHash !== page) {
            window.location.hash = page;
        }
    }, []);

    // Effect 1: Sync currentPage state with the URL hash. Runs only once on mount.
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            const [page, id] = hash.split('/');
            setCurrentPage(page || 'landing');
            setPageId(id || null);
        };
        
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Set initial page from hash

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Effect 2: Handle routing guards and redirects based on auth state and current page.
    useEffect(() => {
        const unauthedPages = ['landing', 'login', 'signup'];
        const isUnauthedPage = unauthedPages.includes(currentPage);
        
        if (isLoading) {
            // Don't perform redirects while the authentication session is loading
            return;
        }
        
        if (currentUser && isUnauthedPage) {
            // If a logged-in user is on a public page, redirect them to the dashboard.
            handleNavigate('simulation');
        } else if (!currentUser && !isUnauthedPage) {
            // If a logged-out user tries to access a protected page, redirect them to the landing page.
            handleNavigate('landing');
        }
    }, [currentUser, currentPage, isLoading, handleNavigate]);
    
    const renderPage = useMemo(() => {
        if (isLoading) {
            return <div className="text-center p-8">Chargement de la session...</div>;
        }

        if (!currentUser) {
            switch (currentPage) {
                case 'login':
                    return <LoginView onNavigate={handleNavigate} />;
                case 'signup':
                    return <SignUpView onNavigate={handleNavigate} />;
                case 'landing':
                default: // Fallback to landing for any invalid hash for a logged out user
                    return <LandingView onNavigate={handleNavigate} />;
            }
        }

        // User is logged in
        switch (currentPage) {
            case 'simulation':
                return <DashboardView onNavigate={handleNavigate} />;
            case 'analysis':
                return <AnalysisView />;
            case 'strategy':
                return <StrategyView />;
            case 'education':
                return <EducationView />;
            case 'tenders':
                return <PublicTendersView />;
            case 'predictions':
                return <PredictionsView />;
            case 'badges':
                return <BadgesView />;
            case 'quiz':
                return <QuizView />;
            case 'leaderboard':
                return <LeaderboardView onNavigate={handleNavigate} />;
            case 'admin':
                return currentUser.role === 'admin' ? <AdminDashboardView onNavigate={handleNavigate} /> : <h2>Access Denied</h2>;
            case 'profile':
                 return pageId ? <ProfileView userId={pageId} onNavigate={handleNavigate} /> : <h2>User ID missing</h2>;
            default:
                 // The redirect logic in the useEffect hook should handle all cases,
                 // but this provides a safe fallback.
                 return <div className="text-center p-8">Redirection...</div>;
        }
    }, [currentPage, pageId, currentUser, handleNavigate, isLoading]);


    const isAuthPage = !currentUser && (currentPage === 'login' || currentPage === 'signup');

    return (
        <div className="flex flex-col min-h-screen bg-[#0B0E15] text-gray-100">
            {!isAuthPage && <Header currentPage={currentPage} onNavigate={handleNavigate} />}
            <main className="flex-grow">
                 <ErrorBoundary>
                    {isAuthPage ? renderPage : (
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            {renderPage}
                        </div>
                    )}
                </ErrorBoundary>
            </main>
            {!isAuthPage && <Footer />}
        </div>
    );
};

export default App;
