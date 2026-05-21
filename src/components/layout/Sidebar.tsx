'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Stethoscope,
  FileText,
  Settings,
  LogOut,
  ClipboardList,
  Upload,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employees', label: 'Çalışanlar', icon: Users },
  { href: '/leaves', label: 'İzinler', icon: CalendarCheck },
  { href: '/reports', label: 'Raporlar', icon: Stethoscope },
  { href: '/leave-report', label: 'İzin Raporu', icon: FileText },
  { href: '/import', label: 'Excel Aktar', icon: Upload },
  { href: '/admin', label: 'Yönetim', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-white">
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <div className="flex size-10 items-center justify-center rounded-lg" style={{ backgroundColor: '#FF961F' }}>
          <ClipboardList className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold" style={{ color: '#2A4587' }}>Personel İzin Yönetim Sistemi</h1>
          <p className="text-xs" style={{ color: '#64748b' }}>Selçuk Ecza Trabzon</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-5" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
