import React, { useState } from 'react';
import { X, ArrowLeftRight, Check, AlertTriangle } from 'lucide-react';
import { suggestSwap } from '../utils/fairness';
import { sounds } from '../utils/soundService';

const ShiftSwapModal = ({ onClose, employees, shifts, swapRequests, onAddSwapRequest, onResolveSwap }) => {
  const [empId, setEmpId] = useState(employees[0]?.id || '');
  const [dateStr, setDateStr] = useState('');
  const suggestions = dateStr && empId ? suggestSwap(empId, dateStr, shifts, employees) : [];
  const pending = (swapRequests || []).filter(r => r.status === 'pending');

  const handleRequest = (suggestion) => {
    sounds.success();
    onAddSwapRequest({
      id: Date.now().toString(), fromEmpId: empId, toEmpId: suggestion.employee.id,
      dateStr: suggestion.dateStr, fromShift: suggestion.yourShift, toShift: suggestion.theirShift,
      status: 'pending', createdAt: new Date().toISOString(),
      fromName: employees.find(e => e.id === empId)?.name,
      toName: suggestion.employee.name,
    });
  };

  return (
    <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '1.75rem', animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)', position: 'relative', border: '1px solid var(--glass-border-hover)', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-secondary)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)', background: 'var(--color-accent-glow)' }}><ArrowLeftRight size={20} style={{ color: 'var(--color-accent)' }} /></div>
          <div><h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Tukar Shift</h3><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cari dan ajukan pertukaran shift</p></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1rem' }}>
          <div>
            <label className="label">Karyawan</label>
            <select className="input" value={empId} onChange={e => setEmpId(e.target.value)} style={{ colorScheme: 'dark', fontSize: '0.82rem' }}>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tanggal</label>
            <input type="date" className="input" value={dateStr} onChange={e => setDateStr(e.target.value)} style={{ colorScheme: 'dark', fontSize: '0.82rem' }} />
          </div>
        </div>

        {dateStr && suggestions.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>💡 Saran Pertukaran:</p>
            {suggestions.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', marginBottom: '0.35rem' }}>
                <div style={{ fontSize: '0.78rem' }}>
                  <span style={{ fontWeight: '600' }}>{s.employee.name}</span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 0.4rem' }}>•</span>
                  <span style={{ color: `var(--shift-${s.theirShift}-text)`, fontWeight: '600' }}>{s.theirShift}</span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 0.3rem' }}>↔</span>
                  <span style={{ color: `var(--shift-${s.yourShift}-text)`, fontWeight: '600' }}>{s.yourShift}</span>
                </div>
                <button onClick={() => handleRequest(s)} className="btn btn-outline" style={{ padding: '0.3rem 0.5rem', fontSize: '0.68rem', color: 'var(--color-primary)' }}><ArrowLeftRight size={11} /> Tukar</button>
              </div>
            ))}
          </div>
        )}

        {dateStr && suggestions.length === 0 && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', textAlign: 'center', padding: '1rem' }}>Tidak ada saran pertukaran untuk tanggal ini.</p>}

        {/* Pending requests */}
        {pending.length > 0 && (
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>⏳ Permintaan Menunggu:</p>
            {pending.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem', borderRadius: 'var(--radius-md)', background: 'var(--warning-bg)', border: '1px solid rgba(251,191,36,0.15)', marginBottom: '0.35rem' }}>
                <div style={{ fontSize: '0.75rem' }}>
                  <span style={{ fontWeight: '600' }}>{r.fromName}</span> ↔ <span style={{ fontWeight: '600' }}>{r.toName}</span>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>{r.dateStr}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button onClick={() => { sounds.success(); onResolveSwap(r.id, 'approved'); }} className="btn btn-outline" style={{ padding: '0.25rem', color: 'var(--success)' }}><Check size={13} /></button>
                  <button onClick={() => { sounds.error(); onResolveSwap(r.id, 'rejected'); }} className="btn btn-outline" style={{ padding: '0.25rem', color: 'var(--danger)' }}><X size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose} className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }}>Tutup</button>
      </div>
    </div>
  );
};

export default ShiftSwapModal;
