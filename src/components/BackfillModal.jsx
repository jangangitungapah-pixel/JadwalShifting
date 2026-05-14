import React, { useState } from 'react';
import { X, Rewind, CalendarRange, Users, User, AlertTriangle, Info, Plus, RotateCcw } from 'lucide-react';
import { shiftTypes } from '../utils/dummyData';
import { sounds } from '../utils/soundService';

const DEFAULT_PATTERN = ['pagi','pagi','sore','sore','malam','malam','libur','libur'];

const SHIFT_CHIP = {
  pagi:  { bg:'var(--shift-pagi-bg)',  text:'var(--shift-pagi-text)',  border:'var(--shift-pagi-border)',  label:'P' },
  sore:  { bg:'var(--shift-sore-bg)',  text:'var(--shift-sore-text)',  border:'var(--shift-sore-border)',  label:'S' },
  malam: { bg:'var(--shift-malam-bg)', text:'var(--shift-malam-text)', border:'var(--shift-malam-border)', label:'M' },
  libur: { bg:'var(--shift-libur-bg)', text:'var(--shift-libur-text)', border:'var(--shift-libur-border)', label:'L' },
};

const BackfillModal = ({ onClose, onBackfill, employees, monthNames }) => {
  const today = new Date();
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const fmtDisplay = (ds) => { const d = new Date(ds); return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`; };

  const [fillStartDate, setFillStartDate] = useState(fmt(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [refDate, setRefDate] = useState(fmt(today));
  const [targetMode, setTargetMode] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(employees[0]?.id || '');
  const [pattern, setPattern] = useState([...DEFAULT_PATTERN]);

  const fillStart = new Date(fillStartDate);
  const ref = new Date(refDate);
  const dayCount = Math.max(0, Math.ceil((ref - fillStart) / (1000*60*60*24)));
  const isValid = fillStart < ref && fillStartDate && refDate && pattern.length > 0;

  const handleBackfill = () => {
    if (!isValid) return;
    sounds.success();
    const targets = targetMode === 'all' ? employees : employees.filter(e => e.id === selectedEmployee);
    onBackfill(new Date(fillStartDate), new Date(refDate), targets, pattern);
    onClose();
  };

  const modeBtn = (active, color, glowVar) => ({
    flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
    padding:'0.65rem', borderRadius:'var(--radius-lg)', cursor:'pointer', fontFamily:'inherit', fontSize:'0.82rem',
    border: `1.5px solid ${active ? `var(--${color})` : 'var(--glass-border)'}`,
    background: active ? `var(--${glowVar})` : 'transparent',
    color: active ? `var(--${color})` : 'var(--text-secondary)',
    fontWeight: active ? '600' : '500', transition:'all 0.25s ease',
    boxShadow: active ? `0 0 15px var(--${glowVar})` : 'none',
  });

  return (
    <div className="animate-fade-in" style={{ position:'fixed', inset:0, backgroundColor:'var(--bg-overlay)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
      <div className="glass-card" style={{ width:'100%', maxWidth:'520px', padding:'1.75rem', animation:'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)', position:'relative', border:'1px solid var(--glass-border-hover)', boxShadow:'var(--shadow-xl), var(--shadow-glow-primary)', maxHeight:'90vh', overflowY:'auto' }}>
        {/* Top accent */}
        <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:'2px', background:'linear-gradient(90deg, transparent, var(--color-accent), var(--color-secondary), transparent)', borderRadius:'0 0 2px 2px' }} />

        <button onClick={onClose} style={{ position:'absolute', top:'1rem', right:'1rem', background:'var(--bg-card)', border:'1px solid var(--glass-border)', borderRadius:'var(--radius-sm)', cursor:'pointer', color:'var(--text-secondary)', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16} /></button>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'1.35rem' }}>
          <div style={{ padding:'0.55rem', borderRadius:'var(--radius-md)', background:'var(--color-accent-glow)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Rewind size={20} style={{ color:'var(--color-accent)' }} />
          </div>
          <div>
            <h3 style={{ fontSize:'1.1rem', fontWeight:'700', letterSpacing:'-0.02em' }}>Backfill — Isi Mundur</h3>
            <p style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Sesuaikan hari-hari sebelumnya berdasarkan jadwal yang sudah ada</p>
          </div>
        </div>

        {/* How it works */}
        <div style={{ padding:'0.65rem 0.85rem', borderRadius:'var(--radius-md)', background:'var(--info-bg)', border:'1px solid rgba(96,165,250,0.15)', marginBottom:'1.15rem', display:'flex', gap:'0.5rem', alignItems:'flex-start' }}>
          <Info size={15} style={{ color:'var(--info)', flexShrink:0, marginTop:'0.15rem' }} />
          <p style={{ fontSize:'0.72rem', color:'var(--info)', lineHeight:'1.6' }}>
            Sistem akan membaca jadwal karyawan pada <strong>tanggal acuan</strong>, mendeteksi posisi pola rotasi, lalu mengisi mundur hingga <strong>tanggal mulai</strong> agar pola tetap kontinu.
          </p>
        </div>

        {/* ── Date Inputs ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.65rem', marginBottom:'0.5rem' }}>
          <div>
            <label className="label"><CalendarRange size={12} style={{ display:'inline', marginRight:'0.3rem', verticalAlign:'middle' }} />Isi Dari Tanggal</label>
            <input type="date" className="input" value={fillStartDate} onChange={e => setFillStartDate(e.target.value)} style={{ fontSize:'0.82rem' }} />
          </div>
          <div>
            <label className="label"><CalendarRange size={12} style={{ display:'inline', marginRight:'0.3rem', verticalAlign:'middle' }} />Tanggal Acuan</label>
            <input type="date" className="input" value={refDate} onChange={e => setRefDate(e.target.value)} style={{ fontSize:'0.82rem' }} />
          </div>
        </div>

        {isValid && (
          <div style={{ marginBottom:'1.15rem', padding:'0.5rem 0.75rem', borderRadius:'var(--radius-sm)', background:'var(--bg-elevated)', border:'1px solid var(--glass-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>{fmtDisplay(fillStartDate)} → {fmtDisplay(refDate)}</span>
            <span style={{ fontSize:'0.68rem', fontWeight:'700', color:'var(--color-accent)', padding:'0.1rem 0.45rem', borderRadius:'var(--radius-full)', background:'var(--color-accent-glow)', border:'1px solid rgba(236,72,153,0.2)' }}>{dayCount} hari mundur</span>
          </div>
        )}

        {!isValid && fillStartDate && refDate && fillStart >= ref && (
          <div style={{ marginBottom:'1.15rem', padding:'0.5rem 0.75rem', borderRadius:'var(--radius-sm)', background:'var(--danger-bg)', border:'1px solid var(--shift-libur-border)', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <AlertTriangle size={14} style={{ color:'var(--danger)', flexShrink:0 }} />
            <span style={{ fontSize:'0.75rem', color:'var(--danger)' }}>Tanggal mulai harus sebelum tanggal acuan.</span>
          </div>
        )}

        {/* ── Pattern ── */}
        <div style={{ marginBottom:'1.15rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
            <label className="label" style={{ margin:0 }}>🔄 Pola Rotasi (sama dengan saat generate)</label>
            <button onClick={() => setPattern([...DEFAULT_PATTERN])} style={{ display:'flex', alignItems:'center', gap:'0.25rem', padding:'0.2rem 0.5rem', fontSize:'0.65rem', borderRadius:'var(--radius-sm)', border:'1px solid var(--glass-border)', background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontFamily:'inherit' }}><RotateCcw size={11} /> Reset</button>
          </div>

          <div style={{ padding:'0.65rem', borderRadius:'var(--radius-md)', background:'var(--bg-elevated)', border:'1px solid var(--glass-border)', minHeight:'44px' }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.25rem', alignItems:'center' }}>
              {pattern.map((id, idx) => {
                const c = SHIFT_CHIP[id];
                return (
                  <div key={idx} onClick={() => setPattern(p => p.filter((_,i) => i !== idx))} title="Klik untuk hapus" style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'30px', height:'30px', borderRadius:'var(--radius-sm)', backgroundColor:c.bg, color:c.text, border:`1px solid ${c.border}`, fontSize:'0.7rem', fontWeight:'800', cursor:'pointer', transition:'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow=`0 0 8px ${c.bg}`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none'; }}
                  >{c.label}</div>
                );
              })}
              {pattern.length === 0 && <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Tambahkan shift...</span>}
            </div>
          </div>

          <div style={{ display:'flex', gap:'0.35rem', marginTop:'0.45rem' }}>
            {shiftTypes.map(type => {
              const c = SHIFT_CHIP[type.id];
              return (
                <button key={type.id} onClick={() => setPattern(p => [...p, type.id])} style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.3rem',
                  padding:'0.4rem', borderRadius:'var(--radius-md)', cursor:'pointer', fontFamily:'inherit',
                  fontSize:'0.68rem', fontWeight:'600', transition:'all 0.2s',
                  backgroundColor:c.bg, color:c.text, border:`1px solid ${c.border}`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}
                ><Plus size={11} /> {type.label}</button>
              );
            })}
          </div>
        </div>

        {/* ── Target ── */}
        <div style={{ marginBottom:'1.15rem' }}>
          <label className="label" style={{ marginBottom:'0.45rem' }}>👥 Target Karyawan</label>
          <div style={{ display:'flex', gap:'0.5rem', marginBottom: targetMode==='single' ? '0.6rem' : '0' }}>
            <button onClick={() => setTargetMode('all')} style={modeBtn(targetMode==='all','color-primary','color-primary-light')}><Users size={15} /> Semua ({employees.length})</button>
            <button onClick={() => setTargetMode('single')} style={modeBtn(targetMode==='single','color-secondary','color-secondary-glow')}><User size={15} /> Pilih Satu</button>
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
          <p style={{ fontSize:'0.72rem', color:'var(--warning)', lineHeight:'1.5' }}>Jadwal pada rentang backfill akan <strong>ditimpa</strong>.</p>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button onClick={onClose} className="btn btn-outline" style={{ flex:1 }}>Batal</button>
          <button onClick={handleBackfill} className="btn btn-primary" style={{ flex:1, opacity:isValid?1:0.5, pointerEvents:isValid?'auto':'none' }} disabled={!isValid}>
            <Rewind size={15} /> Backfill {dayCount > 0 ? `(${dayCount} hari)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackfillModal;

