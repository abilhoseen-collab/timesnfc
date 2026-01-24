import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalViews: number;
  totalClicks: number;
  qrScans: number;
  nfcTaps: number;
  landingPageViews: number;
  dailyStats: {
    date: string;
    views: number;
    clicks: number;
  }[];
  topLinks: [string, number][];
  vcards: {
    name: string;
    views: number;
    template: string;
  }[];
  landingPages: {
    name: string;
    views: number;
    status: string;
  }[];
}

interface AnalyticsExportProps {
  data: AnalyticsData;
}

export default function AnalyticsExport({ data }: AnalyticsExportProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const generateCSV = () => {
    const lines: string[] = [];
    
    // Summary Section
    lines.push('=== ANALYTICS SUMMARY ===');
    lines.push('');
    lines.push('Metric,Value');
    lines.push(`Total Card Views,${data.totalViews}`);
    lines.push(`Total Link Clicks,${data.totalClicks}`);
    lines.push(`QR Code Scans,${data.qrScans}`);
    lines.push(`NFC Taps,${data.nfcTaps}`);
    lines.push(`Landing Page Views,${data.landingPageViews}`);
    lines.push(`Total Views (All),${data.totalViews + data.landingPageViews}`);
    lines.push('');
    
    // Daily Stats
    lines.push('=== DAILY STATISTICS (Last 7 Days) ===');
    lines.push('');
    lines.push('Date,Views,Clicks');
    data.dailyStats.forEach(day => {
      lines.push(`${day.date},${day.views},${day.clicks}`);
    });
    lines.push('');
    
    // Top Links
    if (data.topLinks.length > 0) {
      lines.push('=== TOP CLICKED LINKS ===');
      lines.push('');
      lines.push('Link Name,Clicks');
      data.topLinks.forEach(([name, clicks]) => {
        lines.push(`${name},${clicks}`);
      });
      lines.push('');
    }
    
    // VCards
    if (data.vcards.length > 0) {
      lines.push('=== BUSINESS CARDS ===');
      lines.push('');
      lines.push('Name,Template,Views');
      data.vcards.forEach(card => {
        lines.push(`"${card.name}",${card.template},${card.views}`);
      });
      lines.push('');
    }
    
    // Landing Pages
    if (data.landingPages.length > 0) {
      lines.push('=== LANDING PAGES ===');
      lines.push('');
      lines.push('Name,Status,Views');
      data.landingPages.forEach(page => {
        lines.push(`"${page.name}",${page.status},${page.views}`);
      });
    }
    
    return lines.join('\n');
  };

  const generatePDFContent = () => {
    // Create a printable HTML document
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Report - ${date}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1f2937; }
          h1 { font-size: 24px; margin-bottom: 8px; color: #14b8a6; }
          h2 { font-size: 18px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
          .date { color: #6b7280; margin-bottom: 32px; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
          .stat-card { background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 28px; font-weight: bold; color: #14b8a6; }
          .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280; }
          tr:hover { background: #f9fafb; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>📊 Analytics Report</h1>
        <p class="date">Generated on ${date}</p>
        
        <h2>Overview</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${data.totalViews}</div>
            <div class="stat-label">Card Views</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.totalClicks}</div>
            <div class="stat-label">Link Clicks</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.qrScans}</div>
            <div class="stat-label">QR Scans</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.nfcTaps}</div>
            <div class="stat-label">NFC Taps</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.landingPageViews}</div>
            <div class="stat-label">Landing Page Views</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.totalViews + data.landingPageViews}</div>
            <div class="stat-label">Total Views</div>
          </div>
        </div>
        
        <h2>Daily Statistics (Last 7 Days)</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Views</th>
              <th>Clicks</th>
            </tr>
          </thead>
          <tbody>
            ${data.dailyStats.map(day => `
              <tr>
                <td>${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                <td>${day.views}</td>
                <td>${day.clicks}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${data.topLinks.length > 0 ? `
          <h2>Top Clicked Links</h2>
          <table>
            <thead>
              <tr>
                <th>Link Name</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              ${data.topLinks.map(([name, clicks]) => `
                <tr>
                  <td style="text-transform: capitalize;">${name}</td>
                  <td>${clicks}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
        
        ${data.vcards.length > 0 ? `
          <h2>Business Cards</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Template</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              ${data.vcards.map(card => `
                <tr>
                  <td>${card.name}</td>
                  <td style="text-transform: capitalize;">${card.template}</td>
                  <td>${card.views}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
        
        ${data.landingPages.length > 0 ? `
          <h2>Landing Pages</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              ${data.landingPages.map(page => `
                <tr>
                  <td>${page.name}</td>
                  <td>${page.status}</td>
                  <td>${page.views}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
        
        <div class="footer">
          <p>Generated by Times Digital Dashboard</p>
        </div>
      </body>
      </html>
    `;
  };

  const exportCSV = async () => {
    setExporting('csv');
    try {
      const csv = generateCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'CSV exported successfully!' });
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  const exportPDF = async () => {
    setExporting('pdf');
    try {
      const htmlContent = generatePDFContent();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        // Wait for content to load then trigger print
        printWindow.onload = () => {
          printWindow.print();
        };
        // Fallback if onload doesn't trigger
        setTimeout(() => {
          printWindow.print();
        }, 500);
        toast({ title: 'PDF print dialog opened!' });
      } else {
        toast({ title: 'Please allow pop-ups to export PDF', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting !== null}>
          {exporting ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Download size={16} className="mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV} className="cursor-pointer">
          <Table size={16} className="mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF} className="cursor-pointer">
          <FileText size={16} className="mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
