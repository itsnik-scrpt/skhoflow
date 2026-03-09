import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FileText, Presentation, Code2, LayoutDashboard, LogOut, Settings, Sun, Moon, Layers } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export const AppNav: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const logoFilter = theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)';
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Workspace', to: '/workspace', icon: Layers },
    { label: 'Document',  to: '/editor/document', icon: FileText },
    { label: 'Slides',    to: '/editor/slides',   icon: Presentation },
    { label: 'IDE',       to: '/editor/ide',       icon: Code2 },
  ];

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="flex-shrink-0 z-40"
      style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-6 py-3.5">

        {/* Left — logo + nav */}
        <div className="flex items-center gap-6">
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center flex-shrink-0">
            <img src="/logo.svg" alt="SkhoFlow"
              style={{ height: 36, width: 'auto', objectFit: 'contain', filter: logoFilter, transition: 'filter 0.3s' }} />
          </Link>

          <div className="w-px h-5" style={{ background: 'var(--border)' }} />

          <nav className="flex items-center gap-1">
            {navItems.map(({ label, to, icon: Icon }) => {
              const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
              return (
                <Link key={to} to={to}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    color: active ? 'var(--text-1)' : 'var(--text-3)',
                    background: active ? 'var(--bg-3)' : 'transparent',
                    fontFamily: 'Nunito, sans-serif',
                  }}>
                  <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
                  {label}
                  {active && (
                    <motion.div
                      layoutId="app-nav-indicator"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'var(--bg-3)', zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right — theme + user */}
        <div className="flex items-center gap-2">

          {/* Theme toggle */}
          <button onClick={toggle}
            className="p-2 rounded-xl transition-all hover:opacity-80"
            style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={theme}
                initial={{ rotate: -20, opacity: 0, scale: 0.8 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 20, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.18 }}
                className="block">
                {theme === 'dark' ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
              </motion.span>
            </AnimatePresence>
          </button>

          {/* User menu */}
          <div ref={userRef} className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl transition-all hover:opacity-80"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-3)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
                style={{ background: 'var(--accent)', fontFamily: 'Nunito, sans-serif' }}>
                {initials}
              </div>
              <span className="text-sm font-semibold hidden md:block"
                style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>
                {user?.name?.split(' ')[0] || 'Account'}
              </span>
              <ChevronDown size={13} style={{ color: 'var(--text-3)' }}
                className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', boxShadow: '0 16px 48px rgba(0,0,0,0.16)' }}>
                  {/* User info */}
                  <div className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                        style={{ background: 'var(--accent)', fontFamily: 'Nunito, sans-serif' }}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>
                          {user?.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Menu items */}
                  <div className="py-1.5">
                    <Link to="/account" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-80"
                      style={{ color: 'var(--text-2)', fontFamily: 'Nunito, sans-serif' }}>
                      <Settings size={14} style={{ color: 'var(--text-3)' }} />
                      Account Settings
                    </Link>
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-80"
                      style={{ color: 'var(--accent)', fontFamily: 'Nunito, sans-serif' }}>
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
