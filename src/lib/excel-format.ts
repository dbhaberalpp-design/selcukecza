import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Employee, Leave } from '@/types'
import { getLeaveEntitlement } from './calculations'

// ─── IZIN DEFTERI format columns ───
const LEAF_COLUMNS = 10 // 10 leave entry groups

export interface IzinDefteriRow {
  sicil_no: string
  adi_soyadi: string
  sube: string
  departman: string
  ise_giris: string
  hak_14: string
  hak_20: string
  hak_26: string
  hak_ettigi: number
  devir: number
  toplam_kullanilabilir: number
  kalan: number
  izinler: { baslangic: string; bitis: string; gun: number }[]
}

export function parseIzinDefteri(buffer: ArrayBuffer): IzinDefteriRow[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  const normalize = (s: string) => s.toUpperCase().replace(/İ/g, 'I').replace(/[^A-Z0-9]/g, '')
  let headerRow = rows.findIndex(r => normalize(String(r[0] || '')).includes('SICIL'))
  if (headerRow === -1) {
    headerRow = rows.findIndex((r, i) => i < 10 && String(r[0] || '').replace(/\s/g, '').length > 0 && String(r[1] || '').includes('ADI'))
    if (headerRow === -1) throw new Error('SICIL NO sütunu bulunamadı')
  }

  const dataRows = rows.slice(headerRow + 1).filter((r: any[]) => r[0] && String(r[0]).trim() !== '')

  const result: IzinDefteriRow[] = []

  for (const row of dataRows) {
    const izinler: { baslangic: string; bitis: string; gun: number }[] = []
    for (let i = 0; i < LEAF_COLUMNS; i++) {
      const base = 12 + i * 3
      const baslangic = String(row[base] || '').trim()
      const bitis = String(row[base + 1] || '').trim()
      const gun = Number(row[base + 2]) || 0
      if (baslangic || gun > 0) {
        izinler.push({ baslangic, bitis, gun })
      }
    }

    result.push({
      sicil_no: String(row[0]).trim(),
      adi_soyadi: String(row[1]).trim(),
      sube: String(row[2]).trim(),
      departman: String(row[3]).trim(),
      ise_giris: String(row[4]).trim(),
      hak_14: String(row[5]).trim(),
      hak_20: String(row[6]).trim(),
      hak_26: String(row[7]).trim(),
      hak_ettigi: Number(row[8]) || 0,
      devir: Number(row[9]) || 0,
      toplam_kullanilabilir: Number(row[10]) || 0,
      kalan: Number(row[11]) || 0,
      izinler,
    })
  }

  return result
}

export function parseIzinliRaporluListe(buffer: ArrayBuffer) {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  const leaves: { name: string; start: string; end: string; branch: string; reason: string; role: string; remaining: number }[] = []
  const reports: { name: string; start: string; end: string; branch: string; reason: string; role: string }[] = []

  let inLeaves = false
  let inReports = false

  for (const row of rows) {
    const h = String(row[0] || '').trim()
    if (h.toUpperCase().replace(/İ/g, 'I').includes('RAPORLU')) { inReports = true; inLeaves = false; continue }
    if (h.toUpperCase().replace(/İ/g, 'I').includes('IZINLI')) { inLeaves = true; inReports = false; continue }

    if (inReports && row[1] && String(row[1]).trim()) {
      reports.push({
        name: String(row[1]).trim(),
        start: String(row[2] || '').trim(),
        end: String(row[3] || '').trim(),
        branch: String(row[4] || '').trim(),
        reason: String(row[5] || '').trim(),
        role: String(row[6] || '').trim(),
      })
    }

    if (inLeaves && row[1] && String(row[1]).trim() && !h.includes('TOPLAM') && !h.includes('GENEL') && !h.includes('TRABZON') && !h.includes('GIRESUN') && !h.includes('RIZE') && !h.includes('HIZIRBEY')) {
      leaves.push({
        name: String(row[1]).trim(),
        start: String(row[2] || '').trim(),
        end: String(row[3] || '').trim(),
        branch: String(row[4] || '').trim(),
        reason: String(row[5] || '').trim(),
        role: String(row[6] || '').trim(),
        remaining: Number(row[7]) || 0,
      })
    }
  }

  return { leaves, reports }
}

