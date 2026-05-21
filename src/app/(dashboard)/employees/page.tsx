'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Employee, BRANCHES, DEPARTMENTS } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, User, Filter } from 'lucide-react'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .order('first_name', { ascending: true })

    if (data) setEmployees(data)
    setLoading(false)
  }

  const filtered = employees.filter(e => {
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      e.first_name.toLowerCase().includes(q) ||
      e.last_name.toLowerCase().includes(q) ||
      e.sicil_no.toLowerCase().includes(q) ||
      e.tc_kimlik_no?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q)

    const matchesBranch = !branchFilter || e.branch === branchFilter
    const matchesDept = !deptFilter || e.department === deptFilter

    return matchesSearch && matchesBranch && matchesDept
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
          <h3 className="text-lg font-medium">Tüm Çalışanlar</h3>
          <p className="text-sm text-muted-foreground">{filtered.length} kayıt bulundu</p>
        </div>
        <Link href="/employees/new">
          <Button>
            <Plus className="size-4" />
            Çalışan Ekle
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtrele</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ad, soyad, sicil no, TC, e-posta..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="h-10 rounded-lg border border-input bg-white px-3 text-sm"
            >
              <option value="">Tüm Şubeler</option>
              {BRANCHES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="h-10 rounded-lg border border-input bg-white px-3 text-sm"
            >
              <option value="">Tüm Departmanlar</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map(emp => (
          <Link key={emp.id} href={`/employees/${emp.id}`}>
            <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {emp.photo_url ? (
                    <img src={emp.photo_url} alt="" className="size-12 shrink-0 rounded-full object-cover border-2 border-primary-100" />
                  ) : (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-100">
                      <User className="size-6 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {emp.first_name} {emp.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">Sicil: {emp.sicil_no}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-xs">{emp.branch}</Badge>
                      <Badge variant="outline" className="text-xs">{emp.department}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
            <User className="size-12 mb-3 opacity-40" />
            <p>Çalışan bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  )
}
