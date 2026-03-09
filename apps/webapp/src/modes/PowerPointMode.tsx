import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slide, SlideElement } from '../types';
import { generateId } from '../utils/helpers';

const defaultSlide: Slide = {
  id: '1',
  elements: [
    {
      id: 'title-1',
      type: 'text',
      x: 100,
      y: 200,
      width: 760,
      height: 80,
      content: 'Click to add title',
      style: { fontSize: '40px', fontWeight: 'bold', textAlign: 'center', color: '#1F2937' },
    },
    {
      id: 'sub-1',
      type: 'text',
      x: 100,
      y: 300,
      width: 760,
      height: 50,
      content: 'Click to add subtitle',
      style: { fontSize: '20px', textAlign: 'center', color: '#6B7280' },
    },
  ],
  background: '#FFFFFF',
};

export const PowerPointMode: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([defaultSlide]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingElement, setEditingElement] = useState<string | null>(null);

  const currentSlide = slides[activeSlide];

  const addSlide = () => {
    const newSlide: Slide = {
      id: generateId(),
      elements: [],
      background: '#FFFFFF',
    };
    setSlides([...slides, newSlide]);
    setActiveSlide(slides.length);
  };

  const addTextElement = () => {
    const newElement: SlideElement = {
      id: generateId(),
      type: 'text',
      x: 100,
      y: 100,
      width: 300,
      height: 50,
      content: 'New text',
      style: { fontSize: '16px', color: '#1F2937' },
    };
    const updatedSlides = slides.map((slide, i) =>
      i === activeSlide ? { ...slide, elements: [...slide.elements, newElement] } : slide
    );
    setSlides(updatedSlides);
    setSelectedElement(newElement.id);
  };

  const updateElementContent = (id: string, content: string) => {
    const updatedSlides = slides.map((slide, i) =>
      i === activeSlide
        ? {
            ...slide,
            elements: slide.elements.map((el) => (el.id === id ? { ...el, content } : el)),
          }
        : slide
    );
    setSlides(updatedSlides);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-full"
    >
      {/* Slide panel */}
      <div className="w-48 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-2">
        <div className="flex flex-col gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setActiveSlide(index)}
              className={`relative w-full aspect-video rounded border-2 overflow-hidden transition-colors ${
                activeSlide === index
                  ? 'border-blue-500'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
              style={{ backgroundColor: slide.background }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-gray-400">{index + 1}</span>
              </div>
            </button>
          ))}
          <button
            onClick={addSlide}
            className="w-full aspect-video border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Main editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={addTextElement}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            + Text
          </button>
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Background:</label>
            <input
              type="color"
              value={currentSlide.background}
              onChange={(e) => {
                const updatedSlides = slides.map((slide, i) =>
                  i === activeSlide ? { ...slide, background: e.target.value } : slide
                );
                setSlides(updatedSlides);
              }}
              className="w-6 h-6 rounded cursor-pointer border border-gray-300"
            />
          </div>
        </div>

        {/* Slide canvas */}
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 flex items-center justify-center p-8 overflow-auto">
          <div
            className="relative shadow-xl"
            style={{
              width: 960,
              height: 540,
              backgroundColor: currentSlide.background,
              flexShrink: 0,
            }}
            onClick={() => { setSelectedElement(null); setEditingElement(null); }}
          >
            <AnimatePresence>
              {currentSlide.elements.map((element) => (
                <motion.div
                  key={element.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`absolute cursor-pointer ${
                    selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedElement(element.id); }}
                  onDoubleClick={(e) => { e.stopPropagation(); setEditingElement(element.id); }}
                >
                  {editingElement === element.id ? (
                    <textarea
                      autoFocus
                      value={element.content}
                      onChange={(e) => updateElementContent(element.id, e.target.value)}
                      onBlur={() => setEditingElement(null)}
                      className="w-full h-full resize-none border-none outline-none bg-transparent"
                      style={element.style as React.CSSProperties}
                    />
                  ) : (
                    <div style={element.style as React.CSSProperties} className="w-full h-full">
                      {element.content}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Properties panel */}
      <div className="w-56 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Properties
        </h3>
        {selectedElement ? (
          <div className="space-y-3">
            {currentSlide.elements.find((el) => el.id === selectedElement) && (
              <>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Type</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                    {currentSlide.elements.find((el) => el.id === selectedElement)?.type}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400">Select an element</p>
        )}
      </div>
    </motion.div>
  );
};
