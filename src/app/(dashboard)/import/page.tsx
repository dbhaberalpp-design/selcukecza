'use client'
export const dynamic = 'force-dynamic'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { parseIzinDefteri, parseIzinliRaporluListe, splitName, normalizeBranch, normalizeDepartment } from '@/lib/excel-format'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)
  const [fileType, setFileType] = useState<'defter' | 'liste' | ''>('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    if (f.name.includes('DEFTERI')) setFileType('defter')
    else if (f.name.includes('LISTESI') || f.name.includes('RAPORLU')) setFileType('liste')
    else setFileType('')
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setResult(null)

    try {
      const buffer = await file.arrayBuffer()
      let success = 0
      const errors: string[] = []

      if (fileType === 'defter') {
        const rows = parseIzinDefteri(buffer)
        for (const row of rows) {
          try {
            const { first, last } = splitName(row.adi_soyadi)
            const startDate = row.ise_giris

            const { data: existing } = await supabase
              .from('employees')
              .select('id')
              .eq('sicil_no', row.sicil_no)
              .maybeSingle()

            let empId: string
            if (existing) {
              await supabase.from('employees').update({
                first_name: first,
                last_name: last,
                branch: normalizeBranch(row.sube),
                department: normalizeDepartment(row.departman),
                start_date: startDate,
                carryover_days: row.devir,
              }).eq('id', existing.id)
              empId = existing.id
            } else {
              const { data: newEmp } = await supabase.from('employees').insert([{
                sicil_no: row.sicil_no,
                first_name: first,
                last_name: last,
                branch: normalizeBranch(row.sube),
                department: normalizeDepartment(row.departman),
                start_date: startDate,
                carryover_days: row.devir,
              }]).select().single()
              if (!newEmp) throw new Error('Çalışan oluşturulamadı')
              empId = newEmp.id
            }

            for (const izin of row.izinler) {
              if (!izin.baslangic || !izin.bitis) continue
              const startStr = normalizeDate(izin.baslangic)
              const endStr = normalizeDate(izin.bitis)
              if (!startStr || !endStr) continue

              await supabase.from('leaves').insert([{
                employee_id: empId,
                start_date: startStr,
                end_date: endStr,
                total_days: izin.gun,
                leave_type: 'annual',
                status: 'active',
                notes: 'Excel\'den aktarıldı',
              }])
            }
            success++
          } catch (e: any) {
            errors.push(`${row.sicil_no} ${row.adi_soyadi}: ${e.message}`)
          }
        }
      } else if (fileType === 'liste') {
        const { leaves, reports } = parseIzinliRaporluListe(buffer)

        for (const item of [...leaves, ...reports.map(r => ({ ...r, remaining: 0 }))]) {
          try {
            const { data: emp } = await supabase
              .from('employees')
              .select('id')
              .ilike('first_name || \' \' || last_name', `%${item.name}%`)
              .maybeSingle()

            if (!emp) {
              errors.push(`${item.name}: Çalışan bulunamadı`)
              continue
            }
            success++
          } catch { }
        }
      }

      setResult({ success, errors })
    } catch (e: any) {
      setResult({ success: 0, errors: [e.message] })
    }

    setImporting(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-medium">Excel'den İçe Aktar</h3>
        <p className="text-sm text-muted-foreground">
          IZIN DEFTERI veya IZINLI VE RAPORLU PERSONEL LISTESI dosyalarını yükleyin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dosya Seç</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-input p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              {file ? file.name : 'Excel dosyası seçmek için tıklayın'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              .xlsx formatı
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {file && (
            <div className="flex items-center gap-3 text-sm">
              <FileSpreadsheet className="size-5 text-primary" />
              <span className="flex-1 truncate">{file.name}</span>
              {fileType === 'defter' && <Badge>İzin Defteri</Badge>}
              {fileType === 'liste' && <Badge variant="secondary">Personel Listesi</Badge>}
              {!fileType && <Badge variant="destructive">Tanınmayan format</Badge>}
            </div>
          )}

          {file && fileType && (
            <Button onClick={handleImport} disabled={importing} className="w-full">
              {importing ? (
                <><Loader2 className="size-4 animate-spin" /> Aktarılıyor...</>
              ) : (
                <><Upload className="size-4" /> Verileri Aktar</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktarım Sonucu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="size-5" />
              <span className="font-medium">{result.success} kayıt başarıyla aktarıldı</span>
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="size-5" />
                  <span className="font-medium">{result.errors.length} hata</span>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-lg bg-red-50 p-3 text-xs text-red-700 space-y-1">
                  {result.errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desteklenen Formatlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">1. IZIN DEFTERI 2026.xlsx</p>
          <p>Sicil No, Ad Soyad, Şube, Departman, İşe Giriş, izin bakiyeleri ve geçmiş izin kayıtlarını içerir.</p>
          <p className="font-medium text-foreground mt-3">2. IZINLI VE RAPORLU PERSONEL LISTESI.xlsx</p>
          <p>Raporlu ve izinli personel listesini, tarihleri ve kalan izin bilgilerini içerir.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function normalizeDate(val: string): string {
  if (!val) return ''
  const m = val.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  return val
}
