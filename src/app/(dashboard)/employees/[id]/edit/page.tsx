'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Employee } from '@/types'
import EmployeeForm from '@/components/employees/EmployeeForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function EditEmployeePage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEmployee()
  }, [id])

  const loadEmployee = async () => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    if (data) setEmployee(data)
    setLoading(false)
  }

  const handleSubmit = async (formData: any, photoFile?: File | null) => {
    setSaving(true)
    setError('')

    const updates: any = { ...formData }

    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop()
      const filePath = `${id}/photo.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('employee-photos')
        .upload(filePath, photoFile, { upsert: true })

      if (uploadError) {
        setError('Fotoğraf yüklenirken hata oluştu')
        setSaving(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('employee-photos')
        .getPublicUrl(filePath)

      updates.photo_url = urlData.publicUrl
    }

    const { error: updateError } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push(`/employees/${id}`)
    router.refresh()
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-medium">Çalışan Düzenle</h3>
        <p className="text-sm text-muted-foreground">
          {employee.first_name} {employee.last_name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Çalışan Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <EmployeeForm
            initialData={{
              sicil_no: employee.sicil_no,
              first_name: employee.first_name,
              last_name: employee.last_name,
              branch: employee.branch,
              department: employee.department,
              blood_type: employee.blood_type,
              sgk_meslek_kodu: employee.sgk_meslek_kodu,
              sgk_no: employee.sgk_no,
              iban: employee.iban,
              tc_kimlik_no: employee.tc_kimlik_no,
              email: employee.email,
              phone: employee.phone,
              start_date: employee.start_date,
              photo_url: employee.photo_url,
            }}
            onSubmit={handleSubmit}
            loading={saving}
          />
        </CardContent>
      </Card>
    </div>
  )
}
