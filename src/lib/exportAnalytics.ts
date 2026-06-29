import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Row { [k: string]: any; }

export function exportAnalyticsCsv(filename: string, rows: Row[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','),
    ),
  ].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface PdfSection {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export function exportAnalyticsPdf(opts: {
  title: string;
  subtitle?: string;
  stats: { label: string; value: string | number }[];
  sections: PdfSection[];
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.title, 40, 50);
  if (opts.subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(opts.subtitle, 40, 68);
    doc.setTextColor(0);
  }
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 40, 50, { align: 'right' });

  // Stats grid as a small table
  autoTable(doc, {
    startY: 90,
    head: [opts.stats.map((s) => s.label)],
    body: [opts.stats.map((s) => String(s.value))],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], fontSize: 9 },
    bodyStyles: { fontSize: 11, fontStyle: 'bold', halign: 'center' },
    margin: { left: 40, right: 40 },
  });

  opts.sections.forEach((sec) => {
    const lastY = (doc as any).lastAutoTable?.finalY || 120;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(sec.title, 40, lastY + 30);
    autoTable(doc, {
      startY: lastY + 40,
      head: [sec.headers],
      body: sec.rows.map((r) => r.map(String)),
      theme: 'striped',
      headStyles: { fillColor: [30, 30, 40], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 40, right: 40 },
    });
  });

  doc.save(`${opts.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
}
