import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { InvoiceData } from '../types';

export function exportToCSV(data: InvoiceData[]) {
  const headers = ['Invoice #', 'Date', 'Vendor', 'Nature', 'Category', 'ITC Status', 'ITC Reason', 'TDS Applicable', 'TDS Rate', 'TDS Section', 'Tax', 'Total (INR)'];
  const rows = data.map(inv => [
    inv.invoiceNumber,
    inv.date,
    inv.vendorName,
    inv.natureOfService || '',
    inv.category,
    inv.itcStatus,
    inv.itcReason || '',
    inv.tdsApplicable || 'No',
    inv.tdsRate || '',
    inv.tdsSection || '',
    inv.taxAmount,
    inv.totalAmount
  ]);

  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
}

export function exportToExcel(data: InvoiceData[]) {
  const worksheet = utils.json_to_sheet(data.map(inv => ({
    'Invoice Number': inv.invoiceNumber,
    'Date': inv.date,
    'Vendor': inv.vendorName,
    'Nature of Service': inv.natureOfService,
    'Category': inv.category,
    'ITC Status': inv.itcStatus,
    'ITC Reason': inv.itcReason,
    'TDS Applicable': inv.tdsApplicable,
    'TDS Rate': inv.tdsRate,
    'TDS Section': inv.tdsSection,
    'Tax Amount': inv.taxAmount,
    'Total Amount (INR)': inv.totalAmount,
    'File Name': inv.fileName
  })));
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Invoices');
  writeFile(workbook, `invoices_export_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportToPDF(data: InvoiceData[]) {
  const doc = new jsPDF() as any;
  doc.text('Invoice Processing Tool - Processed Invoices Report', 14, 15);
  
  const tableData = data.map(inv => [
    inv.invoiceNumber,
    inv.date,
    inv.vendorName,
    inv.itcStatus,
    inv.tdsRate || 'N/A',
    inv.totalAmount.toFixed(2)
  ]);

  doc.autoTable({
    startY: 20,
    head: [['Invoice #', 'Date', 'Vendor', 'ITC Status', 'TDS Rate', 'Total (INR)']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillStyle: '#1a56db' }
  });

  doc.save(`invoices_report_${new Date().toISOString().split('T')[0]}.pdf`);
}
