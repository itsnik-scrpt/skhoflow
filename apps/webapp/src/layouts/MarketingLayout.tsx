import React from 'react';
import { Outlet } from 'react-router-dom';
import { MarketingNav } from '../components/marketing/MarketingNav';
import { Footer } from '../components/marketing/Footer';

export const MarketingLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
    <MarketingNav />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);
