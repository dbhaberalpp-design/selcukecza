'use client'

import { useRouter } from 'next/navigation'

export default function NewReportPage() {
  const router = useRouter()
  router.push('/reports')
  return null
}
