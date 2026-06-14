export interface EventJob {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  staff: string[]; // Crew assigned
  materials: string[]; // Equipment assigned
  djService: boolean;
  notes?: string;
  status: 'Planlandı' | 'Kurulum Aşamasında' | 'Aktif' | 'Tamamlandı' | 'İptal';
  clientName?: string;
  clientPhone?: string;
  budget?: number; // Total budget of the job (optional, nice-to-have)
  eventType?: 'Düğün' | 'Nişan / Kına' | 'Konser' | 'Parti' | 'Diğer';
}

export interface Expense {
  id: string;
  title: string;
  eventId: string; // Event ID or 'general'
  person: string; // Crew member who spent
  amount: number; // TL
  date: string; // YYYY-MM-DD
  category: 'Ulaşım' | 'Yemek' | 'Malzeme' | 'Konaklama' | 'Teknik/Ek' | 'Diğer';
  notes?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone?: string;
  status: 'Aktif' | 'İzinli';
}

export interface Equipment {
  id: string;
  name: string;
  category: 'Ses' | 'Işık' | 'DJ Ekipmanı' | 'Görüntü' | 'Efektler/Truss' | 'Diğer';
  quantity: number; // Total stock
  status: 'Hazır' | 'Bakımda';
}

export interface Reminder {
  id: string;
  title: string;
  eventId: string; // "general" or event ID
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  isCompleted: boolean;
}

