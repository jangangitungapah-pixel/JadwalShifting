import { allShiftTypes } from './dummyData';

export const exportToICS = (employee, shifts, month, year, daysInMonth) => {
  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ShiftSync//EN\n";

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const shiftId = shifts[dateStr]?.[employee.id];
    
    if (shiftId && shiftId !== 'libur') {
      const shiftInfo = allShiftTypes.find(s => s.id === shiftId);
      if (!shiftInfo) continue;

      // Basic parsing of times. format: '08:00 - 16:00'
      const times = shiftInfo.time.split(' - ');
      if (times.length !== 2) continue;
      
      const startStr = times[0].replace(':', '');
      const endStr = times[1].replace(':', '');
      
      const startDate = `${year}${String(month + 1).padStart(2, '0')}${String(i).padStart(2, '0')}T${startStr}00`;
      
      // If it ends the next day (e.g. Malam 00:00 - 08:00)
      let endDay = i;
      let endMonth = month;
      let endYear = year;
      
      if (parseInt(endStr) <= parseInt(startStr)) {
        endDay++;
        // simple leap year check is not necessary since we just add 1 and Date object can handle it
        const nextDay = new Date(year, month, i + 1);
        endDay = nextDay.getDate();
        endMonth = nextDay.getMonth();
        endYear = nextDay.getFullYear();
      }
      
      const endDate = `${endYear}${String(endMonth + 1).padStart(2, '0')}${String(endDay).padStart(2, '0')}T${endStr}00`;

      icsContent += "BEGIN:VEVENT\n";
      icsContent += `DTSTART;TZID=Asia/Jakarta:${startDate}\n`;
      icsContent += `DTEND;TZID=Asia/Jakarta:${endDate}\n`;
      icsContent += `SUMMARY:Shift ${shiftInfo.label}\n`;
      icsContent += `DESCRIPTION:Jadwal shift kerja ShiftSync\n`;
      icsContent += "END:VEVENT\n";
    }
  }

  icsContent += "END:VCALENDAR";

  // Create file download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `Jadwal_${employee.name.replace(/\s+/g, '_')}_${year}_${month + 1}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
