import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTeamStore } from '../../stores/teamStore';

function NavBar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { currentTeam, clearTeam } = useTeamStore();

  const handleLogout = async () => {
    await logout();
    clearTeam();
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">⚽</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Coach</span>
            </Link>
            
            <div className="hidden md:flex space-x-6">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/' 
                    ? 'text-primary-600 bg-primary-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </Link>
              
              <Link
                to="/teams"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/teams') 
                    ? 'text-primary-600 bg-primary-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Teams
              </Link>
              
              {currentTeam && (
                <>
                  <Link
                    to={`/teams/${currentTeam.id}/seasons`}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/seasons') || isActive('/matches')
                        ? 'text-primary-600 bg-primary-50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Matches
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Current team indicator */}
          {currentTeam && (
            <div className="hidden md:flex items-center px-3 py-1 bg-primary-100 rounded-full">
              <span className="text-sm font-medium text-primary-800">
                {currentTeam.name}
              </span>
            </div>
          )}
          
          {/* User menu */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-outline text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;