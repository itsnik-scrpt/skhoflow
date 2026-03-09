import React, { useState, useRef, useEffect, useCallback, PointerEvent as RPointerEvent } from 'react';
import {
  Plus, Trash2, Type, Square, Circle,
  Undo2, Redo2, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  ChevronUp, ChevronDown, FolderOpen, Save, LayoutTemplate,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Slide, SlideElement } from '../../types';
import { generateId } from '../../utils/helpers';
import { useDocumentStore } from '../../store/documentStore';
import { SaveDialog, SaveFormat } from './SaveDialog';
import { downloadFile } from '../../utils/saveFile';

const CW = 960, CH = 540;

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function defaultSlide(): Slide {
  return {
    id: generateId(),
    elements: [
      { id: generateId(), type: 'text', x: 80, y: 160, width: 800, height: 90, content: 'Click to edit title', style: { fontSize: '42px', fontWeight: 'bold', color: '#111827', textAlign: 'center' } },
      { id: generateId(), type: 'text', x: 80, y: 280, width: 800, height: 60, content: 'Subtitle text', style: { fontSize: '22px', color: '#6B7280', textAlign: 'center' } },
    ],
    background: '#ffffff',
  };
}

function parseSlidesContent(c: string): Slide[] {
  try { const p = JSON.parse(c); if (Array.isArray(p) && p.length > 0) return p; } catch { /**/ }
  return [defaultSlide()];
}

type HandleDir = 'nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w';
const HANDLES: { dir: HandleDir; cursor: string; style: React.CSSProperties }[] = [
  { dir: 'nw', cursor: 'nw-resize', style: { top: -4,        left: -4        } },
  { dir: 'n',  cursor: 'n-resize',  style: { top: -4,        left: '50%', transform: 'translateX(-50%)' } },
  { dir: 'ne', cursor: 'ne-resize', style: { top: -4,        right: -4       } },
  { dir: 'e',  cursor: 'e-resize',  style: { top: '50%',     right: -4,   transform: 'translateY(-50%)' } },
  { dir: 'se', cursor: 'se-resize', style: { bottom: -4,     right: -4       } },
  { dir: 's',  cursor: 's-resize',  style: { bottom: -4,     left: '50%', transform: 'translateX(-50%)' } },
  { dir: 'sw', cursor: 'sw-resize', style: { bottom: -4,     left: -4        } },
  { dir: 'w',  cursor: 'w-resize',  style: { top: '50%',     left: -4,    transform: 'translateY(-50%)' } },
];

interface HistState { slides: Slide[]; idx: number }
interface Props { docId: string | null; isFocused: boolean; standaloneMode?: boolean }

