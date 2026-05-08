import React, { useMemo } from 'react';
import { Users, CalendarCheck, CalendarOff as CalendarX, AlertTriangle, Clock, Shield, TrendingUp, Zap, ArrowLeftRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { calculateFairnessScore } from '../utils/fairness';
import { allShiftTypes } from '../utils/dummyData';

const COLORS = ['#60A5FA', '#FBBF24', '#A78BFA', '#F87171', '#2DD4BF', '#F472B6'];

const Dashboard = ({ employees, shifts, activityLogs, leaves, swapRequests }) => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const ms = String(month + 1).padStart(2, '0');

  // Today stats
  const todayShifts = shifts[todayStr] || {};
  const working = employees.filter(e => todayShifts[e.id] && todayShifts[e.id] !== 'libur').length;
  const off = employees.length - working;
  const longShiftToday = employees.filter(e => todayShifts[e.id]?.includes('sp')).length;

  // Monthly stats
  const monthlyStats = useMemo(() => {
    let conflicts = 0, spCount = 0;
    employees.forEach(emp => {
      for (let i = 1; i < daysInMonth; i++) {
        const d1 = `${year}-${ms}-${String(i).padStart(2, '0')}`;
        const d2 = `${year}-${ms}-${String(i + 1).padStart(2, '0')}`;
        if (shifts[d1]?.[emp.id] === 'malam' && shifts[d2]?.[emp.id] === 'pagi') conflicts++;
      }
      for (let i = 1; i <= daysInMonth; i++) {
        const ds = `${year}-${ms}-${String(i).padStart(2, '0')}`;
        if (shifts[ds]?.[emp.id]?.includes('sp')) spCount++;
      }
    });
    return { conflicts, spCount };
  }, [employees, shifts, year, month, daysInMonth, ms]);

  // Shift distribution for pie chart
  const shiftDistribution = useMemo(() => {
    let p = 0, s = 0, m = 0, l = 0, sp = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const ds = `${year}-${ms}-${String(i).padStart(2, '0')}`;
      Object.values(shifts[ds] || {}).forEach(sh => {
        if (sh === 'pagi') p++; else if (sh === 'sore') s++; else if (sh === 'malam') m++;
        else if (sh === 'libur') l++; else if (sh?.includes('sp')) sp++;
      });
    }
    return [{ name: 'Pagi', value: p }, { name: 'Sore', value: s }, { name: 'Malam', value: m }, { name: 'Libur', value: l }, { name: 'SP', value: sp }].filter(x => x.value > 0);
  }, [shifts, year, month, daysInMonth, ms]);

  // Fairness
  const fairness = useMemo(() => calculateFairnessScore(employees, shifts, year, month), [employees, shifts, year, month]);

  // Pending items
  const pendingLeaves = (leaves || []).filter(l => l.status === 'pending').length;
  const pendingSwaps = (swapRequests || []).filter(r => r.status === 'pending').length;

  const statCards = [
    { label: 'Total Karyawan', value: employees.length, icon: Users, color: '#818CF8', bg: 'var(--color-primary-light)', glow: 'var(--color-primary-glow)' },
    { label: 'Kerja Hari Ini', value: working, icon: CalendarCheck, color: '#34D399', bg: 'var(--success-bg)', glow: 'rgba(52,211,153,0.15)' },
    { label: 'Libur Hari Ini', value: off, icon: CalendarX, color: '#F87171', bg: 'var(--danger-bg)', glow: 'rgba(248,113,113,0.15)' },
    { label: 'Long Shift Bulan Ini', value: monthlyStats.spCount, icon: Shield, color: '#F472B6', bg: 'var(--color-accent-glow)', glow: 'rgba(244,114,182,0.15)' },
  ];

  const formatTime = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
    return `${Math.floor(diff / 86400000)} hari lalu`;
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      <div className="page-header animate-fade-in-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
          <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, var(--color-primary), var(--color-secondary))', boxShadow: '0 0 12px rgba(129,140,248,0.2)' }} />
          <h2 className="page-title">Dashboard Overview</h2>
        </div>
        <p className="page-subtitle" style={{ marginLeft: '1.75rem' }}>Selamat datang kembali! Berikut ringkasan jadwal hari ini.</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {statCards.map((card, i) => (
          <div key={i} className={`glass-card animate-fade-in-up delay-${(i + 1) * 100}`} style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: card.glow, filter: 'blur(20px)' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '0.5rem' }}>{card.label}</p>
                <p style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.04em', background: `linear-gradient(135deg, ${card.color}, var(--text-primary))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{card.value}</p>
              </div>
              <div style={{ padding: '0.65rem', borderRadius: 'var(--radius-lg)', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={22} style={{ color: card.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Conflicts */}
        <div className="glass-card animate-fade-in-up delay-300" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle size={16} style={{ color: monthlyStats.conflicts > 0 ? 'var(--danger)' : 'var(--success)' }} />
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Konflik Jadwal</h3>
          </div>
          {monthlyStats.conflicts === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--success)' }}>✨ Tidak ada konflik.</p>
          ) : (
            <div style={{ padding: '0.65rem', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.15)' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--danger)' }}>{monthlyStats.conflicts}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '0.2rem' }}>Pelanggaran Malam→Pagi</p>
            </div>
          )}
        </div>

        {/* Fairness Score */}
        <div className="glass-card animate-fade-in-up delay-400" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Zap size={16} style={{ color: '#2DD4BF' }} />
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Skor Keadilan</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <p style={{ fontSize: '2.5rem', fontWeight: '900', background: `linear-gradient(135deg, ${fairness.overallScore >= 70 ? '#2DD4BF' : fairness.overallScore >= 40 ? '#FBBF24' : '#F87171'}, var(--text-primary))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{fairness.overallScore}%</p>
            <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
              <div style={{ width: `${fairness.overallScore}%`, height: '100%', borderRadius: '4px', background: `linear-gradient(90deg, ${fairness.overallScore >= 70 ? '#2DD4BF' : fairness.overallScore >= 40 ? '#FBBF24' : '#F87171'}, ${fairness.overallScore >= 70 ? '#34D399' : fairness.overallScore >= 40 ? '#F59E0B' : '#EF4444'})`, transition: 'width 1s ease' }} />
            </div>
          </div>
        </div>

        {/* Pending items */}
        <div className="glass-card animate-fade-in-up delay-500" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={16} style={{ color: '#FBBF24' }} />
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Menunggu Tindakan</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1, padding: '0.65rem', borderRadius: 'var(--radius-md)', background: 'var(--warning-bg)', border: '1px solid rgba(251,191,36,0.15)', textAlign: 'center' }}>
              <p style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--warning)' }}>{pendingLeaves}</p>
              <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Cuti</p>
            </div>
            <div style={{ flex: 1, padding: '0.65rem', borderRadius: 'var(--radius-md)', background: 'var(--info-bg)', border: '1px solid rgba(96,165,250,0.15)', textAlign: 'center' }}>
              <p style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--info)' }}>{pendingSwaps}</p>
              <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Tukar Shift</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Pie Chart */}
        <div className="glass-card animate-fade-in-up delay-500" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={16} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Distribusi Shift Bulan Ini</h3>
          </div>
          {shiftDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={shiftDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} style={{ fontSize: '0.65rem' }}>
                  {shiftDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-primary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '3rem' }}>Tidak ada data shift.</p>}
        </div>

        {/* Activity Log */}
        <div className="glass-card animate-fade-in-up delay-600" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.85rem' }}>Aktivitas Terkini</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {activityLogs.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Belum ada aktivitas tercatat.</p>
            ) : (
              activityLogs.slice(0, 8).map((log, i) => (
                <div key={log.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.55rem 0', borderBottom: i < 7 ? '1px solid var(--glass-border)' : 'none' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', marginTop: '0.35rem', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{log.message}</p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{formatTime(log.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
