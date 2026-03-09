import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, FileText, FileCode, Image } from 'lucide-react';

export type SaveFormat = 'docx' | 'skho' | 'pdf' | 'skhop';

interface Props {
  open: boolean;
  defaultName: string;
  onSave: (name: string, format: SaveFormat) => void;
  onClose: () => void;
  /** 'document' shows .docx option; 'ide'/'slides' only .skho */
  type: 'document' | 'slides' | 'ide';
}

type FormatOption = { value: SaveFormat; label: string; desc: string; icon: React.ReactNode };

const FORMAT_OPTIONS: Record<string, FormatOption[]> = {
  document: [
    { value: 'docx', label: '.docx', desc: 'Word-compatible, opens anywhere.', icon: <FileText size={14} /> },
    { value: 'skho', label: '.skho', desc: 'SkhoFlow native format.', icon: <FileCode size={14} /> },
  ],
  slides: [
    { value: 'pdf',   label: '.pdf',   desc: 'Print-ready PDF export.',        icon: <Image size={14} /> },
    { value: 'skhop', label: '.skhop', desc: 'SkhoFlow Presentation format.',  icon: <FileCode size={14} /> },
  ],
  ide: [
    { value: 'skho', label: '.skho', desc: 'SkhoFlow project archive.', icon: <FileCode size={14} /> },
  ],
};

export const SaveDialog: React.FC<Props> = ({ open, defaultName, onSave, onClose, type }) => {
  const options = FORMAT_OPTIONS[type] ?? FORMAT_OPTIONS.document;
  const [name, setName]     = useState(defaultName);
  const [format, setFormat] = useState<SaveFormat>(options[0].value);

  useEffect(() => {
    if (open) { setName(defaultName); setFormat(options[0].value); }
  }, [open, defaultName]);

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (name.trim()) onSave(name.trim(), format); };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-50 left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}>

            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: 'var(--accent)', fontFamily: 'Nunito, sans-serif' }}>Save file</p>
                <h3 className="text-lg font-extrabold leading-none" style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif', letterSpacing: '-0.02em' }}>
                  Choose a name<em style={{ fontFamily: '"Cormorant Garamond",serif', fontStyle: 'italic', color: 'var(--accent)' }}>.</em>
                </h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl transition-all hover:opacity-80" style={{ background: 'var(--bg-3)', color: 'var(--text-3)' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {/* Filename input */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-[0.16em] block mb-1.5" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                  File name
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none"
                  style={{ background: 'var(--bg-3)', border: '1.5px solid var(--border)', color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Format selector */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-[0.16em] block mb-1.5" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                  Format
                </label>
                <div className="flex gap-2">
                  {options.map(opt => (
                    <button type="button" key={opt.value} onClick={() => setFormat(opt.value)}
                      className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{ background: format === opt.value ? 'var(--accent-soft)' : 'var(--bg-3)', border: `1.5px solid ${format === opt.value ? 'var(--accent)' : 'var(--border)'}`, color: format === opt.value ? 'var(--accent)' : 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                      {opt.icon}{opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] font-medium mt-1.5" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                  {options.find(o => o.value === format)?.desc}
                </p>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold mt-2"
                style={{ background: 'var(--text-1)', color: 'var(--bg)', fontFamily: 'Nunito, sans-serif' }}>
                <Download size={15} strokeWidth={2.5} />
                Download {name.trim() ? `"${name.trim()}"` : 'file'}.{format}
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

