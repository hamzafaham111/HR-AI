import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import '../../styles/animations.css';

const Layout = ({ children, showSidebar = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('sidebar-open');
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('sidebar-open');
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Close sidebar on Escape key
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Handle swipe gestures for mobile
  useEffect(() => {
    let startX = 0;
    let currentX = 0;
    let sidebarElement = null;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      sidebarElement = document.querySelector('.sidebar-panel');
    };

    const handleTouchMove = (e) => {
      if (!startX || !sidebarOpen) return;
      currentX = e.touches[0].clientX;
      const deltaX = currentX - startX;
      
      // Only allow swiping left to close (negative deltaX)
      if (deltaX < 0 && sidebarElement) {
        const progress = Math.max(0, 1 + deltaX / 300); // 300px swipe distance
        sidebarElement.style.transform = `translateX(${deltaX}px)`;
        sidebarElement.style.opacity = progress;
      }
    };

    const handleTouchEnd = (e) => {
      if (!startX || !sidebarOpen) return;
      const deltaX = currentX - startX;
      
      // Close sidebar if swiped left more than 100px
      if (deltaX < -100) {
        setSidebarOpen(false);
      }
      
      // Reset styles
      if (sidebarElement) {
        sidebarElement.style.transform = '';
        sidebarElement.style.opacity = '';
      }
      
      startX = 0;
      currentX = 0;
    };

    if (window.innerWidth < 1024) { // Only on mobile
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out ${
        showSidebar && sidebarOpen ? 'visible opacity-100' : 'invisible opacity-0'
      }`}>
        {/* Background overlay */}
        <div 
          className={`fixed inset-0 bg-gray-600 transition-opacity duration-300 ease-in-out ${
            sidebarOpen ? 'bg-opacity-75' : 'bg-opacity-0'
          }`} 
          onClick={() => setSidebarOpen(false)} 
        />
        
        {/* Sidebar panel */}
        <div className={`sidebar-panel fixed top-0 left-0 h-screen w-full max-w-xs bg-white shadow-xl transform transition-all duration-300 ease-out ${
          sidebarOpen 
            ? 'translate-x-0 sidebar-shadow-active' 
            : '-translate-x-full sidebar-shadow'
        }`}>
          {/* Close button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              type="button"
              className="mobile-menu-button flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5 text-gray-600 transition-transform duration-200 hover:rotate-90" />
            </button>
          </div>
          
          {/* Sidebar content */}
          <div className="h-full overflow-y-auto sidebar-content">
            <Sidebar setSidebarOpen={setSidebarOpen} />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - desktop */}
        {showSidebar && (
          <div className="hidden lg:flex lg:flex-shrink-0">
            <div className="flex flex-col w-64">
              <div className="sticky top-0 h-screen bg-white shadow-lg">
                <Sidebar setSidebarOpen={setSidebarOpen} />
              </div>
            </div>
          </div>
        )}
        
        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Navbar - sticky */}
          <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
              {/* Mobile menu button */}
              {showSidebar && (
                <button
                  type="button"
                  className="mobile-menu-button lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <Menu className="h-6 w-6 transition-transform duration-200 hover:scale-110" />
                </button>
              )}
              <Navbar />
            </div>
          </div>
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout; 