import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Calendar, User, MessageSquareWarning, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function AuthNavbarControls() {
  const { user, logout } = useAuth();
  
  if (!user) {
    return (
      <Link 
        to="/login" 
        className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-slate-500">Logged in as <span className="text-slate-800 font-semibold">{user.username}</span></span>
      {user.role === 'Admin' && (
        <Link to="/admin" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors flex items-center gap-1">
          <ShieldAlert className="w-4 h-4" /> Admin
        </Link>
      )}
      <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1">
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </div>
  );
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            {/* Branding */}
            <Link to="/" className="flex items-center gap-4 group">
              <div className="relative">
                <img 
                  src="/images/university-logo.png" 
                  alt="University Logo" 
                  className="h-14 md:h-16 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="hidden md:flex flex-col border-l border-slate-300 pl-4 ml-2 justify-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none mb-1.5">Powered by</span>
                <div className="flex items-center gap-2">
                  <img 
                    src="/images/kng_logo_4k_transparent (1) (1)_11zon (2).png" 
                    alt="KNG Logo" 
                    className="h-6 md:h-7 w-auto object-contain"
                  />
                  <span className="text-base font-bold text-slate-800 tracking-tight leading-none hidden lg:block">KNG Logics Solution</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4 lg:space-x-8">
            <Link 
              to="/" 
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                isActive('/') ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-500 hover:border-slate-400 hover:text-slate-900'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/report" 
              className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                isActive('/report') ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-500 hover:border-slate-400 hover:text-slate-900'
              }`}
            >
              Report a Problem
            </Link>
            <AuthNavbarControls />
            <Link 
              to="/builder" 
              className="ml-4 inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Build My Timetable
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/90 backdrop-blur-xl">
          <div className="pt-2 pb-4 space-y-1">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
                isActive('/') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900'
              }`}
            >
              Home
            </Link>
            <Link
              to="/report"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
                isActive('/report') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900'
              }`}
            >
              <MessageSquareWarning className="mr-3 h-5 w-5 text-slate-400" />
              Report a Problem
            </Link>
            
            {/* Mobile Auth Controls */}
            <MobileAuthControls onClose={() => setIsMobileMenuOpen(false)} />

            <div className="px-4 mt-4 mb-2">
              <Link
                to="/builder"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center w-full px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Build My Timetable
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function MobileAuthControls({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  if (!user) {
    return (
      <Link
        to="/login"
        onClick={onClose}
        className={`flex items-center pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors ${
          isActive('/login') ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900'
        }`}
      >
        <User className="mr-3 h-5 w-5 text-slate-400" />
        Login
      </Link>
    );
  }

  return (
    <>
      {user.role === 'Admin' && (
        <Link
          to="/admin"
          onClick={onClose}
          className="flex items-center pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-indigo-600 hover:bg-indigo-50 hover:border-indigo-500 transition-colors"
        >
          <ShieldAlert className="mr-3 h-5 w-5 text-indigo-500" />
          Admin Dashboard
        </Link>
      )}
      <button
        onClick={() => {
          logout();
          onClose();
        }}
        className="flex w-full text-left items-center pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-slate-500 hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-colors"
      >
        <LogOut className="mr-3 h-5 w-5 text-slate-400" />
        Logout ({user.username})
      </button>
    </>
  );
}
