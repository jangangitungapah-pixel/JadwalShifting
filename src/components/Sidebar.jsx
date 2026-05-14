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
      onClick={() => { sounds.click(); setActiveTab(item.id); }}
      onMouseEnter={() => setHoveredItem(item.id)}
      onMouseLeave={() => setHoveredItem(null)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.85rem', width: 'calc(100% - 6px)', padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-full)', border: '1px solid', cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
        fontSize: '0.9rem', fontWeight: isActive ? '700' : '500', letterSpacing: '0.02em',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative', overflow: 'hidden',
        background: isActive ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : hoveredItem === item.id ? 'var(--bg-card-hover)' : 'transparent',
        color: isActive ? 'white' : 'var(--text-secondary)',
        borderColor: isActive ? 'rgba(255,255,255,0.15)' : hoveredItem === item.id ? 'var(--glass-border-hover)' : 'transparent',
        boxShadow: isActive ? '0 12px 24px -6px rgba(99, 102, 241, 0.5), inset 0 2px 4px rgba(255,255,255,0.2)' : hoveredItem === item.id ? '0 4px 12px rgba(0,0,0,0.03)' : 'none',
        transform: isActive ? 'scale(1.02) translateX(3px)' : hoveredItem === item.id ? 'translateX(4px)' : 'translateX(0)',
      }}
    >
      <item.icon size={18} style={{ 
        opacity: isActive ? 1 : hoveredItem === item.id ? 0.9 : 0.6, 
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isActive ? 'scale(1.15)' : hoveredItem === item.id ? 'scale(1.1) rotate(-4deg)' : 'scale(1)'
      }} />
      <span style={{ 
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: hoveredItem === item.id && !isActive ? 'translateX(3px)' : 'translateX(0)' 
      }}>{item.label}</span>
      
      {/* Active Indicator Glow */}
      {isActive && (
        <div style={{ position: 'absolute', right: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 0 12px 3px rgba(255,255,255,0.9)', animation: 'pulse-glow 2s ease-in-out infinite' }} />
        </div>
      )}
      
      {/* Shine effect on hover */}
      {hoveredItem === item.id && !isActive && (
        <div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', transform: 'skewX(-20deg)', transition: 'none', animation: 'shimmer 1.5s infinite' }} />
      )}
    </button>
  );

  // Mini calendar
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const monthNames = t('time.months').map(m => m.substring(0, 3));

  return (
    <aside className="sidebar glass-heavy animate-slide-left" style={{ margin: '1rem', padding: '1.25rem 1rem', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--glass-border)', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 10, width: '16.5rem', height: 'calc(100vh - 2rem)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem', padding: '0.5rem 0.25rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)', animation: 'pulse-glow 4s ease-in-out infinite', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)' }}>
            <img src={appIconSvg} alt="ShiftSync Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: '900', letterSpacing: '-0.03em', fontFamily: "'Outfit', sans-serif", background: 'linear-gradient(135deg, var(--text-primary), var(--color-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>ShiftSync</h1>
            <p style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pro</p>
          </div>
        </div>

        {/* Local Sync Status */}
        <button 
          title={syncStatus === 'synced' ? (lang === 'en' ? 'Local DB: Synced (Click to force sync)' : 'Local DB: Tersinkron (Klik untuk paksa sinkronisasi)') : syncStatus === 'syncing' ? (lang === 'en' ? 'Local DB: Syncing...' : 'Local DB: Sinkronisasi...') : (lang === 'en' ? 'Local DB: Offline (Click to retry)' : 'Local DB: Offline (Klik untuk coba lagi)')} 
          onClick={async () => { if (forceSync) { setIsSyncing(true); await forceSync(); setIsSyncing(false); } }}
          disabled={isSyncing || syncStatus === 'syncing'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem', borderRadius: 'var(--radius-full)', background: syncStatus === 'synced' ? 'rgba(52,211,153,0.1)' : syncStatus === 'syncing' ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${syncStatus === 'synced' ? 'rgba(52,211,153,0.2)' : syncStatus === 'syncing' ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'}`, marginBottom: '1rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", width: '100%', transition: 'all 0.2s' }}
        >
          {syncStatus === 'synced' && !isSyncing ? <Database size={12} style={{ color: '#34D399' }} /> : (syncStatus === 'syncing' || isSyncing) ? <Loader size={12} style={{ color: '#FBBF24', animation: 'spin 1s linear infinite' }} /> : <Database size={12} style={{ color: '#F87171' }} />}
          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: syncStatus === 'synced' && !isSyncing ? '#34D399' : (syncStatus === 'syncing' || isSyncing) ? '#FBBF24' : '#F87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{syncStatus === 'synced' && !isSyncing ? (lang === 'en' ? 'Database Synced' : 'Database Sinkron') : (syncStatus === 'syncing' || isSyncing) ? (lang === 'en' ? 'Syncing...' : 'Sinkronisasi...') : 'Offline'}</span>
        </button>

        {/* Main Nav */}
        <nav data-tour="sidebar-nav" className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, overflowY: 'auto', overflowX: 'visible', paddingRight: '0.5rem', scrollbarWidth: 'thin' }}>
          {menuItems.map((item) => (<NavButton key={item.id} item={item} isActive={activeTab === item.id} />))}

          {/* Mini Calendar Gadget */}
          <div style={{ marginTop: 'auto', padding: '1rem', borderRadius: 'var(--radius-xl)', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>{monthNames[today.getMonth()]} {today.getFullYear()}</span>
              <Calendar size={14} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {t('time.days').map((d,i) => (<div key={i} style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: '600' }}>{d.charAt(0)}</div>))}
              {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => (<div key={`e${i}`} />))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const isToday = i + 1 === today.getDate();
                return (
                  <div key={i} style={{ fontSize: '0.6rem', textAlign: 'center', padding: '4px 0', borderRadius: '6px', fontWeight: isToday ? '800' : '500', background: isToday ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : 'transparent', color: isToday ? 'white' : 'var(--text-secondary)', boxShadow: isToday ? '0 2px 6px rgba(99,102,241,0.4)' : 'none' }}>
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0, marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => { sounds.click(); onStartTutorial && onStartTutorial(); }} onMouseEnter={() => setHoveredItem('help')} onMouseLeave={() => setHoveredItem(null)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', background: hoveredItem === 'help' ? 'var(--bg-card-hover)' : 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", fontSize: '0.7rem', fontWeight: '700', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}>
            <HelpCircle size={14} style={{ color: 'var(--color-primary)' }} /> {lang === 'id' ? 'Tur' : 'Tour'}
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={toggleTheme} onMouseEnter={() => setHoveredItem('theme')} onMouseLeave={() => setHoveredItem(null)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', background: hoveredItem === 'theme' ? 'var(--bg-card-hover)' : 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", fontSize: '0.7rem', fontWeight: '700', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}>
            {theme === 'dark' ? <Sun size={14} style={{ color: '#FBBF24' }} /> : <Moon size={14} style={{ color: '#818CF8' }} />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          
          <button onClick={() => setLanguage(lang === 'id' ? 'en' : 'id')} onMouseEnter={() => setHoveredItem('lang')} onMouseLeave={() => setHoveredItem(null)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', background: hoveredItem === 'lang' ? 'var(--bg-card-hover)' : 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif", fontSize: '0.7rem', fontWeight: '700', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}>
            <Globe size={14} style={{ color: '#34D399' }} /> {lang === 'id' ? 'EN' : 'ID'}
          </button>
        </div>

        {bottomItems.map((item) => (<NavButton key={item.id} item={item} isActive={activeTab === item.id} />))}

        <button onClick={() => { sounds.click(); onLogout(); }} onMouseEnter={() => setHoveredItem('logout')} onMouseLeave={() => setHoveredItem(null)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid transparent', background: hoveredItem === 'logout' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', cursor: 'pointer', color: hoveredItem === 'logout' ? '#EF4444' : 'var(--text-muted)', fontFamily: "'Outfit', sans-serif", fontSize: '0.8rem', fontWeight: '700', transition: 'all 0.2s', marginTop: '0.5rem' }}>
          <LogOut size={16} /> {lang === 'id' ? 'Keluar Akun' : 'Logout'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
