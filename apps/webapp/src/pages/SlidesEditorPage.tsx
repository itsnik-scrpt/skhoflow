import React from 'react';
import { SlidesPanel } from '../components/workspace/SlidesPanel';

/* Standalone slides editor — no cloud, opens/saves locally */
export const SlidesEditorPage: React.FC = () => {
  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <SlidesPanel docId={null} isFocused={true} standaloneMode />
    </div>
  );
};
