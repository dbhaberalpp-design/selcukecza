export interface Employee {
  id: string;
  sicil_no: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  branch: string;
  department: string;
  blood_type: string;
  sgk_meslek_kodu: string;
  sgk_no: string;
  iban: string;
  tc_kimlik_no: string;
  email: string;
  phone: string;
  start_date: string;
  created_at: string;
  updated_at: string;
}

export interface Leave {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  leave_type: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface HealthReport {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  diagnosis: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
  full_name?: string;
}

export const BRANCHES = ['Rize', 'Trabzon', 'Hızırbey', 'Giresun'] as const;

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'] as const;

export const DEPARTMENTS = [
  'Muhasebe',
  'Depo',
  'Satış',
  'Pazarlama',
  'İdari İşler',
  'Teknik Servis',
  'Lojistik',
  'Yönetim',
] as const;

export const LEAVE_TYPES = [
  { value: 'annual', label: 'Yıllık İzin' },
  { value: 'unpaid', label: 'Ücretsiz İzin' },
  { value: 'marriage', label: 'Evlilik İzni' },
  { value: 'bereavement', label: 'Vefat İzni' },
  { value: 'maternity', label: 'Doğum İzni' },
  { value: 'paternity', label: 'Babalık İzni' },
] as const;
