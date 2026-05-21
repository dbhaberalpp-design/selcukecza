import { addYears, differenceInYears, startOfYear, endOfYear, isWeekend, isSameDay, parseISO } from 'date-fns'

export function getLeaveEntitlement(startDate: string): {
  entitledDays: number
  yearsWorked: number
  periodLabel: string
} {
  const now = new Date()
  const start = parseISO(startDate)
  const years = differenceInYears(now, start)

  let entitledDays: number
  let periodLabel: string

  if (years < 6) {
    entitledDays = 14
    periodLabel = '0-6 yıl (14 iş günü)'
  } else if (years < 15) {
    entitledDays = 20
    periodLabel = '6-15 yıl (20 iş günü)'
  } else {
    entitledDays = 26
    periodLabel = '15+ yıl (26 iş günü)'
  }

  return { entitledDays, yearsWorked: years, periodLabel }
}

export function getRemainingLeave(
  startDate: string,
  usedLeaveDays: number
): {
  entitled: number
  used: number
  remaining: number
  yearsWorked: number
  periodLabel: string
} {
  const { entitledDays, yearsWorked, periodLabel } = getLeaveEntitlement(startDate)
  return {
    entitled: entitledDays,
    used: usedLeaveDays,
    remaining: Math.max(0, entitledDays - usedLeaveDays),
    yearsWorked,
    periodLabel,
  }
}

const PUBLIC_HOLIDAYS_2025: { date: string; name: string }[] = [
  { date: '2025-01-01', name: 'Yılbaşı' },
  { date: '2025-04-23', name: 'Ulusal Egemenlik ve Çocuk Bayramı' },
  { date: '2025-05-01', name: 'Emek ve Dayanışma Günü' },
  { date: '2025-05-19', name: 'Atatürk\'ü Anma Gençlik ve Spor Bayramı' },
  { date: '2025-07-15', name: 'Demokrasi ve Milli Birlik Günü' },
  { date: '2025-08-30', name: 'Zafer Bayramı' },
  { date: '2025-10-29', name: 'Cumhuriyet Bayramı' },
]

export function getHolidays(year: number): { date: string; name: string }[] {
  const fixedHolidays = PUBLIC_HOLIDAYS_2025.map(h => {
    const d = parseISO(h.date)
    const newDate = new Date(year, d.getMonth(), d.getDate())
    return { date: newDate.toISOString().split('T')[0], name: h.name }
  })

  return fixedHolidays
}

export function countBusinessDays(startStr: string, endStr: string, holidays: { date: string }[]): number {
  const start = parseISO(startStr)
  const end = parseISO(endStr)
  let count = 0
  const current = new Date(start)

  while (current <= end) {
    if (!isWeekend(current)) {
      const dateStr = current.toISOString().split('T')[0]
      const isHoliday = holidays.some(h => h.date === dateStr)
      if (!isHoliday) {
        count++
      }
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}
