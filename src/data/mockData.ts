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
export const INITIAL_EVENTS: EventJob[] = [];

export const INITIAL_EXPENSES: Expense[] = [];