export const SlidesPanel: React.FC<Props> = ({ docId, isFocused, standaloneMode }) => {
  const { documents, updateDocument } = useDocumentStore();
  const doc = docId ? documents.find(d => d.id === docId) : null;

  const [saveOpen, setSaveOpen]     = useState(false);
  const [fileName, setFileName]     = useState(doc?.title || 'Untitled Presentation');
  const [dirty, setDirty]           = useState(false);
  const [slides, setSlides]         = useState<Slide[]>(() => parseSlidesContent(doc?.content || ''));
  const [activeIdx, setActiveIdx]   = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const scaleRef  = useRef(1);

  const interact = useRef<{
    mode: 'drag'|'resize'; id: string;
    startX: number; startY: number;
    origEl: SlideElement; dir?: HandleDir;
  } | null>(null);

  const hist    = useRef<HistState[]>([{ slides, idx: 0 }]);
  const histPos = useRef(0);

  const pushHist = useCallback((s: Slide[], i: number) => {
    hist.current = hist.current.slice(0, histPos.current + 1);
    hist.current.push({ slides: s, idx: i });
    histPos.current = hist.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (histPos.current <= 0) return;
    histPos.current--;
    const { slides: s, idx } = hist.current[histPos.current];
    setSlides(s); setActiveIdx(idx);
  }, []);

  const redo = useCallback(() => {
    if (histPos.current >= hist.current.length - 1) return;
    histPos.current++;
    const { slides: s, idx } = hist.current[histPos.current];
    setSlides(s); setActiveIdx(idx);
  }, []);

  useEffect(() => {
    if (docId) updateDocument(docId, { content: JSON.stringify(slides), updatedAt: new Date() });
    if (standaloneMode) setDirty(true);
  }, [slides]);

  /* ── Open local .skhop / .json ── */
  const openFile = async () => {
    try {
      // @ts-ignore
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{ description: 'Presentations', accept: { 'application/json': ['.skhop', '.json'] } }],
      });
      const file = await fileHandle.getFile();
      const text = await file.text();
      setFileName(file.name.replace(/\.[^.]+$/, ''));
      try {
        const p = JSON.parse(text);
        const loaded: Slide[] = Array.isArray(p) ? p : (Array.isArray(p.slides) ? p.slides : [defaultSlide()]);
        setSlides(loaded); setActiveIdx(0); setSelectedId(null);
        pushHist(loaded, 0);
      } catch { /**/ }
      setDirty(false);
    } catch (e: any) { if (e?.name !== 'AbortError') console.error(e); }
  };

  useEffect(() => {
    if (!isFocused) return;
    const h = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 's') { e.preventDefault(); setSaveOpen(true); return; }
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !editingId) {
        e.preventDefault();
        mutateSlide(si => ({ ...si, elements: si.elements.filter(el => el.id !== selectedId) }));
        setSelectedId(null); return;
      }
      if (selectedId && !editingId && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const d = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0;
        const dy = e.key === 'ArrowUp'   ? -d : e.key === 'ArrowDown'  ? d : 0;
        mutateEl(selectedId, el => ({ ...el, x: el.x + dx, y: el.y + dy }));
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isFocused, selectedId, editingId, undo, redo]);

  const slide = slides[activeIdx] ?? slides[0];

  const mutateSlide = useCallback((fn: (s: Slide) => Slide) => {
    setSlides(prev => {
      const next = prev.map((s, i) => i === activeIdx ? fn(s) : s);
      pushHist(next, activeIdx);
      return next;
    });
  }, [activeIdx, pushHist]);

  const mutateEl = useCallback((id: string, fn: (el: SlideElement) => SlideElement) => {
    mutateSlide(s => ({ ...s, elements: s.elements.map(el => el.id === id ? fn(el) : el) }));
  }, [mutateSlide]);

  const getScale = () => canvasRef.current ? canvasRef.current.getBoundingClientRect().width / CW : 1;

  const onCanvasPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current) { setSelectedId(null); setEditingId(null); }
  };

  const onElPointerDown = (e: RPointerEvent<HTMLDivElement>, el: SlideElement) => {
    if (editingId === el.id) return;
    e.stopPropagation(); e.preventDefault();
    setSelectedId(el.id);
    scaleRef.current = getScale();
    interact.current = { mode: 'drag', id: el.id, startX: e.clientX, startY: e.clientY, origEl: { ...el } };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onHandlePointerDown = (e: RPointerEvent<HTMLDivElement>, el: SlideElement, dir: HandleDir) => {
    e.stopPropagation(); e.preventDefault();
    scaleRef.current = getScale();
    interact.current = { mode: 'resize', id: el.id, startX: e.clientX, startY: e.clientY, origEl: { ...el }, dir };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    const it = interact.current;
    if (!it) return;
    const dx = (e.clientX - it.startX) / scaleRef.current;
    const dy = (e.clientY - it.startY) / scaleRef.current;
    const { origEl: o, id } = it;
    if (it.mode === 'drag') {
      mutateEl(id, el => ({ ...el, x: clamp(o.x + dx, 0, CW - o.width), y: clamp(o.y + dy, 0, CH - o.height) }));
    } else {
      const dir = it.dir!;
      let { x, y, width, height } = o;
      const min = 20;
      if (dir.includes('e')) width  = Math.max(min, o.width  + dx);
      if (dir.includes('s')) height = Math.max(min, o.height + dy);
      if (dir.includes('w')) { const dw = Math.min(dx, o.width  - min); x = o.x + dw; width  = o.width  - dw; }
      if (dir.includes('n')) { const dh = Math.min(dy, o.height - min); y = o.y + dh; height = o.height - dh; }
      mutateEl(id, el => ({ ...el, x, y, width, height }));
    }
  };

  const onPointerUp = () => { interact.current = null; };

  const addSlide = () => {
    const s = defaultSlide();
    setSlides(prev => { const n = [...prev, s]; pushHist(n, n.length - 1); return n; });
    setActiveIdx(slides.length);
  };

  const delSlide = (i: number) => {
    if (slides.length === 1) return;
    setSlides(prev => { const n = prev.filter((_, j) => j !== i); const ni = Math.min(i, n.length - 1); pushHist(n, ni); return n; });
    setActiveIdx(prev => Math.min(prev, slides.length - 2));
    setSelectedId(null);
  };

  const addEl = (type: SlideElement['type']) => {
    const el: SlideElement = {
      id: generateId(), type, x: 100, y: 100,
      width: type === 'text' ? 320 : 160,
      height: type === 'text' ? 60 : 120,
      content: type === 'text' ? 'Text' : '',
      style: type === 'text' ? { fontSize: '20px', color: '#111827' } : { fill: '#3B82F6' },
    };
    mutateSlide(s => ({ ...s, elements: [...s.elements, el] }));
    setSelectedId(el.id);
  };

  const sel = slide?.elements.find(e => e.id === selectedId);
  const ui = {
    bg: 'var(--bg)',
    panel: 'var(--bg-2)',
    panelAlt: 'var(--bg-3)',
    border: 'var(--border)',
    text: 'var(--text-1)',
    textSoft: 'var(--text-2)',
    textMuted: 'var(--text-3)',
    accent: 'var(--accent)',
    accentSoft: 'var(--accent-soft)',
  } as const;

  const handleSave = async (name: string, format: SaveFormat) => {
    if (docId) updateDocument(docId, { title: name, content: JSON.stringify(slides), updatedAt: new Date() });
    setFileName(name);
    await downloadFile(name, JSON.stringify(slides), format, 'slides', slides);
    setSaveOpen(false);
    setDirty(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: ui.bg, color: ui.text }}>
      <SaveDialog open={saveOpen} defaultName={fileName} type="slides" onSave={handleSave} onClose={() => setSaveOpen(false)} />

      {/* Standalone title bar */}
      {standaloneMode && (
        <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
          style={{ background: ui.panel, borderBottom: `1px solid ${ui.border}` }}>
          <LayoutTemplate size={15} style={{ color: ui.accent, flexShrink: 0 }} />
          <span className="text-sm font-bold truncate" style={{ color: ui.text, fontFamily: 'Nunito, sans-serif' }}>
            {fileName}{dirty ? ' ●' : ''}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <motion.button onClick={openFile} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: ui.panelAlt, color: ui.textSoft, fontFamily: 'Nunito, sans-serif', border: `1px solid ${ui.border}` }}>
              <FolderOpen size={13} /> Open
            </motion.button>
            <motion.button onClick={() => setSaveOpen(true)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: ui.text, color: ui.bg, fontFamily: 'Nunito, sans-serif' }}>
              <Save size={13} /> Save
            </motion.button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

      {/* Slides strip */}
      <div className="w-[146px] flex-shrink-0 flex flex-col" style={{ background: ui.panel, borderRight: `1px solid ${ui.border}` }}>
        <div className="flex items-center justify-between px-2.5 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${ui.border}` }}>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: ui.textMuted, fontFamily: 'Nunito, sans-serif' }}>Slides</span>
          <button onClick={addSlide} className="p-1 rounded-lg transition-all hover:opacity-80" style={{ color: ui.accent, background: ui.accentSoft }}>
            <Plus size={11} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {slides.map((s, i) => (
            <div key={s.id} onClick={() => { setActiveIdx(i); setSelectedId(null); setEditingId(null); }}
              className="relative group rounded-lg overflow-hidden cursor-pointer"
              style={{ aspectRatio: '16/9', background: s.background || '#fff', border: `2px solid ${i === activeIdx ? ui.accent : ui.border}`, transition: 'border-color 0.15s' }}>
              <span className="absolute bottom-0.5 left-1 text-[9px] font-bold" style={{ color: '#9ca3af' }}>{i + 1}</span>
              {slides.length > 1 && (
                <button onClick={e => { e.stopPropagation(); delSlide(i); }}
                  className="absolute top-0.5 right-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'var(--accent)', color: 'white' }}>
                  <Trash2 size={7} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center flex-wrap gap-1 px-3 py-1.5 flex-shrink-0"
          style={{ background: ui.panel, borderBottom: `1px solid ${ui.border}` }}>
          {[
            { t: 'text' as const,      icon: <Type size={12} />,   label: 'Text' },
            { t: 'rectangle' as const, icon: <Square size={12} />, label: 'Rect' },
            { t: 'circle' as const,    icon: <Circle size={12} />, label: 'Circle' },
          ].map(({ t, icon, label }) => (
            <button key={t} onClick={() => addEl(t)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: ui.panelAlt, color: ui.textSoft, fontFamily: 'Nunito, sans-serif' }}>
              {icon}{label}
            </button>
          ))}
          <div className="w-px h-4 mx-0.5" style={{ background: ui.border }} />

          {sel?.type === 'text' && (<>
            <select value={sel.style?.fontSize || '20px'}
              onChange={e => mutateEl(sel.id, el => ({ ...el, style: { ...el.style, fontSize: e.target.value } }))}
              className="text-xs rounded-lg px-1.5 py-1 outline-none w-20"
              style={{ background: ui.panelAlt, border: `1px solid ${ui.border}`, color: ui.textSoft, fontFamily: 'Nunito, sans-serif' }}>
              {['10px','12px','14px','16px','18px','20px','24px','28px','32px','36px','40px','48px','56px','72px'].map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => mutateEl(sel.id, el => ({ ...el, style: { ...el.style, fontWeight: el.style?.fontWeight === 'bold' ? 'normal' : 'bold' } }))}
              className="p-1.5 rounded-md transition-all hover:opacity-80"
              style={{ background: sel.style?.fontWeight === 'bold' ? ui.accentSoft : 'transparent', color: sel.style?.fontWeight === 'bold' ? ui.accent : ui.textMuted }}>
              <Bold size={12} />
            </button>
            <button onClick={() => mutateEl(sel.id, el => ({ ...el, style: { ...el.style, fontStyle: el.style?.fontStyle === 'italic' ? 'normal' : 'italic' } }))}
              className="p-1.5 rounded-md transition-all hover:opacity-80"
              style={{ background: sel.style?.fontStyle === 'italic' ? ui.accentSoft : 'transparent', color: sel.style?.fontStyle === 'italic' ? ui.accent : ui.textMuted }}>
              <Italic size={12} />
            </button>
            {(['left','center','right'] as const).map(a => (
              <button key={a} onClick={() => mutateEl(sel.id, el => ({ ...el, style: { ...el.style, textAlign: a } }))}
                className="p-1.5 rounded-md transition-all hover:opacity-80"
                style={{ background: sel.style?.textAlign === a ? ui.accentSoft : 'transparent', color: sel.style?.textAlign === a ? ui.accent : ui.textMuted }}>
                {a === 'left' ? <AlignLeft size={12} /> : a === 'center' ? <AlignCenter size={12} /> : <AlignRight size={12} />}
              </button>
            ))}
            <label className="cursor-pointer" title="Text color">
              <div className="w-5 h-5 rounded relative" style={{ background: sel.style?.color || '#111827', border: '2px solid var(--border)' }}>
                <input type="color" value={sel.style?.color || '#111827'}
                  onChange={e => mutateEl(sel.id, el => ({ ...el, style: { ...el.style, color: e.target.value } }))}
                  className="absolute opacity-0 w-full h-full cursor-pointer" />
              </div>
            </label>
          </>)}

          {(sel?.type === 'rectangle' || sel?.type === 'circle') && (
            <label className="cursor-pointer flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
              Fill
              <div className="w-5 h-5 rounded relative" style={{ background: sel.style?.fill || '#3B82F6', border: '2px solid var(--border)' }}>
                <input type="color" value={sel.style?.fill || '#3B82F6'}
                  onChange={e => mutateEl(sel.id, el => ({ ...el, style: { ...el.style, fill: e.target.value } }))}
                  className="absolute opacity-0 w-full h-full cursor-pointer" />
              </div>
            </label>
          )}

          {selectedId && (
            <button onClick={() => { mutateSlide(s => ({ ...s, elements: s.elements.filter(e => e.id !== selectedId) })); setSelectedId(null); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontFamily: 'Nunito, sans-serif' }}>
              <Trash2 size={11} /> Del
            </button>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button onClick={undo} className="p-1.5 rounded-md hover:opacity-80 transition-all" style={{ color: ui.textMuted, background: ui.panelAlt }}><Undo2 size={12} /></button>
            <button onClick={redo} className="p-1.5 rounded-md hover:opacity-80 transition-all" style={{ color: ui.textMuted, background: ui.panelAlt }}><Redo2 size={12} /></button>
            <div className="w-px h-4 mx-0.5" style={{ background: ui.border }} />
            <label className="text-xs flex items-center gap-1 cursor-pointer" style={{ color: ui.textMuted, fontFamily: 'Nunito, sans-serif' }}>
              BG
              <input type="color" value={slide?.background || '#ffffff'}
                onChange={e => mutateSlide(s => ({ ...s, background: e.target.value }))}
                className="w-5 h-5 rounded cursor-pointer border-0 p-0" />
            </label>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-6" style={{ background: `linear-gradient(180deg, ${ui.panelAlt}, ${ui.bg})` }}>
          <div ref={canvasRef}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="relative select-none"
            style={{ width: '100%', maxWidth: CW, aspectRatio: `${CW}/${CH}`, background: slide?.background || '#fff', boxShadow: '0 12px 36px rgba(0,0,0,0.2)', borderRadius: 12, border: `1px solid ${ui.border}` }}>
            {slide?.elements.map(el => {
              const pct = (v: number, base: number) => `${(v / base) * 100}%`;
              const isSel = selectedId === el.id;
              const isEd  = editingId  === el.id;
              return (
                <div key={el.id}
                  onPointerDown={e => onElPointerDown(e, el)}
                  onClick={e => { e.stopPropagation(); setSelectedId(el.id); }}
                  onDoubleClick={e => { e.stopPropagation(); if (el.type === 'text') setEditingId(el.id); }}
                  style={{
                    position: 'absolute',
                    left: pct(el.x, CW), top: pct(el.y, CH),
                    width: pct(el.width, CW), height: pct(el.height, CH),
                    cursor: isEd ? 'text' : 'move',
                    outline: isSel ? '2px solid var(--accent)' : 'none',
                    outlineOffset: 2,
                    touchAction: 'none',
                    userSelect: isEd ? 'text' : 'none',
                  }}>
                  {el.type === 'text' ? (
                    isEd ? (
                      <textarea autoFocus value={el.content}
                        onChange={e => mutateEl(el.id, v => ({ ...v, content: e.target.value }))}
                        onBlur={() => setEditingId(null)}
                        onPointerDown={e => e.stopPropagation()}
                        className="w-full h-full bg-transparent resize-none outline-none border-none"
                        style={{ ...el.style as React.CSSProperties, padding: '2px', lineHeight: 1.3 }} />
                    ) : (
                      <div className="w-full h-full overflow-hidden pointer-events-none"
                        style={{ ...el.style as React.CSSProperties, padding: '2px', lineHeight: 1.3 }}>
                        {el.content}
                      </div>
                    )
                  ) : el.type === 'rectangle' ? (
                    <div className="w-full h-full pointer-events-none" style={{ background: el.style?.fill || '#3B82F6', borderRadius: 3 }} />
                  ) : (
                    <div className="w-full h-full rounded-full pointer-events-none" style={{ background: el.style?.fill || '#3B82F6' }} />
                  )}

                  {/* 8 resize handles */}
                  {isSel && !isEd && HANDLES.map(({ dir, cursor, style }) => (
                    <div key={dir}
                      onPointerDown={e => { e.stopPropagation(); onHandlePointerDown(e, el, dir); }}
                      style={{
                        position: 'absolute', width: 8, height: 8,
                        background: 'var(--accent)', border: '2px solid white',
                        borderRadius: '50%', cursor, zIndex: 10, touchAction: 'none',
                        ...style,
                      }} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Properties panel */}
      <div className="w-[160px] flex-shrink-0 overflow-y-auto p-3 space-y-3"
        style={{ background: ui.panel, borderLeft: `1px solid ${ui.border}` }}>
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: ui.textMuted, fontFamily: 'Nunito, sans-serif' }}>Properties</p>
        {sel ? (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              {([['X','x'],['Y','y'],['W','width'],['H','height']] as [string, keyof SlideElement][]).map(([label, key]) => (
                <div key={key}>
                  <label className="text-[9px] font-black uppercase tracking-wider block mb-0.5" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>{label}</label>
                  <input type="number" value={Math.round(sel[key] as number)}
                    onChange={e => mutateEl(sel.id, el => ({ ...el, [key]: +e.target.value }))}
                    className="w-full px-1.5 py-1 text-xs rounded-lg outline-none"
                    style={{ background: ui.panelAlt, border: `1px solid ${ui.border}`, color: ui.text, fontFamily: 'Nunito, sans-serif' }} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider block mb-1" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>Layer</label>
              <div className="flex gap-1">
                <button onClick={() => mutateSlide(s => { const els = [...s.elements]; const i = els.findIndex(e => e.id === sel.id); if (i < els.length - 1) { [els[i], els[i+1]] = [els[i+1], els[i]]; } return { ...s, elements: els }; })}
                  className="flex-1 py-1 rounded-lg text-xs transition-all hover:opacity-80" style={{ background: ui.panelAlt, color: ui.textMuted }}>
                  <ChevronUp size={12} className="mx-auto" />
                </button>
                <button onClick={() => mutateSlide(s => { const els = [...s.elements]; const i = els.findIndex(e => e.id === sel.id); if (i > 0) { [els[i], els[i-1]] = [els[i-1], els[i]]; } return { ...s, elements: els }; })}
                  className="flex-1 py-1 rounded-lg text-xs transition-all hover:opacity-80" style={{ background: ui.panelAlt, color: ui.textMuted }}>
                  <ChevronDown size={12} className="mx-auto" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider block mb-1" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>Opacity</label>
              <input type="range" min={0} max={1} step={0.01}
                value={parseFloat(sel.style?.opacity || '1')}
                onChange={e => mutateEl(sel.id, el => ({ ...el, style: { ...el.style, opacity: e.target.value } }))}
                className="w-full h-1.5 rounded-full" />
              <span className="text-[9px]" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                {Math.round(parseFloat(sel.style?.opacity || '1') * 100)}%
              </span>
            </div>
            <button onClick={() => { mutateSlide(s => ({ ...s, elements: s.elements.filter(e => e.id !== selectedId) })); setSelectedId(null); }}
              className="w-full py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontFamily: 'Nunito, sans-serif' }}>
              Delete element
            </button>
          </>
        ) : (
          <p className="text-xs" style={{ color: ui.textMuted, fontFamily: 'Nunito, sans-serif' }}>Select an element.</p>
        )}
        <div>
          <label className="text-[9px] font-black uppercase tracking-wider block mb-1" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>Notes</label>
          <textarea value={slide?.notes || ''} onChange={e => mutateSlide(s => ({ ...s, notes: e.target.value }))}
            rows={3} placeholder="Speaker notes…"
            className="w-full px-2 py-1 text-xs rounded-lg outline-none resize-none"
            style={{ background: ui.panelAlt, border: `1px solid ${ui.border}`, color: ui.text, fontFamily: 'Nunito, sans-serif' }} />
        </div>
      </div>
      </div>{/* end inner flex */}
    </div>
  );
};
