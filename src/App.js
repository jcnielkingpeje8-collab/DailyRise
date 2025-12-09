import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient'; 

import ChallengeReceivedModal from './components/ChallengeReceivedModal'; 
import GlobalChallengeAlarm from './components/GlobalChallengeAlarm';

// Pages
import LandingPage from './pages/LandingPage'; // <--- IMPORT THIS
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Progress from './pages/Progress';
import Logs from './pages/Logs';
import Notifications from './pages/Notifications';
import Goals from './pages/Goals';
import Badges from './pages/Badges';
import Community from './pages/Community';
import Rewards from './pages/Rewards';
import Profile from './pages/Profile';

// --- GLOBAL LISTENER (POLLING VERSION) ---
const GlobalChallengeListener = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [challengeId, setChallengeId] = useState(null);
  
  const lastSeenIdRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const checkPendingChallenges = async () => {
      try {
        const { data } = await supabase
          .from('challenges')
          .select('id')
          .eq('challenged_user_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const latestId = data[0].id;
          
          if (latestId !== lastSeenIdRef.current) {
            console.log("📬 New Pending Challenge Found:", latestId);
            setChallengeId(latestId);
            setShowModal(true);
            lastSeenIdRef.current = latestId;
          }
        }
      } catch (error) {
        console.error("Error checking pending invites:", error);
      }
    };

    checkPendingChallenges();
    const interval = setInterval(checkPendingChallenges, 3000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <ChallengeReceivedModal
      isOpen={showModal}
      challengeId={challengeId}
      onClose={() => setShowModal(false)}
      onRespond={() => {
        setShowModal(false);
        setChallengeId(null);
        lastSeenIdRef.current = null;
      }}
    />
  );
};

// --- Route Helpers ---
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  // If user is already logged in, redirect them to Home instead of showing public pages (Login/Landing)
  if (user) return <Navigate to="/home" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Listeners are active globally */}
        <GlobalChallengeListener />
        <GlobalChallengeAlarm />

        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* --- LANDING PAGE (Root Route) --- */}
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            
            {/* Public Routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            
            {/* Protected App Routes */}
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
            <Route path="/badges" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            
            {/* Fallback: Redirect unknown paths to Landing Page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;