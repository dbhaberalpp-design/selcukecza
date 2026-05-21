import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportRow {
  [key: string]: string | number | null
}

interface Column {
  header: string
  key: string
}

export function exportToExcel(data: ExportRow[], columns: Column[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(
    data.map(row => {
      const obj: Record<string, string | number> = {}
      columns.forEach(col => {
        obj[col.header] = row[col.key] ?? ''
      })
      return obj
    })
  )

  ws['!cols'] = columns.map(() => ({ wch: 20 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sayfa1')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportToPDF(data: ExportRow[], columns: Column[], filename: string, title: string) {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text(title, 14, 20)
  doc.setFontSize(10)
  doc.text(`Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}`, 14, 28)

  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body: data.map(row => columns.map(col => row[col.key] ?? '')),
    startY: 35,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [13, 148, 136] },
  })

  doc.save(`${filename}.pdf`)
}
