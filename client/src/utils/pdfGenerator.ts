import jsPDF from 'jspdf';

// Company information
const COMPANY_INFO = {
  name: 'Roti Factory',
  address: '123 Business Street, Mumbai, Maharashtra 400001',
  phone: '+91 9876543210',
  email: 'info@rotifactory.com',
  website: 'www.rotifactory.com',
  gst: 'GST123456789',
  logo: '🏭' // Using emoji as placeholder, can be replaced with actual logo
};

// PDF styling constants
const COLORS = {
  primary: '#16a34a', // Green
  secondary: '#374151', // Gray
  accent: '#059669', // Emerald
  text: '#111827', // Dark gray
  lightGray: '#f3f4f6'
};

export interface PDFOptions {
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  includeDate?: boolean;
  includePageNumbers?: boolean;
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 0;

  constructor(options: PDFOptions) {
    this.doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.format || 'a4'
    });

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    
    this.addLetterhead(options.title, options.subtitle);
    this.currentY = 80; // Start content after letterhead
  }

  private addLetterhead(title: string, subtitle?: string) {
    // Company logo/icon (using text for now)
    this.doc.setFontSize(24);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text(COMPANY_INFO.logo, this.margin, 25);

    // Company name
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(COMPANY_INFO.name, this.margin + 15, 25);

    // Company details
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(COLORS.secondary);
    
    const rightAlign = this.pageWidth - this.margin;
    this.doc.text(COMPANY_INFO.address, rightAlign, 15, { align: 'right' });
    this.doc.text(`Phone: ${COMPANY_INFO.phone}`, rightAlign, 20, { align: 'right' });
    this.doc.text(`Email: ${COMPANY_INFO.email}`, rightAlign, 25, { align: 'right' });
    this.doc.text(`GST: ${COMPANY_INFO.gst}`, rightAlign, 30, { align: 'right' });

    // Horizontal line
    this.doc.setDrawColor(COLORS.primary);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, 35, this.pageWidth - this.margin, 35);

    // Document title
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(COLORS.text);
    this.doc.text(title, this.pageWidth / 2, 50, { align: 'center' });

    // Subtitle if provided
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(COLORS.secondary);
      this.doc.text(subtitle, this.pageWidth / 2, 58, { align: 'center' });
    }

    // Date
    this.doc.setFontSize(10);
    this.doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, this.pageWidth - this.margin, 65, { align: 'right' });
  }

  addSection(title: string, content: string | string[]) {
    this.checkPageBreak(20);

    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(COLORS.primary);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;

    // Section content
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(COLORS.text);

    if (Array.isArray(content)) {
      content.forEach(line => {
        this.checkPageBreak(5);
        this.doc.text(line, this.margin, this.currentY);
        this.currentY += 5;
      });
    } else {
      const lines = this.doc.splitTextToSize(content, this.pageWidth - 2 * this.margin);
      lines.forEach((line: string) => {
        this.checkPageBreak(5);
        this.doc.text(line, this.margin, this.currentY);
        this.currentY += 5;
      });
    }

    this.currentY += 5; // Extra space after section
  }

  addTable(headers: string[], rows: string[][]) {
    this.checkPageBreak(30);

    const colWidth = (this.pageWidth - 2 * this.margin) / headers.length;
    const rowHeight = 8;

    // Table headers
    this.doc.setFillColor(COLORS.primary);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);

    headers.forEach((header, index) => {
      this.doc.text(header, this.margin + index * colWidth + 2, this.currentY + 5);
    });

    this.currentY += rowHeight;

    // Table rows
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(COLORS.text);

    rows.forEach((row, rowIndex) => {
      this.checkPageBreak(rowHeight);

      // Alternate row colors
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(COLORS.lightGray);
        this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, rowHeight, 'F');
      }

      row.forEach((cell, colIndex) => {
        this.doc.text(cell, this.margin + colIndex * colWidth + 2, this.currentY + 5);
      });

      this.currentY += rowHeight;
    });

    this.currentY += 5; // Extra space after table
  }

  addSummaryBox(title: string, items: { label: string; value: string }[]) {
    this.checkPageBreak(items.length * 6 + 15);

    // Box background
    this.doc.setFillColor(COLORS.lightGray);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, items.length * 6 + 10, 'F');

    // Box border
    this.doc.setDrawColor(COLORS.primary);
    this.doc.setLineWidth(0.3);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, items.length * 6 + 10);

    // Title
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(COLORS.primary);
    this.doc.text(title, this.margin + 5, this.currentY + 8);

    this.currentY += 15;

    // Items
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(COLORS.text);

    items.forEach(item => {
      this.doc.text(item.label + ':', this.margin + 5, this.currentY);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(item.value, this.pageWidth - this.margin - 5, this.currentY, { align: 'right' });
      this.doc.setFont('helvetica', 'normal');
      this.currentY += 6;
    });

    this.currentY += 5;
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.doc.setDrawColor(COLORS.primary);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);
      
      // Footer text
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(COLORS.secondary);
      this.doc.text(
        `${COMPANY_INFO.name} - ${COMPANY_INFO.website}`,
        this.margin,
        this.pageHeight - 8
      );
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth - this.margin,
        this.pageHeight - 8,
        { align: 'right' }
      );
    }
  }

  save(filename: string) {
    this.addFooter();
    this.doc.save(filename);
  }

  getBlob(): Blob {
    this.addFooter();
    return this.doc.output('blob');
  }

  getPDFDataUri(): string {
    this.addFooter();
    return this.doc.output('datauristring');
  }
}

