import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, FileText, Presentation, Code2, Send, CheckCircle2 } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
const S: React.CSSProperties = { fontFamily: '"Cormorant Garamond", serif' };
const PARTNERS = [
  { name: 'Notion',       slug: 'notion'      },
  { name: 'Figma',        slug: 'figma'       },
  { name: 'GitHub',       slug: 'github'      },
  { name: 'Vercel',       slug: 'vercel'      },
  { name: 'Linear',       slug: 'linear'      },
  { name: 'Stripe',       slug: 'stripe'      },
  { name: 'Supabase',     slug: 'supabase'    },
  { name: 'Tailwind CSS', slug: 'tailwindcss' },
  { name: 'Framer',       slug: 'framer'      },
  { name: 'GitLab',       slug: 'gitlab'      },
  { name: 'Atlassian',    slug: 'atlassian'   },
];
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}
function useTyped(words: string[], speed = 65, pause = 2200) {
  const [display, setDisplay] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[wordIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && charIdx <= word.length) {
      t = setTimeout(() => { setDisplay(word.slice(0, charIdx)); setCharIdx(c => c + 1); }, speed);
    } else if (!deleting && charIdx > word.length) {
      t = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      t = setTimeout(() => { setDisplay(word.slice(0, charIdx - 1)); setCharIdx(c => c - 1); }, speed / 2);
    } else {
      setDeleting(false);
      setWordIdx(i => (i + 1) % words.length);
    }
    return () => clearTimeout(t);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);
  return display;
}
function useTypedReveal(text: string, speed = 30, inject?: string) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState('');
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    let i = 0;
    setDisplay('');
    const iv = setInterval(() => {
      i++;
      setDisplay(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [started, text, speed]);

  // If inject provided, split display at the double-space placeholder and render inject word styled
  const renderContent = () => {
    if (!inject) return display;
    const placeholder = '  '; // two spaces mark the inject point
    const idx = text.indexOf(placeholder);
    if (idx === -1) return display;

    // `before` is everything up to (not including) the placeholder
    const before = display.slice(0, Math.min(display.length, idx));
    const showInject = display.length > idx;
    // `after` starts after the placeholder's two spaces
    const rawAfter = display.length > idx + placeholder.length
      ? display.slice(idx + placeholder.length)
      : '';
    const after = rawAfter.trimStart();

    return (
      <>
        {before}{before && '\u00a0'}
        {showInject && (
          <em style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: 'var(--accent)' }}>
            {inject}
          </em>
        )}
        {after && <>{'\u00a0'}{after}</>}
      </>
    );
  };

  return { ref, display, done: display.length >= text.length, renderContent };
}
const TOOLS_KEYS = ['document', 'slides', 'ide'] as const;
const TOOL_ICONS = [FileText, Presentation, Code2];
const TOOL_ACCENTS = ['var(--accent)', 'var(--orange)', 'var(--gold)'];
const TOOL_IMGS = [
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=900&q=85',
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=900&q=85',
  'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=900&q=85',
];
const TOOL_ROUTES = ['/editor/document', '/editor/slides', '/editor/ide'];
const TOOL_NS = ['01', '02', '03'];

