import React, { useState } from 'react';
import { X, Check, Shield, StickyNote } from 'lucide-react';
import { shiftTypes, longShiftTypes } from '../utils/dummyData';

const ShiftModal = ({ onClose, onSave, cellData, employee, notes }) => {
  const [selectedShift, setSelectedShift] = useState(cellData?.currentShiftId || '');
  const noteKey = `${cellData?.dateStr}_${cellData?.empId}`;
  const [note, setNote] = useState(notes?.[noteKey] || '');

  const dateObj = new Date(cellData.dateStr);
  const formattedDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dateObj);

  const getShiftGradient = (id) => {
    const map = { pagi: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(96,165,250,0.08))', sore: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.08))', malam: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.08))', libur: 'linear-gradient(135deg, rgba(248,113,113,0.15), rgba(239,68,68,0.08))', 'sp-pagi-sore': 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(20,184,166,0.08))', 'pagi-sp-sore': 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(20,184,166,0.08))', 'sp-sore-malam': 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(244,114,182,0.08))', 'sore-sp-malam': 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(244,114,182,0.08))' };
    return map[id] || 'transparent';
  };

  const renderShiftOption = (type) => {
    const isSelected = selectedShift === type.id;
    return (
      <button key={type.id} onClick={() => setSelectedShift(type.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0.85rem', borderRadius: 'var(--radius-lg)', border: `1.5px solid ${isSelected ? `var(--shift-${type.id}-border)` : 'var(--glass-border)'}`, background: isSelected ? getShiftGradient(type.id) : 'transparent', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)', fontFamily: 'inherit', transform: isSelected ? 'scale(1.01)' : 'scale(1)', boxShadow: isSelected ? `0 4px 15px var(--shift-${type.id}-bg)` : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: `var(--shift-${type.id}-bg)`, border: `1px solid var(--shift-${type.id}-border)`, boxShadow: isSelected ? `0 0 8px var(--shift-${type.id}-bg)` : 'none' }} />
          <span style={{ fontWeight: isSelected ? '600' : '500', color: isSelected ? `var(--shift-${type.id}-text)` : 'var(--text-primary)', fontSize: '0.85rem' }}>{type.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{type.time}</span>
          {isSelected && <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: `var(--shift-${type.id}-bg)`, border: `1px solid var(--shift-${type.id}-border)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={10} style={{ color: `var(--shift-${type.id}-text)` }} /></div>}
        </div>
      </button>
    );
  };

  return (
    <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '1.75rem', animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)', position: 'relative', border: '1px solid var(--glass-border-hover)', boxShadow: 'var(--shadow-xl), var(--shadow-glow-primary)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)', borderRadius: '0 0 2px 2px' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-secondary)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>

        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Pilih Shift</h3>
        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={employee?.avatar} alt={employee?.name} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--glass-border)' }} />
          <div>
            <p style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{employee?.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{formattedDate}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.85rem' }}>
          {shiftTypes.map(renderShiftOption)}
        </div>

        <div style={{ marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
            <Shield size={13} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Long Shift — Backup Cuti/Sakit</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {longShiftTypes.map(renderShiftOption)}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <StickyNote size={13} style={{ color: '#FBBF24' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catatan</span>
          </div>
          <textarea className="input" rows={2} placeholder="Tambahkan catatan untuk shift ini..." value={note} onChange={e => setNote(e.target.value)} style={{ resize: 'vertical', fontSize: '0.82rem', minHeight: '50px' }} />
        </div>

        {selectedShift && (
          <button onClick={() => setSelectedShift('')} style={{ width: '100%', padding: '0.65rem', border: '1px dashed rgba(248,113,113,0.3)', borderRadius: 'var(--radius-lg)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--danger)', fontWeight: '600', fontFamily: 'inherit', fontSize: '0.82rem', transition: 'all 0.2s ease', marginBottom: '1rem' }}>Hapus Shift</button>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>Batal</button>
          <button onClick={() => onSave(selectedShift, note)} className="btn btn-primary" style={{ flex: 1 }}>Simpan</button>
        </div>
      </div>
    </div>
  );
};

export default ShiftModal;
