'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Employee, Leave, HealthReport } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getRemainingLeave, countBusinessDays, getHolidays } from '@/lib/calculations'
import {
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Droplets,
  CreditCard,
  Hash,
  Trash,
} from 'lucide-react'

export default function EmployeeProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [reports, setReports] = useState<HealthReport[]>([])
  const [loading, setLoading] = useState(true)

  // Leave dialog
  const [leaveDialog, setLeaveDialog] = useState(false)
  const [leaveStart, setLeaveStart] = useState('')
  const [leaveEnd, setLeaveEnd] = useState('')
  const [leaveType, setLeaveType] = useState('annual')
  const [leaveNotes, setLeaveNotes] = useState('')
  const [leaveLoading, setLeaveLoading] = useState(false)

  // Report dialog
  const [reportDialog, setReportDialog] = useState(false)
  const [reportStart, setReportStart] = useState('')
  const [reportEnd, setReportEnd] = useState('')
  const [reportDiagnosis, setReportDiagnosis] = useState('')
  const [reportNotes, setReportNotes] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    const { data: emp } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    if (emp) {
      setEmployee(emp)

      const { data: lv } = await supabase
        .from('leaves')
        .select('*')
        .eq('employee_id', id)
        .eq('status', 'active')
        .order('start_date', { ascending: false })

      if (lv) setLeaves(lv)

      const { data: rp } = await supabase
        .from('health_reports')
        .select('*')
        .eq('employee_id', id)
        .eq('status', 'active')
        .order('start_date', { ascending: false })

      if (rp) setReports(rp)
    }

    setLoading(false)
  }

  const handleDeleteEmployee = async () => {
    if (!confirm('Bu çalışanı silmek istediğinize emin misiniz?')) return
    await supabase.from('employees').delete().eq('id', id)
    router.push('/employees')
    router.refresh()
  }

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee) return
    setLeaveLoading(true)

    const holidays = getHolidays(new Date().getFullYear())
    const totalDays = countBusinessDays(leaveStart, leaveEnd, holidays)

    const { error } = await supabase.from('leaves').insert([{
      employee_id: id,
      start_date: leaveStart,
      end_date: leaveEnd,
      total_days: totalDays,
      leave_type: leaveType,
      notes: leaveNotes,
      status: 'active',
    }])

    if (!error) {
      setLeaveDialog(false)
      setLeaveStart('')
      setLeaveEnd('')
      setLeaveNotes('')
      loadData()
    }
    setLeaveLoading(false)
  }

  const handleDeleteLeave = async (leaveId: string) => {
    if (!confirm('Bu izni silmek istediğinize emin misiniz?')) return
    await supabase.from('leaves').delete().eq('id', leaveId)
    loadData()
  }

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee) return
    setReportLoading(true)

    const holidays = getHolidays(new Date().getFullYear())
    const totalDays = countBusinessDays(reportStart, reportEnd, holidays)

    const { error } = await supabase.from('health_reports').insert([{
      employee_id: id,
      start_date: reportStart,
      end_date: reportEnd,
      total_days: totalDays,
      diagnosis: reportDiagnosis,
      notes: reportNotes,
      status: 'active',
    }])

    if (!error) {
      setReportDialog(false)
      setReportStart('')
      setReportEnd('')
      setReportDiagnosis('')
      setReportNotes('')
      loadData()
    }
    setReportLoading(false)
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Bu raporu silmek istediğinize emin misiniz?')) return
    await supabase.from('health_reports').delete().eq('id', reportId)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!employee) {
    return <div className="text-center py-12 text-muted-foreground">Çalışan bulunamadı</div>
  }

  const usedLeaveDays = leaves
    .filter(l => l.leave_type === 'annual')
    .reduce((sum, l) => sum + l.total_days, 0)

  const leaveInfo = getRemainingLeave(employee.start_date, usedLeaveDays)

  const infoItem = (icon: React.ReactNode, label: string, value: string) => (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || '-'}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/employees')}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-4">
            {employee.photo_url ? (
              <img src={employee.photo_url} alt="" className="size-14 rounded-full object-cover border-2 border-primary-200" />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-full bg-primary-100">
                <User className="size-7 text-primary" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium">
                {employee.first_name} {employee.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">Sicil: {employee.sicil_no}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/employees/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="size-4" />
              Düzenle
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleDeleteEmployee}>
            <Trash2 className="size-4" />
            Sil
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Employee Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Çalışan Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
              {infoItem(<User className="size-4" />, 'Ad Soyad', `${employee.first_name} ${employee.last_name}`)}
              {infoItem(<Hash className="size-4" />, 'Sicil No', employee.sicil_no)}
              {infoItem(<Hash className="size-4" />, 'TC Kimlik No', employee.tc_kimlik_no)}
              {infoItem(<MapPin className="size-4" />, 'Şube', employee.branch)}
              {infoItem(<Briefcase className="size-4" />, 'Departman', employee.department)}
              {infoItem(<Droplets className="size-4" />, 'Kan Grubu', employee.blood_type)}
              {infoItem(<Hash className="size-4" />, 'SGK Meslek Kodu', employee.sgk_meslek_kodu)}
              {infoItem(<Hash className="size-4" />, 'SGK No', employee.sgk_no)}
              {infoItem(<CreditCard className="size-4" />, 'IBAN', employee.iban)}
              {infoItem(<Mail className="size-4" />, 'E-posta', employee.email)}
              {infoItem(<Phone className="size-4" />, 'Telefon', employee.phone)}
              {infoItem(<Calendar className="size-4" />, 'İşe Giriş Tarihi', employee.start_date ? new Date(employee.start_date).toLocaleDateString('tr-TR') : '-')}
            </div>
          </CardContent>
        </Card>

        {/* Leave Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">İzin Durumu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-primary-50 p-4 text-center">
              <p className="text-3xl font-bold text-primary">{leaveInfo.remaining}</p>
              <p className="text-sm text-muted-foreground">Kalan İzin Günü</p>
            </div>
            <div className="divide-y">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Hak Edilen</span>
                <span className="font-medium">{leaveInfo.entitled} gün</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Kullanılan</span>
                <span className="font-medium">{leaveInfo.used} gün</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Çalışma Süresi</span>
                <span className="font-medium">{leaveInfo.yearsWorked} yıl</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Dönem</span>
                <span className="font-medium text-xs">{leaveInfo.periodLabel}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaves Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">İzinler</CardTitle>
          <Button size="sm" onClick={() => setLeaveDialog(true)}>
            <Plus className="size-4" />
            İzin Ekle
          </Button>
        </CardHeader>
        <CardContent>
          {leaves.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Henüz izin kaydı bulunmuyor</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Gün</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Not</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>{new Date(l.start_date).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell>{new Date(l.end_date).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell><Badge variant="success">{l.total_days} iş günü</Badge></TableCell>
                    <TableCell className="capitalize">{l.leave_type === 'annual' ? 'Yıllık' : l.leave_type}</TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate">{l.notes || '-'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteLeave(l.id)}>
                        <Trash className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reports Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Sağlık Raporları</CardTitle>
          <Button size="sm" onClick={() => setReportDialog(true)}>
            <Plus className="size-4" />
            Rapor Ekle
          </Button>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Henüz rapor kaydı bulunmuyor</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Gün</TableHead>
                  <TableHead>Tanı</TableHead>
                  <TableHead>Not</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.start_date).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell>{new Date(r.end_date).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell><Badge variant="warning">{r.total_days} iş günü</Badge></TableCell>
                    <TableCell className="max-w-[150px] truncate">{r.diagnosis || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate">{r.notes || '-'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteReport(r.id)}>
                        <Trash className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Leave Dialog */}
      <Dialog open={leaveDialog} onOpenChange={setLeaveDialog}>
        <DialogHeader>
          <DialogTitle>İzin Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddLeave} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Başlangıç Tarihi</Label>
              <Input type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Bitiş Tarihi</Label>
              <Input type="date" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>İzin Türü</Label>
            <select
              value={leaveType}
              onChange={e => setLeaveType(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
            >
              <option value="annual">Yıllık İzin</option>
              <option value="unpaid">Ücretsiz İzin</option>
              <option value="marriage">Evlilik İzni</option>
              <option value="bereavement">Vefat İzni</option>
              <option value="maternity">Doğum İzni</option>
              <option value="paternity">Babalık İzni</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Not</Label>
            <Input value={leaveNotes} onChange={e => setLeaveNotes(e.target.value)} placeholder="İzin notu..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setLeaveDialog(false)}>İptal</Button>
            <Button type="submit" disabled={leaveLoading}>
              {leaveLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Add Report Dialog */}
      <Dialog open={reportDialog} onOpenChange={setReportDialog}>
        <DialogHeader>
          <DialogTitle>Sağlık Raporu Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddReport} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Başlangıç Tarihi</Label>
              <Input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Bitiş Tarihi</Label>
              <Input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tanı</Label>
            <Input value={reportDiagnosis} onChange={e => setReportDiagnosis(e.target.value)} placeholder="Tanı bilgisi..." />
          </div>
          <div className="space-y-2">
            <Label>Not</Label>
            <Input value={reportNotes} onChange={e => setReportNotes(e.target.value)} placeholder="Rapor notu..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setReportDialog(false)}>İptal</Button>
            <Button type="submit" disabled={reportLoading}>
              {reportLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
