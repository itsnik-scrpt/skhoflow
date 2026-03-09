import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, ChevronDown, Globe } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const LANGS = [{ code: 'en', label: 'English' }, { code: 'es', label: 'Español' }, { code: 'fr', label: 'Français' }, { code: 'it', label: 'Italiano' }];

export const MarketingNav: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const logoFilter = theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)';

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 60));

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const changeLang = (code: string) => { i18n.changeLanguage(code); localStorage.setItem('skhoflow-lang', code); setLangOpen(false); };
  const currentLang = LANGS.find(l => l.code === i18n.language) ?? LANGS[0];

  const navLinks = [
    { label: t('nav.home'), to: '/' },
    { label: t('nav.products'), to: '/products' },
    { label: t('nav.pricing'), to: '/pricing' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <motion.div
        initial={false}
        animate={scrolled ? {
          paddingLeft: 20, paddingRight: 20, paddingTop: 12,
        } : {
          paddingLeft: 0, paddingRight: 0, paddingTop: 0,
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            maxWidth: scrolled ? 1180 : '100%',
            margin: '0 auto',
          }}
        >
          <motion.div
            className="flex items-center justify-between transition-all"
            animate={scrolled ? {
              borderRadius: 18,
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 20,
              paddingRight: 20,
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            } : {
              borderRadius: 0,
              paddingTop: 18,
              paddingBottom: 18,
              paddingLeft: 32,
              paddingRight: 32,
              boxShadow: 'none',
            }}
            style={{
              background: scrolled ? 'var(--bg-2)' : 'transparent',
              borderBottom: scrolled ? 'none' : '1px solid transparent',
              border: scrolled ? '1px solid var(--border)' : 'none',
              backdropFilter: scrolled ? 'blur(20px)' : 'none',
            }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Logo */}
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2.5 flex-shrink-0"
            >
              <img
                src="/logo.svg"
                alt="SkhoFlow"
                style={{
                  height: 44,
                  width: 'auto',
                  objectFit: 'contain',
                  filter: logoFilter,
                  transition: 'filter 0.2s',
                }}
              />
            </Link>

            {/* Center nav pill */}
            <nav className="hidden md:flex items-center gap-0.5 rounded-xl p-1"
              style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
              {navLinks.map(link => {
                const active = location.pathname === link.to;
                return (
                  <Link key={link.to} to={link.to}
                    className="px-4 py-1.5 rounded-[10px] text-sm font-semibold tracking-wide transition-all duration-200"
                    style={{
                      color: active ? 'var(--text-1)' : 'var(--text-3)',
                      background: active ? 'var(--bg-2)' : 'transparent',
                      boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right controls */}
            <div className="hidden md:flex items-center gap-2">

              {/* Language */}
              <div ref={langRef} className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all"
                  style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                  <Globe size={12} strokeWidth={2.5} />
                  {currentLang.code.toUpperCase()}
                  <ChevronDown size={10} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.13 }}
                      className="absolute right-0 top-full mt-2 min-w-[148px] rounded-2xl py-1.5 z-50 overflow-hidden"
                      style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', boxShadow: '0 12px 40px rgba(0,0,0,0.14)' }}>
                      {LANGS.map(l => (
                        <button key={l.code} onClick={() => changeLang(l.code)}
                          className="w-full text-left px-4 py-2 text-sm font-semibold transition-all hover:opacity-100"
                          style={{ color: i18n.language === l.code ? 'var(--accent)' : 'var(--text-2)', opacity: i18n.language === l.code ? 1 : 0.7 }}>
                          {l.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme toggle — sun/moon only */}
              <button
                onClick={toggle}
                className="p-2 rounded-xl transition-all hover:opacity-80"
                style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}
                title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={theme}
                    initial={{ rotate: -30, opacity: 0, scale: 0.8 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 30, opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="block">
                    {theme === 'dark' ? <Sun size={14} strokeWidth={2} /> : <Moon size={14} strokeWidth={2} />}
                  </motion.span>
                </AnimatePresence>
              </button>

              <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />

              {/* CTA */}
              {isAuthenticated ? (
                <Link to="/dashboard"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'var(--accent)' }}>
                  {t('nav.dashboard')}
                </Link>
              ) : (
                <>
                  <Link to="/login"
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                    style={{ color: 'var(--text-2)' }}>
                    {t('nav.signIn')}
                  </Link>
                  <Link to="/register"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                    style={{ background: 'var(--text-1)', color: 'var(--bg)' }}>
                    {t('nav.getStarted')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile burger */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl transition-all"
              style={{ color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mx-4 mt-2 rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
            <div className="p-4 space-y-1">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    color: location.pathname === link.to ? 'var(--accent)' : 'var(--text-2)',
                    background: location.pathname === link.to ? 'var(--accent-soft)' : 'transparent',
                  }}>
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <button onClick={toggle} className="p-2 rounded-xl transition-all"
                  style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                </button>
              </div>
              <div className="pt-3 mt-1 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
                <Link to="/login" className="block text-center py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  {t('nav.signIn')}
                </Link>
                <Link to="/register"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: 'var(--accent)' }}>
                  {t('nav.getStarted')}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

