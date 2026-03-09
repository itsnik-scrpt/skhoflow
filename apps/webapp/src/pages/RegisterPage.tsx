import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { authService } from '../services/auth';

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();
  const navigate = useNavigate();
  const logoFilter = theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.register({ name, email, password });
      setUser(res.user);
      setToken(res.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] p-12 relative overflow-hidden"
        style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--border)' }}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(circle at 70% 20%, rgba(234,179,8,0.12) 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(circle at 30% 80%, rgba(220,38,38,0.1) 0%, transparent 60%)' }} />

        <Link to="/">
          <img src="/logo.svg" alt="SkhoFlow"
            style={{ height: 34, width: 'auto', objectFit: 'contain', filter: logoFilter, transition: 'filter 0.2s' }} />
        </Link>

        <div>
          <p className="text-4xl font-bold leading-snug mb-4" style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>
            {t('auth.register.leftPanel.line1')}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t('auth.register.leftPanel.sub')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'var(--accent)' }}>S</div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>SkhoFlow</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>skhoflow.com</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="lg:hidden mb-10">
          <Link to="/">
            <img src="/logo.svg" alt="SkhoFlow"
              style={{ height: 32, width: 'auto', objectFit: 'contain', filter: logoFilter, transition: 'filter 0.2s' }} />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md">

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>
              {t('auth.register.title')}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>{t('auth.register.sub')}</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 p-4 rounded-2xl mb-6 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
              <AlertCircle size={15} className="flex-shrink-0" />{error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                {t('auth.nameLabel')}
              </label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none transition-all"
                style={{
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif',
                }}
                placeholder={t('auth.namePlaceholder')} />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                {t('auth.emailLabel')}
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none transition-all"
                style={{
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif',
                }}
                placeholder="you@example.com" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                {t('auth.passwordLabel')}
              </label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                  className="w-full rounded-2xl px-4 py-3 pr-12 text-sm font-medium outline-none transition-all"
                  style={{
                    background: 'var(--bg-2)', border: '1px solid var(--border)',
                    color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif',
                  }}
                  placeholder={t('auth.passwordPlaceholder')} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-3)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--text-1)', color: 'var(--bg)', fontFamily: 'Nunito, sans-serif' }}>
              {loading ? t('auth.register.loading') : t('auth.register.button')}
            </button>
          </form>

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-sm text-center" style={{ color: 'var(--text-3)' }}>
              {t('auth.register.hasAccount')}{' '}
              <Link to="/login" className="font-bold transition-colors hover:opacity-80"
                style={{ color: 'var(--accent)' }}>
                {t('auth.register.signIn')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
