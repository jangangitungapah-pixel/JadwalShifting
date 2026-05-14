/**
 * Shared payroll/incentive calculation logic.
 * Used by Payroll.jsx, Reports.jsx, and AnalyticsView.jsx
 * to ensure consistent calculations across all modules.
 */

/**
 * Get the date range for a payroll period based on cut-off date.
 * @param {number} year 
 * @param {number} month - 0-indexed month
 * @param {number} cutOffDate - Day of month for cut-off (1-31)
 * @returns {{ startDate: Date, endDate: Date, dates: Date[] }}
 */
export const getPayrollPeriod = (year, month, cutOffDate) => {
  let startDate, endDate;
  
  if (!cutOffDate || cutOffDate >= 28) {
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month + 1, 0);
  } else {
    startDate = new Date(year, month - 1, cutOffDate + 1);
    endDate = new Date(year, month, cutOffDate);
  }

  const dates = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return { startDate, endDate, dates };
};

/**
 * Format a Date to 'YYYY-MM-DD' string.
 */
export const formatDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Calculate payroll data for a single employee over a period.
 * @param {Object} emp - Employee object
 * @param {Object} shifts - All shifts data { 'YYYY-MM-DD': { empId: shiftId } }
 * @param {Date[]} dates - Array of dates to calculate over
 * @param {Object} settings - { incentiveAmount, holidayIncentiveAmount, spIncentiveAmount }
 * @param {Array} holidays - Array of { date: 'YYYY-MM-DD', localName: string }
 * @returns {Object} Calculated payroll data
 */
export const calculateEmployeePayroll = (emp, shifts, dates, settings, holidays) => {
  const { incentiveAmount, holidayIncentiveAmount, spIncentiveAmount } = settings;
  
  let normalShifts = 0;
  let spShifts = 0;
  let normalIncentives = 0;
  let holidayIncentives = 0;
  let spIncentives = 0;
  let soreCount = 0;
  let malamCount = 0;
  let holidayShiftCount = 0;
  const details = [];

  for (const d of dates) {
    const dateStr = formatDateStr(d);
    const shiftId = shifts[dateStr]?.[emp.id];
    if (!shiftId || shiftId === 'libur') continue;

    const isSP = shiftId.includes('sp');
    const isHoliday = holidays.some(h => h.date === dateStr);
    const holidayName = holidays.find(h => h.date === dateStr)?.localName;

    // H+1 check for night shifts
    const tomorrow = new Date(d);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDateStr(tomorrow);
    const isTomorrowHoliday = holidays.some(h => h.date === tomorrowStr);
    const tomorrowHolidayName = holidays.find(h => h.date === tomorrowStr)?.localName;

    if (isSP) spShifts++;
    else normalShifts++;

    // Count shift types
    if (shiftId === 'sore' || shiftId.includes('sore')) soreCount++;
    if (shiftId === 'malam' || shiftId.includes('malam')) malamCount++;

    // Holiday incentive eligibility
    let isEligibleForHolidayIncentive = false;
    let holidayReason = '';
    if (shiftId.includes('malam')) {
      if (isTomorrowHoliday) {
        isEligibleForHolidayIncentive = true;
        holidayReason = tomorrowHolidayName || 'Hari Libur (H+1)';
      }
    } else if (shiftId.includes('pagi') || shiftId.includes('sore')) {
      if (isHoliday) {
        isEligibleForHolidayIncentive = true;
        holidayReason = holidayName || 'Hari Libur';
      }
    }

    if (isEligibleForHolidayIncentive) {
      holidayIncentives += holidayIncentiveAmount;
      holidayShiftCount++;
    }

    // Shift incentives
    if (isSP) {
      spIncentives += spIncentiveAmount;
      if (shiftId.includes('sore')) normalIncentives += incentiveAmount;
      if (shiftId.includes('malam')) normalIncentives += incentiveAmount;
    } else {
      if (shiftId === 'sore' || shiftId === 'malam') {
        normalIncentives += incentiveAmount;
      }
    }

    // Build detail entry
    details.push({
      date: dateStr,
      shiftId,
      isHoliday,
      isTomorrowHoliday,
      holidayReason,
      isEligibleForHolidayIncentive,
      isSP
    });
  }

  // Salary calculation
  const baseSalaryMonthly = emp.projectType === 'new' ? 2800000 : 2300000;
  const fixedAllowance = 700000;
  const materialAllowance = emp.materialAllowance || 0;
  const totalIncentives = normalIncentives + holidayIncentives + spIncentives;
  const totalSalary = baseSalaryMonthly + fixedAllowance + materialAllowance + totalIncentives;

  return {
    ...emp,
    baseSalaryMonthly,
    fixedAllowance,
    materialAllowance,
    normalShifts,
    spShifts,
    soreCount,
    malamCount,
    holidayShiftCount,
    normalIncentives,
    holidayIncentives,
    spIncentives,
    totalIncentives,
    totalSalary,
    details
  };
};

/**
 * Calculate payroll for all employees in a given period.
 */
export const calculateAllPayroll = (employees, shifts, year, month, cutOffDate, settings, holidays) => {
  const { dates } = getPayrollPeriod(year, month, cutOffDate);
  return employees.map(emp => calculateEmployeePayroll(emp, shifts, dates, settings, holidays));
};
