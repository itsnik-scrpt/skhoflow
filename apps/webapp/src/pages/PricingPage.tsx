import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

const PLAN_KEYS = ['free', 'pro', 'team', 'enterprise'] as const;
const PLAN_PRICES: Record<string, { monthly: number | null; yearly: number | null }> = {
  free:       { monthly: 0,    yearly: 0    },
  pro:        { monthly: 9,    yearly: 7    },
  team:       { monthly: 19,   yearly: 15   },
  enterprise: { monthly: null, yearly: null },
};
const HIGHLIGHTED = 'pro';

export const PricingPage: React.FC = () => {
  const { t } = useTranslation();
  const [annual, setAnnual] = useState(false);

  return (
    <div className="pt-16" style={{ background: 'var(--bg)', color: 'var(--text-1)' }}>
      <section className="pt-20 pb-12 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>
            {t('pricing.heading')}
          </h1>
          <p className="text-base mb-8" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
            {t('pricing.sub')}
          </p>
          <div className="inline-flex items-center gap-3 rounded-lg p-1" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
            <button onClick={() => setAnnual(false)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{ background: !annual ? 'var(--bg-2)' : 'transparent', color: !annual ? 'var(--text-1)' : 'var(--text-3)', boxShadow: !annual ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', fontFamily: 'Nunito, sans-serif' }}>
              {t('pricing.monthly')}
            </button>
            <button onClick={() => setAnnual(true)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{ background: annual ? 'var(--bg-2)' : 'transparent', color: annual ? 'var(--text-1)' : 'var(--text-3)', boxShadow: annual ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', fontFamily: 'Nunito, sans-serif' }}>
              {t('pricing.annual')} <span style={{ color: 'var(--gold)', fontWeight: 700 }}>-20%</span>
            </button>
          </div>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6">
          {PLAN_KEYS.map((key) => {
            const highlighted = key === HIGHLIGHTED;
            const price = PLAN_PRICES[key];
            const features = t(`pricing.plans.${key}.features`, { returnObjects: true }) as string[];
            return (
              <div key={key}
                className="relative rounded-xl p-6 flex flex-col"
                style={{
                  border: highlighted ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: highlighted ? 'var(--accent)' : 'var(--bg-2)',
                  boxShadow: highlighted ? '0 8px 40px rgba(192,57,43,0.25)' : 'none',
                }}>
                {highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: 'var(--accent)', border: '2px solid var(--bg)' }}>
                    {t('pricing.mostPopular')}
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-semibold text-lg" style={{ color: highlighted ? '#fff' : 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>
                    {t(`pricing.plans.${key}.name`)}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: highlighted ? 'rgba(255,255,255,0.7)' : 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                    {t(`pricing.plans.${key}.desc`)}
                  </p>
                </div>
                <div className="mb-6">
                  {price.monthly === null ? (
                    <div className="text-2xl font-bold" style={{ color: highlighted ? '#fff' : 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>
                      {t('pricing.custom')}
                    </div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold" style={{ color: highlighted ? '#fff' : 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>
                        ${annual ? price.yearly : price.monthly}
                      </span>
                      {(price.monthly ?? 0) > 0 && (
                        <span className="text-xs mb-1" style={{ color: highlighted ? 'rgba(255,255,255,0.6)' : 'var(--text-3)' }}>
                          {t('pricing.perMonth')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {features.map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: highlighted ? 'rgba(255,255,255,0.9)' : 'var(--text-2)', fontFamily: 'Nunito, sans-serif' }}>
                      <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: highlighted ? 'rgba(255,255,255,0.7)' : 'var(--gold)' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={key === 'enterprise' ? '/#contact' : '/register'}
                  className="text-center text-sm font-bold py-2.5 px-4 rounded-xl transition-all"
                  style={{
                    background: highlighted ? '#fff' : 'var(--text-1)',
                    color: highlighted ? 'var(--accent)' : 'var(--bg)',
                    fontFamily: 'Nunito, sans-serif',
                  }}>
                  {t(`pricing.plans.${key}.cta`)}
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

