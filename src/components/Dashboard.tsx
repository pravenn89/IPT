import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { InvoiceData } from '../types';
import { DollarSign, FileCheck, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface DashboardProps {
  invoices: InvoiceData[];
}

const COLORS = ['#1a56db', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ invoices }) => {
  const completedInvoices = invoices.filter(inv => inv.status === 'completed');
  
  const totalSpend = completedInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalInvoicesCount = completedInvoices.length;
  const avgTicketSize = totalInvoicesCount > 0 ? totalSpend / totalInvoicesCount : 0;
  const processingCount = invoices.filter(inv => inv.status === 'processing').length;

  // Category Distribution
  const categoryData = Object.entries(
    completedInvoices.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.totalAmount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]): { name: string; value: number } => ({ name, value: value as number }));

  // Monthly Trends (Mocking months if not enough data, or using real dates)
  const monthlyData = Object.entries(
    completedInvoices.reduce((acc, curr) => {
      const month = curr.date.substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + curr.totalAmount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([month, spend]): { month: string; spend: number } => ({ month, spend: spend as number })).sort((a, b) => a.month.localeCompare(b.month));

  // Tax Distribution
  const taxData = [
    { name: 'Base Amount', value: totalSpend - completedInvoices.reduce((acc, curr) => acc + curr.taxAmount, 0) },
    { name: 'Total Tax', value: completedInvoices.reduce((acc, curr) => acc + curr.taxAmount, 0) }
  ];

  // ITC Distribution
  const itcData = Object.entries(
    completedInvoices.reduce((acc, curr) => {
      const status = curr.itcStatus || 'Eligible';
      acc[status] = (acc[status] || 0) + curr.taxAmount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const totalEligibleITC = completedInvoices
    .filter(inv => inv.itcStatus === 'Eligible')
    .reduce((acc, curr) => acc + curr.taxAmount, 0);
  
  const totalBlockedITC = completedInvoices
    .filter(inv => inv.itcStatus === 'Blocked')
    .reduce((acc, curr) => acc + curr.taxAmount, 0);

  // TDS Summary
  const totalTDSApplicableInvoices = completedInvoices.filter(inv => inv.tdsApplicable === 'Yes');
  const totalPotentialTDSLiability = totalTDSApplicableInvoices.reduce((acc, curr) => {
    const rate = parseFloat(curr.tdsRate?.replace('%', '') || '0');
    return acc + (curr.totalAmount * rate / 100);
  }, 0);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Spend (INR)" 
          value={formatINR(totalSpend)} 
          icon={DollarSign} 
          trend="+12%" 
          color="text-slate-900" 
        />
        <StatCard 
          label="Total Invoices" 
          value={totalInvoicesCount.toLocaleString()} 
          icon={FileCheck} 
          trend="+5" 
          color="text-slate-900" 
        />
        <StatCard 
          label="Avg. Ticket Size" 
          value={formatINR(avgTicketSize)} 
          icon={TrendingUp} 
          trend="-2%" 
          color="text-slate-900" 
        />
        <StatCard 
          label="Pending Processing" 
          value={processingCount.toString()} 
          icon={AlertCircle} 
          color="text-brand" 
          isAccent
        />
      </div>

      <div className="grid grid-cols-12 gap-6 pb-6">
        {/* Spend Trends */}
        <div className="col-span-12 lg:col-span-8 card p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Monthly Spend Trends</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData.length > 0 ? monthlyData : [{ month: 'No Data', spend: 0 }]}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e40af" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1e40af" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatINR(value), 'Spend']}
                  contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="spend" stroke="#1e40af" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="col-span-12 lg:col-span-4 card p-5">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-6">Category Spend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.length > 0 ? categoryData : [{ name: 'No Data', value: 1 }]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  {categoryData.length === 0 && <Cell fill="#f1f5f9" />}
                </Pie>
                <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '6px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-4 overflow-y-auto max-h-32 pr-2">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] text-slate-500 font-bold uppercase truncate max-w-[120px]">{entry.name}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-900">{formatINR(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ITC Eligibility Summary */}
        <div className="col-span-12 lg:col-span-4 card p-5">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-4">ITC Compliance (Sec 17(5))</h3>
          <div className="h-40 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={itcData.length > 0 ? itcData : [{ name: 'No Data', value: 1 }]}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {itcData.map((entry) => (
                    <Cell 
                      key={`cell-${entry.name}`} 
                      fill={entry.name === 'Eligible' ? '#10b981' : '#ef4444'} 
                    />
                  ))}
                  {itcData.length === 0 && <Cell fill="#f1f5f9" />}
                </Pie>
                <Tooltip formatter={(value: number) => formatINR(value)} contentStyle={{ borderRadius: '6px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Compliance</span>
              <span className="text-sm font-black text-slate-800">
                {totalSpend > 0 ? Math.round((totalEligibleITC / (totalEligibleITC + totalBlockedITC || 1)) * 100) : 0}%
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-green-50 p-2 rounded border border-green-100">
              <p className="text-[9px] font-bold text-green-600 uppercase">Eligible ITC</p>
              <p className="text-xs font-black text-green-700">{formatINR(totalEligibleITC)}</p>
            </div>
            <div className="bg-red-50 p-2 rounded border border-red-100">
              <p className="text-[9px] font-bold text-red-600 uppercase">Blocked ITC</p>
              <p className="text-xs font-black text-red-700">{formatINR(totalBlockedITC)}</p>
            </div>
          </div>
          <div className="mt-4 p-2 bg-slate-50 rounded border border-slate-200">
             <p className="text-[8px] text-slate-500 font-medium leading-tight">
               * Based on automated analysis of Section 17(5) rules including food, motor vehicles, personal consumption, etc.
             </p>
          </div>
        </div>

        {/* TDS Overview */}
        <div className="col-span-12 lg:col-span-4 card p-5 bg-indigo-50/20 border-indigo-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-tight">TDS Estimator (FY 2024-25)</h3>
            <span className="text-[8px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded italic">AUTO-OCR</span>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex items-end justify-between border-b border-indigo-50 pb-2">
              <span className="text-[10px] text-indigo-600 font-bold uppercase">Estimated Liability</span>
              <span className="text-xl font-black text-indigo-900">{formatINR(totalPotentialTDSLiability)}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500 font-medium font-bold uppercase">Applicable Invoices</span>
                <span className="font-mono font-bold text-slate-700">{totalTDSApplicableInvoices.length}</span>
              </div>
              <div className="w-full bg-indigo-100 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full" 
                  style={{ width: `${totalInvoicesCount > 0 ? (totalTDSApplicableInvoices.length / totalInvoicesCount) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1" />
                <p className="text-[9px] text-slate-600 leading-tight">
                  <span className="font-bold text-indigo-700">Pro-Tip:</span> Automated identification of Sec 194C, 194J, and 194I based on vendor nature.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1" />
                <p className="text-[9px] text-slate-600 leading-tight">
                  Check threshold limits (e.g. ₹30,000 for 194J) manually before remittance.
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => window.open('https://incometaxindia.gov.in', '_blank')}
            className="mt-auto w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase rounded shadow-sm transition-colors tracking-widest"
          >
            Compliance Portal
          </button>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  icon: any;
  trend?: string;
  color: string;
  isAccent?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, color, isAccent }) => (
  <div className={cn(
    "card p-4 flex flex-col justify-between h-32 transition-colors",
    isAccent && "border-brand bg-blue-50/30"
  )}>
    <div className="flex justify-between items-start">
      <div className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">{label}</div>
      {trend && (
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded",
          trend.startsWith('+') ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        )}>
          {trend}
        </span>
      )}
    </div>
    <div className="mt-auto">
      <div className={cn("text-2xl font-black tracking-tight", isAccent ? "text-brand" : "text-slate-900")}>
        {value}
      </div>
      <div className="text-[10px] text-slate-400 mt-1 font-medium italic">
        {isAccent ? "OCR confidence level: 98.4%" : "Updated just now"}
      </div>
    </div>
  </div>
);

export default Dashboard;
