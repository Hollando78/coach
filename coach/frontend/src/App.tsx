import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useOfflineStore } from './stores/offlineStore';

// Layout components
import AppLayout from './components/layout/AppLayout';
import StatusBanner from './components/layout/StatusBanner';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Main pages
import DashboardPage from './pages/DashboardPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import SeasonsPage from './pages/SeasonsPage';
import MatchesPage from './pages/MatchesPage';
import MatchDetailPage from './pages/MatchDetailPage';
import PlanningPage from './pages/PlanningPage';
import LiveMatchPage from './pages/LiveMatchPage';

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { isOnline } = useOfflineStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StatusBanner isOnline={isOnline} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <AppLayout>
      <StatusBanner isOnline={isOnline} />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/teams/:teamId" element={<TeamDetailPage />} />
        <Route path="/teams/:teamId/seasons" element={<SeasonsPage />} />
        <Route path="/teams/:teamId/seasons/:seasonId/matches" element={<MatchesPage />} />
        <Route path="/teams/:teamId/seasons/:seasonId/matches/:matchId" element={<MatchDetailPage />} />
        <Route path="/teams/:teamId/seasons/:seasonId/matches/:matchId/plan" element={<PlanningPage />} />
        <Route path="/teams/:teamId/seasons/:seasonId/matches/:matchId/live" element={<LiveMatchPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;