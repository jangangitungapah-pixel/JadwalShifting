import React, { useState, useMemo, useRef } from 'react';
import { FileText, Download, Printer, FileDown, Calendar, DollarSign, Users, TrendingUp, ChevronDown } from 'lucide-react';
import { allShiftTypes, longShiftTypes, shiftTypes } from '../utils/dummyData';
import * as XLSX from 'xlsx';

const Reports = ({ employees, shifts, cutOffDate, incentiveAmount, holidayIncentiveAmount, spIncentiveAmount, holidays }) => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [multiMonth, setMultiMonth] = useState(false);
  const [monthRange, setMonthRange] = useState(3);
  const [individualEmp, setIndividualEmp] = useState('');
  const reportRef = useRef(null);

  const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

  const calculateIncentive = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const ms = String(month + 1).padStart(2, '0');

    return employees.map(emp => {
      let soreCount = 0, malamCount = 0, holidayShiftCount = 0, spCount = 0, spHolidayCount = 0;
      const details = [];

      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${ms}-${String(i).padStart(2, '0')}`;
        const shiftId = shifts[dateStr]?.[emp.id];
        if (!shiftId) continue;

        const isHoliday = holidays.some(h => h.date === dateStr);
        const isLong = shiftId.includes('sp');

        if (isLong) {
          spCount++;
          if (isHoliday) spHolidayCount++;
        } else {
          if (shiftId === 'sore') soreCount++;
          else if (shiftId === 'malam') { malamCount++; if (isHoliday) malamCount++; }
          if (isHoliday && shiftId !== 'libur') holidayShiftCount++;
        }
      }

      const shiftIncentive = (soreCount + malamCount) * incentiveAmount;
      const holidayIncentive = holidayShiftCount * holidayIncentiveAmount;
      const spIncentive = spCount * spIncentiveAmount;
      const total = shiftIncentive + holidayIncentive + spIncentive;

      return { empId: emp.id, name: emp.name, role: emp.role, soreCount, malamCount, holidayShiftCount, spCount, shiftIncentive, holidayIncentive, spIncentive, total };
    });
  };

  const reportData = useMemo(() => {
    if (!multiMonth) return [{ month: selectedMonth, year: selectedYear, data: calculateIncentive(selectedYear, selectedMonth) }];
    const reports = [];
    for (let i = 0; i < monthRange; i++) {
      let m = selectedMonth - i, y = selectedYear;
      while (m < 0) { m += 12; y--; }
      reports.push({ month: m, year: y, data: calculateIncentive(y, m) });
    }
    return reports;
  }, [employees, shifts, selectedMonth, selectedYear, multiMonth, monthRange, incentiveAmount, holidayIncentiveAmount, spIncentiveAmount, holidays]);

  const currentData = reportData[0]?.data || [];
  const totalIncentive = currentData.reduce((s, d) => s + d.total, 0);
  const totalShiftIncentive = currentData.reduce((s, d) => s + d.shiftIncentive, 0);
  const totalSP = currentData.reduce((s, d) => s + d.spIncentive, 0);

  const fmt = (n) => 'Rp ' + n.toLocaleString('id-ID');

  const handleExportExcel = () => {
    const wsData = [['No', 'Nama', 'Jabatan', 'Sore', 'Malam', 'Hari Libur', 'SP', 'Insentif Shift', 'Insentif Libur', 'Insentif SP', 'Total']];
    currentData.forEach((d, i) => wsData.push([i + 1, d.name, d.role, d.soreCount, d.malamCount, d.holidayShiftCount, d.spCount, d.shiftIncentive, d.holidayIncentive, d.spIncentive, d.total]));
    wsData.push(['', '', 'TOTAL', '', '', '', '', totalShiftIncentive, currentData.reduce((s, d) => s + d.holidayIncentive, 0), totalSP, totalIncentive]);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Insentif");
    XLSX.writeFile(wb, `Laporan_Insentif_${monthNames[selectedMonth]}_${selectedYear}.xlsx`);
  };

  const handleExportPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const el = reportRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, { backgroundColor: '#0F1629', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, w, Math.min(h, pdf.internal.pageSize.getHeight()));
      pdf.save(`Laporan_Insentif_${monthNames[selectedMonth]}_${selectedYear}.pdf`);
    } catch (err) { alert('PDF export gagal: ' + err.message); }
  };

  const handleExportICS = () => {
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ShiftSync//ID\n';
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const ms = String(selectedMonth + 1).padStart(2, '0');
    employees.forEach(emp => {
      for (let i = 1; i <= daysInMonth; i++) {
        const ds = `${selectedYear}-${ms}-${String(i).padStart(2, '0')}`;
        const s = shifts[ds]?.[emp.id];
        if (s && s !== 'libur') {
          const st = allShiftTypes.find(t => t.id === s);
          ics += `BEGIN:VEVENT\nDTSTART:${selectedYear}${ms}${String(i).padStart(2, '0')}T080000\nDTEND:${selectedYear}${ms}${String(i).padStart(2, '0')}T170000\nSUMMARY:${emp.name} - ${st?.label || s}\nEND:VEVENT\n`;
        }
      }
    });
    ics += 'END:VCALENDAR';
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Jadwal_${monthNames[selectedMonth]}_${selectedYear}.ics`; a.click();
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #34D399, var(--color-primary))' }} />
            <h2 className="page-title">Laporan Insentif</h2>
          </div>
          <p className="page-subtitle" style={{ marginLeft: '1.75rem' }}>Laporan dan perhitungan insentif karyawan.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select className="input" value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)} style={{ width: 'auto', colorScheme: 'dark', fontSize: '0.82rem' }}>
            {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select className="input" value={selectedYear} onChange={e => setSelectedYear(+e.target.value)} style={{ width: '90px', colorScheme: 'dark', fontSize: '0.82rem' }}>
            {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setMultiMonth(!multiMonth)} className={`btn ${multiMonth ? 'btn-primary' : 'btn-outline'}`} style={{ fontSize: '0.75rem' }}>Multi</button>
          <button onClick={handleExportExcel} className="btn btn-success"><Download size={15} /> Excel</button>
          <button onClick={handleExportPDF} className="btn btn-outline" style={{ color: '#F87171' }}><FileDown size={15} /> PDF</button>
          <button onClick={() => window.print()} className="btn btn-outline"><Printer size={15} /></button>
          <button onClick={handleExportICS} className="btn btn-outline" style={{ color: 'var(--color-secondary)', fontSize: '0.75rem' }}><Calendar size={15} /> .ICS</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="animate-fade-in-up delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Karyawan', value: employees.length, icon: Users, color: '#818CF8' },
          { label: 'Shift Insentif', value: fmt(totalShiftIncentive), icon: DollarSign, color: '#34D399' },
          { label: 'Long Shift (SP)', value: fmt(totalSP), icon: TrendingUp, color: '#F472B6' },
          { label: 'Grand Total', value: fmt(totalIncentive), icon: FileText, color: '#FBBF24' },
        ].map((c, i) => (
          <div key={i} className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.55rem', borderRadius: 'var(--radius-md)', background: `${c.color}15` }}><c.icon size={18} style={{ color: c.color }} /></div>
            <div>
              <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>{c.label}</p>
              <p style={{ fontSize: '1rem', fontWeight: '800' }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div ref={reportRef} className="glass-card animate-fade-in-up delay-200" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {['No', 'Nama', 'Jabatan', 'Sore', 'Malam', 'Libur', 'SP', 'Insentif Shift', 'Insentif Libur', 'Insentif SP', 'Total'].map((h, i) => (
                  <th key={i} style={{ padding: '0.85rem 0.75rem', textAlign: i > 2 ? 'center' : 'left', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--glass-border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.map((d, i) => (
                <tr key={d.empId} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.82rem', fontWeight: '600' }}>{d.name}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{d.role}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.82rem' }}>{d.soreCount}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.82rem' }}>{d.malamCount}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.82rem' }}>{d.holidayShiftCount}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.82rem' }}>{d.spCount}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--success)' }}>{fmt(d.shiftIncentive)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--warning)' }}>{fmt(d.holidayIncentive)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--color-accent)' }}>{fmt(d.spIncentive)}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.88rem', fontWeight: '800', background: 'linear-gradient(135deg, #34D399, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{fmt(d.total)}</td>
                </tr>
              ))}
              <tr style={{ background: 'var(--bg-elevated)' }}>
                <td colSpan={7} style={{ padding: '0.85rem', fontWeight: '800', fontSize: '0.88rem', textAlign: 'right' }}>TOTAL</td>
                <td style={{ padding: '0.85rem', textAlign: 'center', fontWeight: '700', fontSize: '0.85rem', color: 'var(--success)' }}>{fmt(totalShiftIncentive)}</td>
                <td style={{ padding: '0.85rem', textAlign: 'center', fontWeight: '700', fontSize: '0.85rem', color: 'var(--warning)' }}>{fmt(currentData.reduce((s, d) => s + d.holidayIncentive, 0))}</td>
                <td style={{ padding: '0.85rem', textAlign: 'center', fontWeight: '700', fontSize: '0.85rem', color: 'var(--color-accent)' }}>{fmt(totalSP)}</td>
                <td style={{ padding: '0.85rem', textAlign: 'center', fontWeight: '800', fontSize: '1rem', background: 'linear-gradient(135deg, #FBBF24, #F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{fmt(totalIncentive)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-month comparison */}
      {multiMonth && reportData.length > 1 && (
        <div className="glass-card animate-fade-in-up" style={{ padding: '1.25rem', marginTop: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem' }}>📊 Perbandingan Multi-Bulan</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  <th style={{ padding: '0.65rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>Bulan</th>
                  <th style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>Total Insentif</th>
                  <th style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>Rata-rata/Karyawan</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((r, i) => {
                  const tot = r.data.reduce((s, d) => s + d.total, 0);
                  const avg = employees.length > 0 ? Math.round(tot / employees.length) : 0;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.65rem', fontSize: '0.82rem', fontWeight: '600' }}>{monthNames[r.month]} {r.year}</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: '700', color: 'var(--success)' }}>{fmt(tot)}</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{fmt(avg)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
