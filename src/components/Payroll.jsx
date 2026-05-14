import React, { useState, useMemo } from 'react';
import { Download, FileText, Printer, DollarSign, Calendar, Info } from 'lucide-react';
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
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #10B981, var(--color-primary))' }} />
            <h2 className="page-title">{lang === 'en' ? 'Payroll Estimation' : 'Estimasi Payroll'}</h2>
          </div>
          <p className="page-subtitle" style={{ marginLeft: '1.75rem' }}>{lang === 'en' ? 'Calculate salary estimates based on attendance and incentives.' : 'Kalkulasi estimasi gaji berdasarkan kehadiran dan insentif.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select className="input" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
            {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select className="input" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
            {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={handlePrint} className="btn btn-outline" style={{ color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }}>
            <Printer size={16} /> {lang === 'en' ? 'Print' : 'Cetak'}
          </button>
        </div>
      </div>

      <div className="glass-card animate-fade-in-up delay-100" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--info-bg)', border: '1px solid rgba(96,165,250,0.2)' }}>
        <Info size={20} style={{ color: 'var(--info)' }} />
        <div style={{ fontSize: '0.8rem', color: 'var(--info)' }}>
          {lang === 'en' ? 'Calculations based on Cut-Off date' : 'Kalkulasi didasarkan pada Cut-Off tanggal'} <strong>{cutOffDate}</strong>. {lang === 'en' ? 'Period calculated:' : 'Periode yang dihitung:'} <strong>{cutOffDate + 1} {monthNames[selectedMonth === 0 ? 11 : selectedMonth - 1]}</strong> - <strong>{cutOffDate} {monthNames[selectedMonth]}</strong>.
          <br/>{lang === 'en' ? 'Base Salary is calculated monthly based on Project Type (Old Project: Rp 2.3M, New Project: Rp 2.8M). Long Shifts receive SP incentives.' : 'Gaji Pokok dihitung per bulan berdasarkan Tipe Project (Old Project: Rp 2.300.000, New Project: Rp 2.800.000). Long Shift hanya mendapatkan insentif tambahan.'}
        </div>
      </div>

      <div data-tour="payroll-table" className="animate-fade-in-up delay-200" style={{ display: 'grid', gap: '1rem' }}>
        {payrollData.map((data, idx) => (
          <div key={data.id} className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={data.avatar} alt={data.name} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--glass-border)' }} />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{data.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{data.role} • {data.department}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lang === 'en' ? 'Total Salary Estimate' : 'Total Estimasi Gaji'}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', color: '#34D399' }}>{formatCurrency(data.totalSalary)}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.75rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.25rem' }}>{lang === 'en' ? 'Salary Components' : 'Komponen Gaji'}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span>{lang === 'en' ? 'Monthly Base Salary' : 'Gaji Pokok Bulanan'}</span>
                  <span style={{ fontWeight: '500' }}>{formatCurrency(data.baseSalaryNormal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span>{lang === 'en' ? 'Fixed Allowance' : 'Tunjangan Tetap'}</span>
                  <span style={{ fontWeight: '500' }}>{formatCurrency(data.fixedAllowance)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span>{lang === 'en' ? 'Material Allowance' : 'Tunjangan Material'}</span>
                  <span style={{ fontWeight: '500' }}>{formatCurrency(data.materialAllowance)}</span>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.75rem', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '0.25rem' }}>{lang === 'en' ? 'Incentives & Allowances' : 'Insentif & Tunjangan'}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span>{lang === 'en' ? 'Normal Incentive' : 'Insentif Normal'}</span>
                  <span style={{ fontWeight: '500' }}>{formatCurrency(data.normalIncentives)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span>{lang === 'en' ? 'Holiday Incentive' : 'Insentif Libur Nasional'}</span>
                  <span style={{ fontWeight: '500' }}>{formatCurrency(data.holidayIncentives)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span>{lang === 'en' ? 'Long Shift (SP) Incentive' : 'Insentif Long Shift (SP)'}</span>
                  <span style={{ fontWeight: '500' }}>{formatCurrency(data.spIncentives)}</span>
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
