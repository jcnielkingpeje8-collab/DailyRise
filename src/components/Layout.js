import React from 'react';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import { useChallenges } from '../hooks/useChallenges';
import ChallengeReceivedModal from './ChallengeReceivedModal';

const Layout = ({ children }) => {
  const { incomingChallenge, acceptChallenge, rejectChallenge } = useChallenges();

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Desktop Sidebar - Hidden on Mobile */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen transition-all duration-300 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-6 max-w-lg md:max-w-7xl">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Hidden on Desktop */}
      <BottomNav />

      {/* Global Challenge Received Modal */}
      {incomingChallenge && (
        <ChallengeReceivedModal
          challenge={incomingChallenge}
          onAccept={() => acceptChallenge(incomingChallenge.id)}
          onDecline={() => rejectChallenge(incomingChallenge.id)}
        />
      )}
    </div>
  );
};

export default Layout;