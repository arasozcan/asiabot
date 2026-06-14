import React, { useState } from 'react';
import { 
  Users, 
  Phone, 
  Trash2, 
  UserPlus, 
  Search,
  Calendar
} from 'lucide-react';
import { Staff, Equipment, EventJob } from '../types';

interface StaffEquipmentManagerProps {
  staffList: Staff[];
  equipmentList: Equipment[];
  events: EventJob[];
  onAddStaff: (staff: Omit<Staff, 'id'>) => void;
  onDeleteStaff: (id: string) => void;
  onAddEquipment: (equip: Omit<Equipment, 'id'>) => void;
  onDeleteEquipment: (id: string) => void;
}

export default function StaffEquipmentManager({
  staffList,
  events,
  onAddStaff,
  onDeleteStaff
}: StaffEquipmentManagerProps) {
  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Add Staff form state
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<Staff['role']>('Ses Teknikeri');
  const [staffPhone, setStaffPhone] = useState('');

  // Helper: Find assignments of a staff member
  const getStaffAssignments = (name: string) => {
    return events.filter(e => e.staff.includes(name) && (e.status !== 'İptal'));
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;

    onAddStaff({
      name: staffName,
      role: staffRole,
      phone: staffPhone || '05-- --- -- --',
      status: 'Aktif'
    });

    setStaffName('');
    setStaffPhone('');
  };

  // Filtered list
  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="staff-equip-parent" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: INPUT FORMS (lg:col-span-4) */}
      <div id="staff-equip-forms" className="lg:col-span-4 space-y-6">
        
        {/* FORM: ADD STAFF */}
        <div id="add-staff-card" className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
          <h4 id="add-staff-header" className="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-widest font-mono">
            <UserPlus className="w-4 h-4 text-violet-400" />
            Yeni Ekip Çalışanı Ekle
          </h4>

          <form onSubmit={handleAddStaffSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono">Ad Soyad *</label>
              <input
                id="staff-form-name"
                type="text"
                required
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 focus:outline-none"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono">Görev / Uzmanlık *</label>
              <select
                id="staff-form-role"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 bg-slate-900"
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as Staff['role'])}
              >
                <option value="Ses Teknikeri" className="bg-slate-950">Ses Teknikeri / Tonmaister</option>
                <option value="Işık Teknikeri" className="bg-slate-950">Işık Teknikeri / Tasarımcı</option>
                <option value="DJ" className="bg-slate-950">DJ (Disk Jokey)</option>
                <option value="Kurulum Ekibi" className="bg-slate-950">Kurulum & Taşıma Elemanı</option>
                <option value="Tonmaister" className="bg-slate-950">Canlı Performans Mix / Tonmaister</option>
                <option value="Yönetici" className="bg-slate-950">Operasyon Yöneticisi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono">İrtibat Numarası</label>
              <input
                id="staff-form-phone"
                type="tel"
                placeholder="Örn: 0532 --- -- --"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 focus:outline-none"
                value={staffPhone}
                onChange={(e) => setStaffPhone(e.target.value)}
              />
            </div>

            <button
              id="staff-form-submit"
              type="submit"
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-violet-600/10 mt-2"
            >
              Ekip Arkadaşını Kaydet
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT COLUMN: SEARCHABLE GRID DISPLAY (lg:col-span-8) */}
      <div id="staff-equip-grids" className="lg:col-span-8 space-y-4">
        
        {/* QUICK SEARCH FIELD */}
        <div className="bg-slate-900/40 border border-slate-800 backdrop-blur-md rounded-2xl p-3.5 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            id="man-search-input"
            type="text"
            placeholder="Ekip arkadaşlarında ara..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* GRID: STAFF CARDS */}
        <div id="staff-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredStaff.map(st => {
            const staffJobs = getStaffAssignments(st.name);
            
            return (
              <div
                id={`staff-card-${st.id}`}
                key={st.id}
                className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/85 p-5 flex flex-col justify-between hover:border-violet-500/50 hover:shadow-xl transition-all space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 font-bold font-mono flex items-center justify-center border border-violet-500/20 shadow-inner">
                      {st.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-sm">{st.name}</h5>
                      <span className="px-2 py-0.5 mt-1 bg-slate-950 border border-slate-850 rounded-lg text-[9px] font-bold tracking-wider uppercase text-slate-400 inline-block">{st.role}</span>
                    </div>
                  </div>
                  
                  <button
                    id={`delete-staff-btn-${st.id}`}
                    onClick={() => {
                      if (confirm(`"${st.name}" çalışanını silmek istediğinize emin misiniz?`)) {
                        onDeleteStaff(st.id);
                      }
                    }}
                    className="p-1 px-2.5 text-rose-450 hover:bg-rose-950/30 border border-rose-950/40 rounded-lg transition-colors inline-block text-xs"
                    title="Elemanı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Operational indicators */}
                <div className="space-y-2 border-t border-slate-800/80 pt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-500 font-bold" />
                    <span className="font-mono">{st.phone || '05-- --- -- --'}</span>
                  </div>

                  <div className="flex items-start gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                    <div className="w-full">
                      <span className="font-bold text-slate-350 block">Atandığı Etkinlikler:</span>
                      {staffJobs.length === 0 ? (
                        <span className="text-emerald-400 text-[11px] font-bold mt-1 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-950/20 inline-block">Müsait (Mevcut işi yok)</span>
                      ) : (
                        <div className="space-y-1 mt-1.5">
                          {staffJobs.slice(0, 3).map(job => (
                            <div key={job.id} className="text-[10px] bg-slate-950 border border-slate-850/80 px-2 py-1 rounded-lg text-slate-300 truncate max-w-[250px] flex items-center justify-between">
                              <span className="font-mono text-violet-400 mr-2 shrink-0">{job.date}</span> 
                              <span className="truncate">{job.title}</span>
                            </div>
                          ))}
                          {staffJobs.length > 3 && (
                            <span className="text-[9px] text-slate-500 font-bold pl-1 font-mono">+{staffJobs.length - 3} iş daha...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredStaff.length === 0 && (
            <div id="no-filtered-staff" className="sm:col-span-2 text-center p-12 text-slate-500 bg-slate-950/20 border-2 border-dashed border-slate-800 rounded-3xl font-mono text-xs">
              Sistemde kayıtlı ekip arkadaşı bulunamadı.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
