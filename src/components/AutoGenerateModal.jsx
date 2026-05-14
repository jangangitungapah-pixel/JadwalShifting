import React, { useState } from 'react';
import { X, Wand2, CalendarRange, Users, User, AlertTriangle, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { shiftTypes } from '../utils/dummyData';
import { sounds } from '../utils/soundService';

const DEFAULT_PATTERN = ['pagi', 'pagi', 'sore', 'sore', 'malam', 'malam', 'libur', 'libur'];

const PATTERN_PRESETS = [
  { label: '2-2-2-2 (Default)', pattern: ['pagi','pagi','sore','sore','malam','malam','libur','libur'] },
  { label: '3-3-1 Kerja', pattern: ['pagi','pagi','pagi','sore','sore','sore','libur'] },
  { label: '5 Hari Kerja', pattern: ['pagi','pagi','pagi','pagi','pagi','libur','libur'] },
  { label: 'Sore Tetap', pattern: ['sore','sore','sore','sore','sore','libur','libur'] },
  { label: 'Malam Tetap', pattern: ['malam','malam','malam','malam','malam','libur','libur'] },
];

const SHIFT_CHIP_STYLES = {
  pagi:  { bg: 'var(--shift-pagi-bg)',  text: 'var(--shift-pagi-text)',  border: 'var(--shift-pagi-border)',  label: 'P' },
  sore:  { bg: 'var(--shift-sore-bg)',  text: 'var(--shift-sore-text)',  border: 'var(--shift-sore-border)',  label: 'S' },
  malam: { bg: 'var(--shift-malam-bg)', text: 'var(--shift-malam-text)', border: 'var(--shift-malam-border)', label: 'M' },
  libur: { bg: 'var(--shift-libur-bg)', text: 'var(--shift-libur-text)', border: 'var(--shift-libur-border)', label: 'L' },
};

const AutoGenerateModal = ({ onClose, onGenerate, employees, monthNames }) => {
  const today = new Date();
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const [startDate, setStartDate] = useState(fmt(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [endDate, setEndDate] = useState(fmt(new Date(today.getFullYear(), today.getMonth()+1, 0)));
  const [targetMode, setTargetMode] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(employees[0]?.id || '');
  const [pattern, setPattern] = useState([...DEFAULT_PATTERN]);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.max(0, Math.ceil((end - start) / (1000*60*60*24)) + 1);
  const isValid = start <= end && startDate && endDate && pattern.length > 0;

  const fmtDisplay = (ds) => { const d = new Date(ds); return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`; };

  const handleGenerate = () => {
    if (!isValid) return;
    sounds.success();
    const targets = targetMode === 'all' ? employees : employees.filter(e => e.id === selectedEmployee);
    onGenerate(new Date(startDate), new Date(endDate), targets, pattern);
    onClose();
  };

  const setPreset = (p) => {
    const y = today.getFullYear(), m = today.getMonth();
    switch(p) {
      case 'thisMonth':  setStartDate(fmt(new Date(y,m,1)));   setEndDate(fmt(new Date(y,m+1,0))); break;
      case 'nextMonth':  setStartDate(fmt(new Date(y,m+1,1))); setEndDate(fmt(new Date(y,m+2,0))); break;
      case 'next3Months':setStartDate(fmt(new Date(y,m,1)));   setEndDate(fmt(new Date(y,m+3,0))); break;
      case 'thisYear':   setStartDate(fmt(new Date(y,0,1)));   setEndDate(fmt(new Date(y,11,31))); break;
    }
  };

  const addToPattern = (shiftId) => setPattern(prev => [...prev, shiftId]);
  const removeFromPattern = (idx) => setPattern(prev => prev.filter((_, i) => i !== idx));

  // Common button style for target mode
  const modeBtn = (mode, active, color, glowVar) => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    padding: '0.65rem', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem',
    border: `1.5px solid ${active ? `var(--${color})` : 'var(--glass-border)'}`,
    background: active ? `var(--${glowVar})` : 'transparent',
    color: active ? `var(--${color})` : 'var(--text-secondary)',
    fontWeight: active ? '600' : '500', transition: 'all 0.25s ease',
    boxShadow: active ? `0 0 15px var(--${glowVar})` : 'none',
  });

  return (
    <div className="animate-fade-in" style={{ position:'fixed', inset:0, backgroundColor:'var(--bg-overlay)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
      <div className="glass-card" style={{ width:'100%', maxWidth:'520px', padding:'1.75rem', animation:'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)', position:'relative', border:'1px solid var(--glass-border-hover)', boxShadow:'var(--shadow-xl), var(--shadow-glow-primary)', maxHeight:'90vh', overflowY:'auto' }}>
        {/* Top accent */}
        <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:'2px', background:'linear-gradient(90deg, transparent, var(--color-primary), var(--color-secondary), transparent)', borderRadius:'0 0 2px 2px' }} />

        <button onClick={onClose} style={{ position:'absolute', top:'1rem', right:'1rem', background:'var(--bg-card)', border:'1px solid var(--glass-border)', borderRadius:'var(--radius-sm)', cursor:'pointer', color:'var(--text-secondary)', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16} /></button>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'1.35rem' }}>
          <div style={{ padding:'0.55rem', borderRadius:'var(--radius-md)', background:'var(--color-primary-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Wand2 size={20} style={{ color:'var(--color-primary)' }} />
          </div>
          <div>
            <h3 style={{ fontSize:'1.1rem', fontWeight:'700', letterSpacing:'-0.02em' }}>Auto-Generate Jadwal</h3>
            <p style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Atur rentang, pola rotasi, dan target karyawan</p>
          </div>
        </div>

        {/* ── SECTION 1: Date Range ── */}
        <div style={{ marginBottom:'1.15rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
            <label className="label" style={{ margin:0 }}>📅 Rentang Tanggal</label>
            <div style={{ display:'flex', gap:'0.3rem' }}>
              {[{id:'thisMonth',l:'Bln Ini'},{id:'nextMonth',l:'Bln Dpn'},{id:'next3Months',l:'3 Bln'},{id:'thisYear',l:'1 Thn'}].map(p => (
                <button key={p.id} onClick={() => setPreset(p.id)} style={{ padding:'0.2rem 0.5rem', fontSize:'0.65rem', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'transparent', color:'var(--text-tertiary)', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', fontWeight:'600' }}
                  onMouseEnter={e => { e.target.style.borderColor='rgba(129,140,248,0.3)'; e.target.style.color='var(--color-primary)'; }}
                  onMouseLeave={e => { e.target.style.borderColor='var(--glass-border)'; e.target.style.color='var(--text-tertiary)'; }}
                >{p.l}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.65rem' }}>
            <div>
              <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ fontSize:'0.82rem' }} />
            </div>
            <div>
              <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ fontSize:'0.82rem' }} />
            </div>
          </div>
          {isValid && (
            <div style={{ marginTop:'0.5rem', padding:'0.5rem 0.75rem', borderRadius:'var(--radius-sm)', background:'var(--bg-elevated)', border:'1px solid var(--glass-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>{fmtDisplay(startDate)} — {fmtDisplay(endDate)}</span>
              <span style={{ fontSize:'0.68rem', fontWeight:'700', color:'var(--color-primary)', padding:'0.1rem 0.45rem', borderRadius:'var(--radius-full)', background:'var(--color-primary-light)', border:'1px solid rgba(129,140,248,0.2)' }}>{dayCount} hari</span>
            </div>
          )}
          {!isValid && startDate && endDate && start > end && (
            <div style={{ marginTop:'0.5rem', padding:'0.5rem 0.75rem', borderRadius:'var(--radius-sm)', background:'var(--danger-bg)', border:'1px solid var(--shift-libur-border)', display:'flex', alignItems:'center', gap:'0.4rem' }}>
              <AlertTriangle size={14} style={{ color:'var(--danger)', flexShrink:0 }} />
              <span style={{ fontSize:'0.75rem', color:'var(--danger)' }}>Tanggal akhir harus setelah tanggal awal.</span>
            </div>
          )}
        </div>

        {/* ── SECTION 2: Shift Pattern ── */}
        <div style={{ marginBottom:'1.15rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
            <label className="label" style={{ margin:0 }}>🔄 Pola Rotasi Shift</label>
            <button onClick={() => setPattern([...DEFAULT_PATTERN])} style={{ display:'flex', alignItems:'center', gap:'0.25rem', padding:'0.2rem 0.5rem', fontSize:'0.65rem', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontFamily:'inherit' }} title="Reset ke default">
              <RotateCcw size={11} /> Reset
            </button>
          </div>

          {/* Pattern presets */}
          <div style={{ display:'flex', gap:'0.35rem', marginBottom:'0.65rem', flexWrap:'wrap' }}>
            {PATTERN_PRESETS.map((pp, i) => {
              const active = JSON.stringify(pattern) === JSON.stringify(pp.pattern);
              return (
                <button key={i} onClick={() => setPattern([...pp.pattern])} style={{
                  padding:'0.25rem 0.6rem', fontSize:'0.68rem', borderRadius:'var(--radius-sm)', cursor:'pointer', fontFamily:'inherit', fontWeight: active ? '700' : '500', transition:'all 0.2s',
                  border: `1px solid ${active ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                  background: active ? 'var(--color-primary-light)' : 'transparent',
                  color: active ? 'var(--color-primary)' : 'var(--text-tertiary)',
                }}>{pp.label}</button>
              );
            })}
          </div>

          {/* Visual pattern chips */}
          <div style={{ padding:'0.75rem', borderRadius:'var(--radius-md)', background:'var(--bg-elevated)', border:'1px solid var(--glass-border)', minHeight:'48px' }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem', alignItems:'center' }}>
              {pattern.map((shiftId, idx) => {
                const chip = SHIFT_CHIP_STYLES[shiftId];
                return (
                  <div key={idx} onClick={() => removeFromPattern(idx)} title={`Klik untuk hapus (${shiftTypes.find(s=>s.id===shiftId)?.label})`} style={{
                    display:'flex', alignItems:'center', justifyContent:'center',
                    width:'32px', height:'32px', borderRadius:'var(--radius-sm)',
                    backgroundColor: chip.bg, color: chip.text, border:`1px solid ${chip.border}`,
                    fontSize:'0.72rem', fontWeight:'800', cursor:'pointer',
                    transition:'all 0.2s ease', position:'relative',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow=`0 0 10px ${chip.bg}`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none'; }}
                  >
                    {chip.label}
                  </div>
                );
              })}
              {pattern.length === 0 && (
                <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', padding:'0.25rem' }}>Tambahkan shift di bawah...</span>
              )}
            </div>
            <p style={{ fontSize:'0.62rem', color:'var(--text-muted)', marginTop:'0.5rem', opacity:0.7 }}>
              Klik chip untuk menghapus • Pola ini berulang untuk setiap karyawan
            </p>
          </div>

          {/* Add shift buttons */}
          <div style={{ display:'flex', gap:'0.4rem', marginTop:'0.5rem' }}>
            {shiftTypes.map(type => {
              const chip = SHIFT_CHIP_STYLES[type.id];
              return (
                <button key={type.id} onClick={() => addToPattern(type.id)} style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.35rem',
                  padding:'0.45rem', borderRadius:'var(--radius-md)', cursor:'pointer', fontFamily:'inherit',
                  fontSize:'0.72rem', fontWeight:'600', transition:'all 0.2s',
                  backgroundColor: chip.bg, color: chip.text, border:`1px solid ${chip.border}`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=`0 4px 12px ${chip.bg}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
                >
                  <Plus size={12} /> {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 3: Target ── */}
        <div style={{ marginBottom:'1.15rem' }}>
          <label className="label" style={{ marginBottom:'0.45rem' }}>👥 Target Karyawan</label>
          <div style={{ display:'flex', gap:'0.5rem', marginBottom: targetMode === 'single' ? '0.6rem' : '0' }}>
            <button onClick={() => setTargetMode('all')} style={modeBtn('all', targetMode==='all', 'color-primary', 'color-primary-light')}>
              <Users size={15} /> Semua ({employees.length})
            </button>
            <button onClick={() => setTargetMode('single')} style={modeBtn('single', targetMode==='single', 'color-secondary', 'color-secondary-glow')}>
              <User size={15} /> Pilih Satu
            </button>
          </div>
          {targetMode === 'single' && (
            <div className="animate-fade-in-scale" style={{ position:'relative' }}>
              <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="input" style={{ appearance:'none', cursor:'pointer', paddingRight:'2rem', fontSize:'0.82rem' }}>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} — {emp.role}</option>)}
              </select>
              <div style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}>▾</div>
            </div>
          )}
        </div>

        {/* Warning */}
        <div style={{ padding:'0.55rem 0.75rem', borderRadius:'var(--radius-md)', background:'var(--warning-bg)', border:'1px solid var(--shift-sore-border)', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.45rem' }}>
          <AlertTriangle size={14} style={{ color:'var(--warning)', flexShrink:0 }} />
          <p style={{ fontSize:'0.72rem', color:'var(--warning)', lineHeight:'1.5' }}>Jadwal yang sudah ada akan <strong>ditimpa</strong> untuk karyawan yang dipilih.</p>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button onClick={onClose} className="btn btn-outline" style={{ flex:1 }}>Batal</button>
          <button onClick={handleGenerate} className="btn btn-primary" style={{ flex:1, opacity: isValid ? 1 : 0.5, pointerEvents: isValid ? 'auto' : 'none' }} disabled={!isValid}>
            <Wand2 size={15} /> Generate {dayCount > 0 ? `(${dayCount} hari)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoGenerateModal;

