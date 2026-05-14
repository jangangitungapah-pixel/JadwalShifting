import React, { useState } from 'react';
import { Calendar, Users, LayoutDashboard, Settings, FileText, Sparkles, BarChart3, CalendarOff, Sun, Moon, Globe, ClipboardList, Loader, Database, DollarSign, LogOut, HelpCircle } from 'lucide-react';
import { useTranslation } from '../utils/i18n.jsx';
import { sounds } from '../utils/soundService';
import appIconSvg from '/app-icon.svg?url';

const Sidebar = ({ activeTab, setActiveTab, theme, toggleTheme, syncStatus, forceSync, isViewer, isEmployee, onLogout, onStartTutorial }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { lang, setLanguage, t } = useTranslation();

  const menuItems = isEmployee ? [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'calendar', label: t('nav.calendar'), icon: Calendar },
    { id: 'bidding', label: lang === 'en' ? 'Shift Market' : 'Bursa Shift', icon: Sparkles },
    { id: 'leave', label: lang === 'en' ? 'Leave Request' : 'Pengajuan Cuti', icon: CalendarOff },
  ] : [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'calendar', label: t('nav.calendar'), icon: Calendar },
    { id: 'bidding', label: lang === 'en' ? 'Shift Market' : 'Bursa Shift', icon: Sparkles },
    { id: 'employees', label: t('nav.employees'), icon: Users },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'reports', label: t('nav.reports'), icon: FileText },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3 },
    { id: 'leave', label: t('nav.leave'), icon: CalendarOff },
  ];

  const bottomItems = isEmployee ? [] : [
    { id: 'audit', label: lang === 'en' ? 'Audit Log' : 'Audit Log', icon: ClipboardList },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  const NavButton = ({ item, isActive }) => (
    <button
      onClick={() => setActiveTab(item.id)}
      onMouseEnter={() => setHoveredItem(item.id)}
      onMouseLeave={() => setHoveredItem(null)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.85rem', width: '100%', padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        fontSize: '0.88rem', fontWeight: isActive ? '600' : '500', letterSpacing: '-0.01em',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden',
        background: isActive ? 'linear-gradient(135deg, rgba(129, 140, 248, 0.18), rgba(99, 102, 241, 0.12))' : hoveredItem === item.id ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
        color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
        boxShadow: isActive ? 'inset 0 1px 0 rgba(129, 140, 248, 0.15), 0 4px 12px rgba(99, 102, 241, 0.1)' : 'none',
        borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
        transform: hoveredItem === item.id && !isActive ? 'translateX(4px) scale(1.02)' : 'translateX(0) scale(1)',
      }}
    >
      <item.icon size={19} style={{ opacity: isActive ? 1 : 0.7, filter: isActive ? 'drop-shadow(0 0 6px rgba(129, 140, 248, 0.4))' : 'none', transition: 'all 0.3s ease' }} />
      <span>{item.label}</span>
      {isActive && (<div style={{ position: 'absolute', right: '0.75rem', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', boxShadow: '0 0 8px var(--color-primary)', animation: 'breathe 2s ease-in-out infinite' }} />)}
    </button>
  );

  // Mini calendar
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const monthNames = t('time.months').map(m => m.substring(0, 3));

  return (
    <aside className="sidebar glass-heavy animate-slide-left" style={{ margin: '0.75rem', padding: '1.25rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 10, width: '16rem', height: 'calc(100vh - 1.5rem)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-xl), var(--shadow-glow-primary)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, var(--color-primary), var(--color-secondary), transparent)', opacity: 0.5 }} />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', padding: '0.5rem 0.25rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)', animation: 'pulse-glow 4s ease-in-out infinite' }}>
            <img src={appIconSvg} alt="ShiftSync Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.03em', fontFamily: "'Outfit', sans-serif", background: 'linear-gradient(135deg, var(--text-primary), var(--color-primary-hover))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.2 }}>ShiftSync</h1>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Scheduling Pro</p>
          </div>
          {/* Local Sync Status */}
          <button 
            title={syncStatus === 'synced' ? (lang === 'en' ? 'Local DB: Synced (Click to force sync)' : 'Local DB: Tersinkron (Klik untuk paksa sinkronisasi)') : syncStatus === 'syncing' ? (lang === 'en' ? 'Local DB: Syncing...' : 'Local DB: Sinkronisasi...') : (lang === 'en' ? 'Local DB: Offline (Click to retry)' : 'Local DB: Offline (Klik untuk coba lagi)')} 
            onClick={async () => { if (forceSync) { setIsSyncing(true); await forceSync(); setIsSyncing(false); } }}
            disabled={isSyncing || syncStatus === 'syncing'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.55rem', borderRadius: 'var(--radius-full)', background: syncStatus === 'synced' ? 'rgba(52,211,153,0.1)' : syncStatus === 'syncing' ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${syncStatus === 'synced' ? 'rgba(52,211,153,0.25)' : syncStatus === 'syncing' ? 'rgba(251,191,36,0.25)' : 'rgba(248,113,113,0.25)'}`, marginTop: '0.25rem', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {syncStatus === 'synced' && !isSyncing ? <Database size={12} style={{ color: '#34D399' }} /> : (syncStatus === 'syncing' || isSyncing) ? <Loader size={12} style={{ color: '#FBBF24', animation: 'spin 1s linear infinite' }} /> : <Database size={12} style={{ color: '#F87171' }} />}
            <span style={{ fontSize: '0.58rem', fontWeight: '600', color: syncStatus === 'synced' && !isSyncing ? '#34D399' : (syncStatus === 'syncing' || isSyncing) ? '#FBBF24' : '#F87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{syncStatus === 'synced' && !isSyncing ? (lang === 'en' ? 'Synced' : 'Tersinkron') : (syncStatus === 'syncing' || isSyncing) ? (lang === 'en' ? 'Syncing' : 'Sinkronisasi') : 'Offline'}</span>
          </button>
        </div>

        {/* Main Nav */}
        <nav data-tour="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, overflow: 'auto' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.5rem', marginBottom: '0.35rem' }}>Menu</p>
          {menuItems.map((item) => (<NavButton key={item.id} item={item} isActive={activeTab === item.id} />))}

          {/* Mini Calendar */}
          <div style={{ margin: '0.75rem 0', padding: '0.65rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
            <p style={{ fontSize: '0.62rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', textAlign: 'center' }}>{monthNames[today.getMonth()]} {today.getFullYear()}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
              {t('time.days').map((d,i) => (<div key={i} style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1px' }}>{d.charAt(0)}</div>))}
              {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => (<div key={`e${i}`} />))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const isToday = i + 1 === today.getDate();
                return (<div key={i} style={{ fontSize: '0.52rem', textAlign: 'center', padding: '2px', borderRadius: '3px', fontWeight: isToday ? '800' : '400', background: isToday ? 'var(--color-primary)' : 'transparent', color: isToday ? 'white' : 'var(--text-tertiary)' }}>{i + 1}</div>);
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.35rem 0' }} />

        {/* Theme & Lang toggles */}
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.35rem' }}>
          <button onClick={() => { sounds.click(); onStartTutorial && onStartTutorial(); }} onMouseEnter={() => setHoveredItem('help')} onMouseLeave={() => setHoveredItem(null)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', background: hoveredItem === 'help' ? 'var(--color-primary-light)' : 'transparent', cursor: 'pointer', color: 'var(--color-primary)', fontFamily: 'inherit', fontSize: '0.68rem', fontWeight: '600', transition: 'all 0.2s' }}>
            <HelpCircle size={13} /> {lang === 'id' ? 'Tur' : 'Tour'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.35rem' }}>
          <button onClick={toggleTheme} onMouseEnter={() => setHoveredItem('theme')} onMouseLeave={() => setHoveredItem(null)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', background: hoveredItem === 'theme' ? 'var(--bg-card)' : 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', fontFamily: 'inherit', fontSize: '0.68rem', fontWeight: '600', transition: 'all 0.2s' }}>
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button onClick={() => setLanguage(lang === 'id' ? 'en' : 'id')} onMouseEnter={() => setHoveredItem('lang')} onMouseLeave={() => setHoveredItem(null)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', background: hoveredItem === 'lang' ? 'var(--bg-card)' : 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', fontFamily: 'inherit', fontSize: '0.68rem', fontWeight: '600', transition: 'all 0.2s' }}>
            <Globe size={13} /> {lang === 'id' ? 'EN' : 'ID'}
          </button>
        </div>

        {bottomItems.map((item) => (<NavButton key={item.id} item={item} isActive={activeTab === item.id} />))}

        <button onClick={() => { sounds.click(); onLogout(); }} onMouseEnter={() => setHoveredItem('logout')} onMouseLeave={() => setHoveredItem(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid transparent', background: hoveredItem === 'logout' ? 'rgba(248, 113, 113, 0.1)' : 'transparent', cursor: 'pointer', color: hoveredItem === 'logout' ? 'var(--danger)' : 'var(--text-tertiary)', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.2s', marginTop: '0.35rem' }}>
          <LogOut size={16} /> {lang === 'id' ? 'Keluar Akun' : 'Logout'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
