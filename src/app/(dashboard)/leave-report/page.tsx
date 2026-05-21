'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Leave, HealthReport, Employee } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, FileSpreadsheet, Search } from 'lucide-react'
import { exportToExcel, exportToPDF } from '@/lib/export'

export default function LeaveReportPage() {
  const [leaves, setLeaves] = useState<(Leave & { employee?: Employee })[]>([])
  const [reports, setReports] = useState<(HealthReport & { employee?: Employee })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'leaves' | 'reports' | 'upcoming'>('leaves')
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: lv } = await supabase
      .from('leaves')
      .select('*, employee:employees(*)')
      .eq('status', 'active')
      .order('start_date', { ascending: false })

    if (lv) setLeaves(lv)

    const { data: rp } = await supabase
      .from('health_reports')
      .select('*, employee:employees(*)')
      .eq('status', 'active')
      .order('start_date', { ascending: false })

    if (rp) setReports(rp)

    setLoading(false)
  }

  const now = new Date()
  const upcomingLeaves = leaves.filter(l => new Date(l.start_date) >= now)
  const pastLeaves = leaves.filter(l => new Date(l.start_date) < now)

  const filteredLeaves = (tab: string) => {
    let items: (Leave & { employee?: Employee })[]
    if (tab === 'leaves') items = pastLeaves
    else if (tab === 'upcoming') items = upcomingLeaves
    else items = []

    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(l => {
      const name = l.employee ? `${l.employee.first_name} ${l.employee.last_name}`.toLowerCase() : ''
      return name.includes(q)
    })
  }

  const filteredReports = reports.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    const name = r.employee ? `${r.employee.first_name} ${r.employee.last_name}`.toLowerCase() : ''
    return name.includes(q)
  })

  const handleExportExcel = () => {
    const data = activeTab === 'reports'
      ? filteredReports.map(r => ({
          employee: r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : '',
          sicil: r.employee?.sicil_no || '',
          branch: r.employee?.branch || '',
          start: new Date(r.start_date).toLocaleDateString('tr-TR'),
          end: new Date(r.end_date).toLocaleDateString('tr-TR'),
          days: r.total_days,
          diagnosis: r.diagnosis || '',
        }))
      : filteredLeaves(activeTab).map(l => ({
          employee: l.employee ? `${l.employee.first_name} ${l.employee.last_name}` : '',
          sicil: l.employee?.sicil_no || '',
          branch: l.employee?.branch || '',
          start: new Date(l.start_date).toLocaleDateString('tr-TR'),
          end: new Date(l.end_date).toLocaleDateString('tr-TR'),
          days: l.total_days,
          type: l.leave_type === 'annual' ? 'Yıllık' : l.leave_type,
        }))

    const columns = [
      { header: 'Çalışan', key: 'employee' },
      { header: 'Sicil No', key: 'sicil' },
      { header: 'Şube', key: 'branch' },
      { header: 'Başlangıç', key: 'start' },
      { header: 'Bitiş', key: 'end' },
      { header: 'Gün', key: 'days' },
      ...(activeTab === 'reports'
        ? [{ header: 'Tanı', key: 'diagnosis' }]
        : [{ header: 'Tür', key: 'type' }]
      ),
    ]

    const tabName = activeTab === 'leaves' ? 'Gecmis_Izinler' : activeTab === 'upcoming' ? 'Gelecek_Izinler' : 'Raporlar'
    exportToExcel(data, columns, `Izin_Raporu_${tabName}`)
  }

  const handleExportPDF = () => {
    const data = activeTab === 'reports'
      ? filteredReports.map(r => ({
          employee: r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : '',
          sicil: r.employee?.sicil_no || '',
          branch: r.employee?.branch || '',
          start: new Date(r.start_date).toLocaleDateString('tr-TR'),
          end: new Date(r.end_date).toLocaleDateString('tr-TR'),
          days: r.total_days,
          diagnosis: r.diagnosis || '',
        }))
      : filteredLeaves(activeTab).map(l => ({
          employee: l.employee ? `${l.employee.first_name} ${l.employee.last_name}` : '',
          sicil: l.employee?.sicil_no || '',
          branch: l.employee?.branch || '',
          start: new Date(l.start_date).toLocaleDateString('tr-TR'),
          end: new Date(l.end_date).toLocaleDateString('tr-TR'),
          days: l.total_days,
          type: l.leave_type === 'annual' ? 'Yıllık' : l.leave_type,
        }))

    const columns = [
      { header: 'Çalışan', key: 'employee' },
      { header: 'Sicil No', key: 'sicil' },
      { header: 'Şube', key: 'branch' },
      { header: 'Başlangıç', key: 'start' },
      { header: 'Bitiş', key: 'end' },
      { header: 'Gün', key: 'days' },
      ...(activeTab === 'reports'
        ? [{ header: 'Tanı', key: 'diagnosis' }]
        : [{ header: 'Tür', key: 'type' }]
      ),
    ]

    const titles: Record<string, string> = {
      leaves: 'Geçmiş İzinler Raporu',
      upcoming: 'Gelecek İzinler Raporu',
      reports: 'Sağlık Raporları',
    }

    const tabName = activeTab === 'leaves' ? 'Gecmis_Izinler' : activeTab === 'upcoming' ? 'Gelecek_Izinler' : 'Raporlar'
    exportToPDF(data, columns, `Izin_Raporu_${tabName}`, titles[activeTab])
  }

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
          <h3 className="text-lg font-medium">İzin ve Rapor Raporu</h3>
          <p className="text-sm text-muted-foreground">Tüm izin ve rapor kayıtları</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="size-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="size-4" />
            PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Button
                variant={activeTab === 'leaves' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('leaves')}
              >
                Geçmiş İzinler ({pastLeaves.length})
              </Button>
              <Button
                variant={activeTab === 'upcoming' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('upcoming')}
              >
                Gelecek İzinler ({upcomingLeaves.length})
              </Button>
              <Button
                variant={activeTab === 'reports' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('reports')}
              >
                Raporlar ({filteredReports.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Çalışan adı, soyadı..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {activeTab === 'reports' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Çalışan</TableHead>
                  <TableHead>Şube</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Gün</TableHead>
                  <TableHead>Tanı</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Kayıt bulunamadı</TableCell></TableRow>
                ) : (
                  filteredReports.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.employee?.first_name} {r.employee?.last_name}</TableCell>
                      <TableCell>{r.employee?.branch}</TableCell>
                      <TableCell>{new Date(r.start_date).toLocaleDateString('tr-TR')}</TableCell>
                      <TableCell>{new Date(r.end_date).toLocaleDateString('tr-TR')}</TableCell>
                      <TableCell><Badge variant="warning">{r.total_days}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.diagnosis || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Çalışan</TableHead>
                  <TableHead>Şube</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Gün</TableHead>
                  <TableHead>Tür</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaves(activeTab).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Kayıt bulunamadı</TableCell></TableRow>
                ) : (
                  filteredLeaves(activeTab).map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.employee?.first_name} {l.employee?.last_name}</TableCell>
                      <TableCell>{l.employee?.branch}</TableCell>
                      <TableCell>{new Date(l.start_date).toLocaleDateString('tr-TR')}</TableCell>
                      <TableCell>{new Date(l.end_date).toLocaleDateString('tr-TR')}</TableCell>
                      <TableCell><Badge variant="success">{l.total_days}</Badge></TableCell>
                      <TableCell className="capitalize">{l.leave_type === 'annual' ? 'Yıllık' : l.leave_type === 'unpaid' ? 'Ücretsiz' : l.leave_type}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
