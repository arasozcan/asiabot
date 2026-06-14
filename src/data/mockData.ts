import { EventJob, Expense, Staff, Equipment } from '../types';

export const INITIAL_STAFF: Staff[] = [];

export const INITIAL_EQUIPMENT: Equipment[] = [];

// Let's dynamic generate event dates around the current date: 2026-06-14 so that some are past and some are upcoming
export const INITIAL_EVENTS: EventJob[] = [];

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
