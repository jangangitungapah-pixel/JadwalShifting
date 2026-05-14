import React, { useState, useMemo, useRef } from 'react';
import { Plus, Search, Edit3, Trash2, X, Check, UserCircle, Zap, LayoutGrid, List, Filter, Mail, Phone, Shield, RefreshCw, Upload } from 'lucide-react';
import EmployeeProfile from './EmployeeProfile';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { getCroppedImg } from '../utils/cropImage';
import { calculateFairnessScore } from '../utils/fairness';
import { sounds } from '../utils/soundService';
import { useTranslation } from '../utils/i18n.jsx';

const EmployeeList = ({ employees, onAdd, onEdit, onDelete, shifts, departments, isViewer, isEmployee, currentEmployeeId }) => {
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [profileEmployee, setProfileEmployee] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: '', phone: '', email: '', department: 'Umum', projectType: 'old', materialAllowance: 0, avatar: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [avatarOptions, setAvatarOptions] = useState([]);
  const fileInputRef = useRef(null);

  // New states for overhaul
  const [viewMode, setViewMode] = useState('grid');
  const [filterDept, setFilterDept] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  const [filterProject, setFilterProject] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Cropper states
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const today = new Date();
  const fairness = useMemo(() => calculateFairnessScore(employees, shifts, today.getFullYear(), today.getMonth()), [employees, shifts]);

  const roles = [...new Set(employees.map(e => e.role))];

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (isEmployee && currentEmployeeId && emp.id !== currentEmployeeId) return false;
      if (filterDept !== 'All' && emp.department !== filterDept) return false;
      if (filterRole !== 'All' && emp.role !== filterRole) return false;
      if (filterProject !== 'All' && emp.projectType !== filterProject) return false;
      
      const searchLower = searchTerm.toLowerCase();
      return emp.name.toLowerCase().includes(searchLower) || emp.role.toLowerCase().includes(searchLower);
    });
  }, [employees, searchTerm, filterDept, filterRole, filterProject, isEmployee, currentEmployeeId]);

  const resetForm = () => { setFormData({ name: '', role: '', phone: '', email: '', department: 'Umum', projectType: 'old', materialAllowance: 0, avatar: '' }); setEditingEmployee(null); setAvatarOptions([]); };

  const generateRandomAvatars = (seed) => {
    const styles = ['avataaars', 'bottts', 'micah', 'lorelei', 'notionists', 'adventurer', 'fun-emoji', 'pixel-art', 'thumbs', 'rings'];
    const randomSeed = seed || Math.random().toString(36).substring(7);
    return styles.map(style => `https://api.dicebear.com/7.x/${style}/svg?seed=${randomSeed}&backgroundColor=transparent`);
  };

  const openAddModal = () => { 
    sounds.modalOpen(); 
    resetForm(); 
    const seed = Date.now().toString();
    const avatars = generateRandomAvatars(seed);
    setAvatarOptions(avatars);
    setFormData(prev => ({ ...prev, avatar: avatars[0] }));
    setIsModalOpen(true); 
  };
  
  const openEditModal = (emp) => { 
    sounds.modalOpen(); 
    setEditingEmployee(emp); 
    setFormData({ 
      name: emp.name, role: emp.role, phone: emp.phone || '', email: emp.email || '', 
      department: emp.department || 'Umum', projectType: emp.projectType || 'old', materialAllowance: emp.materialAllowance || 0,
      avatar: emp.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`
    }); 
    setAvatarOptions(generateRandomAvatars(emp.name));
    setIsModalOpen(true); 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return;
    try {
      if (editingEmployee) onEdit({ ...editingEmployee, ...formData });
      else onAdd(formData);
      sounds.success();
      sounds.modalClose();
      setIsModalOpen(false); resetForm();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data karyawan. Ukuran memori penuh atau terjadi kesalahan: ' + err.message);
    }
  };

  const handleImageUpload = (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 50 * 1024 * 1024) {
        alert(lang === 'en' ? 'File is too large (max 50MB)' : 'Ukuran file terlalu besar (maks 50MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setCropImage(reader.result);
        } else {
          alert("Gagal membaca file gambar.");
        }
      };
      reader.onerror = () => {
        alert("Terjadi kesalahan saat membaca file.");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat memproses gambar.");
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    try {
      const croppedImageBase64 = await getCroppedImg(cropImage, croppedAreaPixels);
      const newOptions = [croppedImageBase64, ...avatarOptions.filter(url => url !== croppedImageBase64)];
      setAvatarOptions(newOptions);
      setFormData({ ...formData, avatar: croppedImageBase64 });
      setCropImage(null);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(lang === 'en' ? `Are you sure you want to delete ${selectedIds.length} employees?` : `Yakin ingin menghapus ${selectedIds.length} karyawan?`)) {
      sounds.success();
      selectedIds.forEach(id => onDelete(id));
      setSelectedIds([]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length) setSelectedIds([]);
    else setSelectedIds(filteredEmployees.map(e => e.id));
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: 'linear-gradient(180deg, #22D3EE, var(--color-primary))' }} />
            <h2 className="page-title">{t('emp.title')}</h2>
          </div>
          <p className="page-subtitle" style={{ marginLeft: '1.75rem' }}>{t('emp.subtitle')}</p>
        </div>
        {!isViewer && !isEmployee && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="btn btn-danger animate-fade-in" style={{ padding: '0.5rem 1rem' }}>
                <Trash2 size={16} /> {lang === 'en' ? `Delete (${selectedIds.length})` : `Hapus (${selectedIds.length})`}
              </button>
            )}
            <button onClick={openAddModal} className="btn btn-primary"><Plus size={17} /> {t('emp.add')}</button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="animate-fade-in-up delay-100 glass-card" style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder={t('emp.search')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ paddingLeft: '2.75rem', width: '100%', margin: 0 }} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem' }} title="Advanced Filters">
            <Filter size={18} />
          </button>
        </div>
        
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '0.25rem', border: '1px solid var(--glass-border)' }}>
          <button onClick={() => setViewMode('grid')} style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', border: 'none', background: viewMode === 'grid' ? 'var(--color-primary-light)' : 'transparent', color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <LayoutGrid size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: viewMode === 'grid' ? '600' : '400' }}>Grid</span>
          </button>
          <button onClick={() => setViewMode('table')} style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', border: 'none', background: viewMode === 'table' ? 'var(--color-primary-light)' : 'transparent', color: viewMode === 'table' ? 'var(--color-primary)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <List size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: viewMode === 'table' ? '600' : '400' }}>Table</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="animate-fade-in glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="label" style={{ fontSize: '0.75rem' }}>Departemen</label>
            <select className="input" value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '0.5rem', colorScheme: 'dark' }}>
              <option value="All">Semua Departemen</option>
              {departments?.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label" style={{ fontSize: '0.75rem' }}>Role / Jabatan</label>
            <select className="input" value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ padding: '0.5rem', colorScheme: 'dark' }}>
              <option value="All">Semua Role</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label" style={{ fontSize: '0.75rem' }}>Tipe Project</label>
            <select className="input" value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ padding: '0.5rem', colorScheme: 'dark' }}>
              <option value="All">Semua Project</option>
              <option value="old">Old Project</option>
              <option value="new">New Project</option>
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      {filteredEmployees.length === 0 ? (
        <div className="glass-card animate-fade-in-up delay-200" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1rem' }}>{t('emp.none')}</p>
          {!isViewer && !isEmployee && <button onClick={openAddModal} className="btn btn-primary"><Plus size={17} /> {t('emp.addFirst')}</button>}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="animate-fade-in-up delay-200" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filteredEmployees.map(emp => {
            const empFairness = fairness.stats.find(s => s.empId === emp.id);
            const score = empFairness?.fairnessScore || 0;
            const scoreColor = score >= 70 ? '#2DD4BF' : score >= 40 ? '#FBBF24' : '#F87171';
            const isSelected = selectedIds.includes(emp.id);

            return (
              <div key={emp.id} className="glass-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--glass-border-hover)', transition: 'all 0.2s', boxShadow: isSelected ? '0 0 0 2px rgba(99,102,241,0.2)' : 'none' }}>
                {!isViewer && !isEmployee && (
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(emp.id)} style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                  <img src={emp.avatar} alt={emp.name} style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid var(--glass-border)', background: 'var(--bg-elevated)' }} />
                  <div style={{ flex: 1, paddingRight: '1.5rem' }}>
                    <h4 style={{ fontWeight: '700', fontSize: '1.05rem', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>{emp.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}>{emp.role}</span>
                      {emp.department && emp.department !== 'Umum' && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-full)' }}>{emp.department}</span>}
                    </div>
                  </div>
                </div>

                {/* Quick Contacts */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {emp.phone && (
                    <a href={`tel:${emp.phone}`} className="badge" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem' }}>
                      <Phone size={12} /> <span style={{ fontSize: '0.7rem' }}>{emp.phone}</span>
                    </a>
                  )}
                  {emp.email && (
                    <a href={`mailto:${emp.email}`} className="badge" style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem' }}>
                      <Mail size={12} /> <span style={{ fontSize: '0.7rem' }}>Email</span>
                    </a>
                  )}
                </div>

                {/* Fairness badge */}
                <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Zap size={12} /> Skor Keadilan</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: scoreColor }}>{score}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'var(--bg-card)', overflow: 'hidden' }}>
                    <div style={{ width: `${score}%`, height: '100%', borderRadius: '2px', background: scoreColor, transition: 'width 0.5s' }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => { sounds.modalOpen(); setProfileEmployee(emp); }} className="btn btn-outline" style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem', color: 'var(--color-secondary)', borderColor: 'rgba(34,211,238,0.2)' }}><UserCircle size={14} /> Profil</button>
                  {!isViewer && !isEmployee && (
                    <>
                      <button onClick={() => openEditModal(emp)} className="btn btn-outline" style={{ padding: '0.5rem', fontSize: '0.75rem' }}><Edit3 size={14} /></button>
                      {deleteConfirmId === emp.id ? (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button onClick={() => { sounds.success(); onDelete(emp.id); setDeleteConfirmId(null); }} className="btn btn-danger" style={{ padding: '0.5rem' }}><Check size={14} /></button>
                          <button onClick={() => { sounds.error(); setDeleteConfirmId(null); }} className="btn btn-outline" style={{ padding: '0.5rem' }}><X size={14} /></button>
                        </div>
                      ) : (
                        <button onClick={() => { sounds.error(); setDeleteConfirmId(emp.id); }} className="btn btn-outline" style={{ padding: '0.5rem', color: 'var(--danger)', borderColor: 'rgba(248,113,113,0.2)' }}><Trash2 size={14} /></button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="glass-card animate-fade-in-up delay-200" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--glass-border)' }}>
                {!isViewer && !isEmployee && (
                  <th style={{ padding: '1rem', width: '40px' }}>
                    <input type="checkbox" checked={selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0} onChange={toggleSelectAll} style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
                  </th>
                )}
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Nama</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Posisi</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Kontak</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Skor</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => {
                const empFairness = fairness.stats.find(s => s.empId === emp.id);
                const score = empFairness?.fairnessScore || 0;
                const scoreColor = score >= 70 ? '#2DD4BF' : score >= 40 ? '#FBBF24' : '#F87171';
                const isSelected = selectedIds.includes(emp.id);

                return (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--glass-border)', background: isSelected ? 'rgba(99,102,241,0.05)' : 'transparent', transition: 'background 0.2s' }}>
                    {!isViewer && !isEmployee && (
                      <td style={{ padding: '1rem' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(emp.id)} style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer', accentColor: 'var(--color-primary)' }} />
                      </td>
                    )}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={emp.avatar} alt={emp.name} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)' }} />
                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{emp.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>{emp.role}</span>
                        {emp.department && emp.department !== 'Umum' && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{emp.department}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {emp.phone && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={10} /> {emp.phone}</span>}
                        {emp.email && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={10} /> {emp.email}</span>}
                        {!emp.phone && !emp.email && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--bg-elevated)' }}>
                          <div style={{ width: `${score}%`, height: '100%', borderRadius: '2px', background: scoreColor }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: scoreColor }}>{score}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { sounds.modalOpen(); setProfileEmployee(emp); }} className="btn btn-outline" style={{ padding: '0.4rem' }} title="Profil"><UserCircle size={14} /></button>
                        {!isViewer && !isEmployee && (
                          <>
                            <button onClick={() => openEditModal(emp)} className="btn btn-outline" style={{ padding: '0.4rem' }} title="Edit"><Edit3 size={14} /></button>
                            <button onClick={() => { sounds.error(); if(window.confirm('Hapus karyawan ini?')) onDelete(emp.id); }} className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger)', borderColor: 'rgba(248,113,113,0.2)' }} title="Hapus"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cropper Modal */}
      {cropImage && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Crop Avatar</h3>
            <div style={{ position: 'relative', width: '100%', height: '300px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000' }}>
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => { setCropImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="btn btn-outline" style={{ flex: 1 }}>{t('common.cancel')}</button>
              <button type="button" onClick={handleCropSave} className="btn btn-primary" style={{ flex: 1 }}>Terapkan</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && !cropImage && (
        <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <form onSubmit={handleSubmit} className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '1.75rem', animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)', position: 'relative', border: '1px solid var(--glass-border-hover)' }}>
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px', background: 'linear-gradient(90deg, transparent, var(--color-secondary), transparent)' }} />
            <button type="button" onClick={() => { sounds.modalClose(); setIsModalOpen(false); }} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-secondary)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem' }}>{editingEmployee ? t('emp.edit') : t('emp.addNew')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              
              {/* Avatar Picker */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="label" style={{ margin: 0 }}>Pilih Avatar</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => fileInputRef.current.click()} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                      <Upload size={12} style={{ marginRight: '0.2rem' }} /> {lang === 'en' ? 'Upload' : 'Unggah'}
                    </button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} onClick={(e) => { e.target.value = null; }} style={{ display: 'none' }} />
                    <button type="button" onClick={() => setAvatarOptions(generateRandomAvatars(Date.now().toString()))} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                      <RefreshCw size={12} style={{ marginRight: '0.2rem' }} /> Randomize
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.25rem 0', scrollbarWidth: 'thin' }}>
                  {avatarOptions.map((url, i) => (
                    <img key={i} src={url} alt="avatar option" onClick={() => setFormData({ ...formData, avatar: url })} 
                      style={{ width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', border: formData.avatar === url ? '2px solid var(--color-primary)' : '2px solid transparent', background: 'var(--bg-elevated)', transition: 'all 0.2s', transform: formData.avatar === url ? 'scale(1.1)' : 'scale(1)' }} 
                    />
                  ))}
                </div>
              </div>

              <div><label className="label">{t('emp.name')}</label><input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder={t('emp.name')} /></div>
              <div><label className="label">{t('emp.role')}</label><input className="input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} required placeholder={t('emp.role')} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label className="label">Telepon</label><input className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="08xxx" /></div>
                <div><label className="label">Email</label><input className="input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email" /></div>
              </div>
              <div>
                <label className="label">{lang === 'en' ? 'Project Type' : 'Tipe Project'}</label>
                <select className="input" value={formData.projectType} onChange={e => setFormData({ ...formData, projectType: e.target.value })} style={{ colorScheme: 'dark' }}>
                  <option value="old">Old Project (Rp 2.300.000/bln)</option>
                  <option value="new">New Project (Rp 2.800.000/bln)</option>
                </select>
              </div>
              <div>
                <label className="label">{lang === 'en' ? 'Material Allowance (Rp)' : 'Tunjangan Material (Rp)'}</label>
                <input className="input" type="number" value={formData.materialAllowance} onChange={e => setFormData({ ...formData, materialAllowance: parseInt(e.target.value) || 0 })} placeholder="0" />
              </div>
              {departments && departments.length > 1 && (
                <div><label className="label">Departemen</label><select className="input" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} style={{ colorScheme: 'dark' }}>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => { sounds.modalClose(); setIsModalOpen(false); }} className="btn btn-outline" style={{ flex: 1 }}>{t('common.cancel')}</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingEmployee ? t('common.save') : t('common.add')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Modal */}
      {profileEmployee && <EmployeeProfile employee={profileEmployee} onClose={() => { sounds.modalClose(); setProfileEmployee(null); }} onUpdate={(emp) => { onEdit(emp); sounds.success(); sounds.modalClose(); setProfileEmployee(null); }} shifts={shifts} />}
    </div>
  );
};

export default EmployeeList;
