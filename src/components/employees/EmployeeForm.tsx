'use client'

import { useState, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BRANCHES, BLOOD_TYPES, DEPARTMENTS } from '@/types'
import { Camera, X } from 'lucide-react'

interface EmployeeFormData {
  sicil_no: string
  first_name: string
  last_name: string
  branch: string
  department: string
  blood_type: string
  sgk_meslek_kodu: string
  sgk_no: string
  iban: string
  tc_kimlik_no: string
  email: string
  phone: string
  start_date: string
}

interface Props {
  initialData?: EmployeeFormData & { photo_url?: string | null }
  onSubmit: (data: EmployeeFormData, photoFile?: File | null) => Promise<void>
  loading: boolean
}

export default function EmployeeForm({ initialData, onSubmit, loading }: Props) {
  const [form, setForm] = useState<EmployeeFormData>(
    initialData || {
      sicil_no: '',
      first_name: '',
      last_name: '',
      branch: '',
      department: '',
      blood_type: '',
      sgk_meslek_kodu: '',
      sgk_no: '',
      iban: '',
      tc_kimlik_no: '',
      email: '',
      phone: '',
      start_date: '',
    }
  )

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(initialData?.photo_url || null)
  const fileRef = useRef<HTMLInputElement>(null)

  const update = (field: keyof EmployeeFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const clearPhoto = () => {
    setPhotoFile(null)
    setPreview(initialData?.photo_url || null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form, photoFile)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-input bg-muted">
            {preview ? (
              <img src={preview} alt="Preview" className="size-full object-cover" />
            ) : (
              <Camera className="size-8 text-muted-foreground" />
            )}
          </div>
          {preview && (
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-white"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <div>
          <Label htmlFor="photo" className="cursor-pointer">
            <div className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">
              <Camera className="size-4" />
              Fotoğraf Seç
            </div>
          </Label>
          <input
            ref={fileRef}
            id="photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP (max 5MB)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="sicil_no">Sicil No</Label>
          <Input id="sicil_no" value={form.sicil_no} onChange={e => update('sicil_no', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="first_name">Ad</Label>
          <Input id="first_name" value={form.first_name} onChange={e => update('first_name', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Soyad</Label>
          <Input id="last_name" value={form.last_name} onChange={e => update('last_name', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tc_kimlik_no">TC Kimlik No</Label>
          <Input id="tc_kimlik_no" value={form.tc_kimlik_no} onChange={e => update('tc_kimlik_no', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch">Şube</Label>
          <select
            id="branch"
            value={form.branch}
            onChange={e => update('branch', e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          >
            <option value="">Seçiniz</option>
            {BRANCHES.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Departman</Label>
          <select
            id="department"
            value={form.department}
            onChange={e => update('department', e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          >
            <option value="">Seçiniz</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="blood_type">Kan Grubu</Label>
          <select
            id="blood_type"
            value={form.blood_type}
            onChange={e => update('blood_type', e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Seçiniz</option>
            {BLOOD_TYPES.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sgk_meslek_kodu">SGK Meslek Kodu</Label>
          <Input id="sgk_meslek_kodu" value={form.sgk_meslek_kodu} onChange={e => update('sgk_meslek_kodu', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sgk_no">SGK No</Label>
          <Input id="sgk_no" value={form.sgk_no} onChange={e => update('sgk_no', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="iban">IBAN</Label>
          <Input id="iban" value={form.iban} onChange={e => update('iban', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" type="email" value={form.email} onChange={e => update('email', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input id="phone" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_date">İşe Giriş Tarihi</Label>
          <Input id="start_date" type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} required />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          İptal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </form>
  )
}
