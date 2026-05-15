import React, { useState, useMemo } from 'react';
import { Download, FileText, Printer, DollarSign, Calendar, Info, Wallet, TrendingUp, Gift, Briefcase, PlusCircle, CalendarRange } from 'lucide-react';
import { calculateAllPayroll } from '../utils/payrollCalculator';
import { sounds } from '../utils/soundService';
import { useTranslation } from '../utils/i18n.jsx';

const Payroll = ({ employees, shifts, cutOffDate, incentiveAmount, holidayIncentiveAmount, spIncentiveAmount, holidays }) => {
  const { t, lang } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const monthNames = t('time.months');

  const payrollData = useMemo(() => {
    const settings = { incentiveAmount, holidayIncentiveAmount, spIncentiveAmount };
    return calculateAllPayroll(employees, shifts, selectedYear, selectedMonth, cutOffDate, settings, holidays);
  }, [employees, shifts, selectedMonth, selectedYear, cutOffDate, incentiveAmount, holidayIncentiveAmount, spIncentiveAmount, holidays]);

  const handlePrint = () => {
    sounds.success();
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      {/* HEADER SECTION */}
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #10B981, var(--color-primary))', boxShadow: '0 0 12px rgba(16,185,129,0.3)' }} />
            <h2 className="page-title">{lang === 'en' ? 'Payroll Estimation' : 'Estimasi Payroll'}</h2>
          </div>
          <p className="page-subtitle" style={{ marginLeft: '1.75rem' }}>{lang === 'en' ? 'Calculate salary estimates based on attendance and incentives.' : 'Kalkulasi estimasi gaji berdasarkan kehadiran dan insentif.'}</p>
        </div>
        
        {/* TOOLBAR */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', padding: '0.2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-sm)' }}>
            <select style={{ background: 'transparent', border: 'none', padding: '0.3rem 0.5rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
              {monthNames.map((m, i) => <option key={i} value={i} style={{ background: 'var(--bg-main)' }}>{m}</option>)}
            </select>
            <div style={{ width: '1px', backgroundColor: 'var(--glass-border)', margin: '0.2rem 0.2rem' }} />
            <select style={{ background: 'transparent', border: 'none', padding: '0.3rem 0.5rem', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => <option key={y} value={y} style={{ background: 'var(--bg-main)' }}>{y}</option>)}
            </select>
          </div>
          <button onClick={handlePrint} className="btn" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: '600', boxShadow: '0 4px 12px rgba(16,185,129,0.25)', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Printer size={14} color="#fff" /> <span>{lang === 'en' ? 'Print Slip' : 'Cetak Slip'}</span>
          </button>
        </div>
      </div>

      {/* INFO BANNER */}
      <div className="glass-card animate-fade-in-up delay-100" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', backgroundColor: 'var(--info-bg)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ background: 'rgba(96,165,250,0.15)', padding: '0.5rem', borderRadius: '50%' }}>
          <Info size={18} style={{ color: 'var(--info)' }} />
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--info)', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '0.25rem' }}>{lang === 'en' ? 'Calculations based on Cut-Off date' : 'Kalkulasi didasarkan pada Cut-Off tanggal'} <strong>{cutOffDate}</strong>. {lang === 'en' ? 'Period calculated:' : 'Periode yang dihitung:'} <strong>{cutOffDate + 1} {monthNames[selectedMonth === 0 ? 11 : selectedMonth - 1]}</strong> - <strong>{cutOffDate} {monthNames[selectedMonth]}</strong>.</div>
          <div style={{ opacity: 0.9 }}>{lang === 'en' ? 'Base Salary is calculated monthly based on Project Type (Old Project: Rp 2.3M, New Project: Rp 2.8M). Long Shifts receive SP incentives.' : 'Gaji Pokok dihitung per bulan berdasarkan Tipe Project (Old Project: Rp 2.300.000, New Project: Rp 2.800.000). Long Shift (SP) ditambahkan sebagai insentif.'}</div>
        </div>
      </div>

      {/* PAYSLIP CARDS */}
      <div data-tour="payroll-table" className="animate-fade-in-up delay-200" style={{ display: 'grid', gap: '1.25rem' }}>
        {payrollData.map((data, idx) => (
          <div key={data.id} className="glass-card payslip-card animate-fade-in-up" style={{ padding: '0', position: 'relative', overflow: 'hidden', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', animationDelay: `${(idx + 2) * 50}ms`, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
          >
            {/* Colored Top Bar */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #10B981, var(--color-primary))' }} />
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                {/* Avatar & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img src={data.avatar} alt={data.name} style={{ width: '56px', height: '56px', borderRadius: '14px', border: '2px solid var(--glass-border)', objectFit: 'cover', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} />
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em', marginBottom: '0.1rem' }}>{data.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Briefcase size={12} /> <span style={{ fontWeight: '500' }}>{data.role}</span>
                      <span>•</span>
                      <span>{data.department}</span>
                    </div>
                  </div>
                </div>
                {/* Total Salary Highlight */}
                <div style={{ textAlign: 'right', background: 'var(--bg-elevated)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', minWidth: '180px' }}>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                     <DollarSign size={10} /> {lang === 'en' ? 'Total Salary Estimate' : 'Total Estimasi Gaji'}
                  </p>
                  <p style={{ fontSize: '1.65rem', fontWeight: '900', background: 'linear-gradient(135deg, #10B981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em', fontFamily: "'Outfit', sans-serif" }}>
                    {formatCurrency(data.totalSalary)}
                  </p>
                </div>
              </div>

              {/* Salary Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                {/* Primary Components */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Wallet size={14} style={{ color: 'var(--color-primary)' }} /> {lang === 'en' ? 'Primary Components' : 'Komponen Utama'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CalendarRange size={14} opacity={0.6} /> {lang === 'en' ? 'Base Salary' : 'Gaji Pokok'}</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(data.baseSalaryMonthly)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><TrendingUp size={14} opacity={0.6} /> {lang === 'en' ? 'Fixed Allowance' : 'Tunjangan Tetap'}</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(data.fixedAllowance)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Briefcase size={14} opacity={0.6} /> {lang === 'en' ? 'Material Allowance' : 'Tunjangan Material'}</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(data.materialAllowance)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Variable & Incentives */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Gift size={14} style={{ color: '#F59E0B' }} /> {lang === 'en' ? 'Incentives & Variable' : 'Insentif & Variabel'}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><PlusCircle size={14} opacity={0.6} /> {lang === 'en' ? 'Normal Incentive' : 'Insentif Normal'}</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(data.normalIncentives)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><PlusCircle size={14} opacity={0.6} /> {lang === 'en' ? 'Holiday Incentive' : 'Insentif Libur Nasional'}</span>
                      <span style={{ fontWeight: '600', color: '#10B981' }}>{formatCurrency(data.holidayIncentives)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><PlusCircle size={14} opacity={0.6} /> {lang === 'en' ? 'Long Shift (SP)' : 'Insentif SP (Long Shift)'}</span>
                      <span style={{ fontWeight: '600', color: '#F59E0B' }}>{formatCurrency(data.spIncentives)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Payroll;
