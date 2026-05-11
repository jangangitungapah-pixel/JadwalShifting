export const initialEmployees = [];

export const shiftTypes = [
  { id: 'pagi', label: 'Pagi', shortLabel: 'P', time: '08:00 - 16:00', colorClass: 'shift-pagi', hours: 8 },
  { id: 'sore', label: 'Sore', shortLabel: 'S', time: '16:00 - 00:00', colorClass: 'shift-sore', hours: 8 },
  { id: 'malam', label: 'Malam', shortLabel: 'M', time: '00:00 - 08:00', colorClass: 'shift-malam', hours: 8 },
  { id: 'libur', label: 'Libur', shortLabel: 'L', time: 'Off', colorClass: 'shift-libur', hours: 0 }
];

export const longShiftTypes = [
  { id: 'sp-pagi-sore', label: 'SP Pagi + Sore', shortLabel: 'SP/P + S', time: '08:00 - 00:00', colorClass: 'shift-sp-pagi-sore', desc: 'Shift Pengganti Pagi + Sore', hours: 16 },
  { id: 'pagi-sp-sore', label: 'Pagi + SP Sore', shortLabel: 'P + SP/S', time: '08:00 - 00:00', colorClass: 'shift-pagi-sp-sore', desc: 'Pagi + Shift Pengganti Sore', hours: 16 },
  { id: 'sp-sore-malam', label: 'SP Sore + Malam', shortLabel: 'SP/S + M', time: '16:00 - 08:00', colorClass: 'shift-sp-sore-malam', desc: 'Shift Pengganti Sore + Malam', hours: 16 },
  { id: 'sore-sp-malam', label: 'Sore + SP Malam', shortLabel: 'S + SP/M', time: '16:00 - 08:00', colorClass: 'shift-sore-sp-malam', desc: 'Sore + Shift Pengganti Malam', hours: 16 },
];

export const allShiftTypes = [...shiftTypes, ...longShiftTypes];
export const initialShifts = {};

// Leave types
export const leaveTypes = [
  { id: 'annual', label: 'Cuti Tahunan', color: '#60A5FA', maxDays: 12 },
  { id: 'sick', label: 'Sakit', color: '#F87171', maxDays: 14 },
  { id: 'personal', label: 'Izin Pribadi', color: '#FBBF24', maxDays: 3 },
  { id: 'other', label: 'Lainnya', color: '#A78BFA', maxDays: 5 },
];

// Default employee constraints
export const defaultConstraints = {
  maxConsecutiveNights: 3,
  minRestHours: 8,
  blockedDays: [],
  blockedShifts: [],
  preferredShifts: [],
};

// Template presets
export const defaultTemplates = [
  { id: 'default-2-2-2-2', name: '2-2-2-2 Standard', pattern: ['pagi','pagi','sore','sore','malam','malam','libur','libur'], isDefault: true },
  { id: 'default-5-day', name: '5 Hari Kerja', pattern: ['pagi','pagi','pagi','pagi','pagi','libur','libur'], isDefault: true },
  { id: 'default-3-3-1', name: '3-3-1 Rotasi', pattern: ['pagi','pagi','pagi','sore','sore','sore','libur'], isDefault: true },
];

// Keyboard shortcuts reference
export const keyboardShortcuts = [
  { keys: 'Ctrl+Z', action: 'Undo perubahan terakhir' },
  { keys: 'Ctrl+Y', action: 'Redo perubahan' },
  { keys: 'Ctrl+S', action: 'Simpan pengaturan' },
  { keys: 'Ctrl+E', action: 'Ekspor Excel' },
];
