import React, { useState } from 'react';
import { Gift, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isAuthenticated: boolean;
  onLogout: () => void;
  userName?: string;
}

export default function Navbar({ currentView, onNavigate, isAuthenticated, onLogout, userName }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const links = [
    { label: 'Home', view: 'home' },
    { label: 'Blog', view: 'blog' },
    { label: 'About Us', view: 'about' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Branding */}
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg p-1 group cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-sm flex items-center justify-center group-hover:bg-purple-700 transition-colors">
              <Gift className="h-5 w-5 animate-pulse" />
            </div>
            <span className="font-sans font-bold text-xl tracking-tight text-gray-900 flex items-center">
              Gift<span className="text-purple-600 font-extrabold">ify</span>
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">SaaS</span>
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {links.map((link) => (
              <button
                key={link.view}
                onClick={() => onNavigate(link.view)}
                className={`font-sans font-medium text-sm transition-colors cursor-pointer ${
                  currentView === link.view
                    ? 'text-purple-600 font-semibold'
                    : 'text-gray-500 hover:text-purple-505'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="hidden leading-none text-right md:block">
                  <span className="block text-xs text-gray-400 font-normal">Signed in as</span>
                  <span className="text-sm font-semibold text-gray-800">{userName || 'Organizer'}</span>
                </span>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="px-4 py-2 border border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100/50 font-semibold text-sm rounded-xl transition-all cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  onClick={onLogout}
                  className="px-3 py-2 text-gray-505 hover:text-red-500 font-medium text-sm rounded-lg transition-all cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 md:space-x-4">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 text-gray-650 hover:text-purple-600 font-medium text-sm rounded-lg transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl hover:shadow-md transition-all duration-300 cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu & Action Trigger */}
          <div className="flex md:hidden items-center space-x-2">
            {isAuthenticated && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 font-bold text-xs rounded-lg border border-purple-100"
              >
                Admin
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-500 hover:text-purple-600 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer/Dropdown Panel */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4 space-y-3 shadow-lg absolute right-0 left-0 top-16 z-50 animate-fade-in">
          <div className="flex flex-col space-y-2">
            {links.map((link) => (
              <button
                key={link.view}
                onClick={() => {
                  onNavigate(link.view);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 rounded-xl text-sm font-semibold text-left transition-all ${
                  currentView === link.view
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <hr className="border-gray-100" />

          {isAuthenticated ? (
            <div className="pt-2 flex flex-col space-y-2">
              <div className="px-3 py-1">
                <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Signed in as</span>
                <span className="text-xs font-bold text-gray-800">{userName || 'Organizer'}</span>
              </div>
              <button
                onClick={() => {
                  onNavigate('dashboard');
                  setIsOpen(false);
                }}
                className="w-full text-center py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl"
              >
                Control Center Dashboard
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="w-full text-center py-2 border border-red-100 text-red-600 font-bold text-xs rounded-xl hover:bg-red-50/50"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="pt-2 flex flex-col space-y-2">
              <button
                onClick={() => {
                  onNavigate('login');
                  setIsOpen(false);
                }}
                className="w-full text-center py-2.5 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50"
              >
                Login
              </button>
              <button
                onClick={() => {
                  onNavigate('register');
                  setIsOpen(false);
                }}
                className="w-full text-center py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Get Started Free
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