export const HomePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useThemeStore();
  const [activeTool, setActiveTool] = useState(0);

  const toolsRef = useReveal();
  const platformRef = useReveal();

  // Rebuild typed words and headings when language changes
  const typedWords = t('hero.typed', { returnObjects: true }) as string[];
  const typed = useTyped(typedWords, 70, 2400);
  const h1Text = t('tools.sectionHeading'); // has double-space placeholder for SkhoFlow
  const h2Text = t('platform.heading');
  const heading1 = useTypedReveal(h1Text, 30, 'SkhoFlow');
  const heading2 = useTypedReveal(h2Text);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { /* re-trigger reveal on lang change */ }, [i18n.language]);

  const logoFilter = theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)';

  return (
    <div style={{ background: 'var(--bg)' }}>

      {/* HERO */}
      <section className="relative flex flex-col px-6 md:px-16 pt-36 pb-0 overflow-hidden" style={{ minHeight: '100svh' }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div style={{ position: 'absolute', top: '-8%', left: '-4%', width: 760, height: 760, borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,57,43,0.08) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', bottom: '12%', right: '6%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,150,42,0.06) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', top: '42%', left: '62%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,57,43,0.04) 0%, transparent 65%)' }} />
        </div>

        <div className="max-w-[1300px] mx-auto w-full flex-1 flex flex-col justify-center" style={{ paddingBottom: 60 }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 mb-10 self-start">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
            <span className="text-xs font-bold uppercase tracking-[0.24em]"
              style={{ color: 'var(--accent)', fontFamily: 'Nunito, sans-serif' }}>
              {t('hero.badge')}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07, duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 'clamp(60px, 9.5vw, 142px)', lineHeight: 0.91, letterSpacing: '-0.04em', color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif', fontWeight: 900, maxWidth: 1100 }}>
            {t('hero.headline')}<br />
            <span style={{ ...S, fontStyle: 'italic', color: 'var(--accent)' }}>{t('hero.for')}&nbsp;</span>
            <span className="cursor-blink" style={{ color: 'var(--accent)', fontFamily: 'Nunito, sans-serif', fontWeight: 900 }}>
              {typed}
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
            <div className="h-px mt-10 mb-8" style={{ background: 'var(--border)', width: 64 }} />
            <p className="text-base font-medium leading-relaxed mb-10"
              style={{ color: 'var(--text-3)', maxWidth: 480, fontFamily: 'Nunito, sans-serif', lineHeight: 1.85 }}>
              {t('hero.sub')}
            </p>
            <div className="flex items-center gap-5 flex-wrap">
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <Link to="/register"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm"
                  style={{ background: 'var(--text-1)', color: 'var(--bg)', fontFamily: 'Nunito, sans-serif', boxShadow: '0 4px 28px rgba(0,0,0,0.2)' }}>
                  <span>{t('hero.cta')}</span>
                  <ArrowRight size={15} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <Link to="/products"
                  className="inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                  {t('hero.ctaSub')}
                  <ArrowRight size={13} />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Partners strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.6 }}
          className="max-w-[1300px] mx-auto w-full"
          style={{ borderTop: '1px solid var(--border)', paddingTop: 28, paddingBottom: 36 }}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-7"
            style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
            {t('hero.trustedBy')}
          </p>
          <div className="flex items-center gap-8 flex-wrap">
            {PARTNERS.map((p) => (
              <motion.div key={p.slug} className="flex items-center gap-2.5 select-none cursor-default"
                initial={{ opacity: 0.5 }} whileHover={{ opacity: 1, scale: 1.06 }} transition={{ duration: 0.2 }}>
                <img src={`https://cdn.simpleicons.org/${p.slug}`} alt={p.name} width={20} height={20}
                  style={{ objectFit: 'contain', flexShrink: 0, filter: logoFilter, transition: 'filter 0.3s' }} />
                <span className="font-bold text-sm whitespace-nowrap"
                  style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif', letterSpacing: '-0.01em' }}>
                  {p.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* TOOLS */}
      <section className="py-24 px-6 md:px-16">
        <div className="max-w-[1300px] mx-auto">
          <div ref={toolsRef} className="reveal mb-16 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] mb-5"
              style={{ color: 'var(--accent)', fontFamily: 'Nunito, sans-serif' }}>{t('tools.sectionLabel')}</p>
            <h2 className="font-extrabold mb-4"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', color: 'var(--text-1)', lineHeight: 1.05, letterSpacing: '-0.025em', fontFamily: 'Nunito, sans-serif', minHeight: '1.2em' }}>
              <span ref={heading1.ref}>
                {heading1.renderContent()}
                {!heading1.done && <span className="cursor-blink" />}
              </span>
            </h2>
            <p className="text-sm font-medium mx-auto"
              style={{ color: 'var(--text-3)', maxWidth: 440, lineHeight: 1.85, fontFamily: 'Nunito, sans-serif' }}>
              {t('tools.sectionSub')}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.1 }}
            className="flex items-center justify-center gap-2 mb-10 flex-wrap">
            {TOOLS_KEYS.map((key, i) => {
              const Icon = TOOL_ICONS[i];
              const active = activeTool === i;
              return (
                <motion.button key={key} onClick={() => setActiveTool(i)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm"
                  style={{ background: active ? 'var(--text-1)' : 'var(--bg-2)', color: active ? 'var(--bg)' : 'var(--text-3)', border: `1px solid ${active ? 'transparent' : 'var(--border)'}`, fontFamily: 'Nunito, sans-serif', transition: 'background 0.25s, color 0.25s, border-color 0.25s' }}>
                  <Icon size={13} strokeWidth={2} />
                  {t(`tools.${key}.title`)}
                </motion.button>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.15 }}
            className="rounded-3xl overflow-hidden"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', boxShadow: '0 2px 60px rgba(0,0,0,0.07)' }}>
            <AnimatePresence mode="wait">
              {TOOLS_KEYS.map((key, i) => {
                if (activeTool !== i) return null;
                const Icon = TOOL_ICONS[i];
                const accent = TOOL_ACCENTS[i];
                return (
                  <motion.div key={key}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="grid md:grid-cols-[1fr_1.15fr]">
                    <div className="p-10 md:p-16 flex flex-col justify-between gap-12"
                      style={{ borderRight: '1px solid var(--border)' }}>
                      <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-10"
                          style={{ background: 'var(--accent-soft)', border: '1px solid var(--border)' }}>
                          <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: accent }}>
                            <Icon size={11} color="white" strokeWidth={2} />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-[0.15em]"
                            style={{ color: 'var(--text-2)', fontFamily: 'Nunito, sans-serif' }}>
                            {t(`tools.${key}.title`)}
                          </span>
                        </div>
                        <h3 className="font-extrabold mb-5"
                          style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', color: 'var(--text-1)', letterSpacing: '-0.025em', lineHeight: 1.08, fontFamily: 'Nunito, sans-serif' }}>
                          {t(`tools.${key}.sub`)}
                        </h3>
                        <p className="text-sm font-medium"
                          style={{ color: 'var(--text-3)', maxWidth: 320, lineHeight: 2, fontFamily: 'Nunito, sans-serif' }}>
                          {t(`tools.${key}.desc`)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <motion.div whileHover={{ x: 5 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                          <Link to={TOOL_ROUTES[i]}
                            className="inline-flex items-center gap-3 font-bold text-sm"
                            style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>
                            <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--text-1)' }}>
                              <ArrowRight size={13} style={{ color: 'var(--bg)' }} />
                            </span>
                            {t('tools.open')} {t(`tools.${key}.title`)}
                          </Link>
                        </motion.div>
                        <span className="font-extrabold select-none"
                          style={{ fontSize: '5rem', lineHeight: 1, color: 'var(--border)', letterSpacing: '-0.04em', fontFamily: 'Nunito, sans-serif' }}>
                          {TOOL_NS[i]}
                        </span>
                      </div>
                    </div>
                    <div className="relative overflow-hidden" style={{ minHeight: 460 }}>
                      <motion.img key={TOOL_IMGS[i]} src={TOOL_IMGS[i]} alt={t(`tools.${key}.title`)}
                        initial={{ scale: 1.06, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ background: `linear-gradient(135deg, ${accent}22 0%, transparent 60%)` }} />
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'linear-gradient(to right, var(--bg-2) 0%, transparent 28%)' }} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          <div className="flex items-center justify-center gap-2 mt-7">
            {TOOLS_KEYS.map((_, i) => (
              <motion.button key={i} onClick={() => setActiveTool(i)}
                animate={{ width: activeTool === i ? 28 : 7, background: activeTool === i ? 'var(--text-1)' : 'var(--border)' }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-full" style={{ height: 7 }} />
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section className="px-6 md:px-16 pb-24">
        <div ref={platformRef} className="reveal max-w-[1300px] mx-auto rounded-3xl overflow-hidden"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
          <div className="grid md:grid-cols-2">
            <div className="p-10 md:p-16 flex flex-col justify-center" style={{ borderRight: '1px solid var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-5"
                style={{ color: 'var(--accent)', fontFamily: 'Nunito, sans-serif' }}>{t('platform.label')}</p>
              <h2 className="font-extrabold mb-5"
                style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', color: 'var(--text-1)', lineHeight: 1.05, letterSpacing: '-0.02em', fontFamily: 'Nunito, sans-serif', minHeight: '1.2em' }}>
                <span ref={heading2.ref}>
                  {heading2.display}
                  {!heading2.done && <span className="cursor-blink" />}
                </span>
              </h2>
              <p className="text-sm font-medium leading-relaxed mb-8"
                style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                {t('platform.sub')}
              </p>
              <div className="flex flex-wrap gap-2 mb-8">
                {['Web', 'Windows', 'macOS', 'iOS', 'Android'].map(p => (
                  <span key={p} className="px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: 'var(--bg-3)', color: 'var(--text-2)', border: '1px solid var(--border)', fontFamily: 'Nunito, sans-serif' }}>
                    {p}
                  </span>
                ))}
              </div>
              <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <Link to="/register" className="inline-flex items-center gap-3 self-start">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--text-1)' }}>
                    <ArrowRight size={15} style={{ color: 'var(--bg)' }} />
                  </span>
                  <span className="font-bold" style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>{t('cta.button')}</span>
                </Link>
              </motion.div>
            </div>
            <div className="relative min-h-[320px]">
              <img src="https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=900&q=85"
                alt="Devices" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, var(--bg-2) 0%, transparent 35%)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="px-6 md:px-16 pb-28" id="contact">
        <ContactSection />
      </section>

    </div>
  );
};

function ContactSection() {
  const { t } = useTranslation();
  const ref = useReveal();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1200);
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-3)',
    border: '1px solid var(--border)',
    color: 'var(--text-1)',
    fontFamily: 'Nunito, sans-serif',
    borderRadius: 14,
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 500,
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <div ref={ref} className="reveal max-w-[1300px] mx-auto rounded-3xl overflow-hidden"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
      <div className="grid md:grid-cols-[1fr_1.2fr]">

        {/* Left — copy */}
        <div className="p-10 md:p-16 flex flex-col justify-center"
          style={{ borderRight: '1px solid var(--border)' }}>
          <p className="text-xs font-bold uppercase tracking-[0.22em] mb-5"
            style={{ color: 'var(--accent)', fontFamily: 'Nunito, sans-serif' }}>
            {t('contact.label')}
          </p>
          <h2 className="font-extrabold mb-5"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', color: 'var(--text-1)', lineHeight: 1.05, letterSpacing: '-0.02em', fontFamily: 'Nunito, sans-serif' }}>
            {t('contact.heading')}<br />
            <em style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: 'var(--accent)' }}>
              {t('contact.headingAccent')}
            </em>
          </h2>
          <p className="text-sm font-medium leading-relaxed mb-8"
            style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif', maxWidth: 340 }}>
            {t('contact.sub')}
          </p>
          <div className="flex flex-col gap-4">
            {(['contact.detail1', 'contact.detail2', 'contact.detail3'] as const).map(key => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-2)', fontFamily: 'Nunito, sans-serif' }}>
                  {t(key)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="p-10 md:p-16 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center justify-center text-center gap-5 py-8">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(192,57,43,0.12)' }}>
                  <CheckCircle2 size={28} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="font-extrabold text-xl mb-1" style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>
                    {t('contact.successTitle')}
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                    {t('contact.successSub')}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setSent(false); setName(''); setEmail(''); setMessage(''); }}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: 'var(--bg-3)', color: 'var(--text-2)', border: '1px solid var(--border)', fontFamily: 'Nunito, sans-serif' }}>
                  {t('contact.sendAnother')}
                </motion.button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col gap-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2"
                      style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                      {t('contact.nameLabel')}
                    </label>
                    <input
                      type="text" required value={name} onChange={e => setName(e.target.value)}
                      placeholder={t('contact.namePlaceholder')}
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2"
                      style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                      {t('contact.emailLabel')}
                    </label>
                    <input
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2"
                    style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                    {t('contact.messageLabel')}
                  </label>
                  <textarea
                    required rows={4} value={message} onChange={e => setMessage(e.target.value)}
                    placeholder={t('contact.messagePlaceholder')}
                    style={{ ...inputStyle, resize: 'none' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <motion.button
                  type="submit" disabled={sending}
                  whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="self-start inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-60"
                  style={{ background: 'var(--accent)', fontFamily: 'Nunito, sans-serif' }}>
                  <AnimatePresence mode="wait">
                    {sending ? (
                      <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <motion.span key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Send size={14} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {sending ? t('contact.sending') : t('contact.send')}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

