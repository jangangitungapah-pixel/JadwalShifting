import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Download, Wand2, Rewind, Undo2, Redo2, MessageCircle, Upload, Bookmark, StickyNote, ArrowLeftRight, ZoomIn, ZoomOut } from 'lucide-react';
import ShiftModal from './ShiftModal';
import AutoGenerateModal from './AutoGenerateModal';
import BackfillModal from './BackfillModal';
import TemplateManager from './TemplateManager';
import ShiftSwapModal from './ShiftSwapModal';
import { shiftTypes, allShiftTypes, longShiftTypes } from '../utils/dummyData';
import { generateSmartShifts, backfillShifts } from '../utils/generateShift';
import * as XLSX from 'xlsx';
import { sounds } from '../utils/soundService';
import { useTranslation } from '../utils/i18n.jsx';

const CalendarView = ({ employees, shifts, updateShift, setBatchShifts, autoHolidayEnabled, holidays, canUndo, canRedo, onUndo, onRedo, notes, updateNote, swapRequests, onAddSwapRequest, onResolveSwap, isViewer, isEmployee, currentEmployeeId }) => {
  const { t, lang } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [autoGenModalOpen, setAutoGenModalOpen] = useState(false);
  const [autoGenSingleEmp, setAutoGenSingleEmp] = useState(null);
  const [backfillModalOpen, setBackfillModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [currentPattern, setCurrentPattern] = useState(['pagi','pagi','sore','sore','malam','malam','libur','libur']);
  const [viewMode, setViewMode] = useState('month'); // 'day', 'week', 'month', 'year'

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = t('time.months');

  const getDatesToRender = () => {
    const dates = [];
    if (viewMode === 'day') {
      dates.push(new Date(currentDate));
    } else if (viewMode === 'week') {
      const date = new Date(currentDate);
      const day = date.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff);
      for (let i = 0; i < 7; i++) dates.push(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
    } else if (viewMode === 'month') {
      const dm = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= dm; i++) dates.push(new Date(year, month, i));
    } else if (viewMode === 'year') {
      const daysInYear = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
      for (let i = 0; i < daysInYear; i++) dates.push(new Date(year, 0, i + 1));
    }
    return dates;
  };

  const datesToRender = getDatesToRender();

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
    else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (viewMode === 'year') newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
    else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (viewMode === 'year') newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentDate(newDate);
  };

  const getHeaderLabel = () => {
    if (viewMode === 'day') return `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (viewMode === 'week') {
      const start = datesToRender[0];
      const end = datesToRender[6];
      if (!start || !end) return '';
      return `${start.getDate()} ${monthNames[start.getMonth()]} - ${end.getDate()} ${monthNames[end.getMonth()]} ${start.getFullYear()}`;
    }
    if (viewMode === 'month') return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (viewMode === 'year') return `${currentDate.getFullYear()}`;
  };

  const handleCellClick = (empId, dateStr, currentShiftId) => {
    if (isViewer || isEmployee) return;
    sounds.modalOpen();
    setSelectedCell({ empId, dateStr, currentShiftId });
    setModalOpen(true);
  };

  const handleSaveShift = (newShiftId, note) => {
    if (selectedCell) {
      updateShift(selectedCell.dateStr, selectedCell.empId, newShiftId);
      if (note !== undefined && updateNote) updateNote(selectedCell.dateStr, selectedCell.empId, note);
    }
    sounds.success();
    sounds.modalClose();
    setModalOpen(false);
  };

  const handleAutoGenerateRange = (startDate, endDate, targetEmployees, pattern) => {
    setCurrentPattern(pattern);
    const generated = generateSmartShifts(startDate, endDate, targetEmployees, pattern, holidays, autoHolidayEnabled);
    const newShifts = { ...shifts };
    Object.keys(generated).forEach(dateStr => {
      if (!newShifts[dateStr]) newShifts[dateStr] = {};
      newShifts[dateStr] = { ...newShifts[dateStr], ...generated[dateStr] };
    });
    setBatchShifts(newShifts);
    sounds.success();
  };

  const handleBackfill = (fillStartDate, refDate, targetEmployees, pattern) => {
    const generated = backfillShifts(fillStartDate, refDate, targetEmployees, pattern, shifts, holidays, autoHolidayEnabled);
    const newShifts = { ...shifts };
    Object.keys(generated).forEach(dateStr => {
      if (!newShifts[dateStr]) newShifts[dateStr] = {};
      newShifts[dateStr] = { ...newShifts[dateStr], ...generated[dateStr] };
    });
    setBatchShifts(newShifts);
    sounds.success();
  };

  const handleExport = () => {
    sounds.success();
    const wsData = [];
    const headerRow = ['Karyawan', 'Jabatan'];
    for (let i = 1; i <= daysInMonth; i++) headerRow.push(`${i} ${monthNames[month]}`);
    wsData.push(headerRow);
    employees.forEach(emp => {
      const row = [emp.name, emp.role];
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const shiftType = allShiftTypes.find(s => s.id === shifts[dateStr]?.[emp.id]);
        row.push(shiftType ? shiftType.label : '-');
      }
      wsData.push(row);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal Shift");
    XLSX.writeFile(wb, `Jadwal_Shift_${monthNames[month]}_${year}.xlsx`);
  };

  const handleExportICS = () => {
    if (!currentEmployeeId) return;
    const emp = employees.find(e => e.id === currentEmployeeId);
    if (!emp) return;
    sounds.success();
    import('../utils/calendarExport').then(module => {
      module.exportToICS(emp, shifts, month, year, daysInMonth);
    });
  };

  // Import Excel
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const newShifts = { ...shifts };
        const shiftMap = {};
        allShiftTypes.forEach(s => { shiftMap[s.label.toLowerCase()] = s.id; shiftMap[s.shortLabel?.toLowerCase()] = s.id; });
        for (let r = 1; r < data.length; r++) {
          const empName = data[r]?.[0];
          const emp = employees.find(e => e.name === empName);
          if (!emp) continue;
          for (let c = 2; c < data[r].length && c - 2 < daysInMonth; c++) {
            const val = String(data[r][c] || '').toLowerCase().trim();
            const shiftId = shiftMap[val];
            if (shiftId) {
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(c - 1).padStart(2, '0')}`;
              if (!newShifts[dateStr]) newShifts[dateStr] = {};
              newShifts[dateStr][emp.id] = shiftId;
            }
          }
        }
        setBatchShifts(newShifts);
        sounds.success();
        alert('Import berhasil!');
      } catch (err) { sounds.error(); alert('Gagal import: ' + err.message); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // WhatsApp share
  const handleShareWA = () => {
    let text = `📋 *Jadwal Shift - ${monthNames[month]} ${year}*\n\n`;
    employees.forEach(emp => {
      text += `👤 *${emp.name}* (${emp.role})\n`;
      for (let i = 1; i <= Math.min(daysInMonth, 31); i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const s = shifts[dateStr]?.[emp.id];
        const st = allShiftTypes.find(t => t.id === s);
        text += `${i}: ${st?.label || '-'}  `;
        if (i % 7 === 0) text += '\n';
      }
      text += '\n\n';
    });
    sounds.success();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const getBaseWidths = () => {
    if (isMobile) {
      if (viewMode === 'day') return { name: 120, col: 140 };
      if (viewMode === 'week') return { name: 100, col: 56 };
      if (viewMode === 'month') return { name: 100, col: 44 };
      if (viewMode === 'year') return { name: 80, col: 22 };
      return { name: 100, col: 44 };
    }
    if (viewMode === 'day') return { name: 200, col: 200 };
    if (viewMode === 'week') return { name: 180, col: 120 };
    if (viewMode === 'month') return { name: 150, col: 72 };
    if (viewMode === 'year') return { name: 130, col: 28 };
    return { name: 150, col: 72 };
  };
  const widths = getBaseWidths();
  const columns = `minmax(${widths.name}px, max-content) repeat(${datesToRender.length}, minmax(${widths.col}px, 1fr))`;

  // Today highlight
  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0.5rem', gap: '0.75rem' }}>
      {/* ═══ HEADER BAR ═══ */}
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '4px', height: '36px', borderRadius: '4px', background: 'linear-gradient(180deg, var(--color-primary), var(--color-secondary))', boxShadow: '0 0 12px rgba(129,140,248,0.3)' }} />
          <div>
            <h2 className="page-title" style={{ marginBottom: '0.15rem' }}>{t('cal.title')}</h2>
            <p className="page-subtitle">{t('cal.subtitle')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {/* Date Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', padding: '0.2rem 0.35rem' }}>
            <button onClick={handlePrev} style={{ padding: '0.4rem', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', transition: 'color 0.2s' }}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', minWidth: '140px', textAlign: 'center', letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>{getHeaderLabel()}</span>
            <button onClick={handleNext} style={{ padding: '0.4rem', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', transition: 'color 0.2s' }}><ChevronRight size={16} /></button>
          </div>
          {!isEmployee && (
            <div style={{ display: 'flex', gap: '0.2rem' }}>
              <button onClick={onUndo} disabled={!canUndo} className="btn btn-outline" style={{ padding: '0.4rem', opacity: canUndo ? 1 : 0.25, borderRadius: '50%' }} title="Undo"><Undo2 size={14} /></button>
              <button onClick={onRedo} disabled={!canRedo} className="btn btn-outline" style={{ padding: '0.4rem', opacity: canRedo ? 1 : 0.25, borderRadius: '50%' }} title="Redo"><Redo2 size={14} /></button>
            </div>
          )}
          {/* View Mode */}
          <div style={{ display: 'flex', padding: '0.2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)' }}>
            {[{ id: 'day', label: lang === 'en' ? 'Day' : 'Hari' },{ id: 'week', label: lang === 'en' ? 'Week' : 'Minggu' },{ id: 'month', label: lang === 'en' ? 'Month' : 'Bulan' },{ id: 'year', label: lang === 'en' ? 'Year' : 'Tahun' }].map((mode) => (
              <button key={mode.id} onClick={() => setViewMode(mode.id)} style={{ padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-full)', border: 'none', background: viewMode === mode.id ? 'linear-gradient(135deg, var(--color-primary-deep), var(--color-primary))' : 'transparent', color: viewMode === mode.id ? 'white' : 'var(--text-muted)', fontSize: '0.7rem', fontWeight: viewMode === mode.id ? '700' : '500', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: viewMode === mode.id ? '0 2px 10px rgba(99,102,241,0.35)' : 'none', fontFamily: 'inherit' }}>{mode.label}</button>
            ))}
          </div>
          {/* Actions */}
          {!isEmployee && (
            <div style={{ display: 'flex', gap: '0.25rem', padding: '0.2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)' }}>
              <button data-tour="calendar-auto-btn" onClick={() => { setAutoGenSingleEmp(null); sounds.modalOpen(); setAutoGenModalOpen(true); }} style={{ padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-full)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'all 0.2s', fontFamily: 'inherit' }}><Wand2 size={12} /> {t('cal.autoGen').split('-')[0]}</button>
              <button onClick={() => { sounds.modalOpen(); setBackfillModalOpen(true); }} style={{ padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-full)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-accent)', fontSize: '0.7rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'all 0.2s', fontFamily: 'inherit' }}><Rewind size={12} /> {t('cal.backfill')}</button>
              <button onClick={() => { sounds.modalOpen(); setTemplateModalOpen(true); }} style={{ padding: '0.35rem', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-secondary)', display: 'flex' }}><Bookmark size={12} /></button>
            </div>
          )}
          <button data-tour="calendar-swap-btn" onClick={() => { sounds.modalOpen(); setSwapModalOpen(true); }} className="btn btn-outline" style={{ padding: '0.35rem 0.6rem', color: '#FBBF24', borderColor: 'rgba(251,191,36,0.2)', fontSize: '0.7rem' }}><ArrowLeftRight size={12} />{isEmployee ? ` ${lang === 'en' ? 'Swap' : 'Tukar'}` : ''}</button>
          {isEmployee && <button onClick={handleExportICS} className="btn btn-outline" style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem' }}><Download size={12} /> .ics</button>}
          {!isEmployee && (
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button onClick={() => { sounds.success(); handleShareWA(); }} className="btn btn-outline" style={{ padding: '0.35rem', borderRadius: '50%' }}><MessageCircle size={12} style={{ color: '#34D399' }} /></button>
              <label className="btn btn-outline" style={{ cursor: 'pointer', padding: '0.35rem', borderRadius: '50%' }}><Upload size={12} style={{ color: 'var(--info)' }} /><input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} /></label>
              <button data-tour="calendar-export-btn" onClick={() => { sounds.success(); handleExport(); }} className="btn btn-success" style={{ padding: '0.35rem 0.7rem', fontSize: '0.7rem' }}><Download size={12} /> {t('common.export')}</button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ LEGEND CHIPS ═══ */}
      <div data-tour="calendar-legend" className="animate-fade-in-up delay-100" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {shiftTypes.map(type => (
          <div key={type.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)', background: `var(--shift-${type.id}-bg)`, border: `1px solid var(--shift-${type.id}-border)` }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: `var(--shift-${type.id}-text)` }}>{type.shortLabel}</span>
            <span style={{ fontSize: '0.65rem', color: `var(--shift-${type.id}-text)`, opacity: 0.8, fontWeight: '500' }}>{type.label}</span>
            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{type.time}</span>
          </div>
        ))}
        {longShiftTypes.map(type => (
          <div key={type.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', background: `var(--shift-${type.id}-bg)`, border: `1px solid var(--shift-${type.id}-border)` }}>
            <span style={{ fontSize: '0.58rem', fontWeight: '800', color: `var(--shift-${type.id}-text)` }}>{type.shortLabel}</span>
            <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{type.time}</span>
          </div>
        ))}
      </div>

      {/* ═══ CALENDAR GRID ═══ */}
      <div data-tour="calendar-grid" className="animate-fade-in-up delay-200" style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-xl)', border: '1px solid var(--glass-border)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: columns, minWidth: 'max-content' }}>
            {/* Year View Month Header Row (Only in Year View) */}
            {viewMode === 'year' && (
              <>
                <div style={{ position: 'sticky', left: 0, zIndex: 6, backgroundColor: 'var(--bg-elevated)', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}></div>
                {Array.from({ length: 12 }).map((_, m) => {
                  const dim = new Date(year, m + 1, 0).getDate();
                  return (
                    <div key={`mh-${m}`} style={{ gridColumn: `span ${dim}`, padding: '0.4rem', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-elevated)', textAlign: 'center', fontWeight: '800', fontSize: '0.75rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                      {monthNames[m]}
                    </div>
                  );
                })}
              </>
            )}
            {/* Header Row */}
            <div style={{ padding: '0.7rem 1rem', borderRight: '1px solid var(--glass-border)', borderBottom: '2px solid var(--glass-border)', backgroundColor: 'var(--bg-elevated)', fontWeight: '700', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', position: 'sticky', left: 0, zIndex: 5, fontFamily: "'Outfit', sans-serif" }}>Karyawan</div>
            {datesToRender.map((date, i) => {
              const y = date.getFullYear();
              const m = date.getMonth();
              const d = date.getDate();
              const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const holiday = holidays.find(h => h.date === dateStr);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const isToday = dateStr === todayStr;
              return (
                <div key={i} title={holiday ? `${lang === 'en' ? 'National Holiday' : 'Libur Nasional'}: ${holiday.localName}` : ''} style={{
                  padding: viewMode === 'year' ? '0.5rem 0.1rem' : '0.5rem 0.35rem',
                  borderBottom: holiday ? '2px solid var(--danger)' : '2px solid var(--glass-border)',
                  borderRight: '1px solid var(--glass-border)',
                  backgroundColor: holiday ? 'rgba(248, 113, 113, 0.12)' : isToday ? 'rgba(129,140,248,0.1)' : isWeekend ? 'rgba(248, 113, 113, 0.04)' : 'var(--bg-elevated)',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: holiday ? 'var(--danger)' : isToday ? 'var(--color-primary)' : isWeekend ? 'var(--danger)' : 'var(--text-tertiary)',
                  cursor: holiday ? 'help' : 'default',
                  fontSize: '0.72rem',
                  minWidth: 0,
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {viewMode !== 'year' && <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.1rem', opacity: 0.6, fontFamily: "'Outfit', sans-serif" }}>{['Min','Sen','Sel','Rab','Kam','Jum','Sab'][date.getDay()]}</div>}
                  <div style={{ fontSize: viewMode === 'year' ? '0.6rem' : '0.9rem', fontWeight: isToday ? '900' : '700', fontFamily: "'Outfit', sans-serif" }}>{d}</div>
                  {holiday && <div style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--danger)', boxShadow: '0 0 6px rgba(248, 113, 113, 0.6)' }} />}
                  {isToday && <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '2px', background: 'var(--color-primary)', borderRadius: '2px' }} />}
                </div>
              );
            })}

            {/* ─── Employee Rows ─── */}
            {employees.filter(emp => isEmployee ? emp.id === currentEmployeeId : true).map((emp, empIdx) => {
              const isEven = empIdx % 2 === 0;
              const rowBg = isEven ? 'var(--bg-main)' : 'var(--bg-elevated)';
              return (
              <React.Fragment key={emp.id}>
                {/* Name Cell */}
                <div style={{ 
                  padding: isMobile ? '0.4rem 0.5rem' : '0.6rem 0.85rem', 
                  borderRight: '1px solid var(--glass-border)', 
                  borderBottom: '1px solid var(--glass-border)', 
                  backgroundColor: rowBg, 
                  position: 'sticky', left: 0, zIndex: 4, 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
                  borderLeft: `3px solid ${['var(--shift-pagi-text)', 'var(--shift-sore-text)', 'var(--shift-malam-text)', 'var(--color-secondary)'][empIdx % 4]}`,
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.35rem' : '0.65rem' }}>
                    <img src={emp.avatar} alt={emp.name} style={{ width: isMobile ? '24px' : '34px', height: isMobile ? '24px' : '34px', borderRadius: isMobile ? '6px' : '10px', border: '2px solid var(--glass-border)', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: isMobile ? '0.68rem' : '0.82rem', color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '70px' : 'none' }}>{emp.name}</div>
                      <div style={{ fontSize: isMobile ? '0.52rem' : '0.62rem', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.02em' }}>{emp.role}</div>
                    </div>
                  </div>
                  {!isViewer && !isEmployee && (
                    <button onClick={() => { sounds.modalOpen(); setAutoGenSingleEmp(emp); setAutoGenModalOpen(true); }} style={{ padding: '0.3rem', borderRadius: '8px', border: '1px solid rgba(129,140,248,0.12)', background: 'transparent', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', transition: 'all 0.2s', fontFamily: 'inherit' }} title="Auto-generate"
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-light)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    ><Wand2 size={13} /></button>
                  )}
                </div>

                {/* Shift Cells */}
                {datesToRender.map((date, i) => {
                  const y = date.getFullYear();
                  const m = date.getMonth();
                  const d = date.getDate();
                  const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const shiftId = shifts[dateStr]?.[emp.id];
                  const shiftType = allShiftTypes.find(s => s.id === shiftId);
                  const noteKey = `${dateStr}_${emp.id}`;
                  const hasNote = notes && notes[noteKey];
                  const isToday = dateStr === todayStr;
                  const holiday = holidays.find(h => h.date === dateStr);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isRedDay = isWeekend || holiday;

                  return (
                    <div key={i} onClick={() => handleCellClick(emp.id, dateStr, shiftId)}
                      style={{
                        padding: viewMode === 'year' ? '0.15rem' : '0.35rem',
                        borderRight: '1px solid var(--glass-border)',
                        borderBottom: '1px solid var(--glass-border)',
                        backgroundColor: isToday ? 'rgba(129,140,248,0.06)' : isRedDay ? 'rgba(248,113,113,0.02)' : rowBg,
                        cursor: isViewer || isEmployee ? 'default' : 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = isToday ? 'rgba(129,140,248,0.12)' : 'var(--bg-card-hover)'; const badge = e.currentTarget.querySelector('[data-badge]'); if (badge) { badge.style.transform = 'scale(1.15)'; badge.style.boxShadow = `0 4px 14px var(--shift-${shiftType?.id || 'pagi'}-bg)`; } }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = isToday ? 'rgba(129,140,248,0.06)' : isRedDay ? 'rgba(248,113,113,0.02)' : rowBg; const badge = e.currentTarget.querySelector('[data-badge]'); if (badge) { badge.style.transform = 'scale(1)'; badge.style.boxShadow = viewMode !== 'year' ? `0 2px 8px var(--shift-${shiftType?.id || 'pagi'}-bg)` : 'none'; } }}>
                      {shiftType ? (
                        <div data-badge="true" style={{
                          backgroundColor: `var(--shift-${shiftType.id}-bg)`,
                          color: `var(--shift-${shiftType.id}-text)`,
                          border: `1px solid var(--shift-${shiftType.id}-border)`,
                          padding: viewMode === 'year' ? '0.1rem' : '0.4rem 0.5rem',
                          borderRadius: viewMode === 'year' ? '4px' : '12px',
                          fontSize: viewMode === 'year' ? '0.55rem' : '0.78rem',
                          fontWeight: '800',
                          textAlign: 'center',
                          height: '100%',
                          minHeight: viewMode === 'year' ? '20px' : '34px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          letterSpacing: '0.04em',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          fontFamily: "'Outfit', sans-serif",
                          boxShadow: viewMode !== 'year' ? `0 2px 8px var(--shift-${shiftType.id}-bg)` : 'none',
                          transition: 'transform 0.15s ease',
                        }}>
                          {viewMode === 'year' ? shiftType.shortLabel.charAt(0) : (shiftType.shortLabel || shiftType.label)}
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: '100%', minHeight: viewMode === 'year' ? '20px' : '34px', border: viewMode === 'year' ? 'none' : '1px dashed rgba(255,255,255,0.03)', borderRadius: '12px' }} />
                      )}
                      {hasNote && <div style={{ position: 'absolute', top: '3px', right: '4px', width: '7px', height: '7px', borderRadius: '50%', background: '#FBBF24', boxShadow: '0 0 8px rgba(251,191,36,0.7)' }} title={notes[noteKey]} />}
                    </div>
                  );
                })}
              </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {modalOpen && <ShiftModal onClose={() => { sounds.modalClose(); setModalOpen(false); }} onSave={handleSaveShift} cellData={selectedCell} employee={employees.find(e => e.id === selectedCell?.empId)} notes={notes} />}
      {autoGenModalOpen && <AutoGenerateModal onClose={() => { sounds.modalClose(); setAutoGenModalOpen(false); }} onGenerate={handleAutoGenerateRange} employees={autoGenSingleEmp ? [autoGenSingleEmp] : employees} monthNames={monthNames} />}
      {backfillModalOpen && <BackfillModal onClose={() => { sounds.modalClose(); setBackfillModalOpen(false); }} onBackfill={handleBackfill} employees={employees} monthNames={monthNames} />}
      {templateModalOpen && <TemplateManager onClose={() => { sounds.modalClose(); setTemplateModalOpen(false); }} onLoadTemplate={(p) => setCurrentPattern(p)} currentPattern={currentPattern} />}
      {swapModalOpen && <ShiftSwapModal onClose={() => { sounds.modalClose(); setSwapModalOpen(false); }} employees={employees} shifts={shifts} swapRequests={swapRequests} onAddSwapRequest={onAddSwapRequest} onResolveSwap={onResolveSwap} />}
    </div>
  );
};

export default CalendarView;
