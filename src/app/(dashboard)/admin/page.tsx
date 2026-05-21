'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, ShieldOff, UserCog, Plus } from 'lucide-react'

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer')
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('email')

    if (data) setProfiles(data)
    setLoading(false)
  }

  const handleToggleRole = async (profile: Profile) => {
    const newRole = profile.role === 'admin' ? 'viewer' : 'admin'
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profile.id)
    loadProfiles()
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      setError(authError.message)
      setSaving(false)
      return
    }

    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email,
        role,
        full_name: fullName,
      })
    }

    setDialogOpen(false)
    setEmail('')
    setPassword('')
    setFullName('')
    setSaving(false)
    loadProfiles()
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
          <h3 className="text-lg font-medium">Yönetim Paneli</h3>
          <p className="text-sm text-muted-foreground">Kullanıcı yetkilendirme yönetimi</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Kullanıcı Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kullanıcı Listesi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-posta</TableHead>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Yetki</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Henüz kullanıcı bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.email}</TableCell>
                    <TableCell>{p.full_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={p.role === 'admin' ? 'default' : 'secondary'}>
                        {p.role === 'admin' ? 'Admin' : 'Sadece Görüntüleme'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleRole(p)}
                      >
                        {p.role === 'admin' ? (
                          <>
                            <ShieldOff className="size-4" />
                            Yetkiyi Kısıtla
                          </>
                        ) : (
                          <>
                            <Shield className="size-4" />
                            Admin Yap
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yetki Açıklamaları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Badge variant="default">Admin</Badge>
            <p className="text-muted-foreground">Çalışan ekleme, silme, düzenleme, izin/rapor ekleme/silme, kullanıcı yönetimi</p>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="secondary">Sadece Görüntüleme</Badge>
            <p className="text-muted-foreground">Tüm bilgileri görüntüleme, rapor alma, Excel/PDF çıktı. Değişiklik yapamaz.</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddUser} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>E-posta</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Şifre</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Ad Soyad</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Yetki</Label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'admin' | 'viewer')}
              className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
            >
              <option value="viewer">Sadece Görüntüleme</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kullanıcı Oluştur'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
