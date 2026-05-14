import React, { useState } from 'react';
import { Plus, Search, Edit3, Trash2, X, Check, UserCircle, Zap } from 'lucide-react';
import EmployeeProfile from './EmployeeProfile';
import { calculateFairnessScore } from '../utils/fairness';
import { sounds } from '../utils/soundService';
import { useTranslation } from '../utils/i18n.jsx';

const EmployeeList = ({ employees, onAdd, onEdit, onDelete, shifts, departments, isViewer }) => {
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [profileEmployee, setProfileEmployee] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: '', phone: '', email: '', department: 'Umum', projectType: 'old', materialAllowance: 0 });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const today = new Date();
  const fairness = calculateFairnessScore(employees, shifts, today.getFullYear(), today.getMonth());

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => { setFormData({ name: '', role: '', phone: '', email: '', department: 'Umum', projectType: 'old', materialAllowance: 0 }); setEditingEmployee(null); };

  const openAddModal = () => { sounds.modalOpen(); resetForm(); setIsModalOpen(true); };
  const openEditModal = (emp) => { sounds.modalOpen(); setEditingEmployee(emp); setFormData({ name: emp.name, role: emp.role, phone: emp.phone || '', email: emp.email || '', department: emp.department || 'Umum', projectType: emp.projectType || 'old', materialAllowance: emp.materialAllowance || 0 }); setIsModalOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return;
    if (editingEmployee) onEdit({ ...editingEmployee, ...formData });
    else onAdd(formData);
    sounds.success();
    sounds.modalClose();
    setIsModalOpen(false); resetForm();
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #22D3EE, var(--color-primary))' }} />
            <h2 className="page-title">{t('emp.title')}</h2>
          </div>
          <p className="page-subtitle" style={{ marginLeft: '1.75rem' }}>{t('emp.subtitle')}</p>
        </div>
        {!isViewer && <button onClick={openAddModal} className="btn btn-primary"><Plus size={17} /> {t('emp.add')}</button>}
      </div>

      {/* Search */}
      <div className="animate-fade-in-up delay-100" style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: '380px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="input" placeholder={t('emp.search')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: '2.75rem' }} />
      </div>

      {/* Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="glass-card animate-fade-in-up delay-200" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1rem' }}>{t('emp.none')}</p>
          {!isViewer && <button onClick={openAddModal} className="btn btn-primary"><Plus size={17} /> {t('emp.addFirst')}</button>}
        </div>
      ) : (
        <div className="animate-fade-in-up delay-200" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filteredEmployees.map(emp => {
            const empFairness = fairness.stats.find(s => s.empId === emp.id);
            const score = empFairness?.fairnessScore || 0;
            const scoreColor = score >= 70 ? '#2DD4BF' : score >= 40 ? '#FBBF24' : '#F87171';
            return (
              <div key={emp.id} className="glass-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <img src={emp.avatar} alt={emp.name} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--glass-border)' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: '700', fontSize: '0.95rem', letterSpacing: '-0.02em' }}>{emp.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                      <span className="badge badge-primary">{emp.role}</span>
                      {emp.department && emp.department !== 'Umum' && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '0.1rem 0.35rem', borderRadius: 'var(--radius-full)' }}>{emp.department}</span>}
                    </div>
                  </div>
                </div>

                {/* Fairness badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Zap size={12} style={{ color: scoreColor }} />
                  <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{ width: `${score}%`, height: '100%', borderRadius: '2px', background: scoreColor, transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: '700', color: scoreColor }}>{score}%</span>
                </div>

                {/* Quick stats */}
                {empFairness && (
                  <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {[{ l: 'P', v: empFairness.pagi, c: 'pagi' }, { l: 'S', v: empFairness.sore, c: 'sore' }, { l: 'M', v: empFairness.malam, c: 'malam' }, { l: 'L', v: empFairness.libur, c: 'libur' }].map(x => (
                      <div key={x.l} style={{ flex: 1, textAlign: 'center', padding: '0.3rem', borderRadius: 'var(--radius-sm)', background: `var(--shift-${x.c}-bg)`, border: `1px solid var(--shift-${x.c}-border)` }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: '800', color: `var(--shift-${x.c}-text)` }}>{x.v}</div>
                        <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{x.l}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => { sounds.modalOpen(); setProfileEmployee(emp); }} className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem', padding: '0.45rem', color: 'var(--color-secondary)', borderColor: 'rgba(34,211,238,0.2)' }}><UserCircle size={13} /> {t('emp.profile')}</button>
                  {!isViewer && (
                    <>
                      <button onClick={() => openEditModal(emp)} className="btn btn-outline" style={{ padding: '0.45rem', fontSize: '0.75rem' }}><Edit3 size={13} /></button>
                      {deleteConfirmId === emp.id ? (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button onClick={() => { sounds.success(); onDelete(emp.id); setDeleteConfirmId(null); }} className="btn btn-danger" style={{ padding: '0.45rem' }}><Check size={13} /></button>
                          <button onClick={() => { sounds.error(); setDeleteConfirmId(null); }} className="btn btn-outline" style={{ padding: '0.45rem' }}><X size={13} /></button>
                        </div>
                      ) : (
                        <button onClick={() => { sounds.error(); setDeleteConfirmId(emp.id); }} className="btn btn-outline" style={{ padding: '0.45rem', color: 'var(--danger)', borderColor: 'rgba(248,113,113,0.2)' }}><Trash2 size={13} /></button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <form onSubmit={handleSubmit} className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '1.75rem', animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)', position: 'relative', border: '1px solid var(--glass-border-hover)' }}>
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--color-secondary), transparent)' }} />
            <button type="button" onClick={() => { sounds.modalClose(); setIsModalOpen(false); }} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-secondary)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem' }}>{editingEmployee ? t('emp.edit') : t('emp.addNew')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <div><label className="label">{t('emp.name')}</label><input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder={t('emp.name')} /></div>
              <div><label className="label">{t('emp.role')}</label><input className="input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} required placeholder={t('emp.role')} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label className="label">Telepon</label><input className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="08xxx" /></div>
                <div><label className="label">Email</label><input className="input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email" /></div>
              </div>
              <div>
                <label className="label">{lang === 'en' ? 'Project Type' : 'Tipe Project'}</label>
                <select className="input" value={formData.projectType} onChange={e => setFormData({ ...formData, projectType: e.target.value })} style={{ colorScheme: 'dark' }}>
                  <option value="old">Old Project (Rp 2.300.000/bln)</option>
                  <option value="new">New Project (Rp 2.800.000/bln)</option>
                </select>
              </div>
              <div>
                <label className="label">{lang === 'en' ? 'Material Allowance (Rp)' : 'Tunjangan Material (Rp)'}</label>
                <input className="input" type="number" value={formData.materialAllowance} onChange={e => setFormData({ ...formData, materialAllowance: parseInt(e.target.value) || 0 })} placeholder="0" />
              </div>
              {departments && departments.length > 1 && (
                <div><label className="label">Departemen</label><select className="input" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} style={{ colorScheme: 'dark' }}>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => { sounds.modalClose(); setIsModalOpen(false); }} className="btn btn-outline" style={{ flex: 1 }}>{t('common.cancel')}</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingEmployee ? t('common.save') : t('common.add')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Modal */}
      {profileEmployee && <EmployeeProfile employee={profileEmployee} onClose={() => { sounds.modalClose(); setProfileEmployee(null); }} onUpdate={(emp) => { onEdit(emp); sounds.success(); sounds.modalClose(); setProfileEmployee(null); }} shifts={shifts} />}
    </div>
  );
};

export default EmployeeList;
