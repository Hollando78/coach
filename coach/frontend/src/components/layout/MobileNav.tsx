import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTeamStore } from '../../stores/teamStore';

function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { currentTeam, clearTeam } = useTeamStore();

  const handleLogout = async () => {
    await logout();
    clearTeam();
    setIsOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Top bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center" onClick={closeMenu}>
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">⚽</span>
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">Coach</span>
          </Link>
          
          {/* Current team indicator */}
          {currentTeam && (
            <div className="flex-1 flex justify-center">
              <div className="px-3 py-1 bg-primary-100 rounded-full">
                <span className="text-sm font-medium text-primary-800">
                  {currentTeam.name}
                </span>
              </div>
            </div>
          )}
          
          {/* Menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMenu}
        />
      )}
      
      {/* Slide-out menu */}
      <div className={`
        fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 md:hidden
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-6">
          {/* User info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="text-lg font-semibold text-gray-900">
              Welcome back!
            </div>
            <div className="text-sm text-gray-600">
              {user?.email}
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="space-y-2">
            <Link
              to="/"
              onClick={closeMenu}
              className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                location.pathname === '/'
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🏠 Dashboard
            </Link>
            
            <Link
              to="/teams"
              onClick={closeMenu}
              className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                isActive('/teams')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              👥 Teams
            </Link>
            
            {currentTeam && (
              <Link
                to={`/teams/${currentTeam.id}/seasons`}
                onClick={closeMenu}
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive('/seasons') || isActive('/matches')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                ⚽ Matches
              </Link>
            )}
          </nav>
          
          {/* Logout */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full btn btn-outline"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileNav;