import React, { useState } from 'react';
import { CalendarOff, Plus, Check, X, Clock, User, Filter, FileText } from 'lucide-react';
import { leaveTypes } from '../utils/dummyData';

const LeaveManagement = ({ employees, leaves, onAddLeave, onUpdateLeave, shifts, setBatchShifts }) => {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({ empId: '', type: 'annual', startDate: '', endDate: '', reason: '' });

  const filteredLeaves = (leaves || []).filter(l => filter === 'all' || l.status === filter).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.empId || !formData.startDate || !formData.endDate) return;
    const emp = employees.find(x => x.id === formData.empId);
    onAddLeave({
      id: Date.now().toString(),
      ...formData,
      empName: emp?.name || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    setFormData({ empId: '', type: 'annual', startDate: '', endDate: '', reason: '' });
    setShowForm(false);
  };

  const handleApprove = (leave) => {
    onUpdateLeave({ ...leave, status: 'approved' });
    // Auto-update shifts to libur
    const newShifts = { ...shifts };
    let curr = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    while (curr <= end) {
      const ds = `${curr.getFullYear()}-${String(curr.getMonth()+1).padStart(2,'0')}-${String(curr.getDate()).padStart(2,'0')}`;
      if (!newShifts[ds]) newShifts[ds] = {};
      newShifts[ds][leave.empId] = 'libur';
      curr.setDate(curr.getDate() + 1);
    }
    setBatchShifts(newShifts);
  };

  const statusColors = { pending: { bg: 'var(--warning-bg)', text: 'var(--warning)', border: 'rgba(251,191,36,0.2)', label: 'Menunggu' }, approved: { bg: 'var(--success-bg)', text: 'var(--success)', border: 'rgba(52,211,153,0.2)', label: 'Disetujui' }, rejected: { bg: 'var(--danger-bg)', text: 'var(--danger)', border: 'rgba(248,113,113,0.2)', label: 'Ditolak' } };
  const getLeaveColor = (type) => leaveTypes.find(t => t.id === type)?.color || '#818CF8';

  return (
    <div style={{ padding: '0.5rem' }}>
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #F472B6, #818CF8)' }} />
            <h2 className="page-title">Manajemen Cuti & Izin</h2>
          </div>
          <p className="page-subtitle" style={{ marginLeft: '1.75rem' }}>Kelola permintaan cuti dan izin karyawan.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? <><X size={15} /> Batal</> : <><Plus size={15} /> Ajukan Cuti</>}
        </button>
      </div>

      {/* Stats */}
      <div className="animate-fade-in-up delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
        {['pending', 'approved', 'rejected'].map(s => {
          const sc = statusColors[s];
          const count = (leaves || []).filter(l => l.status === s).length;
          return (
            <div key={s} className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', border: filter === s ? `1.5px solid ${sc.text}` : undefined }} onClick={() => setFilter(filter === s ? 'all' : s)}>
              <div style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)', background: sc.bg }}><Clock size={18} style={{ color: sc.text }} /></div>
              <div>
                <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>{sc.label}</p>
                <p style={{ fontSize: '1.2rem', fontWeight: '800' }}>{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card animate-fade-in-scale" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>📝 Form Pengajuan Cuti</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">Karyawan</label>
              <select className="input" value={formData.empId} onChange={e => setFormData({ ...formData, empId: e.target.value })} required style={{ colorScheme: 'dark' }}>
                <option value="">Pilih karyawan...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Jenis</label>
              <select className="input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ colorScheme: 'dark' }}>
                {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tanggal Mulai</label>
              <input type="date" className="input" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required style={{ colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="label">Tanggal Selesai</label>
              <input type="date" className="input" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required style={{ colorScheme: 'dark' }} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label className="label">Alasan</label>
            <input type="text" className="input" placeholder="Opsional" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}><button type="submit" className="btn btn-primary"><Plus size={15} /> Ajukan</button></div>
        </form>
      )}

      {/* Leave List */}
      <div className="glass-card animate-fade-in-up delay-200" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredLeaves.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <CalendarOff size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Belum ada pengajuan cuti.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredLeaves.map((leave, idx) => {
              const sc = statusColors[leave.status];
              const emp = employees.find(e => e.id === leave.empId);
              const lt = leaveTypes.find(t => t.id === leave.type);
              const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / 86400000) + 1;
              return (
                <div key={leave.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: idx < filteredLeaves.length - 1 ? '1px solid var(--glass-border)' : 'none', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <img src={emp?.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--glass-border)' }} />
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '0.88rem' }}>{leave.empName || emp?.name}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.15rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: '600', color: getLeaveColor(leave.type), background: `${getLeaveColor(leave.type)}20`, padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)' }}>{lt?.label}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{leave.startDate} → {leave.endDate} ({days} hari)</span>
                      </div>
                      {leave.reason && <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>{leave.reason}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: '700', color: sc.text, background: sc.bg, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', border: `1px solid ${sc.border}` }}>{sc.label}</span>
                    {leave.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(leave)} className="btn btn-outline" style={{ padding: '0.3rem 0.5rem', color: 'var(--success)', borderColor: 'rgba(52,211,153,0.2)', fontSize: '0.7rem' }}><Check size={12} /> Setujui</button>
                        <button onClick={() => onUpdateLeave({ ...leave, status: 'rejected' })} className="btn btn-outline" style={{ padding: '0.3rem 0.5rem', color: 'var(--danger)', borderColor: 'rgba(248,113,113,0.2)', fontSize: '0.7rem' }}><X size={12} /> Tolak</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveManagement;
