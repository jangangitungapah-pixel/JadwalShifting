import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Rectangle } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieIcon, Users, Clock, Shield, Zap, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, CalendarCheck } from 'lucide-react';
import { calculateFairnessScore, calculateWorkloadBalance, calculateOvertime } from '../utils/fairness';
import { useTranslation } from '../utils/i18n.jsx';

const COLORS = ['#60A5FA', '#FBBF24', '#A78BFA', '#F87171', '#2DD4BF', '#F472B6', '#34D399', '#818CF8'];

const CustomActiveBar = (props) => {
  const { x, y, width, height, fill, radius } = props;
  return (
    <Rectangle
      x={x - 4}
      y={y - 4}
      width={width + 8}
      height={height + 8}
      fill={fill}
      radius={radius}
      stroke="rgba(255, 255, 255, 0.15)"
      strokeWidth={1.5}
      style={{ filter: `drop-shadow(0px 6px 12px ${fill}99)`, transition: 'all 0.2s ease-in-out' }}
    />
  );
};

const AnalyticsView = ({ employees, shifts, cutOffDate, incentiveAmount, holidayIncentiveAmount, spIncentiveAmount, holidays }) => {
  const { t, lang } = useTranslation();
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const monthNames = t('time.months').map(m => m.substring(0, 3));

  const getDateRange = (year, month, cutOff) => {
    let start, end;
    if (!cutOff || cutOff >= 28) {
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0);
    } else {
      start = new Date(year, month - 1, cutOff + 1);
      end = new Date(year, month, cutOff);
    }
    const dates = [];
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // Shift distribution pie chart
  const shiftDistribution = useMemo(() => {
    const dates = getDateRange(selectedYear, selectedMonth, cutOffDate);
    let pagi = 0, sore = 0, malam = 0, libur = 0, sp = 0;
    for (const d of dates) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      Object.values(shifts[ds] || {}).forEach(s => {
        if (s === 'pagi') pagi++; else if (s === 'sore') sore++; else if (s === 'malam') malam++;
        else if (s === 'libur') libur++; else if (s?.includes('sp')) sp++;
      });
    }
    return [{ name: 'Pagi', value: pagi }, { name: 'Sore', value: sore }, { name: 'Malam', value: malam }, { name: 'Libur', value: libur }, { name: 'SP', value: sp }].filter(x => x.value > 0);
  }, [shifts, selectedYear, selectedMonth, cutOffDate]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const data = [];
    for (let m = 5; m >= 0; m--) {
      let d = new Date(selectedYear, selectedMonth - m, 1);
      const y = d.getFullYear(), mo = d.getMonth();
      const dates = getDateRange(y, mo, cutOffDate);
      
      let p = 0, s = 0, ml = 0;
      for (const dateObj of dates) {
        const ds = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        Object.values(shifts[ds] || {}).forEach(sh => { if (sh === 'pagi') p++; else if (sh === 'sore') s++; else if (sh === 'malam') ml++; });
      }
      data.push({ month: monthNames[mo], pagi: p, sore: s, malam: ml });
    }
    return data;
  }, [shifts, selectedYear, selectedMonth, cutOffDate]);

  // Fairness & workload
  const fairness = useMemo(() => calculateFairnessScore(employees, shifts, selectedYear, selectedMonth, cutOffDate), [employees, shifts, selectedYear, selectedMonth, cutOffDate]);
  const workload = useMemo(() => calculateWorkloadBalance(employees, shifts, selectedYear, selectedMonth, cutOffDate), [employees, shifts, selectedYear, selectedMonth, cutOffDate]);
  const overtime = useMemo(() => calculateOvertime(employees, shifts, selectedYear, selectedMonth, cutOffDate), [employees, shifts, selectedYear, selectedMonth, cutOffDate]);

  const workloadChart = workload.map(w => ({ name: w.name?.split(' ')[0] || '?', jam: w.totalHours, rata: Math.round(w.avgHours) }));
  const fairnessRadar = fairness.stats.map(s => ({ name: s.name?.split(' ')[0] || '?', skor: s.fairnessScore, pagi: s.pagi, sore: s.sore, malam: s.malam }));

  // Employee comparison stacked bar
  const employeeComparison = fairness.stats.map(s => ({ name: s.name?.split(' ')[0] || '?', Pagi: s.pagi, Sore: s.sore, Malam: s.malam, SP: s.sp, Libur: s.libur }));

  // Summary KPIs
  const totalShiftsThisMonth = shiftDistribution.reduce((a, b) => a + b.value, 0);
  const overtimeCount = overtime.filter(o => o.hasOvertime).length;
  const avgWorkload = workload.length > 0 ? Math.round(workload.reduce((s, w) => s + w.totalHours, 0) / workload.length) : 0;
  const fairnessColor = fairness.overallScore >= 70 ? '#2DD4BF' : fairness.overallScore >= 40 ? '#FBBF24' : '#F87171';

  const cardStyle = { padding: '1.25rem', position: 'relative', overflow: 'hidden' };
  const tooltipStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)' };

  return (
    <div style={{ padding: '0.5rem' }}>
      <div className="page-header animate-fade-in-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
          <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #818CF8, #22D3EE)', boxShadow: '0 0 12px rgba(129,140,248,0.2)' }} />
          <h2 className="page-title">{t('analytics.title')}</h2>
        </div>
        <p className="page-subtitle" style={{ marginLeft: '1.75rem' }}>{t('analytics.subtitle')}</p>
      </div>

      {/* Month selector */}
      <div className="animate-fade-in-up delay-100" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{lang === 'en' ? 'MONTH:' : 'BULAN:'}</span>
        {monthNames.map((m, i) => (
          <button key={i} onClick={() => setSelectedMonth(i)} style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: i === selectedMonth ? '700' : '500', border: `1px solid ${i === selectedMonth ? 'var(--color-primary)' : 'var(--glass-border)'}`, background: i === selectedMonth ? 'var(--color-primary-light)' : 'transparent', color: i === selectedMonth ? 'var(--color-primary)' : 'var(--text-tertiary)', transition: 'all 0.2s' }}>{m}</button>
        ))}
      </div>

      {/* KPI Summary Cards */}
      <div className="animate-fade-in-up delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[{ label: lang === 'en' ? 'Total Shifts' : 'Total Shift', value: totalShiftsThisMonth, icon: CalendarCheck, color: '#818CF8', glow: 'rgba(129,140,248,0.15)' },
          { label: lang === 'en' ? 'Fairness Score' : 'Skor Keadilan', value: `${fairness.overallScore}%`, icon: Zap, color: fairnessColor, glow: `${fairnessColor}22` },
          { label: lang === 'en' ? 'Avg Workload' : 'Rata-rata Jam', value: `${avgWorkload}h`, icon: Clock, color: '#60A5FA', glow: 'rgba(96,165,250,0.15)' },
          { label: lang === 'en' ? 'Overtime Alerts' : 'Peringatan Lembur', value: overtimeCount, icon: AlertTriangle, color: overtimeCount > 0 ? '#F87171' : '#34D399', glow: overtimeCount > 0 ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)' },
          { label: lang === 'en' ? 'Employees' : 'Karyawan', value: employees.length, icon: Users, color: '#F472B6', glow: 'rgba(244,114,182,0.15)' }
        ].map((card, i) => (
          <div key={i} className={`glass-card animate-fade-in-up delay-${(i+1)*100}`} style={{ padding: '1rem 1.15rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '60px', height: '60px', borderRadius: '50%', background: card.glow, filter: 'blur(15px)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '0.3rem' }}>{card.label}</p>
                <p style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.03em', background: `linear-gradient(135deg, ${card.color}, var(--text-primary))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{card.value}</p>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-lg)', background: card.glow }}>
                <card.icon size={18} style={{ color: card.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Pie: Shift Distribution */}
        <div className="glass-card animate-fade-in-up delay-200" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <PieIcon size={16} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{t('dash.shiftDistribution')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={shiftDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} style={{ fontSize: '0.7rem' }} className="single-hover-pie" activeShape={false}>
                {shiftDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            {shiftDistribution.map((entry, i) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: COLORS[i % COLORS.length] }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line: Monthly Trend */}
        <div className="glass-card animate-fade-in-up delay-300" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={16} style={{ color: '#34D399' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{lang === 'en' ? 'Shift Trend (6 Months)' : 'Tren Shift (6 Bulan)'}</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--color-primary)', strokeWidth: 2, strokeDasharray: '4 4', opacity: 0.3 }} />
              <Line type="monotone" dataKey="pagi" name="Pagi" stroke="#60A5FA" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="sore" name="Sore" stroke="#FBBF24" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="malam" name="Malam" stroke="#A78BFA" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Legend wrapperStyle={{ fontSize: '0.72rem', paddingTop: '0.5rem' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Stacked Bar: Employee Comparison */}
        <div className="glass-card animate-fade-in-up delay-400" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Users size={16} style={{ color: '#F472B6' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{lang === 'en' ? 'Shift per Employee' : 'Shift per Karyawan'}</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={employeeComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={60} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(129, 140, 248, 0.15)' }} />
              <Bar dataKey="Pagi" stackId="a" fill="#60A5FA" radius={[0, 0, 0, 0]} activeBar={<CustomActiveBar />} />
              <Bar dataKey="Sore" stackId="a" fill="#FBBF24" activeBar={<CustomActiveBar />} />
              <Bar dataKey="Malam" stackId="a" fill="#A78BFA" activeBar={<CustomActiveBar />} />
              <Bar dataKey="SP" stackId="a" fill="#2DD4BF" activeBar={<CustomActiveBar />} />
              <Bar dataKey="Libur" stackId="a" fill="#F87171" radius={[0, 4, 4, 0]} activeBar={<CustomActiveBar />} />
              <Legend wrapperStyle={{ fontSize: '0.7rem', paddingTop: '0.5rem' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar: Workload */}
        <div className="glass-card animate-fade-in-up delay-500" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BarChart3 size={16} style={{ color: '#FBBF24' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{lang === 'en' ? 'Workload (Hours)' : 'Beban Kerja (Jam)'}</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={workloadChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(129, 140, 248, 0.15)', rx: 4, ry: 4 }} />
              <Bar dataKey="jam" name={lang === 'en' ? 'Total Hours' : 'Total Jam'} fill="#818CF8" radius={[6, 6, 0, 0]} className="single-hover-bar" activeBar={false} />
              <Bar dataKey="rata" name={lang === 'en' ? 'Average' : 'Rata-rata'} fill="rgba(129,140,248,0.3)" radius={[6, 6, 0, 0]} className="single-hover-bar" activeBar={false} />
              <Legend wrapperStyle={{ fontSize: '0.7rem', paddingTop: '0.5rem' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar: Fairness — full width */}
      <div className="glass-card animate-fade-in-up delay-500" style={{ ...cardStyle, marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} style={{ color: fairnessColor }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{t('dash.fairnessScore')}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: '600', color: fairnessColor, textTransform: 'uppercase' }}>
              {fairness.overallScore >= 70 ? (lang === 'en' ? '● Excellent' : '● Sangat Baik') : fairness.overallScore >= 40 ? (lang === 'en' ? '● Needs Attention' : '● Perlu Perhatian') : (lang === 'en' ? '● Poor' : '● Buruk')}
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: '900', background: `linear-gradient(135deg, ${fairnessColor}, var(--text-primary))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{fairness.overallScore}%</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
          {fairnessRadar.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={fairnessRadar}>
                <PolarGrid stroke="var(--glass-border)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} domain={[0, 100]} />
                <Radar name="Skor" dataKey="skor" stroke="#2DD4BF" fill="#2DD4BF" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '3rem' }}>Tidak ada data.</p>}
          {/* Per-employee fairness breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {fairness.stats.map(s => {
              const sc = s.fairnessScore;
              const color = sc >= 70 ? '#2DD4BF' : sc >= 40 ? '#FBBF24' : '#F87171';
              return (
                <div key={s.empId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '600', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                  <div style={{ width: '60px', height: '4px', borderRadius: '2px', background: 'var(--bg-card)', overflow: 'hidden' }}>
                    <div style={{ width: `${sc}%`, height: '100%', borderRadius: '2px', background: color, transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color, minWidth: '32px', textAlign: 'right' }}>{sc}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overtime alerts */}
      <div className="glass-card animate-fade-in-up delay-500" style={{ ...cardStyle, marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Clock size={16} style={{ color: '#F87171' }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{lang === 'en' ? 'Overtime Alert (>40 hours/week)' : 'Peringatan Overtime (>40 jam/minggu)'}</h3>
        </div>
        {overtime.filter(o => o.hasOvertime).length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>✨ Tidak ada karyawan yang overtime bulan ini.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {overtime.filter(o => o.hasOvertime).map(o => (
              <div key={o.empId} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <p style={{ fontWeight: '600', fontSize: '0.82rem', marginBottom: '0.25rem' }}>{o.name}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>+{o.totalOvertime} jam overtime ({o.overtimeWeeks} minggu)</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div className="glass-card animate-fade-in-up delay-600" style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BarChart3 size={16} style={{ color: '#F472B6' }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{lang === 'en' ? 'Attendance Heatmap' : 'Heatmap Kehadiran'}</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {(() => {
            const heatmapDates = getDateRange(selectedYear, selectedMonth, cutOffDate);
            return (
              <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${heatmapDates.length}, 1fr)`, gap: '2px', minWidth: 'max-content' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '0.25rem' }}></div>
                {heatmapDates.map((d, i) => (
                  <div key={i} style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.2rem' }}>{d.getDate()}</div>
                ))}
                {employees.map(emp => (
                  <React.Fragment key={emp.id}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', padding: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name?.split(' ')[0]}</div>
                    {heatmapDates.map((d, i) => {
                      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      const s = shifts[ds]?.[emp.id];
                      const bg = s === 'pagi' ? 'rgba(96,165,250,0.5)' : s === 'sore' ? 'rgba(251,191,36,0.5)' : s === 'malam' ? 'rgba(167,139,250,0.5)' : s === 'libur' ? 'rgba(248,113,113,0.3)' : s?.includes('sp') ? 'rgba(20,184,166,0.5)' : 'rgba(255,255,255,0.03)';
                      return <div key={i} title={`${emp.name} - ${s || '-'}`} style={{ width: '100%', height: '20px', borderRadius: '2px', background: bg, transition: 'all 0.2s' }} />;
                    })}
                  </React.Fragment>
                ))}
              </div>
            );
          })()}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', justifyContent: 'center' }}>
          {[{ l: 'Pagi', c: 'rgba(96,165,250,0.5)' }, { l: 'Sore', c: 'rgba(251,191,36,0.5)' }, { l: 'Malam', c: 'rgba(167,139,250,0.5)' }, { l: 'Libur', c: 'rgba(248,113,113,0.3)' }, { l: 'SP', c: 'rgba(20,184,166,0.5)' }].map(x => (
            <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: x.c }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{x.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
