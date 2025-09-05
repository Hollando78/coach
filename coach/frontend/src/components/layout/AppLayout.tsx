import React from 'react';
import { useLocation } from 'react-router-dom';
import NavBar from './NavBar';
import MobileNav from './MobileNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const isLiveMatch = location.pathname.includes('/live');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <NavBar />
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
      
      {/* Main Content */}
      <main className={`${
        isLiveMatch 
          ? 'pt-0' // Full screen for live matches
          : 'pt-16 md:pt-20'
      }`}>
        <div className={`${
          isLiveMatch 
            ? 'w-full h-screen'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'
        }`}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default AppLayout;