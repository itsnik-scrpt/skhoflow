import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppNav } from '../components/app/AppNav';

export const AppLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text-1)' }}>
      <AppNav />
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};
