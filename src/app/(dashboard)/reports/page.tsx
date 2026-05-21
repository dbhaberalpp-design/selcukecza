'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HealthReport, Employee } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, Stethoscope, Trash } from 'lucide-react'
import { countBusinessDays, getHolidays } from '@/lib/calculations'

export default function ReportsPage() {
  const [reports, setReports] = useState<(HealthReport & { employee?: Employee })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadReports()
    loadEmployees()
  }, [])

  const loadReports = async () => {
    const { data } = await supabase
      .from('health_reports')
      .select('*, employee:employees(*)')
      .eq('status', 'active')
      .order('start_date', { ascending: false })

    if (data) setReports(data)
    setLoading(false)
  }

  const loadEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .order('first_name')

    if (data) setEmployees(data)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu rapor kaydını silmek istediğinize emin misiniz?')) return
    await supabase.from('health_reports').delete().eq('id', id)
    loadReports()
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee) return
    setSaving(true)

    const holidays = getHolidays(new Date().getFullYear())
    const totalDays = countBusinessDays(startDate, endDate, holidays)

    const { error } = await supabase.from('health_reports').insert([{
      employee_id: selectedEmployee,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      diagnosis,
      notes,
      status: 'active',
    }])

    if (!error) {
      setDialogOpen(false)
      setSelectedEmployee('')
      setStartDate('')
      setEndDate('')
      setDiagnosis('')
      setNotes('')
      loadReports()
    }
    setSaving(false)
  }

  const filtered = reports.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    const name = r.employee ? `${r.employee.first_name} ${r.employee.last_name}`.toLowerCase() : ''
    return name.includes(q)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Rapor Yönetimi</h3>
          <p className="text-sm text-muted-foreground">{filtered.length} aktif rapor kaydı</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Rapor Ekle
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtrele</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Çalışan adı, soyadı..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Çalışan</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead>Gün</TableHead>
                <TableHead>Tanı</TableHead>
                <TableHead>Not</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Kayıt bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {r.employee?.first_name} {r.employee?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">Sicil: {r.employee?.sicil_no}</p>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(r.start_date).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell>{new Date(r.end_date).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell><Badge variant="warning">{r.total_days} gün</Badge></TableCell>
                    <TableCell className="max-w-[150px] truncate">{r.diagnosis || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{r.notes || '-'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                        <Trash className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Yeni Sağlık Raporu Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Çalışan</Label>
            <select
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
              required
            >
              <option value="">Seçiniz</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} - {emp.sicil_no}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Başlangıç Tarihi</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Bitiş Tarihi</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tanı</Label>
            <Input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Tanı bilgisi..." />
          </div>
          <div className="space-y-2">
            <Label>Not</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Rapor notu..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
