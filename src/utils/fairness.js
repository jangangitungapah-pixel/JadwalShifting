import { shiftTypes } from './dummyData.js';

const SHIFT_HOURS = { pagi: 8, sore: 8, malam: 8, libur: 0, 'sp-pagi-sore': 16, 'pagi-sp-sore': 16, 'sp-sore-malam': 16, 'sore-sp-malam': 16 };
const fmtDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

export const calculateFairnessScore = (employees, shifts, year, month, cutOffDate) => {
  let start, end;
  if (!cutOffDate || cutOffDate >= 28) {
    start = new Date(year, month, 1);
    end = new Date(year, month + 1, 0);
  } else {
    start = new Date(year, month - 1, cutOffDate + 1);
    end = new Date(year, month, cutOffDate);
  }

  const dates = [];
  let current = new Date(start);
  while (current <= end) { dates.push(new Date(current)); current.setDate(current.getDate() + 1); }

  const stats = employees.map(emp => {
    let pagi=0, sore=0, malam=0, libur=0, sp=0, totalHours=0;
    for (const d of dates) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const ds = `${y}-${m}-${day}`;
      const s = shifts[ds]?.[emp.id];
      if (s === 'pagi') pagi++;
      else if (s === 'sore') sore++;
      else if (s === 'malam') malam++;
      else if (s === 'libur') libur++;
      else if (s?.includes('sp')) sp++;
      totalHours += (SHIFT_HOURS[s] || 0);
    }
    return { empId: emp.id, name: emp.name, pagi, sore, malam, libur, sp, totalHours, totalShifts: pagi+sore+malam+sp };
  });
  if (stats.length === 0) return { stats, overallScore: 100 };
  const avgMalam = stats.reduce((s,x) => s+x.malam, 0) / stats.length;
  const avgShifts = stats.reduce((s,x) => s+x.totalShifts, 0) / stats.length;
  const deviations = stats.map(s => Math.abs(s.malam - avgMalam) + Math.abs(s.totalShifts - avgShifts));
  const maxDev = Math.max(...deviations, 1);
  stats.forEach((s, i) => { s.fairnessScore = Math.max(0, Math.round(100 - (deviations[i] / maxDev) * 50)); });
  const overallScore = Math.round(stats.reduce((sum, s) => sum + s.fairnessScore, 0) / stats.length);
  return { stats, overallScore };
};

export const calculateWorkloadBalance = (employees, shifts, year, month, cutOffDate) => {
  const { stats } = calculateFairnessScore(employees, shifts, year, month, cutOffDate);
  if (stats.length === 0) return [];
  const avgHours = stats.reduce((s, x) => s + x.totalHours, 0) / stats.length;
  return stats.map(s => ({ ...s, avgHours, deviation: s.totalHours - avgHours, deviationPct: avgHours > 0 ? ((s.totalHours - avgHours) / avgHours * 100).toFixed(1) : 0 }));
};

export const calculateOvertime = (employees, shifts, year, month, cutOffDate) => {
  const WEEKLY_LIMIT = 40;
  let start, end;
  if (!cutOffDate || cutOffDate >= 28) {
    start = new Date(year, month, 1);
    end = new Date(year, month + 1, 0);
  } else {
    start = new Date(year, month - 1, cutOffDate + 1);
    end = new Date(year, month, cutOffDate);
  }

  const dates = [];
  let current = new Date(start);
  while (current <= end) { dates.push(new Date(current)); current.setDate(current.getDate() + 1); }

  return employees.map(emp => {
    let weeklyHours = [], currentWeekHours = 0;
    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const s = shifts[ds]?.[emp.id];
      currentWeekHours += (SHIFT_HOURS[s] || 0);
      if (d.getDay() === 0 || i === dates.length - 1) { weeklyHours.push(currentWeekHours); currentWeekHours = 0; }
    }
    const overtimeWeeks = weeklyHours.filter(h => h > WEEKLY_LIMIT).length;
    const totalOvertime = weeklyHours.reduce((s, h) => s + Math.max(0, h - WEEKLY_LIMIT), 0);
    return { empId: emp.id, name: emp.name, weeklyHours, overtimeWeeks, totalOvertime, hasOvertime: totalOvertime > 0 };
  });
};

export const validateConstraints = (empId, dateStr, shiftId, shifts, constraints) => {
  const c = constraints?.[empId];
  if (!c) return { valid: true, warnings: [] };
  const warnings = [];
  if (c.blockedDays?.includes(new Date(dateStr).getDay())) warnings.push('Hari ini diblokir oleh karyawan.');
  if (c.blockedShifts?.includes(shiftId)) warnings.push(`Shift ${shiftId} tidak diinginkan.`);
  if (c.maxConsecutiveNights && shiftId === 'malam') {
    let consecutive = 0;
    for (let i = 1; i <= c.maxConsecutiveNights; i++) {
      const prev = new Date(dateStr); prev.setDate(prev.getDate() - i);
      if (shifts[fmtDate(prev)]?.[empId] === 'malam') consecutive++; else break;
    }
    if (consecutive >= c.maxConsecutiveNights) warnings.push(`Melebihi maks ${c.maxConsecutiveNights} malam berturut-turut.`);
  }
  return { valid: warnings.length === 0, warnings };
};

export const suggestSwap = (empId, dateStr, shifts, employees) => {
  const currentShift = shifts[dateStr]?.[empId];
  if (!currentShift || currentShift === 'libur') return [];
  return employees.filter(e => e.id !== empId).map(e => {
    const theirShift = shifts[dateStr]?.[e.id];
    if (!theirShift || theirShift === currentShift) return null;
    return { employee: e, theirShift, yourShift: currentShift, dateStr };
  }).filter(Boolean).slice(0, 3);
};

export const autoResolveConflicts = (employees, shifts, year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const ms = String(month + 1).padStart(2, '0');
  const suggestions = [];
  employees.forEach(emp => {
    for (let i = 1; i < daysInMonth; i++) {
      const d1 = `${year}-${ms}-${String(i).padStart(2,'0')}`;
      const d2 = `${year}-${ms}-${String(i+1).padStart(2,'0')}`;
      if (shifts[d1]?.[emp.id] === 'malam' && shifts[d2]?.[emp.id] === 'pagi') {
        const swapCandidates = employees.filter(e => e.id !== emp.id && shifts[d2]?.[e.id] !== 'malam' && shifts[d2]?.[e.id] !== 'pagi');
        if (swapCandidates.length > 0) {
          suggestions.push({ empId: emp.id, empName: emp.name, date: d2, conflictType: 'Malam→Pagi', suggestion: `Tukar shift pagi ${emp.name} di ${d2} dengan ${swapCandidates[0].name}`, swapWith: swapCandidates[0] });
        }
      }
    }
  });
  return suggestions;
};
