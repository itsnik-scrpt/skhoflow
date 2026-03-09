import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/themeStore';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const logoFilter = theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)';

  return (
    <footer style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 mb-5">
            <img
              src="/logo.svg"
              alt="SkhoFlow"
              style={{ height: 42, width: 'auto', objectFit: 'contain', filter: logoFilter, transition: 'filter 0.2s' }}
            />
          </div>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
            {t('footer.tagline')}
          </p>
        </div>

        {[
          { title: t('footer.product'), links: [[t('footer.features'), '/products'], [t('footer.pricing'), '/pricing'], [t('footer.start'), '/register']] },
          { title: t('footer.company'), links: [[t('footer.about'), '#'], [t('footer.blog'), '#'], [t('footer.careers'), '#']] },
          { title: t('footer.legal'), links: [[t('footer.privacy'), '#'], [t('footer.terms'), '#'], [t('footer.security'), '#']] },
        ].map(({ title, links }) => (
          <div key={title}>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>{title}</h4>
            <ul className="space-y-3">
              {links.map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-sm font-medium transition-all hover:opacity-100 opacity-60"
                    style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-2"
        style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs font-medium" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
          © 2026 SkhoFlow. {t('footer.rights')}
        </p>
        <p className="text-xs font-medium" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
          Web · Desktop · Mobile
        </p>
      </div>
    </footer>
  );
};
