import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Zap, Calendar, DollarSign, Save, Check, Database, Upload, Download, Trash2, Sun, Moon, Globe, Bell, Lock, Shield, Clock, Plus, X, RotateCcw, Keyboard, Building2, History, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { getVersions, restoreVersion, deleteVersion, saveVersion } from '../utils/versionHistory';
import { keyboardShortcuts } from '../utils/dummyData';

const SettingsView = ({ autoHolidayEnabled, toggleAutoHoliday, cutOffDate, incentiveAmount, holidayIncentiveAmount, spIncentiveAmount, updateSettings, customHolidays, apiHolidays, onAddHoliday, onDeleteHoliday, theme, toggleTheme, departments, updateDepartments, notificationsEnabled, toggleNotifications, shifts, syncStatus, forceSync }) => {
  const [localCutOff, setLocalCutOff] = useState(cutOffDate);
  const [localIncentive, setLocalIncentive] = useState(incentiveAmount);
  const [localHolidayIncentive, setLocalHolidayIncentive] = useState(holidayIncentiveAmount);
  const [localSpIncentive, setLocalSpIncentive] = useState(spIncentiveAmount);
  const [saved, setSaved] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [newDept, setNewDept] = useState('');
  const [loginEnabled, setLoginEnabled] = useState(() => localStorage.getItem('shift_login_enabled') === 'true');
  const [loginPin, setLoginPin] = useState(() => localStorage.getItem('shift_login_pin') || '');
  const [autoBackup, setAutoBackup] = useState(() => localStorage.getItem('shift_auto_backup') !== 'false');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => { if (showVersions) setVersions(getVersions()); }, [showVersions]);

  const handleSave = () => {
    updateSettings(localCutOff, localIncentive, localHolidayIncentive, localSpIncentive);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const handleAddHoliday = () => {
    if (newHolidayDate && newHolidayName) {
      onAddHoliday({ date: newHolidayDate, localName: newHolidayName });
      setNewHolidayDate(''); setNewHolidayName('');
    }
  };

  const handleExport = () => {
    const data = { employees: JSON.parse(localStorage.getItem('shift_employees') || '[]'), shifts: JSON.parse(localStorage.getItem('shift_data') || '{}'), logs: JSON.parse(localStorage.getItem('shift_logs') || '[]'), customHolidays: JSON.parse(localStorage.getItem('shift_custom_holidays') || '[]'), leaves: JSON.parse(localStorage.getItem('shift_leaves') || '[]'), swaps: JSON.parse(localStorage.getItem('shift_swaps') || '[]'), settings: { cutOffDate: localCutOff, incentiveAmount: localIncentive, holidayIncentiveAmount: localHolidayIncentive, spIncentiveAmount: localSpIncentive } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `ShiftSync_Backup_${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };

  const handleRestore = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.employees) localStorage.setItem('shift_employees', JSON.stringify(data.employees));
        if (data.shifts) localStorage.setItem('shift_data', JSON.stringify(data.shifts));
        if (data.logs) localStorage.setItem('shift_logs', JSON.stringify(data.logs));
        if (data.customHolidays) localStorage.setItem('shift_custom_holidays', JSON.stringify(data.customHolidays));
        if (data.leaves) localStorage.setItem('shift_leaves', JSON.stringify(data.leaves));
        if (data.swaps) localStorage.setItem('shift_swaps', JSON.stringify(data.swaps));
        alert('✅ Data berhasil di-restore! Halaman akan di-refresh.'); window.location.reload();
      } catch { alert('❌ File backup tidak valid.'); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  const handleSaveVersion = () => { saveVersion(shifts, `Manual - ${new Date().toLocaleString('id-ID')}`); setVersions(getVersions()); };
  const handleRestoreVersion = (id) => { if (confirm('Kembalikan ke versi ini? Data saat ini akan ditimpa.')) { restoreVersion(id); window.location.reload(); } };
  const handleDeleteVersion = (id) => { deleteVersion(id); setVersions(getVersions()); };

  const handleLoginToggle = () => {
    if (!loginEnabled && !loginPin) { alert('Set PIN terlebih dahulu!'); return; }
    const v = !loginEnabled; setLoginEnabled(v); localStorage.setItem('shift_login_enabled', v.toString());
  };
  const handlePinSave = () => { localStorage.setItem('shift_login_pin', loginPin); alert('PIN disimpan!'); };
  const handleAutoBackupToggle = () => { const v = !autoBackup; setAutoBackup(v); localStorage.setItem('shift_auto_backup', v.toString()); };

  const addDept = () => { if (newDept.trim() && !departments.includes(newDept.trim())) { updateDepartments([...departments, newDept.trim()]); setNewDept(''); } };
  const removeDept = (d) => { if (departments.length > 1) updateDepartments(departments.filter(x => x !== d)); };

  const sectionStyle = { padding: '1.5rem', marginBottom: '1.25rem' };
  const sectionTitle = (icon, text, color) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.15rem' }}>
      <div style={{ padding: '0.45rem', borderRadius: 'var(--radius-md)', background: `${color}15` }}>{icon}</div>
      <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{text}</h3>
    </div>
  );

  const toggleBtn = (active, onClick, label) => (
    <button onClick={onClick} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: '600', border: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--glass-border)'}`, background: active ? 'var(--color-primary-light)' : 'transparent', color: active ? 'var(--color-primary)' : 'var(--text-tertiary)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>{label}</button>
  );

  const allHolidays = [...(apiHolidays || []).filter(h => { const d = new Date(h.date); return d.getFullYear() === new Date().getFullYear(); }), ...customHolidays.map(h => ({ ...h, isCustom: true }))].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={{ padding: '0.5rem' }}>
      <div className="page-header animate-fade-in-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
          <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, var(--color-secondary), var(--color-primary))' }} />
          <h2 className="page-title">Pengaturan</h2>
        </div>
        <p className="page-subtitle" style={{ marginLeft: '1.75rem' }}>Sesuaikan konfigurasi aplikasi ShiftSync Anda.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Theme & Language */}
        <div className="glass-card animate-fade-in-up delay-100" style={sectionStyle}>
          {sectionTitle(<Sun size={18} style={{ color: '#FBBF24' }} />, 'Tampilan', '#FBBF24')}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <button onClick={theme === 'dark' ? undefined : toggleTheme} style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'inherit', border: `2px solid ${theme === 'dark' ? 'var(--color-primary)' : 'var(--glass-border)'}`, background: theme === 'dark' ? 'var(--color-primary-light)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
              <Moon size={24} style={{ color: theme === 'dark' ? 'var(--color-primary)' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: '600', color: theme === 'dark' ? 'var(--color-primary)' : 'var(--text-muted)' }}>Mode Gelap</span>
            </button>
            <button onClick={theme === 'light' ? undefined : toggleTheme} style={{ flex: 1, padding: '1rem', borderRadius: 'var(--radius-lg)', cursor: 'pointer', fontFamily: 'inherit', border: `2px solid ${theme === 'light' ? 'var(--color-primary)' : 'var(--glass-border)'}`, background: theme === 'light' ? 'var(--color-primary-light)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
              <Sun size={24} style={{ color: theme === 'light' ? 'var(--color-primary)' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: '600', color: theme === 'light' ? 'var(--color-primary)' : 'var(--text-muted)' }}>Mode Terang</span>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}><Bell size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />Notifikasi Browser</span>
            {toggleBtn(notificationsEnabled, toggleNotifications, notificationsEnabled ? 'Aktif ✓' : 'Nonaktif')}
          </div>
        </div>

        {/* Incentive Settings */}
        <div className="glass-card animate-fade-in-up delay-200" style={sectionStyle}>
          {sectionTitle(<DollarSign size={18} style={{ color: '#34D399' }} />, 'Pengaturan Insentif', '#34D399')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div><label className="label">Tanggal Cut-Off Bulanan</label><input type="number" className="input" min={1} max={31} value={localCutOff} onChange={e => setLocalCutOff(+e.target.value)} /></div>
            <div><label className="label">Insentif Shift Sore & Malam</label><input type="number" className="input" value={localIncentive} onChange={e => setLocalIncentive(+e.target.value)} /></div>
            <div><label className="label">Insentif Hari Libur Nasional</label><input type="number" className="input" value={localHolidayIncentive} onChange={e => setLocalHolidayIncentive(+e.target.value)} /></div>
            <div><label className="label">Insentif Shift Pengganti (SP)</label><input type="number" className="input" value={localSpIncentive} onChange={e => setLocalSpIncentive(+e.target.value)} /></div>
            <button onClick={handleSave} className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}>{saved ? <><Check size={15} /> Tersimpan!</> : <><Save size={15} /> Simpan</>}</button>
          </div>
        </div>

        {/* Automation */}
        <div className="glass-card animate-fade-in-up delay-300" style={sectionStyle}>
          {sectionTitle(<Zap size={18} style={{ color: '#818CF8' }} />, 'Otomatisasi', '#818CF8')}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.88rem', fontWeight: '600' }}>Auto-Libur Nasional</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Otomatis set libur pada hari libur nasional</p>
            </div>
            {toggleBtn(autoHolidayEnabled, toggleAutoHoliday, autoHolidayEnabled ? 'Aktif ✓' : 'Nonaktif')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.88rem', fontWeight: '600' }}>Auto-Backup</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Backup otomatis setiap 5 menit</p>
            </div>
            {toggleBtn(autoBackup, handleAutoBackupToggle, autoBackup ? 'Aktif ✓' : 'Nonaktif')}
          </div>
        </div>

        {/* Security */}
        <div className="glass-card animate-fade-in-up delay-400" style={sectionStyle}>
          {sectionTitle(<Lock size={18} style={{ color: '#F87171' }} />, 'Keamanan', '#F87171')}
          <div style={{ marginBottom: '1rem' }}>
            <label className="label">PIN Login</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="password" className="input" placeholder="Set PIN..." value={loginPin} onChange={e => setLoginPin(e.target.value)} style={{ maxWidth: '200px' }} />
              <button onClick={handlePinSave} className="btn btn-outline" style={{ fontSize: '0.75rem' }}><Save size={13} /></button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.88rem', fontWeight: '600' }}>Aktifkan Login</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Wajib PIN saat membuka aplikasi</p>
            </div>
            {toggleBtn(loginEnabled, handleLoginToggle, loginEnabled ? 'Aktif ✓' : 'Nonaktif')}
          </div>
        </div>

        {/* Departments */}
        <div className="glass-card animate-fade-in-up delay-500" style={sectionStyle}>
          {sectionTitle(<Building2 size={18} style={{ color: '#22D3EE' }} />, 'Departemen / Cabang', '#22D3EE')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
            {departments.map(d => (
              <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', fontSize: '0.75rem', fontWeight: '600' }}>
                {d}
                {departments.length > 1 && <button onClick={() => removeDept(d)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}><X size={11} /></button>}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="input" placeholder="Nama departemen baru..." value={newDept} onChange={e => setNewDept(e.target.value)} style={{ fontSize: '0.82rem' }} />
            <button onClick={addDept} className="btn btn-outline" style={{ padding: '0.5rem' }}><Plus size={14} /></button>
          </div>
        </div>

        {/* Version History */}
        <div className="glass-card animate-fade-in-up delay-600" style={sectionStyle}>
          {sectionTitle(<History size={18} style={{ color: '#A78BFA' }} />, 'Riwayat Versi', '#A78BFA')}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <button onClick={handleSaveVersion} className="btn btn-outline" style={{ fontSize: '0.75rem' }}><Save size={13} /> Simpan Versi</button>
            <button onClick={() => setShowVersions(!showVersions)} className="btn btn-outline" style={{ fontSize: '0.75rem' }}><History size={13} /> {showVersions ? 'Sembunyikan' : 'Lihat'} ({versions.length || getVersions().length})</button>
          </div>
          {showVersions && (
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {versions.length === 0 ? <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Belum ada versi tersimpan.</p> : versions.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: '600' }}>{v.label}</p>
                    <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{new Date(v.timestamp).toLocaleString('id-ID')}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => handleRestoreVersion(v.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.4rem', fontSize: '0.65rem', color: 'var(--success)' }}><RotateCcw size={11} /></button>
                    <button onClick={() => handleDeleteVersion(v.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.4rem', fontSize: '0.65rem', color: 'var(--danger)' }}><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Holidays — full width */}
      <div className="glass-card animate-fade-in-up delay-300" style={sectionStyle}>
        {sectionTitle(<Calendar size={18} style={{ color: '#F87171' }} />, `Hari Libur Nasional (${allHolidays.length})`, '#F87171')}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input type="date" className="input" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} style={{ colorScheme: 'dark', maxWidth: '180px', fontSize: '0.82rem' }} />
          <input className="input" placeholder="Nama hari libur..." value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} style={{ fontSize: '0.82rem' }} />
          <button onClick={handleAddHoliday} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}><Plus size={14} /> Tambah</button>
        </div>
        <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
          {allHolidays.map(h => (
            <div key={h.date + h.localName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}>
              <div><span style={{ fontSize: '0.78rem', fontWeight: '600' }}>{h.localName}</span><span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{h.date}</span></div>
              {h.isCustom && <button onClick={() => onDeleteHoliday(h.date)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', padding: '0.2rem' }}><Trash2 size={13} /></button>}
            </div>
          ))}
        </div>
      </div>

      {/* Backup & Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="glass-card animate-fade-in-up delay-400" style={sectionStyle}>
          {sectionTitle(<Database size={18} style={{ color: '#34D399' }} />, 'Backup & Restore', '#34D399')}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleExport} className="btn btn-success" style={{ flex: 1 }}><Download size={15} /> Ekspor Data</button>
            <label className="btn btn-outline" style={{ flex: 1, cursor: 'pointer' }}><Upload size={15} /> Restore Data<input type="file" accept=".json" onChange={handleRestore} style={{ display: 'none' }} /></label>
          </div>
        </div>

        <div className="glass-card animate-fade-in-up delay-500" style={sectionStyle}>
          {sectionTitle(<Keyboard size={18} style={{ color: '#818CF8' }} />, 'Pintasan Keyboard', '#818CF8')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {keyboardShortcuts.map(s => (
              <div key={s.keys} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                <kbd style={{ padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', fontSize: '0.72rem', fontWeight: '700', fontFamily: 'monospace' }}>{s.keys}</kbd>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Local Sync — full width */}
      <div className="glass-card animate-fade-in-up delay-300" style={{ ...sectionStyle, border: `1px solid ${syncStatus === 'synced' ? 'rgba(52,211,153,0.2)' : syncStatus === 'syncing' ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
        {sectionTitle(<Database size={18} style={{ color: '#60A5FA' }} />, 'Local Database Sync (SQLite)', '#60A5FA')}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {syncStatus === 'synced' ? <Check size={16} style={{ color: '#34D399' }} /> : syncStatus === 'syncing' ? <RefreshCw size={16} style={{ color: '#FBBF24', animation: 'spin 1s linear infinite' }} /> : <X size={16} style={{ color: '#F87171' }} />}
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: syncStatus === 'synced' ? '#34D399' : syncStatus === 'syncing' ? '#FBBF24' : '#F87171' }}>
              {syncStatus === 'synced' ? 'Tersinkron' : syncStatus === 'syncing' ? 'Sinkronisasi...' : 'Offline / Server Mati'}
            </span>
          </div>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Data disimpan di Local SQLite Server. Perubahan otomatis tersinkron dan bisa diakses dari browser/device lain di jaringan yang sama selama server menyala.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={async () => { if (forceSync) { setIsSyncing(true); await forceSync(); setIsSyncing(false); } }} disabled={isSyncing} className="btn btn-primary" style={{ flex: 1 }}>
            <RefreshCw size={15} style={isSyncing ? { animation: 'spin 1s linear infinite' } : {}} /> {isSyncing ? 'Sinkronisasi...' : 'Force Sync ke Local DB'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card animate-fade-in-up delay-600" style={{ ...sectionStyle, border: '1px solid rgba(248,113,113,0.2)' }}>
        {sectionTitle(<Trash2 size={18} style={{ color: '#F87171' }} />, 'Zona Bahaya', '#F87171')}
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Hapus semua data aplikasi (karyawan, jadwal, log, cuti, pengaturan) dan mulai dari awal. Tindakan ini <strong style={{ color: 'var(--danger)' }}>tidak dapat dibatalkan</strong>.
        </p>
        <button onClick={() => {
          if (confirm('⚠️ PERINGATAN: Semua data akan dihapus permanen!\n\nData yang akan dihapus:\n- Semua karyawan\n- Semua jadwal shift\n- Semua log aktivitas\n- Semua pengajuan cuti\n- Semua pengaturan\n- Riwayat versi\n\nLanjutkan?')) {
            if (confirm('Apakah Anda benar-benar yakin? Ketik OK untuk mengonfirmasi.')) {
              const keysToRemove = ['shift_employees', 'shift_data', 'shift_logs', 'shift_leaves', 'shift_swaps', 'shift_notes', 'shift_custom_holidays', 'shift_templates', 'shift_version_history', 'shift_departments', 'shift_cutoff_date', 'shift_incentive_amount', 'shift_holiday_incentive_amount', 'shift_sp_incentive_amount', 'shift_auto_holiday', 'shift_auto_backup', 'shift_login_enabled', 'shift_login_pin', 'shift_notif', 'shift_lang', 'shift_theme', 'shift_auth', 'shift_role'];
              keysToRemove.forEach(k => localStorage.removeItem(k));
              sessionStorage.clear();
              alert('✅ Semua data berhasil dihapus. Aplikasi akan di-refresh.');
              window.location.reload();
            }
          }
        }} className="btn btn-danger" style={{ width: '100%' }}>
          <Trash2 size={15} /> Reset Semua Data
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
