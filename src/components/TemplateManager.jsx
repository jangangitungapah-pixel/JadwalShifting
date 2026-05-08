import React, { useState } from 'react';
import { X, Save, Trash2, FolderOpen, Plus, Bookmark } from 'lucide-react';
import { defaultTemplates } from '../utils/dummyData';

const SHIFT_CHIP = {
  pagi: { bg: 'var(--shift-pagi-bg)', text: 'var(--shift-pagi-text)', border: 'var(--shift-pagi-border)', label: 'P' },
  sore: { bg: 'var(--shift-sore-bg)', text: 'var(--shift-sore-text)', border: 'var(--shift-sore-border)', label: 'S' },
  malam: { bg: 'var(--shift-malam-bg)', text: 'var(--shift-malam-text)', border: 'var(--shift-malam-border)', label: 'M' },
  libur: { bg: 'var(--shift-libur-bg)', text: 'var(--shift-libur-text)', border: 'var(--shift-libur-border)', label: 'L' },
};

const TemplateManager = ({ onClose, onLoadTemplate, currentPattern }) => {
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('shift_templates');
    return saved ? [...defaultTemplates, ...JSON.parse(saved)] : [...defaultTemplates];
  });
  const [newName, setNewName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const customTemplates = templates.filter(t => !t.isDefault);

  const handleSave = () => {
    if (!newName.trim() || !currentPattern?.length) return;
    const newTemplate = { id: Date.now().toString(), name: newName.trim(), pattern: [...currentPattern], isDefault: false };
    const updated = [...customTemplates, newTemplate];
    localStorage.setItem('shift_templates', JSON.stringify(updated));
    setTemplates([...defaultTemplates, ...updated]);
    setNewName('');
    setShowSave(false);
  };

  const handleDelete = (id) => {
    const updated = customTemplates.filter(t => t.id !== id);
    localStorage.setItem('shift_templates', JSON.stringify(updated));
    setTemplates([...defaultTemplates, ...updated]);
  };

  return (
    <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '1.75rem', animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)', position: 'relative', border: '1px solid var(--glass-border-hover)', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-secondary)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)', background: 'var(--color-primary-light)' }}><Bookmark size={20} style={{ color: 'var(--color-primary)' }} /></div>
          <div><h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Template Jadwal</h3><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Simpan & muat pola rotasi</p></div>
        </div>

        {/* Save current */}
        {showSave ? (
          <div className="animate-fade-in-scale" style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
            <input className="input" placeholder="Nama template..." value={newName} onChange={e => setNewName(e.target.value)} style={{ fontSize: '0.82rem' }} autoFocus />
            <button onClick={handleSave} className="btn btn-primary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}><Save size={13} /> Simpan</button>
            <button onClick={() => setShowSave(false)} className="btn btn-outline" style={{ padding: '0.5rem', fontSize: '0.78rem' }}><X size={13} /></button>
          </div>
        ) : (
          <button onClick={() => setShowSave(true)} className="btn btn-outline" style={{ width: '100%', marginBottom: '1rem', color: 'var(--color-primary)', borderColor: 'rgba(129,140,248,0.2)' }}><Plus size={14} /> Simpan Pola Saat Ini</button>
        )}

        {/* Template list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {templates.map(tmpl => (
            <div key={tmpl.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--glass-border-hover)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <p style={{ fontWeight: '600', fontSize: '0.85rem' }}>{tmpl.name}</p>
                  {tmpl.isDefault && <span style={{ fontSize: '0.58rem', fontWeight: '700', color: 'var(--color-secondary)', background: 'var(--color-secondary-glow)', padding: '0.05rem 0.35rem', borderRadius: 'var(--radius-full)' }}>DEFAULT</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  {tmpl.pattern.map((s, i) => {
                    const c = SHIFT_CHIP[s];
                    return c ? <div key={i} style={{ width: '20px', height: '20px', borderRadius: '3px', background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: '0.6rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.label}</div> : null;
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button onClick={() => { onLoadTemplate(tmpl.pattern); onClose(); }} className="btn btn-outline" style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', color: 'var(--color-primary)' }}><FolderOpen size={12} /> Muat</button>
                {!tmpl.isDefault && <button onClick={() => handleDelete(tmpl.id)} className="btn btn-outline" style={{ padding: '0.35rem', color: 'var(--danger)', borderColor: 'rgba(248,113,113,0.2)' }}><Trash2 size={12} /></button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;
