'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import EmployeeForm from '@/components/employees/EmployeeForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewEmployeePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (data: any, photoFile?: File | null) => {
    setLoading(true)
    setError('')

    const { data: newEmp, error: insertError } = await supabase
      .from('employees')
      .insert([{ ...data, photo_url: null }])
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    if (photoFile && newEmp) {
      const fileExt = photoFile.name.split('.').pop()
      const filePath = `${newEmp.id}/photo.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('employee-photos')
        .upload(filePath, photoFile, { upsert: true })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('employee-photos')
          .getPublicUrl(filePath)

        await supabase
          .from('employees')
          .update({ photo_url: urlData.publicUrl })
          .eq('id', newEmp.id)
      }
    }

    router.push('/employees')
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-medium">Yeni Çalışan Ekle</h3>
        <p className="text-sm text-muted-foreground">Çalışan bilgilerini doldurun</p>
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
          <EmployeeForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  )
}
