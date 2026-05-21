'use client'

import { useRouter } from 'next/navigation'

export default function EditLeavePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  router.push('/leaves')
  return null
}
