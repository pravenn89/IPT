import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UploadSection from './components/UploadSection';
import DataTable from './components/DataTable';
import Auth from './components/Auth';
import { AppSection, InvoiceData } from './types';
import { extractInvoiceDetails } from './services/geminiService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<AppSection>('dashboard');
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) {
        setInvoices([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user) return;

    // Validate connection per instructions
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error: any) {
        if (error.message?.includes('offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const q = query(collection(db, 'users', user.uid, 'invoices'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InvoiceData));
      setInvoices(data);
    });

    return () => unsubscribe();
  }, [user]);

  const handleFilesSelected = async (files: File[]) => {
    if (!user) return;
    setActiveSection('upload');
    
    // Initial placeholder state for processing
    const newInvoices = files.map(file => {
      const id = crypto.randomUUID();
      const initialData = {
        fileName: file.name,
        status: 'processing',
        invoiceNumber: '',
        date: '',
        vendorName: '',
        items: [],
        taxAmount: 0,
        totalAmount: 0,
        category: 'Others',
        itcStatus: 'Eligible',
        tdsApplicable: 'No',
        tdsRate: '0%',
        tdsSection: '',
        userId: user.uid,
        createdAt: new Date().toISOString(), // Fallback for local state until Firestore sets it
        updatedAt: new Date().toISOString()
      };

      // Add to Firestore
      setDoc(doc(db, 'users', user.uid, 'invoices', id), {
        ...initialData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { id, ...initialData } as InvoiceData;
    });

    // Process each file
    files.forEach(async (file, index) => {
      const targetId = newInvoices[index].id;
      try {
        const extracted = await extractInvoiceDetails(file);
        const invoiceRef = doc(db, 'users', user.uid, 'invoices', targetId);
        await updateDoc(invoiceRef, {
          ...extracted,
          status: 'completed',
          updatedAt: serverTimestamp()
        });
      } catch (err: any) {
        const invoiceRef = doc(db, 'users', user.uid, 'invoices', targetId);
        await updateDoc(invoiceRef, {
          status: 'error',
          errorMessage: err.message || 'Failed to extract data',
          updatedAt: serverTimestamp()
        });
      }
    });
  };

  const updateInvoice = async (updated: InvoiceData) => {
    if (!user) return;
    const invoiceRef = doc(db, 'users', user.uid, 'invoices', updated.id);
    const { id, ...data } = updated; // Remove ID for update
    await updateDoc(invoiceRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  };

  const deleteInvoice = async (id: string) => {
    if (!user) return;
    const invoiceRef = doc(db, 'users', user.uid, 'invoices', id);
    await deleteDoc(invoiceRef);
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Initializing Secure Environment...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard invoices={invoices} />;
      case 'upload':
        return (
          <div className="space-y-12">
            <UploadSection 
              onFilesSelected={handleFilesSelected} 
              processingInvoices={invoices.filter(inv => inv.status !== 'completed' && inv.status !== 'error')} 
            />
            {invoices.some(inv => inv.status === 'completed') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                  <h3 className="text-xl font-bold text-gray-900">Recently Processed</h3>
                  <button 
                    onClick={() => setActiveSection('reports')}
                    className="text-brand text-sm font-semibold hover:underline"
                  >
                    View All Reports →
                  </button>
                </div>
                <DataTable 
                  invoices={invoices.slice(-5)} 
                  onUpdateInvoice={updateInvoice} 
                  onDeleteInvoice={deleteInvoice} 
                />
              </div>
            )}
          </div>
        );
      case 'reports':
        return <DataTable invoices={invoices} onUpdateInvoice={updateInvoice} onDeleteInvoice={deleteInvoice} />;
      default:
        return <Dashboard invoices={invoices} />;
    }
  };

  return (
    <div className="flex h-screen bg-bg-app font-sans overflow-hidden">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span className="text-slate-800 capitalize">{activeSection} Overview</span> 
            <span className="text-slate-300">/</span> 
            <span className="text-sm">FY 2024-25</span>
          </div>
          
          <div className="flex items-center gap-3">
             {invoices.some(i => i.status === 'processing') && (
               <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-50 text-brand rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse border border-blue-100">
                 <div className="w-1.5 h-1.5 bg-brand rounded-full" />
                 Processing...
               </div>
             )}
             <div className="text-right mr-2 hidden sm:block">
               <div className="text-sm font-semibold">Aditya Sharma</div>
               <div className="text-[10px] text-slate-400 uppercase tracking-wider">Accounting Admin</div>
             </div>
             <div className="h-10 w-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-brand font-bold text-sm">
               AS
             </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          <div className="max-w-7xl mx-auto">
            {renderSection()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
