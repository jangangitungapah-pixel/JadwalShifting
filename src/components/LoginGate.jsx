import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Shield, User } from 'lucide-react';
import { sounds } from '../utils/soundService';
import { hashPin, verifyPin } from '../utils/storage';

const LoginGate = ({ children, onLogin, employees }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('shift_auth') === 'true';
  });
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('admin');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const loginEnabled = localStorage.getItem('shift_login_enabled') === 'true';
  const storedPin = localStorage.getItem('shift_login_pin') || '';
  const [explicitlyLoggedOut, setExplicitlyLoggedOut] = useState(() => sessionStorage.getItem('shift_auth') === 'false');

  useEffect(() => {
    const handleLogoutEvent = () => {
      setIsAuthenticated(false);
      setRole('admin');
      setSelectedEmployeeId('');
      setExplicitlyLoggedOut(true);
    };
    window.addEventListener('shift_logout', handleLogoutEvent);
    return () => window.removeEventListener('shift_logout', handleLogoutEvent);
  }, []);

  // Show login screen if explicitly logged out, or if login is enabled and not authenticated
  if ((!loginEnabled && !explicitlyLoggedOut) || isAuthenticated) return children;

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (role === 'employee') {
      if (!selectedEmployeeId) {
        sounds.error();
        setError('Silakan pilih nama Anda terlebih dahulu.');
        return;
      }
      sounds.success();
      sessionStorage.setItem('shift_auth', 'true');
      sessionStorage.setItem('shift_role', 'employee');
      sessionStorage.setItem('shift_employee_id', selectedEmployeeId);
      setIsAuthenticated(true);
      if (onLogin) onLogin('employee');
    } else {
      // Support both legacy plain-text PINs and hashed PINs
      let isValid = false;
      if (storedPin.length === 64) {
        // Hashed PIN (SHA-256 = 64 hex chars)
        isValid = await verifyPin(pin, storedPin);
      } else {
        // Legacy plain-text PIN — verify and auto-migrate to hash
        isValid = pin === storedPin;
        if (isValid) {
          const hashed = await hashPin(pin);
          localStorage.setItem('shift_login_pin', hashed);
        }
      }
      
      if (isValid) {
        sounds.success();
        sessionStorage.setItem('shift_auth', 'true');
        sessionStorage.setItem('shift_role', role);
        setIsAuthenticated(true);
        if (onLogin) onLogin(role);
      } else {
        sounds.error();
        setError('PIN salah. Silakan coba lagi.');
        setPin('');
      }
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
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-xl)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(99,102,241,0.4)' }}>
            <img src={`${import.meta.env.BASE_URL}app-icon.svg`} alt="ShiftSync Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.03em', marginBottom: '0.35rem', background: 'linear-gradient(135deg, var(--text-primary), var(--color-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ShiftSync</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Login untuk mengakses sistem</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Role selector */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[{ id: 'admin', label: 'Admin', icon: Shield }, { id: 'viewer', label: 'Viewer', icon: Eye }, { id: 'employee', label: 'Karyawan', icon: User }].map(r => (
              <button key={r.id} type="button" onClick={() => { setRole(r.id); setError(''); }} style={{
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

          {role === 'employee' ? (
            <div style={{ position: 'relative', textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Pilih Nama Anda:</label>
              <select className="input" value={selectedEmployeeId} onChange={e => { setSelectedEmployeeId(e.target.value); setError(''); }} style={{ width: '100%', padding: '0.75rem', cursor: 'pointer' }}>
                <option value="">-- Pilih Karyawan --</option>
                {employees?.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type={showPin ? 'text' : 'password'} className="input" placeholder="Masukkan PIN" value={pin} onChange={e => { setPin(e.target.value); setError(''); }} style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.2em' }} autoFocus={role !== 'employee'} />
              <button type="button" onClick={() => setShowPin(!showPin)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}

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
