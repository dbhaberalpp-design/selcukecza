-- Run this in Supabase SQL Editor

-- Employees table
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sicil_no TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  photo_url TEXT,
  branch TEXT NOT NULL,
  department TEXT NOT NULL,
  blood_type TEXT DEFAULT '',
  sgk_meslek_kodu TEXT DEFAULT '',
  sgk_no TEXT DEFAULT '',
  iban TEXT DEFAULT '',
  tc_kimlik_no TEXT UNIQUE DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  start_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaves table
CREATE TABLE leaves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  leave_type TEXT DEFAULT 'annual',
  status TEXT DEFAULT 'active',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health reports table
CREATE TABLE health_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  diagnosis TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Holidays table
CREATE TABLE holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table for roles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'viewer',
  full_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies: admins can do everything, viewers can only read
CREATE POLICY "Admins can insert employees" ON employees FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update employees" ON employees FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete employees" ON employees FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Everyone can view employees" ON employees FOR SELECT USING (true);

CREATE POLICY "Admins can insert leaves" ON leaves FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update leaves" ON leaves FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete leaves" ON leaves FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Everyone can view leaves" ON leaves FOR SELECT USING (true);

CREATE POLICY "Admins can insert reports" ON health_reports FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update reports" ON health_reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete reports" ON health_reports FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Everyone can view reports" ON health_reports FOR SELECT USING (true);

CREATE POLICY "Everyone can view holidays" ON holidays FOR SELECT USING (true);
CREATE POLICY "Admins can manage holidays" ON holidays FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Insert Turkish public holidays
INSERT INTO holidays (date, name) VALUES
  ('2025-01-01', 'Yılbaşı'),
  ('2025-04-23', 'Ulusal Egemenlik ve Çocuk Bayramı'),
  ('2025-05-01', 'Emek ve Dayanışma Günü'),
  ('2025-05-19', 'Atatürk''ü Anma Gençlik ve Spor Bayramı'),
  ('2025-07-15', 'Demokrasi ve Milli Birlik Günü'),
  ('2025-08-30', 'Zafer Bayramı'),
  ('2025-10-29', 'Cumhuriyet Bayramı'),
  ('2026-01-01', 'Yılbaşı'),
  ('2026-04-23', 'Ulusal Egemenlik ve Çocuk Bayramı'),
  ('2026-05-01', 'Emek ve Dayanışma Günü'),
  ('2026-05-19', 'Atatürk''ü Anma Gençlik ve Spor Bayramı'),
  ('2026-07-15', 'Demokrasi ve Milli Birlik Günü'),
  ('2026-08-30', 'Zafer Bayramı'),
  ('2026-10-29', 'Cumhuriyet Bayramı')
ON CONFLICT (date) DO NOTHING;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (NEW.id, NEW.email, 'viewer', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for employee photos
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-photos', 'employee-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view employee photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'employee-photos');

CREATE POLICY "Admins can upload employee photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'employee-photos'
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update employee photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'employee-photos'
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete employee photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'employee-photos'
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
