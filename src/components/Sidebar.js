import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', path: '/home', icon: '🏠' },
    { id: 'progress', label: 'Progress', path: '/progress', icon: '📊' },
    { id: 'logs', label: 'Logs', path: '/logs', icon: '📝' },
    { id: 'notifications', label: 'Notification', path: '/notifications', icon: '🔔' },
    { id: 'rewards', label: 'Rewards', path: '/rewards', icon: '🏆' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 bg-white border-r border-gray-200 z-50">
      {/* Logo Area */}
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        </div>
        <h1 className="text-[14px] font-medium font-[Poppins] text-dark">DailyRise</h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-primary/5 text-primary' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-dark'
              }`}
            >
              <span className="text-[16px]">{item.icon}</span>
              <span className={`text-[11px] font-medium font-[Poppins] ${isActive ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User Profile Snippet (Bottom) */}
      <div className="p-4 border-t border-gray-100">
        <div 
          className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
          onClick={() => navigate('/profile')}
        >
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
             {userProfile?.image ? (
                <img src={userProfile.image} alt="User" className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-[10px] font-medium">
                  {userProfile?.firstname?.[0] || 'U'}
                </div>
             )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium font-[Poppins] text-darkHb truncate">
              {userProfile?.firstname} {userProfile?.lastname}
            </p>
            <p className="text-[10px] font-[Roboto] text-gray-400 truncate">View Profile</p>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="w-full py-2 text-[11px] font-medium font-[Poppins] text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;