import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Sparkles, Shield } from 'lucide-react';

const LoginGate = ({ children, onLogin }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('shift_auth') === 'true';
  });
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('admin');

  const loginEnabled = localStorage.getItem('shift_login_enabled') === 'true';
  const storedPin = localStorage.getItem('shift_login_pin') || '';

  // If login not enabled or already authenticated, show children
  if (!loginEnabled || isAuthenticated) return children;

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === storedPin) {
      sessionStorage.setItem('shift_auth', 'true');
      sessionStorage.setItem('shift_role', role);
      setIsAuthenticated(true);
      if (onLogin) onLogin(role);
    } else {
      setError('PIN salah. Silakan coba lagi.');
      setPin('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)', animation: 'orb-float-1 15s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.1), transparent 70%)', animation: 'orb-float-2 18s ease-in-out infinite' }} />

      <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: '380px', padding: '2.5rem', textAlign: 'center', border: '1px solid var(--glass-border-hover)', boxShadow: 'var(--shadow-xl), var(--shadow-glow-primary)' }}>
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--color-primary), var(--color-secondary), transparent)' }} />

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, var(--color-primary-deep), var(--color-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(99,102,241,0.4)' }}>
            <Sparkles size={28} color="white" />
          </div>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '0.35rem', background: 'linear-gradient(135deg, var(--text-primary), var(--color-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ShiftSync</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Masukkan PIN untuk melanjutkan</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type={showPin ? 'text' : 'password'} className="input" placeholder="Masukkan PIN" value={pin} onChange={e => { setPin(e.target.value); setError(''); }} style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.2em' }} autoFocus />
            <button type="button" onClick={() => setShowPin(!showPin)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Role selector */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[{ id: 'admin', label: 'Admin', icon: Shield }, { id: 'viewer', label: 'Viewer', icon: Eye }].map(r => (
              <button key={r.id} type="button" onClick={() => setRole(r.id)} style={{
                flex: 1, padding: '0.55rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: role === r.id ? '700' : '500',
                border: `1.5px solid ${role === r.id ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                background: role === r.id ? 'var(--color-primary-light)' : 'transparent',
                color: role === r.id ? 'var(--color-primary)' : 'var(--text-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s'
              }}>
                <r.icon size={14} /> {r.label}
              </button>
            ))}
          </div>

          {error && <p style={{ fontSize: '0.78rem', color: 'var(--danger)', background: 'var(--danger-bg)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(248,113,113,0.2)' }}>{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            <Lock size={15} /> Masuk
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginGate;
