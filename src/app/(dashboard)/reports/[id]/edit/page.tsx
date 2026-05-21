'use client'

import { useRouter } from 'next/navigation'

export default function EditReportPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  router.push('/reports')
  return null
}
