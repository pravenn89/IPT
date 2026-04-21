export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  vendorName: string;
  items: InvoiceItem[];
  taxAmount: number;
  totalAmount: number;
  category: string;
  itcStatus: 'Eligible' | 'Blocked';
  itcReason?: string;
  natureOfService?: string;
  tdsSection?: string;
  tdsRate?: string;
  tdsApplicable?: 'Yes' | 'No';
  fileName: string;
  status: 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export type AppSection = 'dashboard' | 'upload' | 'reports';

export interface DashboardStats {
  totalInvoices: number;
  totalSpend: number;
  categorySpend: { name: string; value: number }[];
  monthlyTrends: { month: string; spend: number }[];
  taxDistribution: { name: string; value: number }[];
}
