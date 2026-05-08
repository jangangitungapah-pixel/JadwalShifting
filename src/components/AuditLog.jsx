import React, { useState } from 'react';
import { FileText, Search, Filter, Download, Clock, ArrowRight } from 'lucide-react';

const AuditLog = ({ logs }) => {
  const [search, setSearch] = useState('');
  const filtered = (logs || []).filter(l => l.message?.toLowerCase().includes(search.toLowerCase()));

  const formatTime = (ts) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const exportLogs = () => {
    const text = filtered.map(l => `[${formatTime(l.timestamp)}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ShiftSync_AuditLog_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, var(--warning), var(--color-primary))' }} />
            <h2 className="page-title">Audit Trail</h2>
          </div>
          <p className="page-subtitle" style={{ marginLeft: '1.75rem' }}>Riwayat lengkap semua perubahan sistem.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Cari log..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem', width: '220px' }} />
          </div>
          <button onClick={exportLogs} className="btn btn-outline"><Download size={15} /> Ekspor</button>
        </div>
      </div>

      <div className="glass-card animate-fade-in-up delay-100" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total: {filtered.length} log</span>
        </div>
        <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tidak ada log ditemukan.</p>
            </div>
          ) : (
            filtered.map((log, i) => (
              <div key={log.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1.25rem', borderBottom: i < filtered.length - 1 ? '1px solid var(--glass-border)' : 'none', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.1rem' }}>
                  <Clock size={14} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{log.message}</p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{formatTime(log.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
