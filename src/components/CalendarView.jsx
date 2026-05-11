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

const CalendarView = ({ employees, shifts, updateShift, setBatchShifts, autoHolidayEnabled, holidays, canUndo, canRedo, onUndo, onRedo, notes, updateNote, swapRequests, onAddSwapRequest, onResolveSwap, isViewer }) => {
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
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const getDatesToRender = () => {
    const dates = [];
    if (viewMode === 'day') {
      dates.push(new Date(currentDate));
    } else if (viewMode === 'week') {
      const date = new Date(currentDate);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
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
    if (isViewer) return;
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

  const getBaseWidths = () => {
    if (viewMode === 'day') return { name: 200, col: 200 };
    if (viewMode === 'week') return { name: 180, col: 120 };
    if (viewMode === 'month') return { name: 150, col: 72 };
    if (viewMode === 'year') return { name: 130, col: 28 };
    return { name: 150, col: 72 };
  };
  const widths = getBaseWidths();
  const columns = `minmax(${widths.name}px, max-content) repeat(${datesToRender.length}, minmax(${widths.col}px, 1fr))`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0.5rem' }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #FBBF24, var(--color-primary))', boxShadow: '0 0 12px rgba(251, 191, 36, 0.2)' }} />
            <h2 className="page-title">Jadwal Shift</h2>
          </div>
          <p className="page-subtitle" style={{ marginLeft: '1.75rem' }}>Atur dan pantau jadwal kerja karyawan.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Date nav */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', padding: '0.25rem', borderRadius: 'var(--radius-lg)' }}>
            <button onClick={handlePrev} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}><ChevronLeft size={18} /></button>
            <span style={{ fontSize: '0.95rem', fontWeight: '700', minWidth: '160px', textAlign: 'center', letterSpacing: '-0.02em' }}>{getHeaderLabel()}</span>
            <button onClick={handleNext} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}><ChevronRight size={18} /></button>
          </div>
          <button onClick={onUndo} disabled={!canUndo} className="btn btn-outline" style={{ padding: '0.5rem', opacity: canUndo ? 1 : 0.3 }} title="Undo (Ctrl+Z)"><Undo2 size={15} /></button>
          <button onClick={onRedo} disabled={!canRedo} className="btn btn-outline" style={{ padding: '0.5rem', opacity: canRedo ? 1 : 0.3 }} title="Redo (Ctrl+Y)"><Redo2 size={15} /></button>
          {/* View Mode controls */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0.25rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)' }}>
            {[
              { id: 'day', label: 'Hari' },
              { id: 'week', label: 'Minggu' },
              { id: 'month', label: 'Bulan' },
              { id: 'year', label: 'Tahun' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: viewMode === mode.id ? 'var(--color-primary)' : 'transparent',
                  color: viewMode === mode.id ? 'white' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: viewMode === mode.id ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: viewMode === mode.id ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>
          {/* Actions */}
          <button onClick={() => { setAutoGenSingleEmp(null); sounds.modalOpen(); setAutoGenModalOpen(true); }} className="btn btn-outline" style={{ color: 'var(--color-primary)', borderColor: 'rgba(129,140,248,0.2)' }}><Wand2 size={15} /> Auto</button>
          <button onClick={() => { sounds.modalOpen(); setBackfillModalOpen(true); }} className="btn btn-outline" style={{ color: 'var(--color-accent)', borderColor: 'rgba(236,72,153,0.2)' }}><Rewind size={15} /> Backfill</button>
          <button onClick={() => { sounds.modalOpen(); setTemplateModalOpen(true); }} className="btn btn-outline" style={{ color: 'var(--color-secondary)', borderColor: 'rgba(34,211,238,0.2)' }}><Bookmark size={15} /></button>
          <button onClick={() => { sounds.modalOpen(); setSwapModalOpen(true); }} className="btn btn-outline" style={{ color: '#FBBF24', borderColor: 'rgba(251,191,36,0.2)' }}><ArrowLeftRight size={15} /></button>
          <button onClick={() => { sounds.success(); handleShareWA(); }} className="btn btn-outline" style={{ color: '#34D399', borderColor: 'rgba(52,211,153,0.2)' }}><MessageCircle size={15} /></button>
          <label className="btn btn-outline" style={{ cursor: 'pointer', color: 'var(--info)', borderColor: 'rgba(96,165,250,0.2)' }}><Upload size={15} /><input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} /></label>
          <button onClick={() => { sounds.success(); handleExport(); }} className="btn btn-success"><Download size={15} /> Excel</button>
        </div>
      </div>

      {/* Legend */}
      <div className="animate-fade-in-up delay-100" style={{ display: 'flex', gap: '1.25rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        {shiftTypes.map(type => (
          <div key={type.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: `var(--shift-${type.id}-bg)`, border: `1px solid var(--shift-${type.id}-border)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', color: `var(--shift-${type.id}-text)` }}>{type.shortLabel}</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{type.label} <span style={{ color: 'var(--text-muted)' }}>({type.time})</span></span>
          </div>
        ))}
      </div>
      <div className="animate-fade-in-up delay-100" style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {longShiftTypes.map(type => (
          <div key={type.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ padding: '0 4px', height: '14px', borderRadius: '3px', backgroundColor: `var(--shift-${type.id}-bg)`, border: `1px solid var(--shift-${type.id}-border)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', color: `var(--shift-${type.id}-text)` }}>{type.shortLabel}</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '500' }}>{type.label} <span style={{ opacity: 0.6 }}>({type.time})</span></span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="glass-card animate-fade-in-up delay-200" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0, borderRadius: 'var(--radius-xl)' }}>
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
            <div style={{ padding: '0.85rem 1rem', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-elevated)', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', position: 'sticky', left: 0, zIndex: 5 }}>Karyawan</div>
            {datesToRender.map((date, i) => {
              const y = date.getFullYear();
              const m = date.getMonth();
              const d = date.getDate();
              const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const holiday = holidays.find(h => h.date === dateStr);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const isRedDay = isWeekend || holiday;
              return (
                <div key={i} title={holiday ? holiday.localName : ''} style={{ padding: viewMode === 'year' ? '0.65rem 0.1rem' : '0.65rem 0.35rem', borderBottom: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', backgroundColor: isRedDay ? 'rgba(248, 113, 113, 0.06)' : 'var(--bg-elevated)', textAlign: 'center', fontWeight: '600', color: isRedDay ? 'var(--danger)' : 'var(--text-tertiary)', cursor: holiday ? 'help' : 'default', fontSize: '0.75rem', minWidth: 0, overflow: 'hidden' }}>
                  {viewMode !== 'year' && <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.15rem', opacity: 0.7 }}>{['Min','Sen','Sel','Rab','Kam','Jum','Sab'][date.getDay()]}</div>}
                  <div style={{ fontSize: viewMode === 'year' ? '0.65rem' : '0.95rem', fontWeight: '700' }}>{d}</div>
                </div>
              );
            })}

            {/* Employee Rows */}
            {employees.map(emp => (
              <React.Fragment key={emp.id}>
                <div style={{ padding: '0.65rem 0.85rem', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-main)', position: 'sticky', left: 0, zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <img src={emp.avatar} alt={emp.name} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--glass-border)' }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.82rem', color: 'var(--text-primary)' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{emp.role}</div>
                    </div>
                  </div>
                  {!isViewer && (
                    <button onClick={() => { sounds.modalOpen(); setAutoGenSingleEmp(emp); setAutoGenModalOpen(true); }} className="btn btn-outline" style={{ padding: '0.2rem', color: 'var(--color-primary)', borderColor: 'rgba(129,140,248,0.15)', backgroundColor: 'transparent', borderRadius: 'var(--radius-sm)' }} title="Generate"><Wand2 size={12} /></button>
                  )}
                </div>
                {datesToRender.map((date, i) => {
                  const y = date.getFullYear();
                  const m = date.getMonth();
                  const d = date.getDate();
                  const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const shiftId = shifts[dateStr]?.[emp.id];
                  const shiftType = allShiftTypes.find(s => s.id === shiftId);
                  const noteKey = `${dateStr}_${emp.id}`;
                  const hasNote = notes && notes[noteKey];

                  return (
                    <div key={i} onClick={() => handleCellClick(emp.id, dateStr, shiftId)}
                      style={{ padding: viewMode === 'year' ? '0.15rem' : '0.35rem', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-main)', cursor: isViewer ? 'default' : 'pointer', transition: 'all 0.2s ease', position: 'relative' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'}>
                      {shiftType ? (
                        <div style={{ backgroundColor: `var(--shift-${shiftType.id}-bg)`, color: `var(--shift-${shiftType.id}-text)`, border: `1px solid var(--shift-${shiftType.id}-border)`, padding: viewMode === 'year' ? '0' : '0.3rem 0.4rem', borderRadius: 'var(--radius-sm)', fontSize: viewMode === 'year' ? '0.55rem' : '0.7rem', fontWeight: '700', textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '0.02em', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {viewMode === 'year' ? shiftType.shortLabel.charAt(0) : (shiftType.shortLabel || shiftType.label)}
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: '100%', minHeight: viewMode === 'year' ? '20px' : '28px', border: viewMode === 'year' ? 'none' : '1px dashed var(--glass-border)', borderRadius: 'var(--radius-sm)' }} />
                      )}
                      {hasNote && <div style={{ position: 'absolute', top: '2px', right: '3px', width: '6px', height: '6px', borderRadius: '50%', background: '#FBBF24', boxShadow: '0 0 4px rgba(251,191,36,0.5)' }} title={notes[noteKey]} />}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
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
