export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  return result;
};

export const sendNotification = (title, body, icon = '⏰') => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(title, { body, icon: '/favicon.svg', badge: '/favicon.svg', tag: 'shiftsync-' + Date.now() }); } catch (e) { console.warn('Notification failed:', e); }
};

export const notifyConflict = (count) => {
  if (count > 0) sendNotification('⚠️ Konflik Jadwal', `Ditemukan ${count} konflik (Malam→Pagi) bulan ini.`);
};

export const notifyScheduleChange = (empName, dateStr, shiftName) => {
  sendNotification('📋 Jadwal Diperbarui', `${empName} pada ${dateStr}: ${shiftName}`);
};

export const notifyLeaveRequest = (empName) => {
  sendNotification('📝 Permintaan Cuti Baru', `${empName} mengajukan cuti/izin.`);
};
