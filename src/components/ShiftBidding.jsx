import React, { useState } from 'react';
import { Sparkles, Plus, Check, X, Clock, Users, UserPlus } from 'lucide-react';
import { allShiftTypes } from '../utils/dummyData';
import { sounds } from '../utils/soundService';
import { useTranslation } from '../utils/i18n.jsx';

const ShiftBidding = ({ employees, shifts, openShifts, addOpenShift, updateOpenShift, removeOpenShift, isEmployee, currentEmployeeId, updateShift }) => {
  const { t, lang } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ dateStr: '', shiftId: 'pagi', role: '', notes: '' });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.dateStr || !formData.shiftId) return;
    addOpenShift({
      id: Date.now().toString(),
      dateStr: formData.dateStr,
      shiftId: formData.shiftId,
      role: formData.role,
      notes: formData.notes,
      status: 'open',
      applicants: []
    });
    sounds.success();
    setIsModalOpen(false);
    setFormData({ dateStr: '', shiftId: 'pagi', role: '', notes: '' });
  };

  const handleApply = (id) => {
    sounds.success();
    const shift = openShifts.find(s => s.id === id);
    if (!shift || shift.status === 'closed') return;
    if (shift.applicants.some(a => a.empId === currentEmployeeId)) return;
    updateOpenShift({
      ...shift,
      applicants: [...shift.applicants, { empId: currentEmployeeId, status: 'pending' }]
    });
  };

  const handleApprove = (shiftId, applicantEmpId) => {
    sounds.success();
    const shift = openShifts.find(s => s.id === shiftId);
    if (!shift) return;
    
    // Set this applicant to approved, others to rejected
    const updatedApplicants = shift.applicants.map(a => 
      a.empId === applicantEmpId ? { ...a, status: 'approved' } : { ...a, status: 'rejected' }
    );

    updateOpenShift({
      ...shift,
      status: 'closed',
      applicants: updatedApplicants
    });

    // Update actual schedule
    updateShift(shift.dateStr, applicantEmpId, shift.shiftId);
  };

  const handleReject = (shiftId, applicantEmpId) => {
    sounds.error();
    const shift = openShifts.find(s => s.id === shiftId);
    if (!shift) return;
    
    const updatedApplicants = shift.applicants.map(a => 
      a.empId === applicantEmpId ? { ...a, status: 'rejected' } : a
    );

    updateOpenShift({
      ...shift,
      applicants: updatedApplicants
    });
  };

  const currentEmp = employees.find(e => e.id === currentEmployeeId);

  return (
    <div style={{ padding: '0.5rem' }}>
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #FBBF24, #F59E0B)' }} />
            <h2 className="page-title">{lang === 'en' ? 'Open Shifts Bidding' : 'Bursa Shift (Open Shifts)'}</h2>
          </div>
          <p className="page-subtitle" style={{ marginLeft: '1.75rem' }}>{lang === 'en' ? 'Take available shifts or make offers.' : 'Ambil shift kosong yang tersedia atau ajukan penawaran.'}</p>
        </div>
        {!isEmployee && (
          <button onClick={() => { sounds.modalOpen(); setIsModalOpen(true); }} className="btn btn-primary">
            <Plus size={17} /> {lang === 'en' ? 'Open New Shift' : 'Buka Shift Baru'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {openShifts.length === 0 ? (
          <div className="glass-card animate-fade-in-up delay-100" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1' }}>
            <p style={{ color: 'var(--text-muted)' }}>{lang === 'en' ? 'No open shifts available.' : 'Belum ada bursa shift yang dibuka saat ini.'}</p>
          </div>
        ) : (
          openShifts.map((os, i) => {
            const shiftType = allShiftTypes.find(s => s.id === os.shiftId);
            const myApplication = isEmployee ? os.applicants.find(a => a.empId === currentEmployeeId) : null;
            
            // Filter if employee doesn't match the required role (and role is specified)
            if (isEmployee && os.role && currentEmp && currentEmp.role !== os.role) return null;

            return (
              <div key={os.id} className={`glass-card animate-fade-in-up delay-${(i % 5) * 100}`} style={{ padding: '1.5rem', borderLeft: `4px solid ${shiftType?.color || 'var(--color-primary)'}`, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>{os.dateStr}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge" style={{ backgroundColor: `var(--shift-${os.shiftId}-bg)`, color: `var(--shift-${os.shiftId}-text)` }}>{shiftType?.label}</span>
                      {os.status === 'closed' && <span className="badge badge-success">Selesai</span>}
                    </div>
                  </div>
                  {os.role && <span className="badge badge-primary">{os.role}</span>}
                </div>
                
                {os.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontStyle: 'italic' }}>"{os.notes}"</p>}

                {isEmployee ? (
                  <div style={{ marginTop: '1.5rem' }}>
                    {os.status === 'closed' ? (
                      <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{lang === 'en' ? 'Shift is closed.' : 'Shift ini sudah ditutup.'}</div>
                    ) : myApplication ? (
                      <div style={{ textAlign: 'center', padding: '0.75rem', background: myApplication.status === 'approved' ? 'var(--success-bg)' : myApplication.status === 'rejected' ? 'var(--danger-bg)' : 'var(--warning-bg)', borderRadius: 'var(--radius-md)', color: myApplication.status === 'approved' ? 'var(--success)' : myApplication.status === 'rejected' ? 'var(--danger)' : 'var(--warning)', fontSize: '0.85rem', fontWeight: '600' }}>
                        {lang === 'en' ? 'Application Status' : 'Status Pengajuan'}: {myApplication.status.toUpperCase()}
                      </div>
                    ) : (
                      <button onClick={() => handleApply(os.id)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        <UserPlus size={16} /> {lang === 'en' ? 'Take Shift' : 'Ambil Shift'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={14} /> {lang === 'en' ? 'Candidates' : 'Kandidat'} ({os.applicants.length})
                    </h4>
                    {os.applicants.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{lang === 'en' ? 'No applicants.' : 'Belum ada pelamar.'}</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {os.applicants.map(app => {
                          const applicantEmp = employees.find(e => e.id === app.empId);
                          return (
                            <div key={app.empId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{applicantEmp?.name || app.empId}</span>
                              {os.status === 'open' && app.status === 'pending' ? (
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  <button onClick={() => handleApprove(os.id, app.empId)} className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}><Check size={12} /> {lang === 'en' ? 'Approve' : 'Terima'}</button>
                                  <button onClick={() => handleReject(os.id, app.empId)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}><X size={12} /> {lang === 'en' ? 'Reject' : 'Tolak'}</button>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: app.status === 'approved' ? 'var(--success)' : app.status === 'rejected' ? 'var(--danger)' : 'var(--warning)' }}>
                                  {app.status.toUpperCase()}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {os.status === 'open' && (
                      <button onClick={() => removeOpenShift(os.id)} className="btn btn-outline" style={{ width: '100%', marginTop: '1rem', color: 'var(--danger)', borderColor: 'rgba(248,113,113,0.2)', fontSize: '0.8rem' }}>
                        {lang === 'en' ? 'Cancel this Shift' : 'Batalkan Shift Ini'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Buka Shift (Admin) */}
      {isModalOpen && !isEmployee && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <form onSubmit={handleAddSubmit} className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '1.75rem', position: 'relative' }}>
            <button type="button" onClick={() => { sounds.modalClose(); setIsModalOpen(false); }} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem' }}>{lang === 'en' ? 'Open Shift Bidding' : 'Buka Bursa Shift'}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Tanggal</label>
                <input type="date" className="input" value={formData.dateStr} onChange={e => setFormData({ ...formData, dateStr: e.target.value })} required style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className="label">Shift</label>
                <select className="input" value={formData.shiftId} onChange={e => setFormData({ ...formData, shiftId: e.target.value })} style={{ colorScheme: 'dark' }}>
                  {allShiftTypes.filter(s => s.id !== 'libur').map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Syarat Role (Opsional)</label>
                <input className="input" placeholder="Misal: Staff Medis" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} />
              </div>
              <div>
                <label className="label">Catatan Tambahan</label>
                <textarea className="input" placeholder="Alasan buka shift / Catatan khusus" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => { sounds.modalClose(); setIsModalOpen(false); }} className="btn btn-outline" style={{ flex: 1 }}>Batal</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Buka Shift</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ShiftBidding;
