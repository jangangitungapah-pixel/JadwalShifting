import { shiftTypes } from './dummyData.js';

/**
 * Generate smart shifts for a given date range and employee list.
 * 
 * @param {Date} startDate - Start date of the range
 * @param {Date} endDate   - End date of the range (inclusive)
 * @param {Array} employees - List of employee objects
 * @param {Array} pattern   - Rotation pattern array, e.g. ['pagi','pagi','sore','sore','malam','malam','libur','libur']
 * @param {Array} holidays  - List of holiday objects with { date: 'YYYY-MM-DD' }
 * @param {boolean} autoHolidayEnabled - Whether to auto-set holidays as 'libur'
 */
export const generateSmartShifts = (startDate, endDate, employees, pattern, holidays = [], autoHolidayEnabled = false) => {
  const shifts = {};
  
  // default shift rotation sequence (fallback)
  const defaultRotation = ['pagi', 'pagi', 'sore', 'sore', 'malam', 'malam', 'libur', 'libur'];

  // Validate the provided pattern
  const validShiftIds = shiftTypes.map(st => st.id);
  const rotation = (pattern && pattern.length > 0 && pattern.every(s => validShiftIds.includes(s)))
    ? pattern
    : defaultRotation;
  
  employees.forEach((emp, empIndex) => {
    // Stagger the starting point so employees don't all share the same shift
    let currentRotationIndex = (empIndex * 2) % rotation.length;
    
    // Iterate from startDate to endDate (inclusive)
    const curr = new Date(startDate);
    while (curr <= endDate) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      
      if (!shifts[dateStr]) {
        shifts[dateStr] = {};
      }
      
      const isHoliday = holidays.some(h => h.date === dateStr);

      if (autoHolidayEnabled && isHoliday) {
        shifts[dateStr][emp.id] = 'libur';
      } else {
        shifts[dateStr][emp.id] = rotation[currentRotationIndex];
      }
      
      // Move to next rotation pattern
      currentRotationIndex = (currentRotationIndex + 1) % rotation.length;

      curr.setDate(curr.getDate() + 1);
    }
  });

  return shifts;
};

/**
 * Detect an employee's position in a pattern by checking existing shifts.
 * Returns the pattern index that corresponds to refDate, or -1 if not found.
 */
const detectPatternPosition = (existingShifts, empId, pattern, refDate) => {
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  // Try each possible starting offset
  for (let offset = 0; offset < pattern.length; offset++) {
    let matches = true;
    const testDate = new Date(refDate);

    // Check up to pattern.length days forward for a match
    for (let i = 0; i < pattern.length; i++) {
      const dateStr = fmt(testDate);
      const actual = existingShifts[dateStr]?.[empId];

      if (actual && actual !== pattern[(offset + i) % pattern.length]) {
        matches = false;
        break;
      }
      testDate.setDate(testDate.getDate() + 1);
    }

    if (matches) return offset;
  }
  return 0; // fallback
};

/**
 * Backfill shifts for days BEFORE a reference date based on existing schedule.
 *
 * @param {Date} fillStartDate - The earliest date to fill
 * @param {Date} refDate       - The reference date (first day with existing shifts)
 * @param {Array} employees    - Target employees
 * @param {Array} pattern      - The rotation pattern
 * @param {Object} existingShifts - Current shifts object
 * @param {Array} holidays     - Holiday list
 * @param {boolean} autoHolidayEnabled
 */
export const backfillShifts = (fillStartDate, refDate, employees, pattern, existingShifts, holidays = [], autoHolidayEnabled = false) => {
  const shifts = {};
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const validShiftIds = shiftTypes.map(st => st.id);
  const rotation = (pattern && pattern.length > 0 && pattern.every(s => validShiftIds.includes(s)))
    ? pattern
    : ['pagi','pagi','sore','sore','malam','malam','libur','libur'];

  employees.forEach((emp) => {
    // Detect where this employee is in the rotation on refDate
    const refPosition = detectPatternPosition(existingShifts, emp.id, rotation, refDate);

    // Calculate how many days back from refDate to fillStartDate
    const daysBetween = Math.ceil((refDate - fillStartDate) / (1000 * 60 * 60 * 24));

    // Fill backwards: for each day before refDate
    for (let daysBack = daysBetween; daysBack >= 1; daysBack--) {
      const fillDate = new Date(refDate);
      fillDate.setDate(fillDate.getDate() - daysBack);
      const dateStr = fmt(fillDate);

      if (!shifts[dateStr]) shifts[dateStr] = {};

      // Calculate the pattern index for this day
      // refDate has index refPosition, so going back `daysBack` days:
      let idx = ((refPosition - daysBack) % rotation.length + rotation.length) % rotation.length;

      const isHoliday = holidays.some(h => h.date === dateStr);
      if (autoHolidayEnabled && isHoliday) {
        shifts[dateStr][emp.id] = 'libur';
      } else {
        shifts[dateStr][emp.id] = rotation[idx];
      }
    }
  });

  return shifts;
};