// Utility functions for specific report types
export const generateSalesReportPDF = (data: any, period: string) => {
  const pdf = new PDFGenerator({
    title: 'Sales Report',
    subtitle: `Period: ${period}`,
    includeDate: true
  });

  // Summary section
  pdf.addSummaryBox('Sales Summary', [
    { label: 'Total Orders', value: data.totalOrders?.toString() || '0' },
    { label: 'Total Revenue', value: `₹${data.totalRevenue?.toLocaleString() || '0'}` },
    { label: 'Average Order Value', value: `₹${data.avgOrderValue?.toLocaleString() || '0'}` },
    { label: 'POS Sales', value: `₹${data.posRevenue?.toLocaleString() || '0'}` }
  ]);

  // Orders table
  if (data.orders && data.orders.length > 0) {
    const headers = ['Order ID', 'Customer', 'Date', 'Amount', 'Status'];
    const rows = data.orders.map((order: any) => [
      order.orderNumber || order.id,
      order.customerName || 'N/A',
      new Date(order.createdAt || order.date).toLocaleDateString('en-IN'),
      `₹${order.totalAmount?.toLocaleString() || '0'}`,
      order.status || 'N/A'
    ]);
    
    pdf.addSection('Order Details', '');
    pdf.addTable(headers, rows);
  }

  return pdf;
};

export const generateEmployeeReportPDF = (employees: any[]) => {
  const pdf = new PDFGenerator({
    title: 'Employee Report',
    subtitle: 'Complete Employee Directory',
    includeDate: true
  });

  // Summary
  const activeEmployees = employees.filter(emp => emp.status === 'ACTIVE').length;
  const departments = new Set(employees.map(emp => emp.department)).size;
  const totalSalary = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);

  pdf.addSummaryBox('Employee Summary', [
    { label: 'Total Employees', value: employees.length.toString() },
    { label: 'Active Employees', value: activeEmployees.toString() },
    { label: 'Departments', value: departments.toString() },
    { label: 'Total Monthly Salary', value: `₹${totalSalary.toLocaleString()}` }
  ]);

  // Employee table
  const headers = ['ID', 'Name', 'Position', 'Department', 'Salary', 'Status'];
  const rows = employees.map(emp => [
    emp.employeeId || emp.id,
    `${emp.firstName} ${emp.lastName}`,
    emp.position || 'N/A',
    emp.department || 'N/A',
    `₹${emp.salary?.toLocaleString() || '0'}`,
    emp.status || 'N/A'
  ]);

  pdf.addSection('Employee Details', '');
  pdf.addTable(headers, rows);

  return pdf;
};
