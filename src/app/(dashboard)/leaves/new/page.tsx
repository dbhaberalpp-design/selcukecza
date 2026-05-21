'use client'

import { useRouter } from 'next/navigation'

export default function NewLeavePage() {
  const router = useRouter()
  router.push('/leaves')
  return null
}
