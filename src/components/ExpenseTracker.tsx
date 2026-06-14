import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Trash2, 
  Plus, 
  ChevronRight, 
  Search, 
  DollarSign, 
  Tag, 
  User, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Download, 
  PieChart, 
  X,
  FileCheck
} from 'lucide-react';
import { Expense, EventJob, Staff } from '../types';

interface ExpenseTrackerProps {
  expenses: Expense[];
  events: EventJob[];
  staffList: Staff[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

export default function ExpenseTracker({
  expenses,
  events,
  staffList,
  onAddExpense,
  onDeleteExpense
}: ExpenseTrackerProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPerson, setFilterPerson] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Add Expense form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formPerson, setFormPerson] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDate, setFormDate] = useState('2026-06-14');
  const [formCategory, setFormCategory] = useState<Expense['category']>('Yemek');
  const [formEventId, setFormEventId] = useState('general');
  const [formNotes, setFormNotes] = useState('');

  // Get name of the event from ID
  const getEventName = (eventId: string) => {
    if (eventId === 'general') return 'Genel Gider / Bağımsız';
    const ev = events.find(e => e.id === eventId);
    return ev ? ev.title : 'Bilinmeyen Etkinlik';
  };

  // Filtered Expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPerson = !filterPerson || exp.person === filterPerson;
      const matchesEvent = !filterEvent || exp.eventId === filterEvent;
      const matchesCategory = !filterCategory || exp.category === filterCategory;

      return matchesSearch && matchesPerson && matchesEvent && matchesCategory;
    });
  }, [expenses, searchTerm, filterPerson, filterEvent, filterCategory]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    
    // Category totals
    const byCategory: Record<Expense['category'], number> = {
      'Ulaşım': 0,
      'Yemek': 0,
      'Malzeme': 0,
      'Konaklama': 0,
      'Teknik/Ek': 0,
      'Diğer': 0
    };
    
    // Staff totals
    const byStaff: Record<string, number> = {};

    expenses.forEach(exp => {
      if (byCategory[exp.category] !== undefined) {
        byCategory[exp.category] += exp.amount;
      } else {
        byCategory[exp.category] = exp.amount;
      }

      byStaff[exp.person] = (byStaff[exp.person] || 0) + exp.amount;
    });

    // Find highest spending member
    let topSpender = 'Elde Yok';
    let maxSpend = 0;
    Object.entries(byStaff).forEach(([person, amount]) => {
      if (amount > maxSpend) {
        maxSpend = amount;
        topSpender = person;
      }
    });

    return {
      total,
      byCategory,
      byStaff,
      topSpender,
      maxSpend
    };
  }, [expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAmount || !formPerson) {
      alert('Lütfen Tüm Zorunlu Alanları (Harcama Tanımı, Harcayan Kişi we Tutar) Doldurunuz!');
      return;
    }

    onAddExpense({
      title: formTitle,
      person: formPerson,
      amount: Number(formAmount),
      date: formDate,
      category: formCategory,
      eventId: formEventId,
      notes: formNotes
    });

    // Reset Form
    setFormTitle('');
    setFormPerson('');
    setFormAmount(0);
    setFormNotes('');
    setIsFormOpen(false);
  };

  // Safe category badges colors
  const getCategoryColor = (cat: Expense['category']) => {
    switch (cat) {
      case 'Ulaşım': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Yemek': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'Malzeme': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Konaklama': return 'bg-violet-500/10 text-violet-400 border-violet-500/30';
      case 'Teknik/Ek': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default: return 'bg-slate-800 text-slate-350 border-slate-700';
    }
  };

  return (
    <div id="expense-section" className="space-y-6">
      
      {/* STATS DECK */}
      <div id="expense-stats-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Total Spend */}
        <div id="total-spend-card" className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="p-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider font-mono text-xs">Toplam Harcama / Gider</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {stats.total.toLocaleString('tr-TR')} ₺
            </h3>
            <p className="text-xs text-slate-500 mt-1">Sisteme kayıtlı {expenses.length} harcama kalemi</p>
          </div>
        </div>

        {/* Card 2: Highest Spending Crew Member */}
        <div id="top-spender-card" className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="p-4 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-2xl">
            <User className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider font-mono text-xs">En Çok Harcama Yapan</p>
            <h3 className="text-xl font-bold text-slate-200 mt-1 truncate max-w-[200px]">
              {stats.topSpender}
            </h3>
            <p className="text-xs text-violet-400 font-bold mt-1">
              Firma Adına: {stats.maxSpend.toLocaleString('tr-TR')} ₺
            </p>
          </div>
        </div>

        {/* Card 3: Distribution Gauge */}
        <div id="category-summary-card" className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider font-mono text-xs">Gider Kategori Dağılımı</p>
            <PieChart className="w-4 h-4 text-slate-500" />
          </div>
          <div className="space-y-2">
            {Object.entries(stats.byCategory).map(([cat, val]) => {
              const valNum = val as number;
              const pct = stats.total > 0 ? (valNum / stats.total) * 100 : 0;
              if (valNum === 0) return null;
              return (
                <div key={cat} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-450">
                    <span>{cat}</span>
                    <span className="font-mono text-slate-300">{pct.toFixed(0)}% ({valNum.toLocaleString('tr-TR')} ₺)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className={`h-full rounded-full ${
                        cat === 'Ulaşım' ? 'bg-cyan-500' :
                        cat === 'Yemek' ? 'bg-orange-500' :
                        cat === 'Malzeme' ? 'bg-amber-500' :
                        cat === 'Konaklama' ? 'bg-violet-500' :
                        cat === 'Teknik/Ek' ? 'bg-indigo-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {stats.total === 0 && (
              <p className="text-xs text-slate-500 italic py-2 text-center font-mono">Gider kaydı bulunmuyor.</p>
            )}
          </div>
        </div>
      </div>

      {/* FILTER PANEL AND MAIN LISTING BLOCK */}
      <div id="expense-main-body" className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        
        {/* CONTROLLERS HEADER */}
        <div id="expense-list-header" className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-white">Harcama ve Gider Kayıtları</h3>
            <p className="text-xs text-slate-400">Hangi çalışanın hangi iş için ne kadar harcadığını takip edin.</p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              id="open-expense-form-btn"
              onClick={() => setIsFormOpen(true)}
              className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-rose-600/10"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Yeni Gider / Harcama Gir
            </button>
          </div>
        </div>

        {/* SEARCH AND COMBOCONS (FILTERS) */}
        <div id="expense-filters" className="p-4 bg-slate-950/60 border-b border-slate-850 grid grid-cols-1 sm:grid-cols-4 gap-3">
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              id="expense-search-input"
              type="text"
              placeholder="Tanımlarda ara..."
              className="w-full pl-9 pr-4 py-2 border border-slate-800 rounded-xl text-xs bg-slate-900 text-slate-150 placeholder-slate-550 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select
              id="expense-filter-person"
              className="w-full px-3 py-2 border border-slate-800 rounded-xl text-xs bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              value={filterPerson}
              onChange={(e) => setFilterPerson(e.target.value)}
            >
              <option value="">Harcayan Eleman (Tümü)</option>
              {staffList.map(st => (
                <option key={st.id} value={st.name} className="bg-slate-900">{st.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              id="expense-filter-event"
              className="w-full px-3 py-2 border border-slate-800 rounded-xl text-xs bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
            >
              <option value="">İlişkili Etkinlik (Tümü)</option>
              <option value="general" className="bg-slate-900">Genel / Bağımsız Gider</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id} className="bg-slate-900">{ev.title} ({ev.date})</option>
              ))}
            </select>
          </div>

          <div>
            <select
              id="expense-filter-cat"
              className="w-full px-3 py-2 border border-slate-800 rounded-xl text-xs bg-slate-900 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">Gider Kategorisi (Tümü)</option>
              <option value="Ulaşım" className="bg-slate-900">Ulaşım / HGS</option>
              <option value="Yemek" className="bg-slate-900">Yemek / İaşe</option>
              <option value="Malzeme" className="bg-slate-900">Malzeme / Sarf</option>
              <option value="Konaklama" className="bg-slate-900">Konaklama / Otel Gideri</option>
              <option value="Teknik/Ek" className="bg-slate-900">Teknik / Jeneratör / Yakıt</option>
              <option value="Diğer" className="bg-slate-900">Diğer</option>
            </select>
          </div>

        </div>

        {/* DATA TABLE */}
        <div id="expense-table-wrapper" className="overflow-x-auto text-slate-200">
          {filteredExpenses.length === 0 ? (
            <div id="expense-empty-state" className="p-12 text-center text-slate-500">
              <FileCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="font-bold text-slate-400 text-sm">Aranan kriterlere uygun harcama kaydı bulunamadı.</p>
              <p className="text-xs text-slate-500 mt-1">Filtreleri sıfırlayabilir veya sağ üstten yeni harcama ekleyebilirsiniz.</p>
            </div>
          ) : (
            <table id="expense-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-bold text-slate-450 uppercase tracking-widest font-mono">
                  <th className="py-3.5 px-6">Harcama Tanımı / Detay</th>
                  <th className="py-3.5 px-6">Harcayan Eleman</th>
                  <th className="py-3.5 px-6">İlişkili İş / Etkinlik</th>
                  <th className="py-3.5 px-6">Kategori</th>
                  <th className="py-3.5 px-6">Ödeme Tarihi</th>
                  <th className="py-3.5 px-6 text-right">Tutar</th>
                  <th className="py-3.5 px-6 text-center w-12">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-900/20 transition-all border-b border-slate-900/20">
                    
                    {/* Title & Notes */}
                    <td className="py-4 px-6 max-w-xs">
                      <div>
                        <span className="font-bold text-white block text-sm">{exp.title}</span>
                        {exp.notes && (
                          <span className="text-xs text-slate-450 block italic mt-0.5 truncate">"{exp.notes}"</span>
                        )}
                      </div>
                    </td>

                    {/* Who Spent */}
                    <td className="py-4 px-6 font-medium text-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-slate-950 font-mono text-slate-350 border border-slate-800 flex items-center justify-center text-[9px] font-bold">
                          {exp.person.split(' ').map(n=>n[0]).join('')}
                        </div>
                        {exp.person}
                      </div>
                    </td>

                    {/* Associated Job */}
                    <td className="py-4 px-6 text-slate-400 max-w-xs truncate">
                      <span className="text-xs px-2.5 py-1 bg-slate-950/50 rounded-lg text-slate-300 border border-slate-850">
                        {getEventName(exp.eventId)}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${getCategoryColor(exp.category)}`}>
                        {exp.category}
                      </span>
                    </td>

                    {/* Payment/Expense Date */}
                    <td className="py-4 px-6 font-mono text-xs text-slate-450">
                      {exp.date}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 text-right font-black text-rose-455 text-base">
                      {exp.amount.toLocaleString('tr-TR')} ₺
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-center">
                      <button
                        id={`delete-expense-btn-${exp.id}`}
                        onClick={() => {
                          if (confirm(`"${exp.title}" harcamasını silmek istediğinize emin misiniz?`)) {
                            onDeleteExpense(exp.id);
                          }
                        }}
                        className="p-1 px-2.5 text-rose-450 hover:bg-rose-950/30 border border-rose-950/40 rounded-lg transition-colors inline-block text-xs"
                        title="Gideri Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* EXPENSE ADDING MODAL/FORM */}
      {isFormOpen && (
        <div id="expense-action-modal" className="fixed inset-0 bg-[#020617]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-800 flex flex-col max-h-[90vh] text-slate-150">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80 rounded-t-3xl">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-500" />
                Gider / Harcama Girişi
              </h3>
              <button
                id="close-expense-modal"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              
              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Harcama Açıklaması *</label>
                <input
                  id="form-expense-title"
                  type="text"
                  required
                  placeholder="Örn: 200 Litre Jeneratör Mazotu"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              {/* Amount (TL) & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tutar (TL) *</label>
                  <input
                    id="form-expense-amount"
                    type="number"
                    min="1"
                    required
                    placeholder="Tutar"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    value={formAmount || ''}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Ödeme Tarihi</label>
                  <input
                    id="form-expense-date"
                    type="date"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Person Who Paid (Crew) */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ödemeyi Yapan Eleman *</label>
                <select
                  id="form-expense-person"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm bg-slate-900 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  value={formPerson}
                  onChange={(e) => setFormPerson(e.target.value)}
                >
                  <option value="" className="bg-slate-950">Seçiniz...</option>
                  {staffList.map(st => (
                    <option key={st.id} value={st.name} className="bg-slate-950">{st.name} ({st.role})</option>
                  ))}
                </select>
              </div>

              {/* Expense Category & Associated Event */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kategori</label>
                <select
                  id="form-expense-category"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm bg-slate-900 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as Expense['category'])}
                >
                  <option value="Ulaşım" className="bg-slate-950">Ulaşım / Nakliye / Geçiş Ücreti</option>
                  <option value="Yemek" className="bg-slate-950">Yemek / İaşe</option>
                  <option value="Malzeme" className="bg-slate-950">Malzeme Alımı / Sarf Malzeme</option>
                  <option value="Konaklama" className="bg-slate-950">Konaklama / Otel Gideri</option>
                  <option value="Teknik/Ek" className="bg-slate-950">Teknik / Yakıt / Jeneratör ekleri</option>
                  <option value="Diğer" className="bg-slate-950">Diğer Gider</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">İlişkili İş / Etkinlik</label>
                <select
                  id="form-expense-eventid"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm bg-slate-900 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  value={formEventId}
                  onChange={(e) => setFormEventId(e.target.value)}
                >
                  <option value="general" className="bg-slate-950">Genel Gider / Herhangi bir işe bağlı değil</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id} className="bg-slate-950">{ev.title} ({ev.date})</option>
                  ))}
                </select>
              </div>

              {/* Additional notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Gider Notu / Ek Detay</label>
                <textarea
                  id="form-expense-notes"
                  rows={2}
                  placeholder="Fatura no, fiş detayı veya ek açıklamalar..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  id="form-expense-cancel"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  İptal
                </button>
                <button
                  id="form-expense-submit"
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/10 uppercase tracking-wider"
                >
                  Kaydet
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
