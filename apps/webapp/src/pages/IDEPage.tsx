import React from 'react';
import { IDEPanel } from '../components/workspace/IDEPanel';

/* Standalone IDE — open local folder/files, save locally, no cloud */
export const IDEPage: React.FC = () => (
  <div className="flex flex-col h-full overflow-hidden">
    <IDEPanel docId={null} isFocused={true} standaloneMode />
  </div>
);
