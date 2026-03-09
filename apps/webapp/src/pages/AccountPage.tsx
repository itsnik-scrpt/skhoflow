import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { User, Lock, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export const AccountPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) setUser({ ...user, name });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tierLabel: Record<string, string> = { free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' };

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div className="glass rounded-2xl p-6 mb-5">
      <div className="flex items-center gap-2.5 mb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <Icon size={15} className="text-white/30" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-white mb-8">Account Settings</h1>

        <Section icon={User} title="Profile">
          {saved && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm text-emerald-300"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <CheckCircle size={14} /> Changes saved
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Display name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" value={user?.email || ''} disabled className="input opacity-40 cursor-not-allowed" />
              <p className="text-xs text-white/20 mt-1">Email cannot be changed.</p>
            </div>
            <button type="submit" className="btn-primary">Save Changes</button>
          </form>
        </Section>

        <Section icon={Shield} title="Subscription">
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-sm font-semibold text-white">{tierLabel[user?.subscriptionTier || 'free']} Plan</p>
              <p className="text-xs text-white/30 mt-0.5">
                {user?.subscriptionTier === 'free' ? 'Upgrade to unlock more features' : 'Active subscription'}
              </p>
            </div>
            {user?.subscriptionTier === 'free' && (
              <a href="/pricing" className="btn-primary text-xs px-3 py-1.5">Upgrade</a>
            )}
          </div>
        </Section>

        <Section icon={Lock} title="Security">
          <button className="btn-ghost text-sm">Change Password</button>
        </Section>
      </div>
    </div>
  );
};
