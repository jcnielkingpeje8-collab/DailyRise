import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ title, showProfile = true, showBack = false }) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  return (
    <header className="md:hidden flex items-center justify-between py-4 px-4 bg-white sticky top-0 z-40 border-b border-gray-100">
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-heading font-poppins text-dark">{title}</h1>
      </div>
      
      {showProfile && (
        <button 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-primary overflow-hidden flex items-center justify-center"
        >
          {userProfile?.image ? (
            <img 
              src={userProfile.image} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-body font-medium">
              {userProfile?.firstname?.charAt(0) || 'U'}
            </span>
          )}
        </button>
      )}
    </header>
  );
};

export default Header;