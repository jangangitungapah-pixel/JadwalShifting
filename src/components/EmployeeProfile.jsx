import React, { useState, useMemo } from 'react';
import { X, User, Phone, Mail, Calendar, BarChart3, Shield, Clock, Star, Ban } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { defaultConstraints } from '../utils/dummyData';

const COLORS = ['#60A5FA', '#FBBF24', '#A78BFA', '#F87171', '#2DD4BF'];

const EmployeeProfile = ({ employee, onClose, onUpdate, shifts }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editData, setEditData] = useState({ phone: employee.phone || '', email: employee.email || '', joinDate: employee.joinDate || '' });
  const [constraints, setConstraints] = useState(employee.constraints || { ...defaultConstraints });
  const [preferences, setPreferences] = useState(employee.preferences || { preferredShifts: [], blockedDays: [] });

  // Shift stats for this employee
  const shiftStats = useMemo(() => {
    let p = 0, s = 0, m = 0, l = 0, sp = 0;
    Object.values(shifts).forEach(day => {
      const sh = day[employee.id];
      if (sh === 'pagi') p++; else if (sh === 'sore') s++; else if (sh === 'malam') m++; else if (sh === 'libur') l++; else if (sh?.includes('sp')) sp++;
    });
    return [{ name: 'Pagi', value: p }, { name: 'Sore', value: s }, { name: 'Malam', value: m }, { name: 'Libur', value: l }, { name: 'SP', value: sp }].filter(x => x.value > 0);
  }, [shifts, employee.id]);

  const handleSave = () => {
    onUpdate({ ...employee, ...editData, constraints, preferences });
    onClose();
  };

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const shiftOptions = ['pagi', 'sore', 'malam'];

  const tabStyle = (active) => ({
    padding: '0.5rem 1rem', fontSize: '0.78rem', fontWeight: active ? '700' : '500', cursor: 'pointer', fontFamily: 'inherit',
    borderRadius: 'var(--radius-md)', border: `1px solid ${active ? 'var(--color-primary)' : 'var(--glass-border)'}`,
    background: active ? 'var(--color-primary-light)' : 'transparent', color: active ? 'var(--color-primary)' : 'var(--text-tertiary)', transition: 'all 0.2s'
  });

  return (
    <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '560px', padding: '1.75rem', animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)', position: 'relative', border: '1px solid var(--glass-border-hover)', boxShadow: 'var(--shadow-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--color-primary), var(--color-secondary), transparent)' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-secondary)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <img src={employee.avatar} alt={employee.name} style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid var(--glass-border)' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>{employee.name}</h3>
            <span className="badge badge-primary">{employee.role}</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.25rem' }}>
          {[{ id: 'overview', label: 'Profil' }, { id: 'preferences', label: 'Preferensi' }, { id: 'constraints', label: 'Batasan' }, { id: 'stats', label: 'Statistik' }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id)}>{t.label}</button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><label className="label"><Phone size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />Telepon</label><input className="input" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} placeholder="08xxx" /></div>
            <div><label className="label"><Mail size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />Email</label><input className="input" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} placeholder="email@example.com" /></div>
            <div><label className="label"><Calendar size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />Tanggal Bergabung</label><input type="date" className="input" value={editData.joinDate} onChange={e => setEditData({ ...editData, joinDate: e.target.value })} style={{ colorScheme: 'dark' }} /></div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label"><Star size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />Shift Favorit</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {shiftOptions.map(s => (
                  <button key={s} onClick={() => { const p = preferences.preferredShifts.includes(s) ? preferences.preferredShifts.filter(x => x !== s) : [...preferences.preferredShifts, s]; setPreferences({ ...preferences, preferredShifts: p }); }}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: '600', border: `1.5px solid ${preferences.preferredShifts.includes(s) ? `var(--shift-${s}-border)` : 'var(--glass-border)'}`, background: preferences.preferredShifts.includes(s) ? `var(--shift-${s}-bg)` : 'transparent', color: preferences.preferredShifts.includes(s) ? `var(--shift-${s}-text)` : 'var(--text-tertiary)', transition: 'all 0.2s', textTransform: 'capitalize' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label"><Ban size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />Hari Tidak Tersedia</label>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {dayNames.map((d, i) => (
                  <button key={i} onClick={() => { const b = preferences.blockedDays?.includes(i) ? preferences.blockedDays.filter(x => x !== i) : [...(preferences.blockedDays || []), i]; setPreferences({ ...preferences, blockedDays: b }); }}
                    style={{ flex: 1, padding: '0.4rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.68rem', fontWeight: '700', border: `1px solid ${preferences.blockedDays?.includes(i) ? 'var(--danger)' : 'var(--glass-border)'}`, background: preferences.blockedDays?.includes(i) ? 'var(--danger-bg)' : 'transparent', color: preferences.blockedDays?.includes(i) ? 'var(--danger)' : 'var(--text-tertiary)', transition: 'all 0.2s' }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Constraints Tab */}
        {activeTab === 'constraints' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">Maks Malam Berturut-turut</label>
              <input type="number" className="input" min="1" max="7" value={constraints.maxConsecutiveNights} onChange={e => setConstraints({ ...constraints, maxConsecutiveNights: parseInt(e.target.value) || 3 })} style={{ maxWidth: '120px' }} />
            </div>
            <div>
              <label className="label">Min Jam Istirahat</label>
              <input type="number" className="input" min="4" max="16" value={constraints.minRestHours} onChange={e => setConstraints({ ...constraints, minRestHours: parseInt(e.target.value) || 8 })} style={{ maxWidth: '120px' }} />
            </div>
            <div>
              <label className="label"><Ban size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />Shift yang Diblokir</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {shiftOptions.map(s => (
                  <button key={s} onClick={() => { const b = constraints.blockedShifts?.includes(s) ? constraints.blockedShifts.filter(x => x !== s) : [...(constraints.blockedShifts || []), s]; setConstraints({ ...constraints, blockedShifts: b }); }}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: '600', border: `1.5px solid ${constraints.blockedShifts?.includes(s) ? 'var(--danger)' : 'var(--glass-border)'}`, background: constraints.blockedShifts?.includes(s) ? 'var(--danger-bg)' : 'transparent', color: constraints.blockedShifts?.includes(s) ? 'var(--danger)' : 'var(--text-tertiary)', transition: 'all 0.2s', textTransform: 'capitalize' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div>
            {shiftStats.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={shiftStats} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} style={{ fontSize: '0.7rem' }}>
                    {shiftStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-primary)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '0.5rem', marginTop: '1rem' }}>
                {shiftStats.map((s, i) => (
                  <div key={s.name} style={{ background: 'var(--bg-elevated)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: `1px solid ${COLORS[i % COLORS.length]}40` }}>
                    <div style={{ fontSize: '1rem', fontWeight: '800', color: COLORS[i % COLORS.length] }}>{s.value}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.name}</div>
                  </div>
                ))}
              </div>
            </>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '2rem' }}>Belum ada data shift.</p>}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>Batal</button>
          <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }}>Simpan Profil</button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
