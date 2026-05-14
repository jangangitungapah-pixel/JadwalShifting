import { calculateFairnessScore } from './fairness';
import { allShiftTypes } from './dummyData';

export const processQuery = (query, context) => {
  const { employees, shifts, leaves, swapRequests, openShifts } = context;
  const lowerQuery = query.toLowerCase();

  // Keyword matching
  if (lowerQuery.includes('jadwal') && lowerQuery.includes('hari ini')) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayShifts = shifts[dateStr] || {};
    
    let working = 0;
    employees.forEach(emp => {
      if (todayShifts[emp.id] && todayShifts[emp.id] !== 'libur') working++;
    });
    
    return `Hari ini (${dateStr}), ada ${working} karyawan yang bekerja dan ${employees.length - working} yang libur/cuti.`;
  }

  if (lowerQuery.includes('siapa') && lowerQuery.includes('malam') && lowerQuery.includes('hari ini')) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayShifts = shifts[dateStr] || {};
    
    const nightShiftEmps = employees.filter(emp => todayShifts[emp.id] === 'malam');
    if (nightShiftEmps.length === 0) return 'Tidak ada karyawan yang terjadwal shift malam hari ini.';
    return `Karyawan yang shift malam hari ini: ${nightShiftEmps.map(e => e.name).join(', ')}.`;
  }

  if (lowerQuery.includes('cuti') && (lowerQuery.includes('pending') || lowerQuery.includes('menunggu'))) {
    const pendingLeaves = (leaves || []).filter(l => l.status === 'pending');
    if (pendingLeaves.length === 0) return 'Tidak ada pengajuan cuti yang menunggu persetujuan.';
    return `Ada ${pendingLeaves.length} pengajuan cuti yang menunggu persetujuan. Anda bisa mengeceknya di tab Cuti & Izin.`;
  }

  if (lowerQuery.includes('tukar shift') || lowerQuery.includes('swap')) {
    const pendingSwaps = (swapRequests || []).filter(s => s.status === 'pending');
    if (pendingSwaps.length === 0) return 'Tidak ada permintaan tukar shift yang menunggu.';
    return `Ada ${pendingSwaps.length} permintaan tukar shift. Silakan periksa di dashboard atau kalender.`;
  }

  if (lowerQuery.includes('bursa shift') || lowerQuery.includes('open shift')) {
    const open = (openShifts || []).filter(o => o.status === 'open');
    if (open.length === 0) return 'Saat ini tidak ada bursa shift (open shift) yang tersedia.';
    return `Terdapat ${open.length} bursa shift yang masih dibuka. Karyawan bisa mengambil shift tersebut di menu Bursa Shift.`;
  }

  if (lowerQuery.includes('keadilan') || lowerQuery.includes('fairness') || lowerQuery.includes('skor')) {
    const today = new Date();
    const fairness = calculateFairnessScore(employees, shifts, today.getFullYear(), today.getMonth());
    return `Skor keadilan (fairness) bulan ini adalah ${fairness.overallScore}%. ${fairness.overallScore < 50 ? 'Jadwal perlu dirombak agar lebih adil.' : 'Distribusi jadwal cukup baik.'}`;
  }

  if (lowerQuery.includes('bantu') || lowerQuery.includes('help')) {
    return `Saya adalah asisten virtual lokal ShiftSync. Anda dapat bertanya seputar:\n- Jadwal hari ini\n- Siapa shift malam hari ini\n- Jumlah cuti pending\n- Tukar shift\n- Bursa shift / Open shift\n- Skor keadilan`;
  }

  return "Maaf, saya belum mengerti pertanyaan Anda. Coba tanyakan 'jadwal hari ini', 'siapa shift malam hari ini', atau 'bantu'.";
};
