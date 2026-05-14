import React, { useState, useEffect, useCallback, useRef } from 'react';
import { syncToApi, subscribeToAllApi, syncAllToApi, loadAllFromApi } from './utils/apiSync';
import { getHolidays } from './utils/holidayService';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import CalendarView from './components/CalendarView';
import SettingsView from './components/Settings';
import Reports from './components/Reports';
import AnalyticsView from './components/AnalyticsView';
import LeaveManagement from './components/LeaveManagement';
import AuditLog from './components/AuditLog';
import LoginGate from './components/LoginGate';
import Payroll from './components/Payroll';
import ShiftBidding from './components/ShiftBidding';
import AIChatbot from './components/AIChatbot';
import { initialEmployees, initialShifts } from './utils/dummyData';
import { createUndoManager } from './utils/undoManager';
import { saveVersion, startAutoBackup, stopAutoBackup } from './utils/versionHistory';
import { requestNotificationPermission, notifyScheduleChange } from './utils/notifications';
import { sounds } from './utils/soundService';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState({});
  const [activityLogs, setActivityLogs] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('shift_theme') || 'dark');
  const [notes, setNotes] = useState(() => { try { return JSON.parse(localStorage.getItem('shift_notes') || '{}'); } catch { return {}; } });
  const [leaves, setLeaves] = useState(() => { try { return JSON.parse(localStorage.getItem('shift_leaves') || '[]'); } catch { return []; } });
  const [swapRequests, setSwapRequests] = useState(() => { try { return JSON.parse(localStorage.getItem('shift_swaps') || '[]'); } catch { return []; } });
  const [openShifts, setOpenShifts] = useState(() => { try { return JSON.parse(localStorage.getItem('shift_open_shifts') || '[]'); } catch { return []; } });
  const [departments, setDepartments] = useState(() => { try { return JSON.parse(localStorage.getItem('shift_departments') || '["Umum"]'); } catch { return ['Umum']; } });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('shift_notif') === 'true');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('shift_gemini_key') || '');
  const [syncStatus, setSyncStatus] = useState('offline'); // 'synced' | 'syncing' | 'offline'
  const firebaseListenerRef = useRef(false); // prevent re-entrant updates

  const [autoHolidayEnabled, setAutoHolidayEnabled] = useState(() => {
    const saved = localStorage.getItem('shift_auto_holiday');
    return saved ? JSON.parse(saved) : false;
  });
  const [cutOffDate, setCutOffDate] = useState(() => {
    const saved = localStorage.getItem('shift_cutoff_date');
    return saved ? parseInt(saved, 10) : 31;
  });
  const [incentiveAmount, setIncentiveAmount] = useState(() => {
    const saved = localStorage.getItem('shift_incentive_amount');
    return saved ? parseInt(saved, 10) : 50000;
  });
  const [holidayIncentiveAmount, setHolidayIncentiveAmount] = useState(() => {
    const saved = localStorage.getItem('shift_holiday_incentive_amount');
    return saved ? parseInt(saved, 10) : 100000;
  });
  const [spIncentiveAmount, setSpIncentiveAmount] = useState(() => {
    const saved = localStorage.getItem('shift_sp_incentive_amount');
    return saved ? parseInt(saved, 10) : 100000;
  });
  const [holidays, setHolidays] = useState([]);
  const [customHolidays, setCustomHolidays] = useState(() => {
    const saved = localStorage.getItem('shift_custom_holidays');
    return saved ? JSON.parse(saved) : [];
  });

  // Undo manager
  const undoRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('shift_theme', theme);
  }, [theme]);

  // Initialize data
  useEffect(() => {
    const storedEmployees = localStorage.getItem('shift_employees');
    const storedShifts = localStorage.getItem('shift_data');
    const storedLogs = localStorage.getItem('shift_logs');

    const emps = storedEmployees ? JSON.parse(storedEmployees) : initialEmployees;
    const shts = storedShifts ? JSON.parse(storedShifts) : initialShifts;

    setEmployees(emps);
    setShifts(shts);
    if (!storedEmployees) localStorage.setItem('shift_employees', JSON.stringify(initialEmployees));
    if (!storedShifts) localStorage.setItem('shift_data', JSON.stringify(initialShifts));
    if (storedLogs) setActivityLogs(JSON.parse(storedLogs));

    // Initialize undo manager
    undoRef.current = createUndoManager(shts);

    // Fetch holidays from the new service
    getHolidays().then(data => setHolidays(data));

    // Auto-backup
    const autoBackupEnabled = localStorage.getItem('shift_auto_backup') !== 'false';
    if (autoBackupEnabled) {
      startAutoBackup(() => {
        try { return JSON.parse(localStorage.getItem('shift_data') || '{}'); } catch { return {}; }
      }, 300000);
    }

    // Request notifications
    if (localStorage.getItem('shift_notif') === 'true') requestNotificationPermission();

    // Local SQLite Sync via API
    setSyncStatus('syncing');
    loadAllFromApi().then(cloud => {
      if (cloud) {
        firebaseListenerRef.current = true;
        if (cloud.employees) { setEmployees(cloud.employees); localStorage.setItem('shift_employees', JSON.stringify(cloud.employees)); }
        if (cloud.shifts) { setShifts(cloud.shifts); localStorage.setItem('shift_data', JSON.stringify(cloud.shifts)); if (undoRef.current) undoRef.current = createUndoManager(cloud.shifts); }
        if (cloud.logs) { setActivityLogs(cloud.logs); localStorage.setItem('shift_logs', JSON.stringify(cloud.logs)); }
        if (cloud.notes) { setNotes(cloud.notes); localStorage.setItem('shift_notes', JSON.stringify(cloud.notes)); }
        if (cloud.leaves) { setLeaves(cloud.leaves); localStorage.setItem('shift_leaves', JSON.stringify(cloud.leaves)); }
        if (cloud.swaps) { setSwapRequests(cloud.swaps); localStorage.setItem('shift_swaps', JSON.stringify(cloud.swaps)); }
        if (cloud.openShifts) { setOpenShifts(cloud.openShifts); localStorage.setItem('shift_open_shifts', JSON.stringify(cloud.openShifts)); }
        if (cloud.departments) { setDepartments(cloud.departments); localStorage.setItem('shift_departments', JSON.stringify(cloud.departments)); }
        if (cloud.customHolidays) { setCustomHolidays(cloud.customHolidays); localStorage.setItem('shift_custom_holidays', JSON.stringify(cloud.customHolidays)); }
        if (cloud.settings) {
          if (cloud.settings.cutOffDate != null) { setCutOffDate(cloud.settings.cutOffDate); localStorage.setItem('shift_cutoff_date', cloud.settings.cutOffDate); }
          if (cloud.settings.incentiveAmount != null) { setIncentiveAmount(cloud.settings.incentiveAmount); localStorage.setItem('shift_incentive_amount', cloud.settings.incentiveAmount); }
          if (cloud.settings.holidayIncentiveAmount != null) { setHolidayIncentiveAmount(cloud.settings.holidayIncentiveAmount); localStorage.setItem('shift_holiday_incentive_amount', cloud.settings.holidayIncentiveAmount); }
          if (cloud.settings.spIncentiveAmount != null) { setSpIncentiveAmount(cloud.settings.spIncentiveAmount); localStorage.setItem('shift_sp_incentive_amount', cloud.settings.spIncentiveAmount); }
          if (cloud.settings.autoHolidayEnabled != null) { setAutoHolidayEnabled(cloud.settings.autoHolidayEnabled); localStorage.setItem('shift_auto_holiday', JSON.stringify(cloud.settings.autoHolidayEnabled)); }
        }
        setTimeout(() => { firebaseListenerRef.current = false; }, 500);
      }
      setSyncStatus('synced');
    }).catch(() => setSyncStatus('offline'));

    // Polling listener for multi-browser sync
    const unsub = subscribeToAllApi((cloud) => {
        if (!cloud || firebaseListenerRef.current) return;
        firebaseListenerRef.current = true;
        if (cloud.employees) { setEmployees(cloud.employees); localStorage.setItem('shift_employees', JSON.stringify(cloud.employees)); }
        if (cloud.shifts) { setShifts(cloud.shifts); localStorage.setItem('shift_data', JSON.stringify(cloud.shifts)); }
        if (cloud.logs) { setActivityLogs(cloud.logs); localStorage.setItem('shift_logs', JSON.stringify(cloud.logs)); }
        if (cloud.notes) { setNotes(cloud.notes); localStorage.setItem('shift_notes', JSON.stringify(cloud.notes)); }
        if (cloud.leaves) { setLeaves(cloud.leaves); localStorage.setItem('shift_leaves', JSON.stringify(cloud.leaves)); }
        if (cloud.swaps) { setSwapRequests(cloud.swaps); localStorage.setItem('shift_swaps', JSON.stringify(cloud.swaps)); }
        if (cloud.openShifts) { setOpenShifts(cloud.openShifts); localStorage.setItem('shift_open_shifts', JSON.stringify(cloud.openShifts)); }
        if (cloud.departments) { setDepartments(cloud.departments); localStorage.setItem('shift_departments', JSON.stringify(cloud.departments)); }
        if (cloud.customHolidays) { setCustomHolidays(cloud.customHolidays); localStorage.setItem('shift_custom_holidays', JSON.stringify(cloud.customHolidays)); }
        if (cloud.settings) {
          if (cloud.settings.cutOffDate != null) setCutOffDate(cloud.settings.cutOffDate);
          if (cloud.settings.incentiveAmount != null) setIncentiveAmount(cloud.settings.incentiveAmount);
          if (cloud.settings.holidayIncentiveAmount != null) setHolidayIncentiveAmount(cloud.settings.holidayIncentiveAmount);
          if (cloud.settings.spIncentiveAmount != null) setSpIncentiveAmount(cloud.settings.spIncentiveAmount);
          if (cloud.settings.autoHolidayEnabled != null) setAutoHolidayEnabled(cloud.settings.autoHolidayEnabled);
        }
        setSyncStatus('synced');
        setTimeout(() => { firebaseListenerRef.current = false; }, 500);
      });

    return () => { stopAutoBackup(); unsub(); };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo(); }
      else if (e.ctrlKey && e.key === 'y') { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shifts]);

  // Global UI Sounds
  useEffect(() => {
    const handleGlobalClick = (e) => {
      sounds.init();
      const target = e.target.closest('button, a, .clickable, .btn, .btn-icon, [role="button"]');
      if (target) sounds.click();
    };
    const handleGlobalHover = (e) => {
      const target = e.target.closest('button, a, .btn, .btn-icon, .nav-item');
      if (target && !target.dataset.hovered) {
        target.dataset.hovered = 'true';
        sounds.hover();
        target.addEventListener('mouseleave', () => {
          target.dataset.hovered = '';
        }, { once: true });
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('mouseover', handleGlobalHover);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('mouseover', handleGlobalHover);
    };
  }, []);

  const allHolidays = [
    ...holidays,
    ...customHolidays.map(h => ({ date: h.date, localName: h.localName, name: h.localName, isCustom: true }))
  ];

  // Sync helper — syncs a specific path
  const apiSyncPath = (path, data) => {
    firebaseListenerRef.current = true;
    syncToApi(path, data).finally(() => {
      setTimeout(() => { firebaseListenerRef.current = false; }, 300);
    });
  };

  // Force sync all data to API
  const forceSync = async () => {
    setSyncStatus('syncing');
    firebaseListenerRef.current = true;
    const allData = {
      employees, shifts, logs: activityLogs, notes, leaves, swaps: swapRequests, openShifts,
      departments, customHolidays,
      settings: { cutOffDate, incentiveAmount, holidayIncentiveAmount, spIncentiveAmount, autoHolidayEnabled }
    };
    const ok = await syncAllToApi(allData);
    setSyncStatus(ok ? 'synced' : 'offline');
    setTimeout(() => { firebaseListenerRef.current = false; }, 500);
  };

  const addLog = (message) => {
    const newLog = { id: Date.now().toString(), message, timestamp: new Date().toISOString() };
    const updatedLogs = [newLog, ...activityLogs].slice(0, 100);
    setActivityLogs(updatedLogs);
    localStorage.setItem('shift_logs', JSON.stringify(updatedLogs));
    apiSyncPath('logs', updatedLogs);
  };

  const toggleAutoHoliday = () => {
    const newVal = !autoHolidayEnabled;
    setAutoHolidayEnabled(newVal);
    localStorage.setItem('shift_auto_holiday', JSON.stringify(newVal));
    apiSyncPath('settings/autoHolidayEnabled', newVal);
    addLog(`Fitur Auto-Libur Nasional ${newVal ? 'diaktifkan' : 'dinonaktifkan'}`);
  };

  const updateSettings = (newCutOff, newIncentive, newHolidayIncentive, newSpIncentive) => {
    setCutOffDate(newCutOff); setIncentiveAmount(newIncentive);
    setHolidayIncentiveAmount(newHolidayIncentive); setSpIncentiveAmount(newSpIncentive);
    localStorage.setItem('shift_cutoff_date', newCutOff);
    localStorage.setItem('shift_incentive_amount', newIncentive);
    localStorage.setItem('shift_holiday_incentive_amount', newHolidayIncentive);
    localStorage.setItem('shift_sp_incentive_amount', newSpIncentive);
    apiSyncPath('settings', { cutOffDate: newCutOff, incentiveAmount: newIncentive, holidayIncentiveAmount: newHolidayIncentive, spIncentiveAmount: newSpIncentive, autoHolidayEnabled });
    addLog(`Pengaturan insentif & cut-off diperbarui`);
  };

  const addCustomHoliday = (holiday) => {
    const updated = [...customHolidays, holiday];
    setCustomHolidays(updated);
    localStorage.setItem('shift_custom_holidays', JSON.stringify(updated));
    apiSyncPath('customHolidays', updated);
    addLog(`Hari libur manual ditambahkan: ${holiday.localName} (${holiday.date})`);
  };

  const deleteCustomHoliday = (date) => {
    const updated = customHolidays.filter(h => h.date !== date);
    setCustomHolidays(updated);
    localStorage.setItem('shift_custom_holidays', JSON.stringify(updated));
    apiSyncPath('customHolidays', updated);
    addLog(`Hari libur manual dihapus: ${date}`);
  };

  // Shift update with undo support
  const updateShift = (dateStr, empId, newShiftId) => {
    const updatedShifts = { ...shifts };
    if (!updatedShifts[dateStr]) updatedShifts[dateStr] = {};
    if (newShiftId) updatedShifts[dateStr][empId] = newShiftId;
    else delete updatedShifts[dateStr][empId];

    setShifts(updatedShifts);
    localStorage.setItem('shift_data', JSON.stringify(updatedShifts));
    apiSyncPath('shifts', updatedShifts);
    if (undoRef.current) {
      const state = undoRef.current.pushState(updatedShifts);
      setCanUndo(state.canUndo); setCanRedo(state.canRedo);
    }
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      const shiftName = newShiftId ? `shift ${newShiftId}` : 'dihapus';
      addLog(`Jadwal ${emp.name} pada ${dateStr} diubah menjadi ${shiftName}`);
      if (notificationsEnabled) notifyScheduleChange(emp.name, dateStr, shiftName);
    }
  };

  // Notes
  const updateNote = (dateStr, empId, note) => {
    const key = `${dateStr}_${empId}`;
    const updated = { ...notes };
    if (note) updated[key] = note; else delete updated[key];
    setNotes(updated);
    localStorage.setItem('shift_notes', JSON.stringify(updated));
    apiSyncPath('notes', updated);
  };

  // Undo/Redo
  const handleUndo = () => {
    if (!undoRef.current) return;
    const state = undoRef.current.undo();
    setShifts(state.current); setCanUndo(state.canUndo); setCanRedo(state.canRedo);
    localStorage.setItem('shift_data', JSON.stringify(state.current));
    apiSyncPath('shifts', state.current);
    addLog('Undo: Jadwal dikembalikan ke versi sebelumnya');
  };
  const handleRedo = () => {
    if (!undoRef.current) return;
    const state = undoRef.current.redo();
    setShifts(state.current); setCanUndo(state.canUndo); setCanRedo(state.canRedo);
    localStorage.setItem('shift_data', JSON.stringify(state.current));
    apiSyncPath('shifts', state.current);
    addLog('Redo: Jadwal dikembalikan ke versi berikutnya');
  };

  // Employee CRUD
  const addEmployee = (emp) => {
    const newEmp = { ...emp, id: Date.now().toString(), avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`, phone: emp.phone || '', email: emp.email || '', joinDate: emp.joinDate || '', department: emp.department || 'Umum', constraints: emp.constraints || {}, preferences: emp.preferences || {} };
    const updated = [...employees, newEmp];
    setEmployees(updated); localStorage.setItem('shift_employees', JSON.stringify(updated));
    apiSyncPath('employees', updated);
    addLog(`Karyawan baru ditambahkan: ${emp.name}`);
  };
  const editEmployee = (emp) => {
    const updated = employees.map(e => e.id === emp.id ? { ...e, ...emp } : e);
    setEmployees(updated); localStorage.setItem('shift_employees', JSON.stringify(updated));
    apiSyncPath('employees', updated);
    addLog(`Data karyawan diubah: ${emp.name}`);
  };
  const deleteEmployee = (id) => {
    const emp = employees.find(e => e.id === id);
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated); localStorage.setItem('shift_employees', JSON.stringify(updated));
    apiSyncPath('employees', updated);
    if (emp) addLog(`Karyawan dihapus: ${emp.name}`);
  };

  // Batch shifts with undo
  const setBatchShifts = (newShifts) => {
    setShifts(newShifts); localStorage.setItem('shift_data', JSON.stringify(newShifts));
    apiSyncPath('shifts', newShifts);
    if (undoRef.current) {
      const state = undoRef.current.pushState(newShifts);
      setCanUndo(state.canUndo); setCanRedo(state.canRedo);
    }
    addLog(`Jadwal di-generate ulang secara otomatis`);
  };

  // Leave management
  const addLeave = (leave) => {
    const updated = [...leaves, leave];
    setLeaves(updated); localStorage.setItem('shift_leaves', JSON.stringify(updated));
    apiSyncPath('leaves', updated);
    addLog(`Pengajuan cuti: ${leave.empName} (${leave.type})`);
  };
  const updateLeave = (leave) => {
    const updated = leaves.map(l => l.id === leave.id ? leave : l);
    setLeaves(updated); localStorage.setItem('shift_leaves', JSON.stringify(updated));
    apiSyncPath('leaves', updated);
    addLog(`Status cuti ${leave.empName}: ${leave.status}`);
  };

  // Swap requests
  const addSwapRequest = (req) => {
    const updated = [...swapRequests, req];
    setSwapRequests(updated); localStorage.setItem('shift_swaps', JSON.stringify(updated));
    apiSyncPath('swaps', updated);
    addLog(`Permintaan tukar shift: ${req.fromName} ↔ ${req.toName}`);
  };
  const resolveSwap = (id, status) => {
    const updated = swapRequests.map(r => r.id === id ? { ...r, status } : r);
    setSwapRequests(updated); localStorage.setItem('shift_swaps', JSON.stringify(updated));
    apiSyncPath('swaps', updated);
    if (status === 'approved') {
      const req = swapRequests.find(r => r.id === id);
      if (req) {
        const newShifts = { ...shifts };
        if (newShifts[req.dateStr]) {
          newShifts[req.dateStr][req.fromEmpId] = req.toShift;
          newShifts[req.dateStr][req.toEmpId] = req.fromShift;
          setBatchShifts(newShifts);
        }
        addLog(`Tukar shift disetujui: ${req.fromName} ↔ ${req.toName} pada ${req.dateStr}`);
      }
    }
  };

  // Open Shifts (Bidding)
  const addOpenShift = (openShift) => {
    const updated = [...openShifts, openShift];
    setOpenShifts(updated); localStorage.setItem('shift_open_shifts', JSON.stringify(updated));
    apiSyncPath('openShifts', updated);
    addLog(`Bursa shift dibuka: ${openShift.dateStr} (${openShift.shiftId})`);
  };
  const updateOpenShift = (openShift) => {
    const updated = openShifts.map(s => s.id === openShift.id ? openShift : s);
    setOpenShifts(updated); localStorage.setItem('shift_open_shifts', JSON.stringify(updated));
    apiSyncPath('openShifts', updated);
  };
  const removeOpenShift = (id) => {
    const updated = openShifts.filter(s => s.id !== id);
    setOpenShifts(updated); localStorage.setItem('shift_open_shifts', JSON.stringify(updated));
    apiSyncPath('openShifts', updated);
  };


  // Theme & departments
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const updateDepartments = (deps) => { setDepartments(deps); localStorage.setItem('shift_departments', JSON.stringify(deps)); apiSyncPath('departments', deps); };
  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const result = await requestNotificationPermission();
      if (result === 'granted') { setNotificationsEnabled(true); localStorage.setItem('shift_notif', 'true'); }
    } else { setNotificationsEnabled(false); localStorage.setItem('shift_notif', 'false'); }
  };

  const isViewer = sessionStorage.getItem('shift_role') === 'viewer';
  const isEmployee = sessionStorage.getItem('shift_role') === 'employee';
  const currentEmployeeId = sessionStorage.getItem('shift_employee_id');

  const handleLogout = () => {
    sessionStorage.setItem('shift_auth', 'false');
    sessionStorage.removeItem('shift_role');
    sessionStorage.removeItem('shift_employee_id');
    window.location.href = window.location.pathname;
  };

  return (
    <LoginGate employees={employees}>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} toggleTheme={toggleTheme} syncStatus={syncStatus} forceSync={forceSync} isViewer={isViewer} isEmployee={isEmployee} onLogout={handleLogout} />
        <main style={{ flex: 1, marginLeft: '17.5rem', overflowY: 'auto', position: 'relative', padding: '1.25rem' }}>
          <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
          <div key={activeTab} className="animate-fade-in-up" style={{ position: 'relative', zIndex: 1, height: '100%' }}>
            {activeTab === 'dashboard' && <Dashboard employees={employees} shifts={shifts} activityLogs={activityLogs} leaves={leaves} swapRequests={swapRequests} isEmployee={isEmployee} currentEmployeeId={currentEmployeeId} />}
            {activeTab === 'employees' && <EmployeeList employees={employees} onAdd={addEmployee} onEdit={editEmployee} onDelete={deleteEmployee} shifts={shifts} departments={departments} isViewer={isViewer} isEmployee={isEmployee} currentEmployeeId={currentEmployeeId} />}
            {activeTab === 'calendar' && <CalendarView employees={employees} shifts={shifts} updateShift={updateShift} setBatchShifts={setBatchShifts} autoHolidayEnabled={autoHolidayEnabled} holidays={allHolidays} canUndo={canUndo} canRedo={canRedo} onUndo={handleUndo} onRedo={handleRedo} notes={notes} updateNote={updateNote} swapRequests={swapRequests} onAddSwapRequest={addSwapRequest} onResolveSwap={resolveSwap} isViewer={isViewer} isEmployee={isEmployee} currentEmployeeId={currentEmployeeId} />}
            {activeTab === 'bidding' && <ShiftBidding employees={employees} shifts={shifts} openShifts={openShifts} addOpenShift={addOpenShift} updateOpenShift={updateOpenShift} removeOpenShift={removeOpenShift} isEmployee={isEmployee} currentEmployeeId={currentEmployeeId} updateShift={updateShift} />}
            {activeTab === 'payroll' && <Payroll employees={employees} shifts={shifts} cutOffDate={cutOffDate} incentiveAmount={incentiveAmount} holidayIncentiveAmount={holidayIncentiveAmount} spIncentiveAmount={spIncentiveAmount} holidays={allHolidays} />}
            {activeTab === 'reports' && <Reports employees={employees} shifts={shifts} cutOffDate={cutOffDate} incentiveAmount={incentiveAmount} holidayIncentiveAmount={holidayIncentiveAmount} spIncentiveAmount={spIncentiveAmount} holidays={allHolidays} />}
            {activeTab === 'analytics' && <AnalyticsView employees={employees} shifts={shifts} cutOffDate={cutOffDate} incentiveAmount={incentiveAmount} holidayIncentiveAmount={holidayIncentiveAmount} spIncentiveAmount={spIncentiveAmount} holidays={allHolidays} />}
            {activeTab === 'leave' && <LeaveManagement employees={employees} leaves={leaves} onAddLeave={addLeave} onUpdateLeave={updateLeave} shifts={shifts} setBatchShifts={setBatchShifts} />}
            {activeTab === 'audit' && <AuditLog logs={activityLogs} />}
            {activeTab === 'settings' && <SettingsView autoHolidayEnabled={autoHolidayEnabled} toggleAutoHoliday={toggleAutoHoliday} cutOffDate={cutOffDate} incentiveAmount={incentiveAmount} holidayIncentiveAmount={holidayIncentiveAmount} spIncentiveAmount={spIncentiveAmount} updateSettings={updateSettings} allHolidays={allHolidays} onAddHoliday={addCustomHoliday} onDeleteHoliday={deleteCustomHoliday} theme={theme} toggleTheme={toggleTheme} departments={departments} updateDepartments={updateDepartments} notificationsEnabled={notificationsEnabled} toggleNotifications={toggleNotifications} shifts={shifts} syncStatus={syncStatus} forceSync={forceSync} geminiApiKey={geminiApiKey} setGeminiApiKey={setGeminiApiKey} />}
          </div>
        </main>
      </div>
      <AIChatbot context={{ employees, shifts, leaves, swapRequests, openShifts, geminiApiKey }} />
    </LoginGate>
  );
}

export default App;
