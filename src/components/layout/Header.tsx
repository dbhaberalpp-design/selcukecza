'use client'

import { usePathname } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Çalışanlar',
  '/leaves': 'İzin Yönetimi',
  '/reports': 'Rapor Yönetimi',
  '/leave-report': 'İzin Raporu',
  '/admin': 'Yönetim Paneli',
}

export default function Header() {
  const pathname = usePathname()
  const title = pageTitles[pathname] || 'Personel Yönetim Sistemi'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/95 backdrop-blur px-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="ml-auto flex items-center gap-4">
        <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
      </div>
    </header>
  )
}
