import React, { useState } from 'react';
import { LayoutDashboard, Calendar, Users, FileText, BarChart3, Settings, CalendarOff, Sparkles, DollarSign, ClipboardList, MoreHorizontal, Sun, Moon, Globe, LogOut, X } from 'lucide-react';
import { useTranslation } from '../utils/i18n.jsx';

const MobileNav = ({ activeTab, setActiveTab, theme, toggleTheme, isViewer, isEmployee, onLogout }) => {
  const [showMore, setShowMore] = useState(false);
  const { lang, setLanguage, t } = useTranslation();

  // Primary tabs shown in the bottom bar (max 5 including "More")
  const primaryTabs = isEmployee ? [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'calendar', label: t('nav.calendar'), icon: Calendar },
    { id: 'bidding', label: 'Bursa', icon: Sparkles },
    { id: 'leave', label: 'Cuti', icon: CalendarOff },
  ] : [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'calendar', label: t('nav.calendar'), icon: Calendar },
    { id: 'employees', label: t('nav.employees'), icon: Users },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
  ];

  // Secondary tabs shown in the "More" popup
  const secondaryTabs = isEmployee ? [] : [
    { id: 'bidding', label: lang === 'en' ? 'Shift Market' : 'Bursa Shift', icon: Sparkles },
    { id: 'reports', label: t('nav.reports'), icon: FileText },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3 },
    { id: 'leave', label: t('nav.leave'), icon: CalendarOff },
    { id: 'audit', label: 'Audit Log', icon: ClipboardList },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  const isActiveInMore = secondaryTabs.some(tab => tab.id === activeTab);

  const handleTabClick = (id) => {
    setActiveTab(id);
    setShowMore(false);
  };

  return (
    <>
      {/* Overlay to close the More menu */}
      {showMore && (
        <div 
          className="mobile-more-overlay animate-fade-in"
          onClick={() => setShowMore(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(0,0,0,0.3)' }}
        />
      )}

      {/* More Menu Popup */}
      {showMore && (
        <div className="mobile-more-menu">
          {secondaryTabs.map(tab => (
            <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => handleTabClick(tab.id)}>
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
          
          {/* Theme & Language in More menu */}
          <button onClick={() => { toggleTheme(); }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <button onClick={() => setLanguage(lang === 'id' ? 'en' : 'id')}>
            <Globe size={18} />
            <span>{lang === 'id' ? 'English' : 'Indonesia'}</span>
          </button>
          <button onClick={() => { onLogout(); setShowMore(false); }} style={{ color: 'var(--danger)' }}>
            <LogOut size={18} />
            <span>{lang === 'id' ? 'Keluar' : 'Logout'}</span>
          </button>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        {primaryTabs.map(tab => (
          <button 
            key={tab.id} 
            className={`mobile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <tab.icon size={20} />
            <span>{tab.label}</span>
          </button>
        ))}
        {secondaryTabs.length > 0 && (
          <button 
            className={`mobile-nav-item ${isActiveInMore || showMore ? 'active' : ''}`}
            onClick={() => setShowMore(!showMore)}
          >
            {showMore ? <X size={20} /> : <MoreHorizontal size={20} />}
            <span>{showMore ? (lang === 'id' ? 'Tutup' : 'Close') : (lang === 'id' ? 'Lainnya' : 'More')}</span>
          </button>
        )}
      </nav>
    </>
  );
};

export default MobileNav;
