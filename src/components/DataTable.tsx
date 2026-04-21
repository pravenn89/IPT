import React, { useState } from 'react';
import { InvoiceData } from '../types';
import { Edit2, Check, X, Trash2, Download, Filter, Search } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '../services/exportService';
import { cn } from '../lib/utils';

interface DataTableProps {
  invoices: InvoiceData[];
  onUpdateInvoice: (updated: InvoiceData) => void;
  onDeleteInvoice: (id: string) => void;
}

const DataTable: React.FC<DataTableProps> = ({ invoices, onUpdateInvoice, onDeleteInvoice }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InvoiceData>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const completedInvoices = invoices.filter(inv => 
    inv.status === 'completed' && 
    (inv.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const startEditing = (invoice: InvoiceData) => {
    setEditingId(invoice.id);
    setEditForm(invoice);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = () => {
    if (editingId && editForm) {
      onUpdateInvoice(editForm as InvoiceData);
      setEditingId(null);
      setEditForm({});
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 overflow-hidden flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-card border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input 
            type="text"
            placeholder="Search vendor or invoice..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => exportToCSV(completedInvoices)}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded font-bold border border-slate-300 text-slate-700 transition-colors"
          >
            EXPORT CSV
          </button>
          <button 
            onClick={() => exportToExcel(completedInvoices)}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded font-bold border border-slate-300 text-slate-700 transition-colors"
          >
            EXPORT EXCEL
          </button>
          <button 
            onClick={() => exportToPDF(completedInvoices)}
            className="text-[10px] bg-brand hover:bg-brand-dark text-white px-3 py-1.5 rounded font-bold transition-colors shadow-sm"
          >
            PDF REPORT
          </button>
        </div>
      </div>

      <div className="bg-white rounded-card border border-slate-200 shadow-sm overflow-hidden flex-1">
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice ID</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor Name</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Category</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Total (₹)</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">TDS (Rate/Sec)</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">ITC Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-medium">
              {completedInvoices.map((inv) => (
                <tr key={inv.id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2 font-mono text-[11px] text-slate-500">
                    {editingId === inv.id ? (
                      <input 
                        className="w-full px-1 border rounded bg-white"
                        value={editForm.invoiceNumber || ''} 
                        onChange={e => setEditForm({ ...editForm, invoiceNumber: e.target.value })}
                      />
                    ) : (
                      `#${inv.invoiceNumber}`
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === inv.id ? (
                      <input 
                        className="w-full px-1 border rounded bg-white font-bold"
                        value={editForm.vendorName || ''} 
                        onChange={e => setEditForm({ ...editForm, vendorName: e.target.value })}
                      />
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold">{inv.vendorName}</span>
                        {inv.natureOfService && (
                          <span className="text-[9px] text-slate-400 italic line-clamp-1">{inv.natureOfService}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {editingId === inv.id ? (
                      <select 
                        className="px-1 border rounded bg-white"
                        value={editForm.category || ''}
                        onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        <option value="Software">Software</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Office Supplies">Office Supplies</option>
                        <option value="Travel">Travel</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Others">Others</option>
                      </select>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{inv.category}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {editingId === inv.id ? (
                      <input 
                        type="date"
                        className="px-1 border rounded bg-white"
                        value={editForm.date || ''}
                        onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                      />
                    ) : (
                      inv.date
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-slate-900">
                    {editingId === inv.id ? (
                      <input 
                        type="number"
                        className="text-right w-20 px-1 border rounded bg-white"
                        value={editForm.totalAmount || 0}
                        onChange={e => setEditForm({ ...editForm, totalAmount: parseFloat(e.target.value) })}
                      />
                    ) : (
                      `₹${inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    )}
                  </td>
                  <td className="px-4 py-2 text-center border-x border-slate-50 bg-slate-50/5">
                    {editingId === inv.id ? (
                      <div className="flex flex-col gap-1 items-center">
                        <input 
                          placeholder="Rate %"
                          className="w-12 px-1 border rounded bg-white text-[9px] text-center"
                          value={editForm.tdsRate || ''}
                          onChange={e => setEditForm({ ...editForm, tdsRate: e.target.value })}
                        />
                        <input 
                          placeholder="Section"
                          className="w-12 px-1 border rounded bg-white text-[9px] text-center"
                          value={editForm.tdsSection || ''}
                          onChange={e => setEditForm({ ...editForm, tdsSection: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "text-[10px] font-bold",
                          inv.tdsApplicable === 'Yes' ? "text-slate-900" : "text-slate-400"
                        )}>
                          {inv.tdsApplicable === 'Yes' ? (inv.tdsRate || 'N/A') : 'N/A'}
                        </span>
                        {inv.tdsSection && inv.tdsApplicable === 'Yes' && (
                          <span className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded font-mono mt-0.5">
                            {inv.tdsSection}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {editingId === inv.id ? (
                        <select 
                          className="px-1 border rounded bg-white text-[9px]"
                          value={editForm.itcStatus || 'Eligible'}
                          onChange={e => setEditForm({ ...editForm, itcStatus: e.target.value as 'Eligible' | 'Blocked' })}
                        >
                          <option value="Eligible">Eligible</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                      ) : (
                        <>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                            inv.itcStatus === 'Eligible' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {inv.itcStatus}
                          </span>
                          {inv.itcReason && (
                            <span className="text-[8px] text-slate-400 max-w-[80px] truncate" title={inv.itcReason}>
                              {inv.itcReason}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-1">
                      {editingId === inv.id ? (
                        <>
                          <button onClick={saveEditing} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors">
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={cancelEditing} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(inv)} className="p-1 text-slate-300 hover:text-brand hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => onDeleteInvoice(inv.id)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {completedInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
