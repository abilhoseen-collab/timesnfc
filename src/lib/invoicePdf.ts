import { jsPDF } from "jspdf";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface InvoiceData {
  invoice_number: string;
  issued_at: string | Date;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  brand_name?: string;
  brand_logo_url?: string | null;
  brand_address?: string;
  line_items: InvoiceLineItem[];
  currency?: string;
  notes?: string;
}

export function generateInvoicePdf(data: InvoiceData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const currency = data.currency || "BDT";
  const brand = data.brand_name || "Times Digital";

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(brand, 40, 60);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (data.brand_address) doc.text(data.brand_address, 40, 78);

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120);
  doc.text("INVOICE", W - 40, 60, { align: "right" });
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.text(`# ${data.invoice_number}`, W - 40, 78, { align: "right" });
  doc.text(
    `Date: ${new Date(data.issued_at).toLocaleDateString("en-GB")}`,
    W - 40,
    94,
    { align: "right" }
  );

  // Bill to
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 40, 140);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let y = 158;
  if (data.customer_name) {
    doc.text(data.customer_name, 40, y);
    y += 14;
  }
  if (data.customer_email) {
    doc.text(data.customer_email, 40, y);
    y += 14;
  }
  if (data.customer_address) {
    doc.text(data.customer_address, 40, y, { maxWidth: 250 });
  }

  // Table
  const tableTop = 230;
  doc.setFillColor(245, 245, 245);
  doc.rect(40, tableTop, W - 80, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Description", 50, tableTop + 15);
  doc.text("Qty", 360, tableTop + 15);
  doc.text("Price", 420, tableTop + 15);
  doc.text("Total", W - 50, tableTop + 15, { align: "right" });

  doc.setFont("helvetica", "normal");
  let ry = tableTop + 38;
  let grand = 0;
  for (const item of data.line_items) {
    doc.text(item.description, 50, ry, { maxWidth: 300 });
    doc.text(String(item.quantity), 360, ry);
    doc.text(`${item.unit_price.toFixed(2)}`, 420, ry);
    doc.text(`${item.total.toFixed(2)}`, W - 50, ry, { align: "right" });
    grand += item.total;
    ry += 24;
  }

  // Total
  doc.setDrawColor(200);
  doc.line(40, ry, W - 40, ry);
  ry += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total:", 360, ry);
  doc.text(`${currency} ${grand.toFixed(2)}`, W - 50, ry, { align: "right" });

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    data.notes || "Thank you for your business!",
    40,
    doc.internal.pageSize.getHeight() - 40
  );

  return doc;
}

export function downloadInvoicePdf(data: InvoiceData) {
  const doc = generateInvoicePdf(data);
  doc.save(`invoice-${data.invoice_number}.pdf`);
}
