'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Employee, Leave, HealthReport } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  CalendarCheck,
  Stethoscope,
  AlertCircle,
  User,
  Calendar,
} from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeLeaves: 0,
    activeReports: 0,
    upcomingLeaves: 0,
    recentLeaves: [] as (Leave & { employee?: Employee })[],
    recentReports: [] as (HealthReport & { employee?: Employee })[],
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const now = new Date().toISOString()

    const { count: empCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })

    const { data: leaves } = await supabase
      .from('leaves')
      .select('*, employee:employees(*)')
      .eq('status', 'active')
      .order('start_date', { ascending: false })

    const { data: reports } = await supabase
      .from('health_reports')
      .select('*, employee:employees(*)')
      .eq('status', 'active')
      .order('start_date', { ascending: false })

    const activeLeaves = leaves?.filter(l => new Date(l.start_date) <= new Date() && new Date(l.end_date) >= new Date()) || []
    const upcomingLeaves = leaves?.filter(l => new Date(l.start_date) > new Date()) || []

    setStats({
      totalEmployees: empCount || 0,
      activeLeaves: activeLeaves.length,
      activeReports: reports?.length || 0,
      upcomingLeaves: upcomingLeaves.length,
      recentLeaves: (leaves || []).slice(0, 5),
      recentReports: (reports || []).slice(0, 5),
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const statCards = [
    {
      title: 'Toplam Çalışan',
      value: stats.totalEmployees,
      icon: Users,
      color: 'text-[#2A4587]',
      bg: 'bg-[#EAEEF6]',
      href: '/employees',
    },
    {
      title: 'Aktif İzin',
      value: stats.activeLeaves,
      icon: CalendarCheck,
      color: 'text-[#FF961F]',
      bg: 'bg-[#FFF4E5]',
      href: '/leaves',
    },
    {
      title: 'Aktif Rapor',
      value: stats.activeReports,
      icon: Stethoscope,
      color: 'text-[#FF961F]',
      bg: 'bg-[#FFF4E5]',
      href: '/reports',
    },
    {
      title: 'Gelecek İzin',
      value: stats.upcomingLeaves,
      icon: Calendar,
      color: 'text-[#2A4587]',
      bg: 'bg-[#EAEEF6]',
      href: '/leave-report',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Dashboard</h3>
        <p className="text-sm text-muted-foreground">Sisteme genel bakış</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(card => (
          <Link key={card.title} href={card.href}>
            <Card className="transition-all hover:shadow-md cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`flex size-12 items-center justify-center rounded-xl ${card.bg} ${card.color}`}>
                    <card.icon className="size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Son İzinler</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentLeaves.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Henüz izin kaydı yok</p>
            ) : (
              <div className="space-y-3">
                {stats.recentLeaves.map(l => (
                  <Link key={l.id} href={`/employees/${l.employee_id}`} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    {l.employee?.photo_url ? (
                      <img src={l.employee.photo_url} alt="" className="size-9 rounded-full object-cover" />
                    ) : (
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary-100">
                        <User className="size-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {l.employee?.first_name} {l.employee?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(l.start_date).toLocaleDateString('tr-TR')} - {new Date(l.end_date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <Badge variant="success">{l.total_days} gün</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Son Raporlar</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentReports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Henüz rapor kaydı yok</p>
            ) : (
              <div className="space-y-3">
                {stats.recentReports.map(r => (
                  <Link key={r.id} href={`/employees/${r.employee_id}`} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    {r.employee?.photo_url ? (
                      <img src={r.employee.photo_url} alt="" className="size-9 rounded-full object-cover" />
                    ) : (
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary-100">
                        <User className="size-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {r.employee?.first_name} {r.employee?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.diagnosis || 'Tanı belirtilmemiş'}
                      </p>
                    </div>
                    <Badge variant="warning">{r.total_days} gün</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
