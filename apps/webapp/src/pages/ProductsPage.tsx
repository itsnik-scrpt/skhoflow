import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Presentation, Code2, ArrowRight } from 'lucide-react';

const PRODUCT_KEYS = ['document', 'slides', 'ide'] as const;
const PRODUCT_ICONS = [FileText, Presentation, Code2];
const PRODUCT_LINKS = ['/editor/document', '/editor/slides', '/editor/ide'];

export const ProductsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-16" style={{ background: 'var(--bg)', color: 'var(--text-1)' }}>
      <section className="pt-20 pb-14 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>
            {t('products.heading')}
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
            {t('products.sub')}
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          {PRODUCT_KEYS.map((key, idx) => {
            const Icon = PRODUCT_ICONS[idx];
            const features = t(`products.${key}.features`, { returnObjects: true }) as string[];
            return (
              <div key={key} className="grid md:grid-cols-2 gap-10 items-start">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium mb-4"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                    <Icon size={13} />
                    {t(`products.${key}.title`)}
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>
                    {t(`products.${key}.subtitle`)}
                  </h2>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                    {t(`products.${key}.desc`)}
                  </p>
                  <Link to={PRODUCT_LINKS[idx]}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
                    style={{ background: 'var(--accent)' }}>
                    {t('products.openTool')} {t(`products.${key}.title`)} <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="rounded-xl p-6" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-3)' }}>
                    {t('products.featuresLabel')}
                  </h3>
                  <ul className="space-y-2.5">
                    {features.map((f: string) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-2)', fontFamily: 'Nunito, sans-serif' }}>
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--accent)' }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
