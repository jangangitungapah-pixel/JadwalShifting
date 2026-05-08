import { generateSmartShifts } from './src/utils/generateShift.js';
const employees = [
  { id: '1', name: 'Budi', shiftPattern: 'pagi, pagi, siang ' },
  { id: '2', name: 'Siti', shiftPattern: 'pagi, pagi, libur' },
  { id: '3', name: 'Joko', shiftPattern: 'pagi, pagi, invalid' }
];
console.log(generateSmartShifts(2026, 4, employees));
