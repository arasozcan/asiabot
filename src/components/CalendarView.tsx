import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  Briefcase, 
  Plus, 
  Trash2, 
  Edit, 
  Music, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Smile,
  X
} from 'lucide-react';
import { EventJob, Staff, Equipment, Reminder } from '../types';

interface CalendarViewProps {
  events: EventJob[];
  staffList: Staff[];
  equipmentList: Equipment[];
  onAddEvent: (event: Omit<EventJob, 'id'>) => void;
  onUpdateEvent: (event: EventJob) => void;
  onDeleteEvent: (id: string) => void;
  reminders?: Reminder[];
  onAddReminder?: (rem: Omit<Reminder, 'id'>) => void;
  onToggleReminder?: (id: string) => void;
  onDeleteReminder?: (id: string) => void;
  userRole?: 'patron' | 'calisan';
}

export default function CalendarView({
  events,
  staffList,
  equipmentList,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  reminders,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  userRole
}: CalendarViewProps) {
  const isPatron = userRole !== 'calisan';

  // Current displayed year & month (Default to June 2026, matching current metadata)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(5); // June (0-indexed, so 5 is June)
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-06-14'); // Initial Selected Date
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventJob | null>(null);

  // Constants
  const WEDDING_MATERIALS_PRESET = [
    'Ses Sistemi (Standart Çift Kolon) x1',
    'Pioneer DJ Kontrol Cihazı x1',
    'Sahnede Robot Işıklar x4',
    'Telsiz El Mikrofonu x2',
    'Giriş Volkan Efekti & Sis Makinesi x1'
  ];

  // Form State for Create/Edit Modal
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formBudget, setFormBudget] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');
  const [formDjService, setFormDjService] = useState(false);
  const [formStatus, setFormStatus] = useState<EventJob['status']>('Planlandı');
  const [formSelectedStaff, setFormSelectedStaff] = useState<string[]>([]);
  const [formSelectedEquipment, setFormSelectedEquipment] = useState<string[]>([]);
  const [formEventType, setFormEventType] = useState<EventJob['eventType']>('Düğün');
  
  // Custom manual equipment adding in modal (for items & quantities)
  const [customEquipName, setCustomEquipName] = useState('');
  const [customEquipQty, setCustomEquipQty] = useState(1);

  // Handler for wedding preset loading
  const handleEventTypeChange = (type: EventJob['eventType']) => {
    setFormEventType(type);
    if (type === 'Düğün') {
      const merged = [...formSelectedEquipment];
      WEDDING_MATERIALS_PRESET.forEach(item => {
        const baseName = item.split(' x')[0];
        if (!merged.some(m => m.startsWith(baseName + ' x') || m === baseName)) {
          merged.push(item);
        }
      });
      setFormSelectedEquipment(merged);
    }
  };

  // Month names in Turkish
  const MONTHS_TR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  // Day of the week names in Turkish (Monday first)
  const DAYS_SHORT_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  // Helper calendar calculations
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Translate Sunday (0) to index 6, Monday to 0
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Generate calendar grid dates
  const calendarCells = useMemo(() => {
    const cells: { dateStr: string | null; dayNum: number | null; isCurrentMonth: boolean }[] = [];
    
    // Previous Month's padded days
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevDaysCount = getDaysInMonth(prevYear, prevMonth);
    
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = prevDaysCount - i;
      const mStr = String(prevMonth + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      cells.push({
        dateStr: `${prevYear}-${mStr}-${dStr}`,
        dayNum: day,
        isCurrentMonth: false
      });
    }

    // Current Month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const mStr = String(currentMonth + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      cells.push({
        dateStr: `${currentYear}-${mStr}-${dStr}`,
        dayNum: i,
        isCurrentMonth: true
      });
    }

    // Next Month's padded days to fill the grid up to multiple of 7
    const remainingCells = 42 - cells.length; // standard 6 rows
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    for (let i = 1; i <= remainingCells; i++) {
      const mStr = String(nextMonth + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      cells.push({
        dateStr: `${nextYear}-${mStr}-${dStr}`,
        dayNum: i,
        isCurrentMonth: false
      });
    }

    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstDayIndex]);

  // Navigate Months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Check which days have events
  const getEventsForDate = (dateStr: string) => {
    return events.filter(e => e.date === dateStr);
  };

  // Filtered Events Lists
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.clientName && event.clientName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStaff = !filterStaff || event.staff.includes(filterStaff);
      
      const matchesEquipment = !filterEquipment || event.materials.some(m => 
        m.toLowerCase().includes(filterEquipment.toLowerCase())
      );

      const matchesStatus = !filterStatus || event.status === filterStatus;

      return matchesSearch && matchesStaff && matchesEquipment && matchesStatus;
    });
  }, [events, searchTerm, filterStaff, filterEquipment, filterStatus]);

  // Selected Day Events
  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter(e => e.date === selectedDateStr);
  }, [filteredEvents, selectedDateStr]);

  // Open Modal for Create Event
  const openCreateModal = (dateStr?: string) => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDate(dateStr || selectedDateStr);
    setFormTime('17:00');
    setFormLocation('');
    setFormClientName('');
    setFormBudget(0);
    setFormNotes('');
    setFormDjService(false);
    setFormStatus('Planlandı');
    setFormSelectedStaff([]);
    setFormSelectedEquipment([...WEDDING_MATERIALS_PRESET]);
    setFormEventType('Düğün');
    setIsModalOpen(true);
  };

  // Open Modal for Edit Event
  const openEditModal = (event: EventJob) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDate(event.date);
    setFormTime(event.time);
    setFormLocation(event.location);
    setFormClientName(event.clientName || '');
    setFormBudget(event.budget || 0);
    setFormNotes(event.notes || '');
    setFormDjService(event.djService);
    setFormStatus(event.status);
    setFormSelectedStaff([...event.staff]);
    setFormSelectedEquipment([...event.materials]);
    setFormEventType(event.eventType || 'Diğer');
    setIsModalOpen(true);
  };

  // Handle Submit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate || !formLocation.trim()) {
      alert('Lütfen Etkinlik Adı, Tarihi ve Adresi doldurunuz.');
      return;
    }

    const eventData: Omit<EventJob, 'id'> = {
      title: formTitle,
      date: formDate,
      time: formTime,
      location: formLocation,
      staff: formSelectedStaff,
      materials: formSelectedEquipment,
      djService: formDjService,
      notes: formNotes,
      status: formStatus,
      clientName: formClientName || undefined,
      budget: Number(formBudget) || undefined,
      eventType: formEventType
    };

    if (editingEvent) {
      onUpdateEvent({
        ...eventData,
        id: editingEvent.id
      });
    } else {
      onAddEvent(eventData);
    }
    
    setIsModalOpen(false);
    // Refresh selected date
    setSelectedDateStr(formDate);
    // Adjust month view to the added date's month
    const addedDate = new Date(formDate);
    if (!isNaN(addedDate.getTime())) {
      setCurrentYear(addedDate.getFullYear());
      setCurrentMonth(addedDate.getMonth());
    }
  };

  // Toggle staff selection in form
  const toggleFormStaff = (staffName: string) => {
    if (formSelectedStaff.includes(staffName)) {
      setFormSelectedStaff(formSelectedStaff.filter(name => name !== staffName));
    } else {
      setFormSelectedStaff([...formSelectedStaff, staffName]);
    }
  };

  // Toggle equipment selection in form
  const addEquipmentToForm = (equipName: string, qty: number) => {
    const formatted = `${equipName} x${qty}`;
    // Remove if already exists with some other quantity
    const cleanList = formSelectedEquipment.filter(item => !item.startsWith(equipName + ' x'));
    setFormSelectedEquipment([...cleanList, formatted]);
  };

  const removeEquipmentFromForm = (itemToRemove: string) => {
    setFormSelectedEquipment(formSelectedEquipment.filter(i => i !== itemToRemove));
  };

  // Quick helper to determine badges colors for event status
  const getStatusBadge = (status: EventJob['status']) => {
    switch (status) {
      case 'Planlandı':
        return <span id="status-planned" className="px-2.5 py-1 text-xs font-bold rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Planlandı</span>;
      case 'Kurulum Aşamasında':
        return <span id="status-setup" className="px-2.5 py-1 text-xs font-bold rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Kurulumda</span>;
      case 'Aktif':
        return <span id="status-active" className="px-2.5 py-1 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5 animate-pulse"><Sparkles className="w-3.5 h-3.5" /> Aktif</span>;
      case 'Tamamlandı':
        return <span id="status-done" className="px-2.5 py-1 text-xs font-bold rounded-xl bg-slate-850 text-slate-400 border border-slate-750 inline-flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Tamamlandı</span>;
      case 'İptal':
        return <span id="status-cancelled" className="px-2.5 py-1 text-xs font-bold rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> İptal</span>;
      default:
        return null;
    }
  };

  return (
    <div id="calendar-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: FILTERS & CALENDAR GRID (lg:col-span-8) */}
      <div id="calendar-left" className="lg:col-span-8 space-y-6">
        
        {/* FILTERS & SEARCH MODULE */}
        <div id="filter-card" className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                id="search-input"
                type="text"
                placeholder={isPatron ? "Etkinlik adı, müşteri veya konum ara..." : "Arama (Etkinlik adı veya konum ara...)"}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 md:w-auto">
              {/* Filter Staff */}
              {isPatron && (
                <select
                  id="filter-staff-select"
                  className="px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={filterStaff}
                  onChange={(e) => setFilterStaff(e.target.value)}
                >
                  <option value="">Ekip Elemanı (Tümü)</option>
                  {staffList.map(st => (
                    <option key={st.id} value={st.name} className="bg-slate-900">{st.name} ({st.role})</option>
                  ))}
                </select>
              )}

              {/* Filter Equipment */}
              <input
                id="filter-equip-input"
                type="text"
                placeholder="Malzeme adı ara..."
                className="px-3 py-1.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-[150px]"
                value={filterEquipment}
                onChange={(e) => setFilterEquipment(e.target.value)}
              />

              {/* Filter Status */}
              <select
                id="filter-status-select"
                className="px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Durum (Tümü)</option>
                <option value="Planlandı" className="bg-slate-900">Planlandı</option>
                <option value="Kurulum Aşamasında" className="bg-slate-900">Kurulumda</option>
                <option value="Aktif" className="bg-slate-900">Aktif</option>
                <option value="Tamamlandı" className="bg-slate-900">Tamamlandı</option>
                <option value="İptal" className="bg-slate-900">İptal</option>
              </select>

              {/* Reset Filters */}
              {(searchTerm || filterStaff || filterEquipment || filterStatus) && (
                <button
                  id="reset-filters-btn"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStaff('');
                    setFilterEquipment('');
                    setFilterStatus('');
                  }}
                  className="px-3 shadow-md py-2 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/30 transition-all"
                >
                  Sıfırla
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CALENDAR CONTROLLER & MONTH GRID */}
        <div id="calendar-card" className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-xl border border-slate-800 p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h2 id="calendar-title" className="text-[19px] font-bold text-white tracking-tight uppercase">
                {MONTHS_TR[currentMonth]} {currentYear}
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
              <button
                id="prev-month-btn"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Önceki Ay"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="today-month-btn"
                onClick={() => {
                  const now = new Date('2026-06-14');
                  setCurrentYear(now.getFullYear());
                  setCurrentMonth(now.getMonth());
                  setSelectedDateStr('2026-06-14');
                }}
                className="px-3 py-1.5 text-xs font-bold hover:bg-slate-900/80 rounded-lg text-slate-350 hover:text-white transition-colors uppercase tracking-wider"
              >
                Bugün
              </button>
              <button
                id="next-month-btn"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Sonraki Ay"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAYS_SHORT_TR.map((day, idx) => (
              <div key={day} className={`text-xs font-semibold py-2 text-slate-500 font-mono uppercase tracking-wider ${idx >= 5 ? 'text-amber-500/70' : ''}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Monthly Grid */}
          <div className="grid grid-cols-7 gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-850/60">
            {calendarCells.map((cell, idx) => {
              if (!cell.dateStr) return <div key={idx} className="bg-[#020617]/50 min-h-[95px] p-1 text-slate-700" />;
              
              const dateEvs = getEventsForDate(cell.dateStr);
              const isSelected = selectedDateStr === cell.dateStr;
              const isToday = cell.dateStr === '2026-06-14';

              return (
                <div
                  id={`cell-${cell.dateStr}`}
                  key={cell.dateStr}
                  onClick={() => setSelectedDateStr(cell.dateStr!)}
                  className={`min-h-[105px] rounded-xl p-1.5 flex flex-col justify-between transition-all cursor-pointer relative group ${
                    !cell.isCurrentMonth ? 'text-slate-650 bg-slate-900/10' : 'text-slate-200 bg-slate-900/40'
                  } ${
                    isSelected ? 'ring-2 ring-blue-500 border-blue-500/50 bg-blue-950/20 z-10' : 'hover:bg-slate-850/60 border border-transparent'
                  } ${
                    isToday ? 'bg-amber-950/20 border border-amber-600/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span 
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                        isToday ? 'bg-amber-500 text-white shadow-md' : 
                        isSelected ? 'bg-blue-600 text-white' : 
                        cell.isCurrentMonth ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    
                    {/* Event Count Dot Badge */}
                    {dateEvs.length > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/40 animate-pulse" title={`${dateEvs.length} Etkinlik`} />
                    )}
                  </div>

                  {/* Tiny Event Titles in Cells */}
                  <div className="mt-1 space-y-1 overflow-hidden select-none">
                    {dateEvs.slice(0, 2).map(ev => (
                      <div 
                        key={ev.id} 
                        className={`text-[9px] leading-tight px-1 py-0.5 rounded truncate border ${
                          ev.status === 'Tamamlandı' ? 'bg-slate-800 text-slate-400 border-slate-750' :
                          ev.status === 'Aktif' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40 font-semibold' :
                          'bg-blue-950/40 text-blue-400 border-blue-900/40'
                        }`}
                        title={ev.title}
                      >
                        {ev.time} {ev.title}
                      </div>
                    ))}
                    {dateEvs.length > 2 && (
                      <div className="text-[8px] text-slate-500 font-bold pl-1 font-mono">
                        + {dateEvs.length - 2} DİĞER
                      </div>
                    )}
                  </div>

                  {/* Add Event Overlay icon on cell hover */}
                  {isPatron && (
                    <button
                      id={`quick-add-${cell.dateStr}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreateModal(cell.dateStr!);
                      }}
                      className="absolute right-1 bottom-1 p-1 bg-blue-600 text-white rounded-lg opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-md hover:bg-blue-700"
                      title="Bu güne etkinlik ekle"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 justify-between items-center text-xs text-slate-500 font-mono">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Etkinlik Var</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Bugün (14 Haz 2026)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xl bg-slate-900 border border-slate-800 px-1 py-0.5" /> Boş Günler</span>
            </div>
            {isPatron && (
              <div>
                * Hücre köşesindeki <span className="inline-block px-1 bg-slate-800 text-slate-300 rounded font-black">+</span> ikonundan hızlı kayıt ekleyebilirsiniz.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: SELECTED DAY'S DETAILS & JOBS LIST (lg:col-span-4) */}
      <div id="calendar-right-sidebar" className="lg:col-span-4 space-y-6">
        
        {/* EVENT SHEETS BOX */}
        <div id="selected-day bg-card" className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl text-white p-6 relative overflow-hidden">
          {/* Subtle party theme lighting background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/20 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 blur-2xl rounded-full pointer-events-none" />

          <div className="relative flex justify-between items-start mb-4">
            <div>
              <p className="text-blue-105/80 text-xs font-bold uppercase tracking-widest font-mono">SEÇİLİ GÜN</p>
              <h3 id="selected-date-header" className="text-lg font-extrabold flex items-center gap-2 mt-1">
                {new Date(selectedDateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
              </h3>
            </div>
          </div>

          <div className="space-y-4 relative">
            <div className="flex justify-between items-center py-2 border-b border-white/10 text-xs font-mono">
              <span className="text-blue-100">Planlanmış Toplam Hizmet:</span>
              <span className="font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-lg">
                {selectedDayEvents.length} Etkinlik
              </span>
            </div>

            {isPatron && (
              <button
                id="new-event-action-btn"
                onClick={() => openCreateModal(selectedDateStr)}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-blue-900 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl hover:scale-[1.01]"
              >
                <Plus className="w-4 h-4 text-blue-600 stroke-[3]" /> Yeni Etkinlik / İş Kaydı Ekle
              </button>
            )}
          </div>
        </div>

        {/* DAY REMINDERS AREA */}
        {reminders && isPatron && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2 font-mono">
              <Clock className="w-4 h-4 text-teal-400" /> Günün Reji Hatırlatıcıları
            </h4>

            {(() => {
              const dayRems = reminders.filter(r => r.date === selectedDateStr);
              if (dayRems.length === 0) {
                return (
                  <p className="text-xs text-slate-500 italic py-1 font-mono">
                    Bu gün için özel bir hatırlatıcı planlanmamış.
                  </p>
                );
              }
              return (
                <div className="space-y-2">
                  {dayRems.map(rem => (
                    <div 
                      key={rem.id} 
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 transition-all ${
                        rem.isCompleted 
                          ? 'bg-slate-950/30 border-slate-900/30 text-slate-500' 
                          : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleReminder && onToggleReminder(rem.id)}
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                            rem.isCompleted 
                              ? 'bg-emerald-600 border-emerald-500 text-white' 
                              : 'bg-slate-900 border-slate-700 hover:border-blue-500'
                          }`}
                        >
                          {rem.isCompleted && <span className="text-[10px] text-white">✓</span>}
                        </button>
                        <span className={`truncate text-[11px] ${rem.isCompleted ? 'line-through text-slate-500' : ''}`} title={rem.title}>
                          {rem.title}
                        </span>
                      </div>

                      {onDeleteReminder && (
                        <button
                          type="button"
                          onClick={() => onDeleteReminder(rem.id)}
                          className="p-1 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-rose-450 transition-colors shrink-0"
                          title="Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* QUICK FORM TO ADD REMINDER DIRECTLY TO THIS SELECTED DATE */}
            {onAddReminder && (
              <div className="pt-3 border-t border-slate-800/80">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const targetInput = e.currentTarget.elements.namedItem('quickRemTitle') as HTMLInputElement;
                    if (!targetInput || !targetInput.value.trim()) return;
                    onAddReminder({
                      title: targetInput.value.trim(),
                      eventId: 'general',
                      date: selectedDateStr,
                      time: '12:00',
                      isCompleted: false
                    });
                    targetInput.value = '';
                  }}
                  className="flex gap-2"
                >
                  <input 
                    name="quickRemTitle"
                    type="text" 
                    placeholder="Bugün için hızlı görev yaz..." 
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 outline-none transition-all"
                    required
                  />
                  <button 
                    type="submit" 
                    className="p-1 px-3 bg-blue-600 hover:bg-blue-500 text-white text-[11px] rounded-xl font-bold transition-colors shrink-0"
                  >
                    Ekle
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* DETAILED CARDS OF SELECTED DAY EVENTS */}
        <div id="events-scroll-container" className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
          {selectedDayEvents.length === 0 ? (
            <div id="no-events-prompt" className="bg-slate-900/30 border-2 border-dashed border-slate-800/80 rounded-3xl p-8 text-center text-slate-500">
              <Smile className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-bold text-slate-450 text-sm">Bu tarihte planlanmış iş yok.</p>
              <p className="text-xs text-slate-550 mt-1">Sol takvimden başka gün seçebilir veya yeni iş kaydı oluşturabilirsiniz.</p>
            </div>
          ) : (
            selectedDayEvents.map(event => (
              <div
                id={`event-card-${event.id}`}
                key={event.id}
                className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-5 border border-slate-800 hover:border-blue-500/30 transition-all shadow-xl space-y-4 relative group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors">
                      {event.title}
                    </h4>
                    <span className="text-xs text-slate-420 font-mono mt-1 block tracking-tight">Kurul/Saat: {event.date} | {event.time}</span>
                  </div>
                  {getStatusBadge(event.status)}
                </div>

                {/* Event Location */}
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-400">Etkinlik Yeri:</span>
                    <span>{event.location}</span>
                  </div>
                </div>

                {/* Client & Budget */}
                {isPatron && (event.clientName || event.budget) && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-850 text-xs">
                    {event.clientName && (
                      <div>
                        <span className="text-slate-500 block font-mono uppercase tracking-wider text-[9px]">Müşteri:</span>
                        <span className="text-slate-250 font-semibold">{event.clientName}</span>
                      </div>
                    )}
                    {event.budget !== undefined && (
                      <div>
                        <span className="text-slate-500 block font-mono uppercase tracking-wider text-[9px]">İş Bütçesi:</span>
                        <span className="text-blue-400 font-extrabold">{event.budget.toLocaleString('tr-TR')} ₺</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Assigned Crew List */}
                {isPatron && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 font-mono uppercase tracking-tight text-[10px]">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      Görevli Ekip ({event.staff.length} Eleman):
                    </span>
                    {event.staff.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Henüz eleman atanmamış.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {event.staff.map(person => (
                          <span key={person} className="px-2 py-1 bg-slate-950/40 text-slate-300 rounded-lg text-[11px] font-medium border border-slate-850">
                            {person}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Materials List */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 font-mono uppercase tracking-tight text-[10px]">
                    <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                    Kullanılacak Malzemeler:
                  </span>
                  {event.materials.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Henüz malzeme atanmamış.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {event.materials.map(mat => (
                        <span key={mat} className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded-lg text-[11px] border border-amber-900/30 font-medium whitespace-nowrap">
                          {mat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* DJ Note */}
                {event.djService && (
                  <div className="text-xs bg-indigo-500/10 text-indigo-300 p-2.5 rounded-xl border border-indigo-900/30 flex items-center gap-2 font-medium">
                    <Music className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>DJ Hizmeti Dahildir</span>
                  </div>
                )}

                {/* Administrative Notes */}
                {isPatron && event.notes && (
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 text-xs text-slate-400">
                    <p className="font-bold text-slate-300 mb-0.5 font-mono text-[9px] uppercase tracking-wider">Operasyonel Notlar:</p>
                    <p className="italic">"{event.notes}"</p>
                  </div>
                )}

                {/* Actions */}
                {isPatron && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 justify-end">
                    <button
                      id={`edit-event-btn-${event.id}`}
                      type="button"
                      onClick={() => openEditModal(event)}
                      className="p-1.5 px-3 text-xs bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg transition-colors border border-slate-700 flex items-center gap-1 font-semibold"
                    >
                      <Edit className="w-3 h-3" /> Düzenle
                    </button>
                    <button
                      id={`delete-event-btn-${event.id}`}
                      type="button"
                      onClick={() => {
                        if (confirm(`"${event.title}" kaydını silmek istediğinize emin misiniz?`)) {
                          onDeleteEvent(event.id);
                        }
                      }}
                      className="p-1.5 px-3 text-xs text-rose-450 bg-rose-950/20 hover:bg-rose-950/40 rounded-lg transition-colors border border-rose-950/60 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3 h-3" /> Sil
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* EVENT MODAL - CREATE OR EDIT */}
      {isModalOpen && (
        <div id="event-action-modal" className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-800 flex flex-col text-slate-100">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80 rounded-t-3xl">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-500" />
                {editingEvent ? 'Etkinlik Kaydını Düzenle' : `${formDate} için Yeni Etkinlik / İş Ekle`}
              </h3>
              <button
                id="close-modal-btn"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-5 flex-1 bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Event Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Etkinlik Başlığı / İsmi *</label>
                  <input
                    id="modal-title-input"
                    type="text"
                    required
                    placeholder="Örn: Royal Düğün Salonu DJ + Ses Kiralama"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                {/* Event Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">İşin Tarihi *</label>
                  <input
                    id="modal-date-input"
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>

                {/* Event Time */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Kurulum/Başlangıç Saati</label>
                  <input
                    id="modal-time-input"
                    type="time"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                  />
                </div>

                {/* Event Location */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Etkinlik Konumu / Adres *</label>
                  <input
                    id="modal-location-input"
                    type="text"
                    required
                    placeholder="Otel Adı, Salon veya Açık Adres giriniz"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                  />
                </div>

                {/* Client Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Müşteri / Kurum Adı</label>
                  <input
                    id="modal-client-input"
                    type="text"
                    placeholder="Kişi veya Şirket Adı"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Anlaşılan Bütçe (TL)</label>
                  <input
                    id="modal-budget-input"
                    type="number"
                    min="0"
                    placeholder="Örn: 25000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    value={formBudget || ''}
                    onChange={(e) => setFormBudget(Number(e.target.value))}
                  />
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Hizmet Durumu</label>
                  <select
                    id="modal-status-select"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-900 focus:outline-none"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as EventJob['status'])}
                  >
                    <option value="Planlandı">Planlandı / Ayrıldı</option>
                    <option value="Kurulum Aşamasında">Kurulum Aşamasında</option>
                    <option value="Aktif">Aktif (Devam Ediyor)</option>
                    <option value="Tamamlandı">Tamamlandı (Bitti)</option>
                    <option value="İptal">İptal Edildi</option>
                  </select>
                </div>

                {/* Event Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Etkinlik Türü / Tipi</label>
                  <select
                    id="modal-eventtype-select"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-900 focus:outline-none"
                    value={formEventType || 'Diğer'}
                    onChange={(e) => handleEventTypeChange(e.target.value as EventJob['eventType'])}
                  >
                    <option value="Düğün">Düğün (Düğün Paketiyle Otomatik Malzemeler Ekler)</option>
                    <option value="Nişan / Kına">Nişan / Kına</option>
                    <option value="Konser">Konser / Canlı Sahne</option>
                    <option value="Parti">Parti / Kurumsal</option>
                    <option value="Diğer">Diğer / Özelleştirilmiş</option>
                  </select>
                </div>

                {/* DJ Included toggle */}
                <div className="flex items-center pt-8">
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      id="modal-dj-toggle"
                      type="checkbox"
                      className="sr-only peer"
                      checked={formDjService}
                      onChange={(e) => setFormDjService(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                      <Music className="w-4 h-4 text-blue-500" /> DJ Hizmeti Dahil
                    </span>
                  </label>
                </div>
              </div>

              {/* STAFF CRW MULTIPICKER */}
              <div className="border-t border-slate-800 pt-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                  Görevlendirilecek Personel Seçimi (Ekip):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {staffList.map(st => {
                    const isSelected = formSelectedStaff.includes(st.name);
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => toggleFormStaff(st.name)}
                        className={`p-2.5 text-xs text-left border rounded-xl flex items-center justify-between transition-all ${
                          isSelected 
                            ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 font-bold' 
                            : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/55 text-slate-300'
                        }`}
                      >
                        <div>
                          <p className="truncate font-semibold">{st.name}</p>
                          <p className="text-[10px] text-slate-500 font-normal">{st.role}</p>
                        </div>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 ml-1 shadow-md shadow-blue-500/40" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MATERIALS SELECTOR & COUNTER */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Malzeme / Ekipman Ekle (Otomatik Paket Dışı Ekstralar):
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Düğün paketi dışında kalan veya diğer etkinlikleriniz için gerekli olan ekstra malzemeleri buraya yazıp ekleyebilirsiniz:
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="modal-custom-equip-text"
                      type="text"
                      placeholder="Örn: Ekstra Led Ekran, Jeneratör, Sis Makinesi, Robot Işık..."
                      className="flex-1 px-3 py-2 text-sm bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                      value={customEquipName}
                      onChange={(e) => setCustomEquipName(e.target.value)}
                    />

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-semibold text-slate-500">Miktar:</span>
                      <input
                        id="modal-equip-qty"
                        type="number"
                        min="1"
                        className="w-16 px-2 py-1.5 text-center bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
                        value={customEquipQty}
                        onChange={(e) => setCustomEquipQty(Math.max(1, Number(e.target.value)))}
                      />
                      <button
                        id="modal-equip-add-btn"
                        type="button"
                        onClick={() => {
                          if (!customEquipName.trim()) return;
                          addEquipmentToForm(customEquipName.trim(), customEquipQty);
                          setCustomEquipName('');
                          setCustomEquipQty(1);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                      >
                        Ekstra Ekle
                      </button>
                    </div>
                  </div>
                </div>

                {/* Displaying Currently Assigned Equipment inside Form */}
                {formSelectedEquipment.length > 0 && (
                  <div className="p-3 bg-slate-950/60 rounded-xl space-y-1.5 border border-slate-850">
                    <p className="text-xs font-semibold text-slate-450 font-mono">Atanmış Malzemeler:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {formSelectedEquipment.map(item => (
                        <span 
                          key={item} 
                          className="pl-2.5 pr-1.5 py-1 text-xs bg-amber-500/10 text-amber-300 border border-amber-900/30 rounded-lg font-medium flex items-center gap-1 shadow-xs"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => removeEquipmentFromForm(item)}
                            className="p-0.5 hover:bg-amber-500/20 text-amber-500 hover:text-amber-300 rounded-full transition-colors"
                            title="Malzemeyi Çıkar"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Operational Notes */}
              <div className="border-t border-slate-800 pt-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Teknik ve Operasyonel Notlar</label>
                <textarea
                  id="modal-notes-input"
                  rows={3}
                  placeholder="Kullanıcı kuruluma ne zaman gelecek? Güç kaynağı nerede? Özel DJ istekleri var mı?"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-blue-500/25 focus:outline-none text-sm"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="p-5 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/80 rounded-b-3xl">
                <button
                  id="modal-cancel-btn"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-xl text-sm font-semibold transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  id="modal-save-btn"
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/10"
                >
                  {editingEvent ? 'Değişiklikleri Kaydet' : 'Etkinliği Planla'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
