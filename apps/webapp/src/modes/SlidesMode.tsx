import React, { useState, useRef } from 'react';
import { Plus, Trash2, Type, Square, Circle, ChevronUp, ChevronDown } from 'lucide-react';
import { Slide, SlideElement } from '../types';
import { generateId } from '../utils/helpers';

const CANVAS_W = 960;
const CANVAS_H = 540;

const defaultSlide = (): Slide => ({
  id: generateId(),
  elements: [
    { id: generateId(), type: 'text', x: 80, y: 180, width: 800, height: 80, content: 'Click to edit title', style: { fontSize: '40px', fontWeight: 'bold', color: '#111827', textAlign: 'center' } },
    { id: generateId(), type: 'text', x: 80, y: 290, width: 800, height: 50, content: 'Subtitle text', style: { fontSize: '22px', color: '#6B7280', textAlign: 'center' } },
  ],
  background: '#ffffff',
});

export const SlidesMode: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([defaultSlide()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const slide = slides[activeIdx];

  const updateSlide = (updated: Slide) => setSlides(slides.map((s, i) => i === activeIdx ? updated : s));

  const addSlide = () => {
    const s = defaultSlide();
    setSlides([...slides, s]);
    setActiveIdx(slides.length);
    setSelectedId(null);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length === 1) return;
    const next = slides.filter((_, i) => i !== idx);
    setSlides(next);
    setActiveIdx(Math.min(idx, next.length - 1));
  };

  const addElement = (type: SlideElement['type']) => {
    const el: SlideElement = {
      id: generateId(), type,
      x: 100, y: 100, width: type === 'text' ? 300 : 160, height: type === 'text' ? 50 : 120,
      content: type === 'text' ? 'Text' : '',
      style: type === 'text' ? { fontSize: '18px', color: '#111827' } : { fill: '#3B82F6' },
    };
    updateSlide({ ...slide, elements: [...slide.elements, el] });
    setSelectedId(el.id);
  };

  const updateElement = (id: string, patch: Partial<SlideElement>) =>
    updateSlide({ ...slide, elements: slide.elements.map(e => e.id === id ? { ...e, ...patch } : e) });

  const deleteSelected = () => {
    if (!selectedId) return;
    updateSlide({ ...slide, elements: slide.elements.filter(e => e.id !== selectedId) });
    setSelectedId(null);
  };

  const onMouseDown = (e: React.MouseEvent, el: SlideElement) => {
    if (editingId === el.id) return;
    e.stopPropagation();
    setSelectedId(el.id);
    const rect = canvasRef.current!.getBoundingClientRect();
    const scale = rect.width / CANVAS_W;
    setDragging({ id: el.id, ox: e.clientX / scale - el.x, oy: e.clientY / scale - el.y });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = rect.width / CANVAS_W;
    const x = Math.max(0, e.clientX / scale - dragging.ox);
    const y = Math.max(0, e.clientY / scale - dragging.oy);
    updateElement(dragging.id, { x, y });
  };

  const sel = slide.elements.find(e => e.id === selectedId);

  return (
    <div className="flex h-full bg-gray-900 text-gray-100 overflow-hidden">
      {/* Slides panel */}
      <div className="w-44 flex-shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Slides</span>
          <button onClick={addSlide} className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"><Plus size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {slides.map((s, i) => (
            <div key={s.id} onClick={() => { setActiveIdx(i); setSelectedId(null); }}
              className={`relative group rounded border cursor-pointer overflow-hidden transition-colors ${i === activeIdx ? 'border-blue-500' : 'border-gray-700 hover:border-gray-600'}`}
              style={{ aspectRatio: '16/9', background: s.background }}>
              <span className="absolute bottom-1 left-1 text-xs text-gray-500 font-medium">{i + 1}</span>
              {slides.length > 1 && (
                <button onClick={e => { e.stopPropagation(); deleteSlide(i); }}
                  className="absolute top-1 right-1 p-0.5 rounded bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-10 flex-shrink-0 bg-gray-900 border-b border-gray-800 flex items-center px-3 gap-2">
          <button onClick={() => addElement('text')} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"><Type size={13} /> Text</button>
          <button onClick={() => addElement('rectangle')} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"><Square size={13} /> Rectangle</button>
          <button onClick={() => addElement('circle')} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"><Circle size={13} /> Circle</button>
          {selectedId && <button onClick={deleteSelected} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-red-400 hover:bg-gray-800 transition-colors ml-2"><Trash2 size={13} /> Delete</button>}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-gray-500">Background</label>
            <input type="color" value={slide.background} onChange={e => updateSlide({ ...slide, background: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-800 flex items-center justify-center p-8"
          onMouseMove={onMouseMove} onMouseUp={() => setDragging(null)} onClick={() => { setSelectedId(null); setEditingId(null); }}>
          <div ref={canvasRef} className="relative shadow-2xl select-none"
            style={{ width: '100%', maxWidth: CANVAS_W, aspectRatio: `${CANVAS_W}/${CANVAS_H}`, background: slide.background }}>
            {slide.elements.map(el => {
              const pct = (v: number, base: number) => `${(v / base) * 100}%`;
              return (
                <div key={el.id}
                  style={{ position: 'absolute', left: pct(el.x, CANVAS_W), top: pct(el.y, CANVAS_H), width: pct(el.width, CANVAS_W), height: pct(el.height, CANVAS_H), cursor: editingId === el.id ? 'text' : 'move', outline: selectedId === el.id ? '2px solid #3B82F6' : 'none', outlineOffset: '1px' }}
                  onMouseDown={e => onMouseDown(e, el)}
                  onClick={e => { e.stopPropagation(); setSelectedId(el.id); }}>
                  {el.type === 'text' ? (
                    editingId === el.id ? (
                      <textarea autoFocus value={el.content} onChange={e => updateElement(el.id, { content: e.target.value })}
                        onBlur={() => setEditingId(null)}
                        className="w-full h-full bg-transparent border-none outline-none resize-none"
                        style={{ ...el.style, padding: '2px' }} />
                    ) : (
                      <div onDoubleClick={e => { e.stopPropagation(); setEditingId(el.id); }}
                        className="w-full h-full overflow-hidden"
                        style={{ ...el.style, padding: '2px' }}>
                        {el.content}
                      </div>
                    )
                  ) : el.type === 'rectangle' ? (
                    <div className="w-full h-full" style={{ background: el.style?.fill || '#3B82F6', borderRadius: '2px' }} />
                  ) : (
                    <div className="w-full h-full rounded-full" style={{ background: el.style?.fill || '#3B82F6' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Properties panel */}
      <div className="w-52 flex-shrink-0 bg-gray-950 border-l border-gray-800 p-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Properties</p>
        {sel ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">X</label>
              <input type="number" value={Math.round(sel.x)} onChange={e => updateElement(sel.id, { x: +e.target.value })}
                className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Y</label>
              <input type="number" value={Math.round(sel.y)} onChange={e => updateElement(sel.id, { y: +e.target.value })}
                className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Width</label>
              <input type="number" value={Math.round(sel.width)} onChange={e => updateElement(sel.id, { width: +e.target.value })}
                className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Height</label>
              <input type="number" value={Math.round(sel.height)} onChange={e => updateElement(sel.id, { height: +e.target.value })}
                className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500" />
            </div>
            {sel.type === 'text' && (
              <>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Font Size</label>
                  <input type="text" value={sel.style?.fontSize || '16px'} onChange={e => updateElement(sel.id, { style: { ...sel.style, fontSize: e.target.value } })}
                    className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Color</label>
                  <input type="color" value={sel.style?.color || '#111827'} onChange={e => updateElement(sel.id, { style: { ...sel.style, color: e.target.value } })}
                    className="w-full h-7 rounded cursor-pointer bg-gray-800 border border-gray-700" />
                </div>
              </>
            )}
            {(sel.type === 'rectangle' || sel.type === 'circle') && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Fill</label>
                <input type="color" value={sel.style?.fill || '#3B82F6'} onChange={e => updateElement(sel.id, { style: { ...sel.style, fill: e.target.value } })}
                  className="w-full h-7 rounded cursor-pointer bg-gray-800 border border-gray-700" />
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-600">Select an element to edit its properties.</p>
        )}
      </div>
    </div>
  );
};

