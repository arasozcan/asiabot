import { EventJob, Expense, Staff, Equipment } from '../types';

export const INITIAL_STAFF: Staff[] = [
  { id: 's1', name: 'Ozan Özcan', role: 'DJ', phone: '0532 245 4455', status: 'Aktif' },
  { id: 's2', name: 'Mustafa Cihan Özdemir', role: 'DJ ve Ses Teknikeri / Tonmaister', phone: '0543 555 6677', status: 'Aktif' },
  { id: 's3', name: 'Özkan Özcan', role: 'Kurulum ve Taşıma', phone: '0555 777 8899', status: 'Aktif' },
  { id: 's4', name: 'Cansu Polat', role: 'DJ', phone: '0535 999 1122', status: 'Aktif' },
  { id: 's5', name: 'Aras Özcan', role: 'DJ', phone: '0542 333 4455', status: 'Aktif' },
  { id: 's6', name: 'Cihan Bağdatlı', role: 'Kurulum', phone: '0530 888 9900', status: 'Aktif' },
];

export const INITIAL_EQUIPMENT: Equipment[] = [];

// Let's dynamic generate event dates around the current date: 2026-06-14 so that some are past and some are upcoming
export const INITIAL_EVENTS: EventJob[] = [
  {
    id: 'v1',
    title: 'Kır Düğünü ve DJ Performansı',
    date: '2026-06-15', // Upcoming
    time: '18:00',
    location: 'Mandarin Oriental, Bodrum',
    staff: ['Ozan Özcan', 'Mustafa Cihan Özdemir', 'Özkan Özcan'],
    materials: [
      'Ses Sistemi (Standart Çift Kolon) x1',
      'Pioneer DJ Kontrol Cihazı x1',
      'Sahnede Robot Işıklar x4',
      'Telsiz El Mikrofonu x2',
      'Giriş Volkan Efekti & Sis Makinesi x1'
    ],
    djService: true,
    eventType: 'Düğün',
    status: 'Planlandı',
    clientName: 'Merve & Kaan Çifti',
    budget: 35000,
    notes: 'Kır düğünü konsepti. Kurulum saati en geç 14:00 olmalı. DJ Ozan akşam 20:00 - 00:00 arası çalacak.'
  },
  {
    id: 'v2',
    title: 'Kurumsal Gala Gecesi ve Ödül Töreni',
    date: '2026-06-18', // Upcoming
    time: '19:00',
    location: 'Swissotel The Bosphorus, İstanbul',
    staff: ['Mustafa Cihan Özdemir', 'Özkan Özcan', 'Cihan Bağdatlı', 'Cansu Polat'],
    materials: [
      'L-Acoustics K2 Line Array Ses Sistemi x1',
      'GrandMA2 Light Işık Masası x1',
      'Martin Mac Aura LED Robot Işık x10',
      'Clay Paky Sharpy Beam Robot Işık x8',
      'Shure QLXD Telsiz Mikrofon Seti x4',
      '4x3m Dış Mekan Led Ekran P3 x1'
    ],
    djService: true,
    eventType: 'Parti',
    status: 'Planlandı',
    clientName: 'TechCorp A.Ş. İletişim',
    budget: 95000,
    notes: 'Büyük ölçekli kurumsal organizasyon. Çok kanallı sunucu takipleri var. Ödül töreni fon müzikleri ve ışık şovu önceden programlanmalı.'
  },
  {
    id: 'v3',
    title: 'Havuz Başı Private Party',
    date: '2026-06-13', // Past
    time: '16:00',
    location: 'Villa Sunset Marina, Yalıkavak',
    staff: ['Ozan Özcan', 'Mustafa Cihan Özdemir'],
    materials: [
      'RCF ART 915-A Aktif Hoparlör x2',
      'Pioneer CDJ-3000 + DJM-900NXS2 Setup x1',
      'LED Pars (RGBW) Sahne Aydınlatma x4',
      'Antari Sis ve Baloncuk Makinesi x1'
    ],
    djService: true,
    eventType: 'Parti',
    status: 'Tamamlandı',
    clientName: 'Sinan Karabey',
    budget: 22000,
    notes: 'Özel havuz başı doğum günü partisi. Elektronik müzik konseptli.'
  },
  {
    id: 'v4',
    title: 'Üniversite Bahar Şenliği Sahne Kurulumu',
    date: '2026-06-14', // Today (2026-06-14)
    time: '12:00',
    location: 'ODTÜ Mezunlar Derneği Vişnelik, Ankara',
    staff: ['Mustafa Cihan Özdemir', 'Özkan Özcan', 'Cihan Bağdatlı'],
    materials: [
      'L-Acoustics K2 Line Array Ses Sistemi x2',
      'Behringer X32 Dijital Mikser x1',
      'GrandMA2 Light Işık Masası x1',
      'Martin Mac Aura LED Robot Işık x12',
      'Clay Paky Sharpy Beam Robot Işık x12',
      'LED Pars (RGBW) Sahne Aydınlatma x16',
      '30cm Alüminyum Truss (Kare Örümcek) x1',
      'Shure QLXD Telsiz Mikrofon Seti x6'
    ],
    djService: false,
    eventType: 'Konser',
    status: 'Aktif',
    clientName: 'Bahar Şenliği Organizasyon Komitesi',
    budget: 150000,
    notes: 'Ana sahne canlı performans kurulumu. Sadece teknik prodüksiyon (ses/ışık) şirketimizce sağlanacaktır.'
  },
  {
    id: 'v5',
    title: 'Beach Club Açılış Partisi',
    date: '2026-06-21', // Upcoming week
    time: '21:00',
    location: 'Xuma Beach, Yalıkavak',
    staff: ['Aras Özcan', 'Cihan Bağdatlı'],
    materials: [
      'Pioneer CDJ-3000 + DJM-900NXS2 Setup x1',
      'RCF ART 915-A Aktif Hoparlör x4',
      'LED Pars (RGBW) Sahne Aydınlatma x6',
      'Antari Sis ve Baloncuk Makinesi x2'
    ],
    djService: true,
    eventType: 'Parti',
    status: 'Planlandı',
    clientName: 'Xuma Beach İşletme',
    budget: 30000,
    notes: 'Kumsalda DJ kabini kurulumu olacak. Enerji hattına dikkat edilmeli, koruyucu kullanılmalı.'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'ex1',
    title: 'Bodrum Gidiş Dönüş Otoban Transit Geçiş Ücreti',
    eventId: 'v1',
    person: 'Özkan Özcan',
    amount: 1450,
    date: '2026-06-14',
    category: 'Ulaşım',
    notes: 'Bodrum kır düğünü nakliye aracı ve binek araç HGS geçişleri.'
  },
  {
    id: 'ex2',
    title: 'Ekip Akşam Yemeği (Bodrum Kurulum Günü)',
    eventId: 'v1',
    person: 'Mustafa Cihan Özdemir',
    amount: 1800,
    date: '2026-06-14',
    category: 'Yemek',
    notes: 'Kurulum ekibi 3 kişi akşam yemeği.'
  },
  {
    id: 'ex3',
    title: 'Powercon Besleme Kablosu Ek Alımı',
    eventId: 'v4',
    person: 'Mustafa Cihan Özdemir',
    amount: 950,
    date: '2026-06-13',
    category: 'Malzeme',
    notes: 'Truss üzerindeki robot ışıklar için yerel elektrikçiden 10 metre acil ara kablo alımı.'
  },
  {
    id: 'ex4',
    title: 'Ankara Kurulum Ekibi Konaklama (1 Gece)',
    eventId: 'v4',
    person: 'Mustafa Cihan Özdemir',
    amount: 6000,
    date: '2026-06-13',
    category: 'Konaklama',
    notes: 'Bahar şenliği kurulum ekibi 4 kişi otel konaklaması.'
  },
  {
    id: 'ex5',
    title: 'Jeneratör Mazot Dolumu',
    eventId: 'v4',
    person: 'Cihan Bağdatlı',
    amount: 4500,
    date: '2026-06-14',
    category: 'Teknik/Ek',
    notes: 'Etkinlik yedek jeneratörü için 120 litre mazot takviyesi.'
  },
  {
    id: 'ex6',
    title: 'Villa Partisi DJ Kulağı Ek Kablo',
    eventId: 'v3',
    person: 'Ozan Özcan',
    amount: 350,
    date: '2026-06-13',
    category: 'Malzeme',
    notes: 'DJ kulaklığı uzatma jakı.'
  },
  {
    id: 'ex7',
    title: 'Araba Yıkama ve Temizlik',
    eventId: 'general',
    person: 'Özkan Özcan',
    amount: 400,
    date: '2026-06-12',
    category: 'Diğer',
    notes: 'Malzeme taşıyan panelvan aracın iç dış komple temizliği.'
  }
];
