import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  CreditCard, 
  Users, 
  TrendingUp, 
  Volume2, 
  Info, 
  CheckCircle, 
  Activity, 
  DollarSign, 
  Truck,
  Briefcase,
  CloudLightning,
  Database,
  Cloud,
  LogOut,
  UserCheck,
  Bell,
  BellRing,
  Check,
  AlertCircle,
  Trash,
  Plus,
  X,
  Volume1,
  VolumeX
} from 'lucide-react';

import { EventJob, Expense, Staff, Equipment, Reminder } from './types';
import { 
  INITIAL_EVENTS, 
  INITIAL_EXPENSES, 
  INITIAL_STAFF, 
  INITIAL_EQUIPMENT 
} from './data/mockData';

import { 
  db, 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  handleFirestoreError, 
  OperationType 
} from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';

import CalendarView from './components/CalendarView';
import ExpenseTracker from './components/ExpenseTracker';
import StaffEquipmentManager from './components/StaffEquipmentManager';

export default function App() {
  // --- STATE FOR RESILIENT DUAL PERSISTENCE ---
  const getStoredData = <T,>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
      console.error('Local Storage read error', e);
      return fallback;
    }
  };

  const [events, setEvents] = useState<EventJob[]>(() => 
    getStoredData('rf_events_data', INITIAL_EVENTS).filter((e: any) => !['v1', 'v2', 'v3', 'v4', 'v5'].includes(e.id))
  );
  
  const [expenses, setExpenses] = useState<Expense[]>(() => 
    getStoredData('rf_expenses_data', INITIAL_EXPENSES).filter((e: any) => !['ex1', 'ex2', 'ex3', 'ex4', 'ex5', 'ex6', 'ex7'].includes(e.id))
  );
  
  const [staffList, setStaffList] = useState<Staff[]>(() => 
    getStoredData('rf_staff_data', INITIAL_STAFF)
  );

  const INITIAL_REMINDERS: Reminder[] = [];

  const [reminders, setReminders] = useState<Reminder[]>(() =>
    getStoredData('rf_reminders_data', INITIAL_REMINDERS).filter((r: any) => !['rem-1', 'rem-2', 'rem-3'].includes(r.id))
  );

  const [dbMode, setDbMode] = useState<'cloud' | 'local'>('local');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // --- CUSTOM AUTHENTICATION & ACCESS CONTROL ENGINES ---
  const [customUser, setCustomUser] = useState<{name: string; code: string; role: 'patron' | 'calisan'} | null>(() => 
    getStoredData('asl_custom_user', null)
  );
  const [loginName, setLoginName] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [generatedCodeInfo, setGeneratedCodeInfo] = useState<{name: string, code: string} | null>(null);

  const handleGetCode = async () => {
    setLoginError('');
    setGeneratedCodeInfo(null);
    if (!loginName.trim()) {
      setLoginError("Lütfen kullanıcı kodu almadan önce Ad ve Soyadınızı giriniz.");
      return;
    }

    setGeneratingCode(true);
    const fullName = loginName.trim();
    // Simple translit to normalize characters
    const norm = fullName.toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');

    let code = '';
    let role: 'patron' | 'calisan' = 'calisan';

    // Patron override check
    if (norm.includes('ozan') && norm.includes('ozcan')) {
      code = '1903';
      role = 'patron';
    } else if (norm.includes('mustafa') && norm.includes('cihan')) {
      code = '1923';
      role = 'patron';
    } else {
      // General staff code handling
      try {
        const docRef = doc(db, 'user_codes', norm);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          code = data.code;
          role = data.role || 'calisan';
        } else {
          // Generate pseudo random 6-digit number
          const rand = Math.floor(100000 + Math.random() * 900000);
          code = String(rand);
          role = 'calisan';
          // Save in Firestore for multi-device sync
          await setDoc(docRef, {
            name: fullName,
            code,
            role,
            createdAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.warn("Firestore error getting code, using local cached registries:", e);
        const localRegistry = getStoredData<Record<string, {name: string, code: string, role: string}>>('asl_local_codes_registry', {});
        if (localRegistry[norm]) {
          code = localRegistry[norm].code;
          role = localRegistry[norm].role as 'patron' | 'calisan';
        } else {
          const rand = Math.floor(100000 + Math.random() * 900000);
          code = String(rand);
          role = 'calisan';
          localRegistry[norm] = { name: fullName, code, role };
          localStorage.setItem('asl_local_codes_registry', JSON.stringify(localRegistry));
        }
      }
    }

    setGeneratingCode(false);
    setLoginCode(code);
    setGeneratedCodeInfo({ name: fullName, code });
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginName.trim() || !loginCode.trim()) {
      setLoginError("Lütfen Ad Soyad ve Kullanıcı Kodu alanlarını doldurunuz.");
      return;
    }

    const nameVal = loginName.trim();
    const codeVal = loginCode.trim();

    const norm = nameVal.toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');

    let role: 'patron' | 'calisan' = 'calisan';

    if (codeVal === '1903' || codeVal === '1923') {
      role = 'patron';
    } else {
      role = 'calisan';
    }

    if (norm.includes('ozan') && norm.includes('ozcan') && codeVal === '1903') {
      role = 'patron';
    } else if (norm.includes('mustafa') && norm.includes('cihan') && codeVal === '1923') {
      role = 'patron';
    }

    const userData = {
      name: nameVal,
      code: codeVal,
      role
    };

    setCustomUser(userData);
    localStorage.setItem('asl_custom_user', JSON.stringify(userData));
    setGeneratedCodeInfo(null);
  };

  const handleCustomLogout = () => {
    setCustomUser(null);
    localStorage.removeItem('asl_custom_user');
    setLoginName('');
    setLoginCode('');
    setLoginError('');
  };

  // Active View Tab Control
  const [activeTab, setActiveTab] = useState<'calendar' | 'expenses' | 'inventory'>('calendar');

  // --- GOOGLE FIREBASE CLOUD REAL-TIME SYNCHRONIZER ---
  useEffect(() => {
    // 1. Auth Listener
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthChecking(false);
    });

    // 2. Real-time Database Snapshot Subscribers
    let unsubEvents: (() => void) | null = null;
    let unsubStaff: (() => void) | null = null;
    let unsubExpenses: (() => void) | null = null;
    let unsubReminders: (() => void) | null = null;

    const startFirestoreSync = async () => {
      try {
        // Optimistically set to cloud
        setDbMode('cloud');

        // Subscribe to events
        unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
          if (snapshot.empty) {
            if (INITIAL_EVENTS.length > 0) {
              // Seed INITIAL_EVENTS if free-tier cloud is fully blank
              INITIAL_EVENTS.forEach(async (ev) => {
                await setDoc(doc(db, 'events', ev.id), ev);
              });
            } else {
              setEvents([]);
              localStorage.setItem('rf_events_data', JSON.stringify([]));
            }
          } else {
            const list: EventJob[] = [];
            snapshot.forEach((snap) => {
              const id = snap.id;
              if (['v1', 'v2', 'v3', 'v4', 'v5'].includes(id)) {
                // Wipe stale mock events from Firestore
                deleteDoc(doc(db, 'events', id)).catch(e => console.warn(e));
              } else {
                list.push({ ...snap.data(), id } as EventJob);
              }
            });
            // Sort by date then time
            list.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
            setEvents(list);
            localStorage.setItem('rf_events_data', JSON.stringify(list));
          }
        }, (err) => {
          console.warn("Firestore collection events snapshot failed (Terms or offline), falling back to Local Storage: ", err.message);
          setDbMode('local');
        });

        // Subscribe to technical staff
        unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
          if (snapshot.empty) {
            if (INITIAL_STAFF.length > 0) {
              // Seed INITIAL_STAFF if Firestore holds no personnel records
              INITIAL_STAFF.forEach(async (st) => {
                await setDoc(doc(db, 'staff', st.id), st);
              });
            } else {
              setStaffList([]);
              localStorage.setItem('rf_staff_data', JSON.stringify([]));
            }
          } else {
            const list: Staff[] = [];
            snapshot.forEach((snap) => {
              list.push({ ...snap.data(), id: snap.id } as Staff);
            });
            setStaffList(list);
            localStorage.setItem('rf_staff_data', JSON.stringify(list));
          }
        }, (err) => {
          console.warn("Firestore collection staff snapshot failed, falling back: ", err.message);
          setDbMode('local');
        });

        // Subscribe to operation expenses
        unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
          if (snapshot.empty) {
            if (INITIAL_EXPENSES.length > 0) {
              // Seed INITIAL_EXPENSES on clean DB
              INITIAL_EXPENSES.forEach(async (ex) => {
                await setDoc(doc(db, 'expenses', ex.id), ex);
              });
            } else {
              setExpenses([]);
              localStorage.setItem('rf_expenses_data', JSON.stringify([]));
            }
          } else {
            const list: Expense[] = [];
            snapshot.forEach((snap) => {
              const id = snap.id;
              if (['ex1', 'ex2', 'ex3', 'ex4', 'ex5', 'ex6', 'ex7'].includes(id)) {
                // Wipe stale mock expenses from Firestore
                deleteDoc(doc(db, 'expenses', id)).catch(e => console.warn(e));
              } else {
                list.push({ ...snap.data(), id } as Expense);
              }
            });
            setExpenses(list);
            localStorage.setItem('rf_expenses_data', JSON.stringify(list));
          }
        }, (err) => {
          console.warn("Firestore collection expenses snapshot failed, falling back: ", err.message);
          setDbMode('local');
        });

        // Subscribe to event reminders
        unsubReminders = onSnapshot(collection(db, 'reminders'), (snapshot) => {
          if (snapshot.empty) {
            if (INITIAL_REMINDERS.length > 0) {
              // Seed INITIAL_REMINDERS on first boot
              INITIAL_REMINDERS.forEach(async (rem) => {
                await setDoc(doc(db, 'reminders', rem.id), rem);
              });
            } else {
              setReminders([]);
              localStorage.setItem('rf_reminders_data', JSON.stringify([]));
            }
          } else {
            const list: Reminder[] = [];
            snapshot.forEach((snap) => {
              const id = snap.id;
              if (['rem-1', 'rem-2', 'rem-3'].includes(id)) {
                // Wipe stale mock reminders from Firestore
                deleteDoc(doc(db, 'reminders', id)).catch(e => console.warn(e));
              } else {
                list.push({ ...snap.data(), id } as Reminder);
              }
            });
            setReminders(list);
            localStorage.setItem('rf_reminders_data', JSON.stringify(list));
          }
        }, (err) => {
          console.warn("Firestore collection reminders snapshot failed, falling back: ", err.message);
          setDbMode('local');
        });

      } catch (err) {
        console.error("Failed to boot Firebase Firestore. Resilient local fallback mode keeps app 100% responsive:", err);
        setDbMode('local');
      }
    };

    startFirestoreSync();

    return () => {
      unsubscribeAuth();
      if (unsubEvents) unsubEvents();
      if (unsubStaff) unsubStaff();
      if (unsubExpenses) unsubExpenses();
      if (unsubReminders) unsubReminders();
    };
  }, []);

  // --- DUAL-WRITE OPERATIONAL STATE ACTIONS ---

  // Events
  const handleAddEvent = async (newEvent: Omit<EventJob, 'id'>) => {
    const id = `ev-${Date.now()}`;
    const fullEvent = { ...newEvent, id } as EventJob;
    
    // Update local state and disk storage instantly for immediate response
    const updated = [...events, fullEvent];
    setEvents(updated);
    localStorage.setItem('rf_events_data', JSON.stringify(updated));

    // Async write to Cloud
    try {
      await setDoc(doc(db, 'events', id), fullEvent);
    } catch (e) {
      console.warn("Could not sync added event to Cloud Database. Persisted locally under LocalStorage:", e);
    }
  };

  const handleUpdateEvent = async (updatedEvent: EventJob) => {
    const updated = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    setEvents(updated);
    localStorage.setItem('rf_events_data', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'events', updatedEvent.id), updatedEvent);
    } catch (e) {
      console.warn("Could not sync updated event to Cloud Database:", e);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    localStorage.setItem('rf_events_data', JSON.stringify(updated));

    // Cleanup local expenses bound to this event ID
    const cleanedExpenses = expenses.filter(exp => exp.eventId !== id);
    setExpenses(cleanedExpenses);
    localStorage.setItem('rf_expenses_data', JSON.stringify(cleanedExpenses));

    try {
      await deleteDoc(doc(db, 'events', id));
      // Delete bound expenses on cloud as well
      const cloudExpensesToDelete = expenses.filter(exp => exp.eventId === id);
      cloudExpensesToDelete.forEach(async (exp) => {
        await deleteDoc(doc(db, 'expenses', exp.id));
      });
    } catch (e) {
      console.warn("Could not sync deletion of event to Cloud Database:", e);
    }
  };

  // Expenses
  const handleAddExpense = async (newExpense: Omit<Expense, 'id'>) => {
    const id = `ex-${Date.now()}`;
    const fullExpense = { ...newExpense, id } as Expense;

    const updated = [...expenses, fullExpense] as Expense[];
    setExpenses(updated);
    localStorage.setItem('rf_expenses_data', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'expenses', id), fullExpense);
    } catch (e) {
      console.warn("Could not sync added expense entry to Cloud Database:", e);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    localStorage.setItem('rf_expenses_data', JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (e) {
      console.warn("Could not sync expense deletion to Cloud:", e);
    }
  };

  // Staff / Personnel Squad members
  const handleAddStaff = async (newStaff: Omit<Staff, 'id'>) => {
    const id = `st-${Date.now()}`;
    const fullStaff = { ...newStaff, id } as Staff;

    const updated = [...staffList, fullStaff] as Staff[];
    setStaffList(updated);
    localStorage.setItem('rf_staff_data', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'staff', id), fullStaff);
    } catch (e) {
      console.warn("Could not sync added staff member to Cloud Database:", e);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    const victim = staffList.find(s => s.id === id);
    const updated = staffList.filter(s => s.id !== id);
    setStaffList(updated);
    localStorage.setItem('rf_staff_data', JSON.stringify(updated));

    // Unassign staff members from active events to prevent orphaned tasks in lists
    if (victim) {
      const updatedEvents = events.map(ev => ({
        ...ev,
        staff: ev.staff.filter(name => name !== victim.name)
      }));
      setEvents(updatedEvents);
      localStorage.setItem('rf_events_data', JSON.stringify(updatedEvents));

      try {
        await deleteDoc(doc(db, 'staff', id));
        // Push updates to events affected by this unassignment in Firebase
        const affectedGigs = events.filter(ev => ev.staff.includes(victim.name));
        affectedGigs.forEach(async (ev) => {
          const updatedEv = {
            ...ev,
            staff: ev.staff.filter(name => name !== victim.name)
          };
          await setDoc(doc(db, 'events', ev.id), updatedEv);
        });
      } catch (e) {
        console.warn("Could not sync crew deletion to Cloud:", e);
      }
    }
  };

  // --- REMINDERS ACTIONS ---
  const handleAddReminder = async (newRem: Omit<Reminder, 'id'>) => {
    const id = `rem-${Date.now()}`;
    const fullRem = { ...newRem, id } as Reminder;

    const updated = [...reminders, fullRem];
    setReminders(updated);
    localStorage.setItem('rf_reminders_data', JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'reminders', id), fullRem);
    } catch (e) {
      console.warn("Could not sync added reminder to Firestore:", e);
    }
  };

  const handleToggleReminder = async (id: string) => {
    const updated = reminders.map(r => r.id === id ? { ...r, isCompleted: !r.isCompleted } : r);
    setReminders(updated);
    localStorage.setItem('rf_reminders_data', JSON.stringify(updated));

    const targetRem = updated.find(r => r.id === id);
    if (targetRem) {
      try {
        await setDoc(doc(db, 'reminders', id), targetRem);
      } catch (e) {
        console.warn("Could not sync toggled reminder to Firestore:", e);
      }
    }
  };

  const handleDeleteReminder = async (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    localStorage.setItem('rf_reminders_data', JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, 'reminders', id));
    } catch (e) {
      console.warn("Could not sync deletion of reminder to Firestore:", e);
    }
  };




  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Custom states for custom reminder creator inside the notifications panel
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderEventId, setNewReminderEventId] = useState('general');
  const [newReminderDate, setNewReminderDate] = useState('2026-06-14');
  const [newReminderTime, setNewReminderTime] = useState('12:00');

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.12);

      osc2.frequency.setValueAtTime(293.66, ctx.currentTime);
      osc2.frequency.setValueAtTime(440, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.log('Web Audio notification block:', e);
    }
  };

  const prevActiveCountRef = React.useRef(0);
  const activeRemindersCount = useMemo(() => {
    return reminders.filter(r => !r.isCompleted).length;
  }, [reminders]);

  useEffect(() => {
    if (activeRemindersCount > prevActiveCountRef.current) {
      if (soundEnabled) {
        playNotificationSound();
      }
    }
    prevActiveCountRef.current = activeRemindersCount;
  }, [activeRemindersCount, soundEnabled]);

  const automatedAlerts = useMemo(() => {
    const alerts: { id: string; title: string; type: 'critical' | 'warning' | 'info'; eventId?: string }[] = [];
    
    events.forEach(event => {
      // 1. Missing Staff
      if (event.status !== 'Tamamlandı' && event.status !== 'İptal' && event.staff.length === 0) {
        alerts.push({
          id: `auto-staff-${event.id}`,
          title: `Eksik Kadro: "${event.title}" etkinliğine hiçbir personel atanmadı!`,
          type: 'critical',
          eventId: event.id
        });
      }
      
      // 2. DJ Service check
      if (event.status !== 'Tamamlandı' && event.status !== 'İptal' && event.djService) {
        const hasDjAssigned = event.staff.some(sName => {
          const staffMember = staffList.find(s => s.name === sName);
          return staffMember?.role.toLowerCase().includes('dj');
        });
        if (!hasDjAssigned) {
          alerts.push({
            id: `auto-dj-${event.id}`,
            title: `DJ Eksikliği: "${event.title}" için DJ hizmeti talep edildi ama kadroda aktif DJ bulunmuyor!`,
            type: 'warning',
            eventId: event.id
          });
        }
      }

      // 3. Imminent events (Today or Tomorrow)
      if (event.status !== 'Tamamlandı' && event.status !== 'İptal') {
        if (event.date === '2026-06-14') {
          alerts.push({
            id: `auto-today-${event.id}`,
            title: `BUGÜN ETKİNLİK VAR: "${event.title}" bugün saat ${event.time}'da gerçekleşecek. Ekip hazır mı?`,
            type: 'critical',
            eventId: event.id
          });
        } else if (event.date === '2026-06-15') {
          alerts.push({
            id: `auto-tomorrow-${event.id}`,
            title: `YARIN ETKİNLİK VAR: "${event.title}" yarın başlıyor. Kurulum planlamasını canlandırın.`,
            type: 'info',
            eventId: event.id
          });
        }
      }
    });

    return alerts;
  }, [events, staffList]);


  // --- DYNAMIC STATISTICS CALCULATIONS ---
  const companyStats = useMemo(() => {
    // Total income from active/completed events (Sum of budgets where status is not Cancelled)
    const totalIncome = events
      .filter(e => e.status !== 'İptal')
      .reduce((sum, e) => sum + (e.budget || 0), 0);

    // Total expenses paid out
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculated Profit Margin
    const netProfit = totalIncome - totalExpenses;
    const profitMarginPct = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Counts
    const activeJobsCount = events.filter(e => e.status === 'Planlandı' || e.status === 'Kurulum Aşamasında' || e.status === 'Aktif').length;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMarginPct,
      activeJobsCount
    };
  }, [events, expenses]);

  if (!customUser) {
    return (
      <div id="login-container" className="min-h-screen bg-[#020617] text-slate-100 font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative ambient background spheres */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
        
        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 relative shadow-2xl z-10 flex flex-col space-y-6">
          {/* Brand header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-500 mx-auto relative shadow-lg shadow-blue-500/10 group overflow-hidden">
              <div className="absolute inset-1 rounded-full border border-dashed border-slate-800/80 animate-spin" style={{ animationDuration: '6s' }}></div>
              <Volume2 className="w-7 h-7 text-blue-400 relative z-0" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-white">
                Asia Sound & Light <span className="text-blue-500">Technology</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold mt-1">Sistem & Hizmet Defteri Giriş</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Ad Soyad</label>
              <input
                type="text"
                placeholder="Örn: Ozan Özcan"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Kullanıcı Kodu</label>
              <input
                type="text"
                placeholder="Kodunuzu giriniz veya alınız"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all font-mono font-bold"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {generatedCodeInfo && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px] font-mono text-emerald-300">
                  <CheckCircle className="w-4 h-4 text-emerald-450 shrink-0" />
                  Kullanıcı Kodu Atandı!
                </div>
                <p className="mt-1">Sayın <strong className="text-white">{generatedCodeInfo.name}</strong>, sizin için özel belirlenen giriş kodunuz:</p>
                <div className="mt-2 text-center text-lg font-black font-mono tracking-widest text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/30">
                  {generatedCodeInfo.code}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 italic font-medium">// Kodunuz sisteme kaydedildi. Lütfen bu kodu unutmayınız.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={generatingCode}
                onClick={handleGetCode}
                className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-850/80 text-blue-400 hover:text-blue-300 rounded-xl font-bold text-xs uppercase tracking-wider border border-blue-500/30 hover:border-blue-500/50 transition-all flex items-center justify-center gap-1.5"
              >
                {generatingCode ? (
                  <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    Kod Al
                  </>
                )}
              </button>
              
              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/15 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Giriş Yap
              </button>
            </div>
          </form>

          {/* Slogan */}
          <p className="text-[10px] text-slate-500 text-center font-mono font-medium pt-3 border-t border-slate-800/50">
            &copy; 2026 Asia Sound & Light Technology
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="applet-viewport" className="min-h-screen bg-[#020617] text-slate-100 font-sans flex flex-col">
      
      {/* PROFESSIONAL DASHBOARD BRAND HEADER */}
      <header id="main-header" className="bg-slate-950/60 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo & Slogan (Asia Sound & Light Technology Turn Table Logo) */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-blue-500 relative shadow-lg shadow-blue-500/10 group overflow-hidden">
              {/* Outer Vinyl grooves */}
              <div className="absolute inset-1 rounded-full border border-dashed border-slate-800/80 animate-spin" style={{ animationDuration: '6s' }}></div>
              <div className="absolute inset-2.5 rounded-full border border-slate-805/50"></div>
              {/* Turntable needle styled via custom micro layout elements */}
              <div className="absolute top-1 right-2.5 w-1 h-3 bg-slate-400 rotate-45 transform origin-top-left rounded-sm z-10"></div>
              <Volume2 className="w-5 h-5 text-blue-400 relative z-0 transition-transform group-hover:scale-110" />
            </div>
            <div>
              <h1 id="app-brand-name" className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-1.5">
                Asia Sound & Light <span className="text-blue-500">Technology</span>
              </h1>
              <p id="app-brand-sub" className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Profesyonel Reji, Ses, Işık ve DJ Hizmet Defteri</p>
            </div>
          </div>

          {/* Quick status bar indicator with Google sign-in */}
          <div className="flex items-center gap-3">
            


            {/* Notification Bell Badge */}
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-blue-400 hover:bg-slate-800 transition-colors flex items-center justify-center h-9 w-9"
              title="Hatırlatıcılar ve Alarm Merkezi"
            >
              {activeRemindersCount + automatedAlerts.length > 0 ? (
                <>
                  <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] font-black pointer-events-none rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow">
                    {activeRemindersCount + automatedAlerts.length}
                  </span>
                </>
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>

            {/* DB Mode indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono leading-none">
              {dbMode === 'cloud' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-emerald-400 font-bold uppercase">BULUT AKTİF</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-400 font-bold uppercase">YEREL DISK</span>
                </>
              )}
            </div>

            {/* Custom User Authentication Section */}
            {customUser && (
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-1 pl-3 rounded-xl max-h-[38px]">
                <div className="flex flex-col text-left leading-none">
                  <span className="font-extrabold text-xs text-white truncate max-w-[120px]">{customUser.name}</span>
                  <span className={`font-mono text-[9px] font-bold mt-0.5 ${customUser.role === 'patron' ? 'text-amber-400' : 'text-blue-400'}`}>
                    {customUser.role === 'patron' ? 'PATRON' : 'EKİP'} ({customUser.code})
                  </span>
                </div>
                <button 
                  onClick={handleCustomLogout}
                  title="Güvenli Çıkış"
                  className="p-1 px-2.5 bg-slate-950/40 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors flex items-center justify-center border border-slate-800/80 hover:border-rose-950/50 h-7"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="hidden lg:flex flex-col text-right border-l border-slate-800 pl-3">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold font-mono">14 Haziran 2026</p>
              <p className="text-xs font-mono text-blue-500">AKTİF</p>
            </div>
          </div>

        </div>
      </header>

      {/* VIEWPORT BODY CONTROLLER */}
      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TOP LEVEL OVERALL COMPANY FINANCE & OPERATION STATUS SUMMARY GRIDS */}
        {customUser.role === 'patron' ? (
          <div id="company-summary-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stat 1: Total Revenue (Budget) */}
            <div id="metric-revenue" className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group shadow-xl">
              <div className="space-y-1">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Toplam Ciro / Bütçe</span>
                <h4 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">{companyStats.totalIncome.toLocaleString('tr-TR')} ₺</h4>
                <span className="text-[10px] text-slate-500 block">Planlanmış işlerden beklenen gelir</span>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center shadow-inner">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Stat 2: Total Spent (Expenses) */}
            <div id="metric-expenses" className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group shadow-xl">
              <div className="space-y-1">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Toplam Operasyon Gideri</span>
                <h4 className="text-2xl font-black text-rose-500">{companyStats.totalExpenses.toLocaleString('tr-TR')} ₺</h4>
                <span className="text-[10px] text-slate-500 block">Personel, ulaşım ve malzeme harcamaları</span>
              </div>
              <div className="w-12 h-12 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            {/* Stat 3: Net Cash Position */}
            <div id="metric-profit" className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group shadow-xl">
              <div className="space-y-1">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Öngörülen Net Kar</span>
                <h4 className={`text-2xl font-black ${companyStats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {companyStats.netProfit.toLocaleString('tr-TR')} ₺
                </h4>
                <span className="text-[10px] text-slate-500 block font-semibold">
                  Kar Oranı: <span className="text-emerald-400 font-bold">{companyStats.profitMarginPct.toFixed(1)}%</span>
                </span>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            {/* Stat 4: Active Work List */}
            <div id="metric-active-jobs" className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-5 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group shadow-xl">
              <div className="space-y-1">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Gelecek Aktif İşler</span>
                <h4 className="text-2xl font-black text-indigo-400">{companyStats.activeJobsCount} Etkinlik</h4>
                <span className="text-[10px] text-slate-500 block">Hazırlık veya planlama aşamasında</span>
              </div>
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>

          </div>
        ) : (
          /* SIMPLE GREETING BANNERS FOR EMPLOYEES */
          <div id="crew-greeting-banner" className="bg-slate-900/40 border border-slate-850 backdrop-blur-md rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2.5xl flex items-center justify-center shadow-lg">
                <Volume2 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-white">Hoş geldiniz, {customUser.name}!</h3>
                <p className="text-xs text-slate-400 font-mono tracking-tight">// Asia Sound & Light Saha Ekip Üyesi - Sadece takvim, saat ve malzeme detaylarına yetkilisiniz.</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-blue-950/40 border border-blue-900/30 rounded-2xl text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest shrink-0 text-center">
              Mevcut Yetki: Çalışma Takvimi
            </div>
          </div>
        )}

        {/* NAVIGATION VIEWS CONTROLLER TABS */}
        {customUser.role === 'patron' && (
          <div id="dashboard-views-nav" className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            
            {/* Tabs */}
            <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800 shadow-xl self-start">
              <button
                id="navigation-tab-calendar"
                onClick={() => setActiveTab('calendar')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'calendar' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <CalendarIcon className="w-4 h-4" /> Hizmet & Kiralama Takvimi
              </button>
              <button
                id="navigation-tab-expenses"
                onClick={() => setActiveTab('expenses')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'expenses' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Harcamalar & Gider Takibi
              </button>
              <button
                id="navigation-tab-inventory"
                onClick={() => setActiveTab('inventory')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'inventory' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-4 h-4" /> Saha Ekip Yönetimi
              </button>
            </div>

            <p id="active-tab-desc" className="text-xs text-slate-400 font-mono font-medium">
              {activeTab === 'calendar' && '// Takvim günlerine tıklayarak o güne atanan ekip ve malzemeleri görebilirsiniz.'}
              {activeTab === 'expenses' && '// Personel masrafları ve teknik giderleri kategori bazlı yönetip denetleyebilirsiniz.'}
              {activeTab === 'inventory' && '// Saha görevli personellerini, DJ kadrosunu ve çalışma takvimlerini yönetebilirsiniz.'}
            </p>
          </div>
        )}

        {/* CONTAINER SWITCH - DYNAMIC RENDER OF THE CHOSEN SUBVIEW */}
        <div id="active-view-canvas" className="transition-all duration-300">
          {activeTab === 'calendar' && (
            <CalendarView
              events={events}
              staffList={staffList}
              equipmentList={[]}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
              reminders={reminders}
              onAddReminder={handleAddReminder}
              onToggleReminder={handleToggleReminder}
              onDeleteReminder={handleDeleteReminder}
              userRole={customUser?.role}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseTracker
              expenses={expenses}
              events={events}
              staffList={staffList}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'inventory' && (
            <StaffEquipmentManager
              staffList={staffList}
              equipmentList={[]}
              events={events}
              onAddStaff={handleAddStaff}
              onDeleteStaff={handleDeleteStaff}
              onAddEquipment={() => {}}
              onDeleteEquipment={() => {}}
            />
          )}
        </div>

      </main>

      {/* HUMBLE FOOTER ACCORDING TO ANTI-SLOP SPECIFICATIONS */}
      <footer id="main-footer" className="bg-slate-950/60 border-t border-slate-800 mt-12 py-6 text-center text-xs text-slate-400 font-medium font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 Asia Sound & Light Technology - Reji & Planlama Sistem Defteri</span>
          <span className="flex items-center gap-1.5 text-slate-550">
            <Info className="w-4 h-4 text-blue-500" /> Verileriniz yerel depolama ve Firebase Firestore bulut veritabanında çift taraflı senkronize edilir.
          </span>
        </div>
      </footer>

      {/* NOTIFICATIONS & REMINDERS SIDEBAR OVERLAY */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" id="notif-center-modal">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsNotificationsOpen(false)}
          />

          {/* Drawer container */}
          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col z-10 transition-all duration-350 transform ease-out">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-1050/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wide">Hatırlatıcı & Alarm Merkezi</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Reji canlandırma, kadro ve alarm durumu</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Audio Toggle button */}
                <button
                  type="button"
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    if (!soundEnabled) {
                      playNotificationSound();
                    }
                  }}
                  className={`p-1.5 rounded-lg border transition-all ${
                    soundEnabled 
                      ? 'bg-blue-600/15 border-blue-500/30 text-blue-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                  title={soundEnabled ? "Bildirim Sesi Açık" : "Bildirim Sesi Kapalı"}
                >
                  {soundEnabled ? <Volume1 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                
                <button 
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Content list body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* SECTION 1: ADD NEW CUSTOM REMINDER */}
              <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5 font-mono">
                  <Plus className="w-3.5 h-3.5" /> Yeni Hatırlatıcı Planla
                </h4>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newReminderTitle.trim()) return;
                    handleAddReminder({
                      title: newReminderTitle.trim(),
                      eventId: newReminderEventId,
                      date: newReminderDate,
                      time: newReminderTime,
                      isCompleted: false
                    });
                    setNewReminderTitle('');
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold font-mono mb-1">Hatırlatıcı Mesajı</label>
                    <input 
                      type="text" 
                      value={newReminderTitle}
                      onChange={(e) => setNewReminderTitle(e.target.value)}
                      placeholder="Merve hanımı ödeme detayları için ara..." 
                      className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none transition-all text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold font-mono mb-1">Alarm Tarihi</label>
                      <input 
                        type="date" 
                        value={newReminderDate}
                        onChange={(e) => setNewReminderDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white outline-none focus:border-blue-500 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-bold font-mono mb-1">Alarm Saati</label>
                      <input 
                        type="time" 
                        value={newReminderTime}
                        onChange={(e) => setNewReminderTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white outline-none focus:border-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold font-mono mb-1">Bağlantılı Etkinlik (Opsiyonel)</label>
                    <select
                      value={newReminderEventId}
                      onChange={(e) => {
                        setNewReminderEventId(e.target.value);
                        const linked = events.find(ev => ev.id === e.target.value);
                        if (linked) {
                          setNewReminderDate(linked.date);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white outline-none focus:border-blue-500 text-xs text-slate-200"
                    >
                      <option value="general">Genel / Bağlantısız Görev</option>
                      {events.filter(ev => ev.status !== 'Tamamlandı' && ev.status !== 'İptal').map(ev => (
                        <option key={ev.id} value={ev.id} className="text-slate-100">{ev.title} ({ev.date})</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Listeme Ekle & Korun
                  </button>
                </form>
              </div>

              {/* SECTION 2: SYSTEM AUTO ALERTS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-450 flex items-center gap-1.5 font-mono">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Otomatik Reji Uyarıları ({automatedAlerts.length})
                </h4>
                
                {automatedAlerts.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic p-3 text-center bg-slate-950/20 border border-dashed border-slate-800/50 rounded-xl font-mono">
                    Herhangi bir kadro veya zaman aşımı riskli durum saptanmadı. Tüm sistemler kararlı!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {automatedAlerts.map(alert => (
                      <div 
                        key={alert.id}
                        className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 transition-all hover:bg-slate-900/60 ${
                          alert.type === 'critical'
                            ? 'bg-red-500/10 border-red-500/20 text-red-200'
                            : alert.type === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-200'
                        }`}
                      >
                        <AlertCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          alert.type === 'critical' ? 'text-red-500 animate-pulse' : 'text-amber-500'
                        }`} />
                        <div>
                          <p className="font-medium text-[11px]">{alert.title}</p>
                          {alert.eventId && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('calendar');
                                setIsNotificationsOpen(false);
                              }}
                              className="text-[9px] hover:underline font-bold text-sky-450 mt-1 uppercase tracking-wider block"
                            >
                              İncele & Planla →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: CUSTOM CREATED REMINDERS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-mono">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Aktif Hatırlatıcı Listeniz ({reminders.length})
                </h4>
                
                {reminders.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic p-3 text-center bg-slate-950/20 border border-dashed border-slate-800/50 rounded-xl font-mono">
                    Kayıtlı aktif hatırlatıcı bulunmamaktadır.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {reminders.map(rem => {
                      const linkedEvent = events.find(ev => ev.id === rem.eventId);
                      return (
                        <div 
                          key={rem.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                            rem.isCompleted 
                              ? 'bg-slate-950/40 border-slate-800/40 opacity-55' 
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleReminder(rem.id)}
                              className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                                rem.isCompleted 
                                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                                  : 'bg-slate-900 border-slate-700 hover:border-blue-500'
                              }`}
                            >
                              {rem.isCompleted && <Check className="w-3 h-3 text-white" />}
                            </button>
                            
                            <div className="min-w-0 font-sans">
                              <p className={`font-medium break-words text-[11px] text-slate-200 ${
                                rem.isCompleted ? 'line-through text-slate-500' : ''
                              }`}>
                                {rem.title}
                              </p>
                              
                              <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400 font-mono">
                                <span className="bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded text-blue-400">
                                  {rem.date} {rem.time || ''}
                                </span>
                                {linkedEvent && (
                                  <span className="truncate max-w-[120px] text-slate-500">
                                    • {linkedEvent.title}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteReminder(rem.id)}
                            className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-455 transition-colors shrink-0"
                            title="Hatırlatıcıyı sil"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Footer lock info */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950 text-center text-[9px] text-slate-500 font-mono">
              // Hatırlatıcılar Firestore bulutunda akıllı senkronizedir.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