// ─── EXPORT: Izin Defteri ───
export function exportIzinDefteri(employees: (Employee & { leaves?: Leave[] })[], year: number) {
  const header = [
    'SICIL NO', 'ADI SOYADI', 'SUBE', 'DEPARTMAN', 'ISE GIS TARIHI',
    `YI HAK EDIS TARIHI (14)`, `YI HAK EDIS TARIHI (20)`, `YI HAK EDIS TARIHI (26)`,
    `${year} YILINDA HAK ETTIGI IZIN`, 'GECMIS DONEMLERDEN DEVIRLER',
    `${year} TOPLAM KULLANILABILIR IZIN`, 'KALAN YILLIK IZIN GUN SAYISI',
  ]

  for (let i = 1; i <= LEAF_COLUMNS; i++) {
    header.push(`IZINE CIKIS TARIHI`, 'IS BASI TARIHI', `KULLANILAN YILLIK IZIN GUN SAYISI`)
  }

  const data: any[][] = []

  for (const emp of employees) {
    const entitlement = getLeaveEntitlement(emp.start_date)
    const annualLeaves = (emp.leaves || []).filter(l => l.leave_type === 'annual' && l.status === 'active')
    const usedThisYear = annualLeaves.reduce((s, l) => s + l.total_days, 0)
    const totalAvailable = entitlement.entitledDays + (emp.carryover_days || 0)
    const remaining = Math.max(0, totalAvailable - usedThisYear)

    const leaveEntries = annualLeaves.slice(0, LEAF_COLUMNS)
    const row: any[] = [
      emp.sicil_no,
      `${emp.first_name} ${emp.last_name}`,
      emp.branch,
      emp.department,
      formatDateExcel(emp.start_date),
      '', '', '',
      entitlement.entitledDays,
      emp.carryover_days || 0,
      totalAvailable,
      remaining,
    ]

    for (const lv of leaveEntries) {
      row.push(formatDateExcel(lv.start_date))
      row.push(formatDateExcel(lv.end_date))
      row.push(lv.total_days)
    }

    while (row.length < header.length) row.push('')
    data.push(row)
  }

  const ws = XLSX.utils.aoa_to_sheet([header, ...data])
  ws['!cols'] = [
    { wch: 10 }, { wch: 28 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
    { wch: 20 }, { wch: 20 }, { wch: 20 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sayfa1')
  XLSX.writeFile(wb, `IZIN DEFTERI ${year}.xlsx`)
}

// ─── EXPORT: Izinli ve Raporlu Personel Listesi ───
export function exportIzinliRaporluListe(
  onLeave: { name: string; start: string; end: string; branch: string; reason: string; role: string; remaining: number }[],
  onReport: { name: string; start: string; end: string; branch: string; reason: string; role: string }[]
) {
  const reportHeader = ['SN', 'RAPORLU PERSONELLER', 'RAPOR BASLANGIC TARIHI', 'DONUS TARIHI', 'BILGISI', 'NEDENI', 'GOREVI']
  const leaveHeader = ['SN', 'IZINLI VE IZNE CIKACAK PERSONELLER', 'IZNE CIKIS TARIHI', 'DONUS TARIHI', 'BILGISI', 'NEDENI', 'GOREVI', 'KALAN IZINI']

  const rows: any[][] = []

  // Reports section
  rows.push(reportHeader)
  if (onReport.length === 0) {
    rows.push([1, '', '', '', '', '', ''])
    rows.push([2, '', '', '', '', '', ''])
  } else {
    onReport.forEach((r, i) => {
      rows.push([i + 1, r.name, r.start, r.end, r.branch, r.reason, r.role])
    })
  }

  rows.push([])

  // Leaves section
  rows.push(leaveHeader)
  onLeave.forEach((l, i) => {
    rows.push([i + 1, l.name, l.start, l.end, l.branch, l.reason, l.role, l.remaining])
  })

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = Array(8).fill({ wch: 22 })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sayfa1')
  XLSX.writeFile(wb, 'IZINLI VE RAPORLU PERSONEL LISTESI.xlsx')
}

function formatDateExcel(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${month}/${day}/${year}`
}

function parseExcelDate(val: string): string {
  if (!val) return ''
  // Try mm/dd/yyyy
  const m = val.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  return val
}

export function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { first: parts[0], last: '' }
  const last = parts.pop()!
  return { first: parts.join(' '), last }
}

export function normalizeBranch(b: string): string {
  const map: Record<string, string> = {
    'RIZE': 'Rize', 'TRABZON': 'Trabzon', 'HIZIRBEY': 'Hızırbey', 'GIRESUN': 'Giresun',
  }
  return map[b.toUpperCase()] || b
}

export function normalizeDepartment(d: string): string {
  const map: Record<string, string> = {
    'DEPO': 'Depo', 'SATIS': 'Satış', 'IDARI': 'İdari İşler',
    'SEVKIYAT': 'Lojistik', 'MUHASEBE': 'Muhasebe', 'PAZARLAMA': 'Pazarlama',
    'TEKNIK SERVIS': 'Teknik Servis', 'YONETIM': 'Yönetim',
  }
  return map[d.toUpperCase()] || d
}
