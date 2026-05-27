import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, BookOpen, Users, ArrowLeftRight, Coins, 
  FileText, PieChart, ListOrdered, Settings, Printer, 
  PlusCircle, ShieldCheck, Download, Upload, Trash2, Edit2, 
  CheckCircle2, AlertCircle
} from 'lucide-react';

// --- UTILITY FUNCTIONS ---
const generateID = () => 'id_' + Math.random().toString(36).substr(2, 9);
const daysBetween = (d1, d2) => Math.floor((new Date(d2) - new Date(d1)) / 86400000);
const getChittyCycles = (start) => Array.from({ length: 26 }, (_, i) => {
  const d = new Date(start);
  d.setDate(d.getDate() + (i * 14));
  return { number: i + 1, date: d.toISOString().split('T')[0] };
});

// --- DECOUPLED STANDALONE TAB COMPONENTS ---

const TransactionsTab = ({ db, personMap, chittyMap, modals, setModals, updateDb, triggerToast, askConfirm }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const pageSize = 50;

  const filteredTxs = useMemo(() => {
    return db.transactions
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || b.timestamp.localeCompare(a.timestamp))
      .filter(t => {
        const pName = personMap.get(t.personId)?.name || '';
        if (filter !== 'ALL' && t.type !== filter) return false;
        if (search && !pName.toLowerCase().includes(search.toLowerCase()) && !t.type.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      });
  }, [db.transactions, search, filter, personMap]);
  
  const totalPages = Math.ceil(filteredTxs.length / pageSize) || 1;
  const paginated = filteredTxs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-6xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      <div className="p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50 shrink-0">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          Journal History <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{filteredTxs.length} Entries</span>
        </h3>
        <div className="flex gap-2">
          <input type="text" placeholder="Search logs..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-48"/>
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
            <option value="ALL">All Event Types</option>
            <option value="OHARI_COLLECTION">Ohari Collection</option>
            <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
            <option value="LOAN_REPAYMENT">Loan Repayment</option>
            <option value="INTEREST_RECEIVED">Interest Received</option>
            <option value="PENALTY">Penalty</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>
      </div>
      <div className="overflow-y-auto flex-1">
        <table className="w-full text-left relative">
          <thead className="bg-white text-xs uppercase text-slate-500 font-semibold tracking-wider sticky top-0 shadow-sm z-10">
            <tr><th className="p-4">Date</th><th className="p-4">Nav Type</th><th className="p-4">Entity & Ref</th><th className="p-4 text-right">Debit (+)</th><th className="p-4 text-right">Credit (-)</th><th className="p-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {paginated.map(t => {
              const pName = personMap.get(t.personId)?.name || 'Unknown';
              const cName = chittyMap.get(t.chittyId)?.name || '-';
              const isDebit = ['OHARI_COLLECTION', 'LOAN_REPAYMENT', 'INTEREST_RECEIVED', 'PENALTY'].includes(t.type);
              return (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-500 font-mono">{t.date}</td>
                  <td className="p-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 text-[10px] font-bold uppercase tracking-wider">{t.type.replace('_', ' ')}</span></td>
                  <td className="p-4 font-semibold text-slate-800">{pName}<span className="block text-xs font-normal text-slate-500">{cName} {t.notes ? `| ${t.notes}` : ''}</span></td>
                  <td className="p-4 text-right font-mono font-medium text-emerald-600">{isDebit ? `₹${parseFloat(t.amount).toLocaleString('en-IN')}` : '-'}</td>
                  <td className="p-4 text-right font-mono font-medium text-rose-600">{!isDebit ? `₹${parseFloat(t.amount).toLocaleString('en-IN')}` : '-'}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => setModals({ ...modals, editTx: t })} className="text-slate-400 hover:text-blue-600 p-1.5"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => askConfirm('Delete Journal Entry?', () => {
                      updateDb({ ...db, transactions: db.transactions.filter(x => x.id !== t.id) }); triggerToast("Entry Deleted");
                    })} className="text-slate-400 hover:text-red-600 p-1.5"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
        <span className="text-xs text-slate-500 font-medium">Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredTxs.length)} of {filteredTxs.length}</span>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-sm font-medium shadow-sm">Prev</button>
          <span className="px-3 py-1.5 text-sm font-medium text-slate-600">Pg {page}/{totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-sm font-medium shadow-sm">Next</button>
        </div>
      </div>
    </div>
  );
};

const LedgerTab = ({ db, personMap }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 50;

  const { filtered, closingBal } = useMemo(() => {
    let bal = 0;
    const sortedTxs = [...db.transactions].sort((a, b) => a.date.localeCompare(b.date) || a.timestamp.localeCompare(b.timestamp));
    
    const txsWithBal = sortedTxs.map(t => {
      const isDebit = ['OHARI_COLLECTION', 'LOAN_REPAYMENT', 'INTEREST_RECEIVED', 'PENALTY'].includes(t.type);
      const amt = parseFloat(t.amount);
      isDebit ? (bal += amt) : (bal -= amt);
      return { ...t, runningBal: bal };
    });
    
    const finalBal = bal;
    txsWithBal.reverse();
    
    const fil = txsWithBal.filter(t => {
      const pName = personMap.get(t.personId)?.name || '';
      const typeStr = t.type.replace('_', ' ');
      if (search && !pName.toLowerCase().includes(search.toLowerCase()) && !typeStr.toLowerCase().includes(search.toLowerCase()) && !t.date.includes(search)) return false;
      return true;
    });

    return { filtered: fil, closingBal: finalBal };
  }, [db.transactions, search, personMap]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-6xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
      <div className="p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50 shrink-0">
        <h3 className="text-lg font-bold text-slate-800">General Cash Ledger</h3>
        <div className="flex gap-3 items-center">
          <input type="text" placeholder="Search particulars..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-64"/>
          <div className="text-sm bg-white border border-slate-200 px-4 py-2 rounded-lg font-medium text-slate-700 shadow-sm">
            Closing Balance: <span className="text-blue-600 font-bold text-base ml-1">₹{closingBal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
      <div className="overflow-y-auto flex-1">
        <table className="w-full text-left relative">
          <thead className="bg-white text-xs uppercase text-slate-500 font-semibold tracking-wider sticky top-0 shadow-sm z-10">
            <tr><th className="p-4">Date</th><th className="p-4">Particulars</th><th className="p-4 text-right">Debit (+)</th><th className="p-4 text-right">Credit (-)</th><th className="p-4 text-right">Balance</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {paginated.map(t => {
              const pName = personMap.get(t.personId)?.name || '';
              const typeStr = t.type.replace('_', ' ');
              const isDebit = ['OHARI_COLLECTION', 'LOAN_REPAYMENT', 'INTEREST_RECEIVED', 'PENALTY'].includes(t.type);
              return (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-500 font-mono">{t.date}</td>
                  <td className="p-4 font-semibold text-slate-700">{typeStr} <span className="font-normal text-slate-500 ml-1 text-xs">{pName}</span></td>
                  <td className="p-4 text-right font-mono font-medium text-emerald-600">{isDebit ? `₹${parseFloat(t.amount).toLocaleString('en-IN')}` : '-'}</td>
                  <td className="p-4 text-right font-mono font-medium text-rose-600">{!isDebit ? `₹${parseFloat(t.amount).toLocaleString('en-IN')}` : '-'}</td>
                  <td className="p-4 text-right font-mono font-bold text-slate-800 bg-slate-50/50">₹{t.runningBal.toLocaleString('en-IN')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
        <span className="text-xs text-slate-500 font-medium">Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-sm font-medium shadow-sm">Prev</button>
          <span className="px-3 py-1.5 text-sm font-medium text-slate-600">Pg {page}/{totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-sm font-medium shadow-sm">Next</button>
        </div>
      </div>
    </div>
  );
};

const ReportsTab = ({ db }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  
  const metrics = useMemo(() => {
    let repTxs = db.transactions;
    if (start) repTxs = repTxs.filter(t => t.date >= start);
    if (end) repTxs = repTxs.filter(t => t.date <= end);

    let totOhari = 0, totInt = 0, totPen = 0, totLoan = 0;
    repTxs.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.type === 'OHARI_COLLECTION') totOhari += amt;
      if (t.type === 'INTEREST_RECEIVED') totInt += amt;
      if (t.type === 'PENALTY') totPen += amt;
      if (t.type === 'LOAN_DISBURSEMENT') totLoan += amt;
    });
    return { totOhari, totInt, totPen, totLoan };
  }, [db.transactions, start, end]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-800">Financial Reports & Filters</h3>
          <div className="flex gap-2 items-center">
            <input type="date" value={start} onChange={e => setStart(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"/>
            <span className="text-slate-400 text-xs">to</span>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"/>
            <button onClick={() => { setStart(''); setEnd(''); }} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">Clear</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100"><p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Total Ohari</p><h4 className="text-xl font-bold text-blue-900 mt-1">₹{metrics.totOhari.toLocaleString('en-IN')}</h4></div>
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100"><p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Interest Received</p><h4 className="text-xl font-bold text-emerald-900 mt-1">₹{metrics.totInt.toLocaleString('en-IN')}</h4></div>
          <div className="bg-purple-50 p-5 rounded-xl border border-purple-100"><p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Penalty Received</p><h4 className="text-xl font-bold text-purple-900 mt-1">₹{metrics.totPen.toLocaleString('en-IN')}</h4></div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-100"><p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Loans Disbursed</p><h4 className="text-xl font-bold text-rose-900 mt-1">₹{metrics.totLoan.toLocaleString('en-IN')}</h4></div>
        </div>
      </div>
    </div>
  );
};

const SummaryTab = ({ db, loanMetrics }) => {
  const [search, setSearch] = useState('');
  
  const summaryData = useMemo(() => {
    const statsMap = new Map(db.persons.map(p => [p.id, { totOhari: 0, intPaidEver: 0, disbManual: 0, intOs: 0 }]));
    
    db.transactions.forEach(t => {
      if (!statsMap.has(t.personId)) return;
      const s = statsMap.get(t.personId);
      const amt = parseFloat(t.amount);
      if (t.type === 'OHARI_COLLECTION') s.totOhari += amt;
      if (t.type === 'INTEREST_RECEIVED') s.intPaidEver += amt;
      if (t.type === 'LOAN_DISBURSEMENT') s.disbManual += amt;
    });

    loanMetrics.activeLoans.forEach(l => {
      if (statsMap.has(l.personId)) statsMap.get(l.personId).intOs += l.interestDue;
    });

    return db.persons.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => {
      const s = statsMap.get(p.id);
      const fixed = parseFloat(p.ohari || 0);
      const cycles = fixed > 0 ? (s.totOhari / fixed).toFixed(1) : '0';
      return { ...p, fixed, cycles, ...s };
    });
  }, [db.persons, db.transactions, loanMetrics, search]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-7xl mx-auto">
      <div className="p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50">
        <h3 className="text-lg font-bold text-slate-800">Consolidated Member Profile Summary</h3>
        <input type="text" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-64"/>
      </div>
      <div className="overflow-x-auto max-h-[calc(100vh-16rem)]">
        <table className="w-full text-left relative">
          <thead className="bg-white text-xs uppercase text-slate-500 font-semibold tracking-wider sticky top-0 shadow-sm z-10">
            <tr><th className="p-4">Member Name</th><th className="p-4 text-right">Fixed Ohari Rate</th><th className="p-4 text-center">Ohari Cycles Given</th><th className="p-4 text-right">Loan Took (Disbursed)</th><th className="p-4 text-right">Interest Paid</th><th className="p-4 text-right text-amber-600">Interest O/S</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {summaryData.map((d, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-semibold text-slate-800">{d.name} <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-normal mt-0.5">{d.type}</span></td>
                <td className="p-4 text-right font-mono text-slate-600">₹{d.fixed.toLocaleString('en-IN')}</td>
                <td className="p-4 text-center font-mono font-bold text-blue-600 bg-blue-50/30">{d.cycles}</td>
                <td className="p-4 text-right font-mono text-slate-600">₹{d.disbManual.toLocaleString('en-IN')}</td>
                <td className="p-4 text-right font-mono text-emerald-600">₹{d.intPaidEver.toLocaleString('en-IN')}</td>
                <td className="p-4 text-right font-mono font-bold text-amber-600 bg-amber-50/30">₹{d.intOs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PersonProfileModal = ({ profile, db, loanMetrics, onClose }) => {
  const data = useMemo(() => {
    let totOhari = 0, intPaid = 0, pen = 0;
    db.transactions.forEach(t => { 
      if (t.personId === profile.id) { 
        const a = parseFloat(t.amount); 
        if (t.type === 'OHARI_COLLECTION') totOhari += a; 
        if (t.type === 'INTEREST_RECEIVED') intPaid += a; 
        if (t.type === 'PENALTY') pen += a; 
      }
    });
    let os = 0, intDue = 0, expected = 0;
    loanMetrics.activeLoans.forEach(l => { 
      if (l.personId === profile.id) { 
        os += l.outstandingPrincipal; 
        intDue += l.interestDue; 
        expected += l.expectedInterest; 
      }
    });
    const fixed = parseFloat(profile.ohari || 0);
    const cycles = fixed > 0 ? (totOhari / fixed).toFixed(1) : '0';
    return { totOhari, intPaid, pen, os, intDue, expected, cycles };
  }, [profile, db.transactions, loanMetrics]);

  return (
    <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[95vh] border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0 rounded-t-2xl">
          <h3 className="text-xl font-bold text-slate-800">{profile.name} <span className="text-sm font-normal text-slate-500">| Complete Profile</span></h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 p-2">
            <AlertCircle className="w-6 h-6 rotate-45" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 sm:col-span-2">
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Total Ohari Given</p>
              <h4 className="text-3xl font-bold text-blue-900 mt-1">₹{data.totOhari.toLocaleString('en-IN')}</h4>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 sm:col-span-2">
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Ohari Cycles Rendered</p>
              <h4 className="text-3xl font-bold text-emerald-900 mt-1">{data.cycles}</h4>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Loan Outstanding</p>
              <h4 className="text-xl font-bold text-slate-800 mt-1">₹{data.os.toLocaleString('en-IN')}</h4>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Expected Int. Accrual</p>
              <h4 className="text-xl font-bold text-slate-800 mt-1">₹{data.expected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h4>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Interest Paid To Date</p>
              <h4 className="text-xl font-bold text-slate-800 mt-1">₹{data.intPaid.toLocaleString('en-IN')}</h4>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-inner">
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Current Interest Due</p>
              <h4 className="text-xl font-bold text-amber-900 mt-1">₹{data.intDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h4>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 shadow-sm transition-colors">
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('1234');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, msg: '', action: null });
  
  // Database State
  const [db, setDb] = useState({ persons: [], chitties: [], transactions: [] });

  // Modals State
  const [modals, setModals] = useState({
    transaction: false, chitty: false, person: false,
    editPerson: null, editTx: null, personProfile: null
  });

  // Initialization
  useEffect(() => {
    const localData = localStorage.getItem('keralaChitsReactDB');
    const localSettings = localStorage.getItem('keralaChitsReactSettings');
    
    if (localData) {
      setDb(JSON.parse(localData));
    } else {
      const initialDb = {
        chitties: [{ id: generateID(), name: "Mankulam Series A", startDate: "2026-05-01" }],
        persons: [
          { id: generateID(), name: "Rahul Krishna", mobile: "9876543210", type: "INTERNAL", ohari: 5000 },
          { id: generateID(), name: "Anil George", mobile: "9876543211", type: "EXTERNAL", ohari: 0 }
        ],
        transactions: []
      };
      setDb(initialDb);
      localStorage.setItem('keralaChitsReactDB', JSON.stringify(initialDb));
    }
    
    if (localSettings) setPin(JSON.parse(localSettings).pin);
  }, []);

  const updateDb = (newDb) => {
    setDb(newDb);
    localStorage.setItem('keralaChitsReactDB', JSON.stringify(newDb));
  };

  const triggerToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const askConfirm = (msg, action) => setConfirmModal({ show: true, msg, action });

  const personMap = useMemo(() => new Map(db.persons.map(p => [p.id, p])), [db.persons]);
  const chittyMap = useMemo(() => new Map(db.chitties.map(c => [c.id, c])), [db.chitties]);

  // --- MATH ENGINE ---
  const loanMetrics = useMemo(() => {
    const profiles = {};

    const loanTxs = db.transactions
      .filter(t => ['LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'INTEREST_RECEIVED'].includes(t.type))
      .sort((a, b) => a.date.localeCompare(b.date) || a.timestamp.localeCompare(b.timestamp));

    loanTxs.forEach(t => {
      const key = `${t.personId}_${t.chittyId}`;
      if (!profiles[key]) {
        profiles[key] = {
          personId: t.personId, chittyId: t.chittyId, balance: 0,
          totalDisbursed: 0, totalRepaid: 0, interestPaid: 0,
          expectedInterest: 0, lastCycle: null, anchorDate: t.date
        };
      }

      const p = profiles[key];
      const startDate = chittyMap.has(t.chittyId) ? chittyMap.get(t.chittyId).startDate : p.anchorDate;
      
      const elapsedDays = daysBetween(startDate, t.date);
      const currentCycle = Math.floor(elapsedDays / 14) + 1;

      if (p.lastCycle !== null && p.lastCycle < currentCycle) {
        const cycleDiff = currentCycle - p.lastCycle;
        p.expectedInterest += p.balance * cycleDiff * 0.025;
      }
      p.lastCycle = currentCycle;

      const amt = parseFloat(t.amount);
      if (t.type === 'LOAN_DISBURSEMENT') { p.balance += amt; p.totalDisbursed += amt; }
      if (t.type === 'LOAN_REPAYMENT') { p.balance -= amt; p.totalRepaid += amt; }
      if (t.type === 'INTEREST_RECEIVED') p.interestPaid += amt;
    });

    const today = new Date().toISOString().split('T')[0];
    const activeLoans = [];
    let totalOs = 0, totalIntDue = 0, sumDisbursed = 0;

    Object.values(profiles).forEach(p => {
      const startDate = chittyMap.has(p.chittyId) ? chittyMap.get(p.chittyId).startDate : p.anchorDate;
      const todayCycle = Math.floor(daysBetween(startDate, today) / 14) + 1;

      if (p.lastCycle !== null && p.lastCycle < todayCycle) {
        const cycleDiff = todayCycle - p.lastCycle;
        p.expectedInterest += p.balance * cycleDiff * 0.025;
        p.lastCycle = todayCycle;
      }

      p.interestDue = Math.max(0, p.expectedInterest - p.interestPaid);
      
      if (p.balance > 0 || p.interestDue > 0 || p.totalDisbursed > 0) {
        if (p.balance > 0) totalOs += p.balance;
        if (p.interestDue > 0) totalIntDue += p.interestDue;
        sumDisbursed += p.totalDisbursed;
        activeLoans.push({ ...p, outstandingPrincipal: p.balance });
      }
    });

    return { activeLoans, totalOs, totalIntDue, sumDisbursed };
  }, [db.transactions, chittyMap]);

  const generalMetrics = useMemo(() => {
    let totOhari = 0, cashIn = 0, cashOut = 0;
    db.transactions.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.type === 'OHARI_COLLECTION') { totOhari += amt; cashIn += amt; }
      else if (['LOAN_REPAYMENT', 'INTEREST_RECEIVED', 'PENALTY'].includes(t.type)) cashIn += amt;
      else if (['LOAN_DISBURSEMENT', 'EXPENSE'].includes(t.type)) cashOut += amt;
    });
    return { totOhari, cash: cashIn - cashOut };
  }, [db.transactions]);


  // --- LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 bg-gradient-to-br from-slate-100 to-blue-100">
        <div className="bg-white/80 backdrop-blur-xl p-10 max-w-sm w-full text-center shadow-2xl rounded-2xl border border-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
          <ShieldCheck className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Kerala Chits</h1>
          <p className="text-slate-500 mb-6 text-xs font-semibold uppercase tracking-wider">Secure Access</p>
          <input 
            type="password" id="loginPin" maxLength="4" placeholder="Enter PIN (1234)"
            className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-[0.5em] text-xl font-bold mb-4"
          />
          <button 
            onClick={() => {
              if (document.getElementById('loginPin').value === pin) setIsAuthenticated(true);
              else alert('Invalid PIN');
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/30"
          >
            Unlock System
          </button>
        </div>
      </div>
    );
  }

  const SidebarItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-sm font-medium ${
        activeTab === id ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon className="w-5 h-5" /> {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden selection:bg-blue-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm hidden md:flex shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-500/20"><BookOpen className="w-6 h-6" /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">Kerala Chits</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ERP System</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem id="chitties" icon={BookOpen} label="Chitty Master" />
          <SidebarItem id="persons" icon={Users} label="Members & Directory" />
          <SidebarItem id="transactions" icon={ArrowLeftRight} label="Journal Entries" />
          <SidebarItem id="loans" icon={Coins} label="Loan Management" />
          <SidebarItem id="ledger" icon={FileText} label="General Ledger" />
          <SidebarItem id="reports" icon={PieChart} label="Financial Reports" />
          <SidebarItem id="summary" icon={ListOrdered} label="Member Summary" />
          <SidebarItem id="settings" icon={Settings} label="System Settings" />
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={() => setIsAuthenticated(false)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors flex justify-center items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Lock System
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="bg-white/60 backdrop-blur-md border-b border-slate-200 p-4 px-8 flex justify-between items-center shrink-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="p-2.5 text-slate-500 hover:text-blue-600 bg-white rounded-full shadow-sm border border-slate-200 transition-all"><Printer className="w-5 h-5" /></button>
            <button onClick={() => setModals({ ...modals, transaction: true })} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-semibold shadow-md shadow-blue-500/30 flex items-center gap-2 transition-all">
              <PlusCircle className="w-5 h-5" /> New Entry
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          
          {/* DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-emerald-500">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Ohari Collected</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-2">₹{generalMetrics.totOhari.toLocaleString('en-IN')}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Outstanding Loans</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-2">₹{loanMetrics.totalOs.toLocaleString('en-IN')}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-amber-500">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Interest Receivable</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-2">₹{loanMetrics.totalIntDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-purple-500">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Cash In Hand</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-2">₹{generalMetrics.cash.toLocaleString('en-IN')}</h3>
                </div>
              </div>
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Activity Overview</h3>
                  <div className="h-64 flex items-end gap-2 text-xs text-slate-500">
                    <p className="m-auto text-slate-400">System metrics are running. Use Reports tab for detailed graphical charts.</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Upcoming Cycles</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {db.chitties.length === 0 ? <p className="text-sm text-slate-400">No active chitties.</p> : null}
                    {db.chitties.flatMap(c => getChittyCycles(c.startDate).filter(cy => cy.date >= new Date().toISOString().split('T')[0]).map(cy => ({ ...cy, name: c.name })))
                      .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6).map((item, i) => (
                        <div key={i} className={`p-3 rounded-xl border flex justify-between items-center ${item.date === new Date().toISOString().split('T')[0] ? 'border-blue-200 bg-blue-50 text-blue-900' : 'border-slate-100 bg-slate-50'}`}>
                          <div>
                            <p className="text-sm font-semibold">{item.name}</p>
                            <p className="text-xs text-slate-500">Cycle {item.number} / 26</p>
                          </div>
                          <div className="text-sm font-mono font-bold bg-white px-2 py-1 rounded shadow-sm">{item.date}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHITTIES VIEW */}
          {activeTab === 'chitties' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-5xl mx-auto">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">Chitty Master</h3>
                <button onClick={() => setModals({ ...modals, chitty: true })} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-all">+ Add Chitty</button>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                  <tr><th className="p-4">Chitty Name</th><th className="p-4">Start Date</th><th className="p-4">Progress</th><th className="p-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {db.chitties.map(c => {
                    const currentCycle = Math.min(26, Math.max(1, Math.floor(daysBetween(c.startDate, new Date().toISOString().split('T')[0]) / 14) + 1));
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-semibold text-slate-800">{c.name}</td>
                        <td className="p-4 font-mono">{c.startDate}</td>
                        <td className="p-4">
                          <div className="w-full bg-slate-200 rounded-full h-2 mb-1"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(currentCycle / 26) * 100}%` }}></div></div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Cycle {currentCycle} of 26</span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => askConfirm(`Delete Chitty ${c.name}? ALL linked transactions will be removed.`, () => {
                            updateDb({ ...db, chitties: db.chitties.filter(x => x.id !== c.id), transactions: db.transactions.filter(x => x.chittyId !== c.id) });
                            triggerToast("Chitty Deleted");
                          })} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PERSONS VIEW */}
          {activeTab === 'persons' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200"><p className="text-[10px] text-slate-500 font-bold uppercase">Total Members</p><h4 className="text-2xl font-bold text-blue-700 mt-1">{db.persons.filter(p => p.type === 'INTERNAL').length}</h4></div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200"><p className="text-[10px] text-slate-500 font-bold uppercase">External Borrowers</p><h4 className="text-2xl font-bold text-amber-700 mt-1">{db.persons.filter(p => p.type === 'EXTERNAL').length}</h4></div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200"><p className="text-[10px] text-slate-500 font-bold uppercase">Total Fixed Ohari</p><h4 className="text-2xl font-bold text-emerald-700 mt-1">₹{db.persons.reduce((sum, p) => sum + parseFloat(p.ohari || 0), 0).toLocaleString('en-IN')}</h4></div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800">Directory</h3>
                  <button onClick={() => setModals({ ...modals, person: true })} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-all">+ Add Person</button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    <tr><th className="p-4">Name</th><th className="p-4">Type</th><th className="p-4">Contact</th><th className="p-4">Fixed Ohari</th><th className="p-4 text-center">Dashboard</th><th className="p-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {db.persons.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-semibold text-slate-800">{p.name}</td>
                        <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${p.type === 'INTERNAL' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{p.type}</span></td>
                        <td className="p-4 font-mono text-slate-600">{p.mobile}</td>
                        <td className="p-4 font-mono text-slate-800 font-medium">₹{parseFloat(p.ohari || 0).toLocaleString('en-IN')}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => setModals({ ...modals, personProfile: p })} className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">View Data</button>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => setModals({ ...modals, editPerson: p })} className="text-slate-400 hover:text-blue-600 p-2"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => askConfirm(`Delete ${p.name}?`, () => {
                            updateDb({ ...db, persons: db.persons.filter(x => x.id !== p.id), transactions: db.transactions.filter(x => x.personId !== p.id) });
                            triggerToast("Member Deleted");
                          })} className="text-slate-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DYNAMIC TAB OUTSOURCED TO RESOLVE LIFECYCLE HOOK ERRORS */}
          {activeTab === 'transactions' && (
            <TransactionsTab db={db} personMap={personMap} chittyMap={chittyMap} modals={modals} setModals={setModals} updateDb={updateDb} triggerToast={triggerToast} askConfirm={askConfirm} />
          )}

          {/* LOANS VIEW */}
          {activeTab === 'loans' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200"><p className="text-[10px] text-slate-500 font-bold uppercase">Active Borrowers</p><h4 className="text-2xl font-bold text-slate-800 mt-1">{loanMetrics.activeLoans.length}</h4></div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200"><p className="text-[10px] text-slate-500 font-bold uppercase">Total Principal Issued</p><h4 className="text-2xl font-bold text-blue-700 mt-1">₹{loanMetrics.sumDisbursed.toLocaleString('en-IN')}</h4></div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-b-4 border-b-brand-500"><p className="text-[10px] text-slate-500 font-bold uppercase">Outstanding Principal</p><h4 className="text-2xl font-bold text-brand-700 mt-1">₹{loanMetrics.totalOs.toLocaleString('en-IN')}</h4></div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-b-4 border-b-amber-500"><p className="text-[10px] text-slate-500 font-bold uppercase">Total Interest Due (O/S)</p><h4 className="text-2xl font-bold text-amber-700 mt-1">₹{loanMetrics.totalIntDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h4></div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800">Active Loan Portfolios</h3>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-white text-xs uppercase text-slate-500 font-semibold tracking-wider">
                    <tr><th className="p-4 border-b">Borrower</th><th className="p-4 border-b">Chitty Ref</th><th className="p-4 border-b text-right">Principal Issued</th><th className="p-4 border-b text-right text-brand-600">Outstanding Principal</th><th className="p-4 border-b text-right text-amber-600">Interest Due</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {loanMetrics.activeLoans.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-400">No active loans found.</td></tr>}
                    {loanMetrics.activeLoans.map((l, i) => {
                      const person = personMap.get(l.personId)?.name || 'Unknown';
                      const chitty = chittyMap.get(l.chittyId)?.name || '-';
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-4 font-semibold text-slate-800">{person}</td>
                          <td className="p-4 text-slate-500">{chitty}</td>
                          <td className="p-4 text-right font-mono text-slate-600">₹{l.totalDisbursed.toLocaleString('en-IN')}</td>
                          <td className="p-4 text-right font-mono font-bold text-brand-600 bg-brand-50/30">₹{l.outstandingPrincipal.toLocaleString('en-IN')}</td>
                          <td className="p-4 text-right font-mono font-bold text-amber-600 bg-amber-50/30">₹{l.interestDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DYNAMIC LEDGER TAB OUTSOURCED */}
          {activeTab === 'ledger' && (
            <LedgerTab db={db} personMap={personMap} />
          )}

          {/* DYNAMIC REPORTS TAB OUTSOURCED */}
          {activeTab === 'reports' && (
            <ReportsTab db={db} />
          )}

          {/* DYNAMIC SUMMARY TAB OUTSOURCED */}
          {activeTab === 'summary' && (
            <SummaryTab db={db} loanMetrics={loanMetrics} />
          )}

          {/* SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">System Settings & Data Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/50">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-slate-400" /> Security</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">New Application PIN</label>
                        <input type="password" id="set-new-pin" maxLength="4" placeholder="Enter 4-digit PIN" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500"/>
                      </div>
                      <button onClick={() => {
                        const v = document.getElementById('set-new-pin').value;
                        if (v.length >= 4) { setPin(v); localStorage.setItem('keralaChitsReactSettings', JSON.stringify({ pin: v })); triggerToast('PIN Updated'); document.getElementById('set-new-pin').value = ''; }
                        else alert('PIN must be at least 4 characters');
                      }} className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors">Update PIN</button>
                    </div>
                  </div>

                  <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/50">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Download className="w-5 h-5 text-slate-400" /> Data Portability</h4>
                    <div className="space-y-3">
                      <button onClick={() => {
                        const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
                        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `Backup_${new Date().toISOString().split('T')[0]}.json`;
                        a.click(); URL.revokeObjectURL(a.href); triggerToast('JSON Backup Downloaded');
                      }} className="w-full bg-blue-50 text-blue-700 border border-blue-200 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">Backup JSON DB</button>
                      
                      <button onClick={() => {
                        let csv = "Date,Type,Person,Chitty,Amount,Notes\n";
                        [...db.transactions].sort((a, b) => a.date.localeCompare(b.date)).forEach(t => {
                          csv += `${t.date},${t.type},"${personMap.get(t.personId)?.name || ''}","${chittyMap.get(t.chittyId)?.name || ''}",${t.amount},"${(t.notes || '').replace(/"/g, '""')}"\n`;
                        });
                        const blob = new Blob([csv], { type: "text/csv" });
                        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `Journals_${new Date().toISOString().split('T')[0]}.csv`;
                        a.click(); URL.revokeObjectURL(a.href); triggerToast('CSV Exported');
                      }} className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2">Export Journals (CSV)</button>

                      <div className="relative mt-2">
                        <input type="file" accept=".json" onChange={e => {
                          const f = e.target.files[0]; if (!f) return;
                          const r = new FileReader(); r.onload = (ev) => {
                            try { const newDb = JSON.parse(ev.target.result); if (newDb.transactions) { updateDb(newDb); triggerToast('DB Restored'); } } catch (err) { alert('Invalid file'); }
                          }; r.readAsText(f); e.target.value = '';
                        }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                        <button className="w-full bg-amber-50 text-amber-700 border border-amber-200 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Restore JSON DB</button>
                      </div>
                      <p className="text-[10px] text-slate-400 text-center font-medium">Restoring overrides current data.</p>
                    </div>
                  </div>

                  <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/50">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-slate-400" /> Batch CSV Import</h4>
                    <div className="space-y-3">
                      <button onClick={() => {
                        const a = document.createElement("a"); a.href = encodeURI("data:text/csv;charset=utf-8,Name,Mobile,Type,Fixed Ohari\nJohn Doe,9999999999,INTERNAL,5000\nJane Smith,8888888888,EXTERNAL,0\n"); a.download = "Muster_Roll_Template.csv"; a.click();
                      }} className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">Template: Members</button>

                      <div className="relative">
                        <input type="file" accept=".csv" onChange={e => {
                          const f = e.target.files[0]; if (!f) return;
                          const r = new FileReader(); r.onload = (ev) => {
                            try { 
                              const rows = ev.target.result.split('\n'); let added = 0; const newP = [...db.persons];
                              for (let i = 1; i < rows.length; i++) {
                                const c = rows[i].split(','); if (c.length >= 3 && c[0].trim()) { newP.push({ id: generateID(), name: c[0].trim(), mobile: c[1].trim(), type: c[2].trim().toUpperCase() === 'EXTERNAL' ? 'EXTERNAL' : 'INTERNAL', ohari: parseFloat(c[3]) || 0 }); added++; }
                              }
                              if (added) { updateDb({ ...db, persons: newP }); triggerToast(`${added} Members Imported`); }
                            } catch (err) { alert('Error parsing CSV'); }
                          }; r.readAsText(f); e.target.value = '';
                        }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                        <button className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Import Members CSV</button>
                      </div>

                      <hr className="border-slate-200 my-2"/>

                      <button onClick={() => {
                        const a = document.createElement("a"); a.href = encodeURI("data:text/csv;charset=utf-8,Date (YYYY-MM-DD),Type,Person Name,Chitty Name,Amount,Notes\n2026-05-01,OHARI_COLLECTION,Rahul Krishna,Mankulam Series A,5000,May payment\n"); a.download = "Journal_Import_Template.csv"; a.click();
                      }} className="w-full bg-orange-50 text-orange-700 border border-orange-200 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2">Template: Journals</button>

                      <div className="relative">
                        <input type="file" accept=".csv" onChange={e => {
                          const f = e.target.files[0]; if (!f) return;
                          const r = new FileReader(); r.onload = (ev) => {
                            try {
                              const rows = ev.target.result.split('\n'); let added = 0; const newTx = [...db.transactions];
                              const validT = ['OHARI_COLLECTION', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'INTEREST_RECEIVED', 'PENALTY', 'EXPENSE'];
                              for (let i = 1; i < rows.length; i++) {
                                const c = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(x => x.replace(/^"|"$/g, '').trim());
                                if (c.length >= 5) {
                                  const person = db.persons.find(p => p.name.toLowerCase() === c[2].toLowerCase());
                                  const chitty = db.chitties.find(x => x.name.toLowerCase() === c[3].toLowerCase());
                                  if (person && validT.includes(c[1].toUpperCase()) && parseFloat(c[4]) > 0) {
                                    newTx.push({ id: generateID(), date: c[0], type: c[1].toUpperCase(), personId: person.id, chittyId: chitty ? chitty.id : '', amount: parseFloat(c[4]).toString(), notes: c[5] || '', timestamp: new Date().toISOString() }); added++;
                                  }
                                }
                              }
                              if (added) { updateDb({ ...db, transactions: newTx }); triggerToast(`${added} Journals Imported`); } else { alert("0 rows imported. Check exact names."); }
                            } catch (err) { alert('Error parsing CSV'); }
                          }; r.readAsText(f); e.target.value = '';
                        }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                        <button className="w-full bg-orange-50 text-orange-700 border border-orange-200 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Import Journals CSV</button>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* GLOBAL MODALS */}
      {/* 1. Transaction Form Modal */}
      {modals.transaction && (() => {
        const onSubmit = (e) => {
          e.preventDefault();
          const date = document.getElementById('n-date').value;
          const personId = document.getElementById('n-person').value;
          const chittyId = document.getElementById('n-chitty').value;
          const notes = document.getElementById('n-notes').value;
          const fields = [
            { id: 'n-ohari', type: 'OHARI_COLLECTION' }, { id: 'n-ldisb', type: 'LOAN_DISBURSEMENT' },
            { id: 'n-lrep', type: 'LOAN_REPAYMENT' }, { id: 'n-int', type: 'INTEREST_RECEIVED' },
            { id: 'n-pen', type: 'PENALTY' }, { id: 'n-exp', type: 'EXPENSE' }
          ];
          const newTxs = []; const ts = new Date().toISOString();
          fields.forEach(f => {
            const amt = document.getElementById(f.id).value;
            if (amt && parseFloat(amt) > 0) newTxs.push({ id: generateID(), date, type: f.type, personId, chittyId, amount: amt, notes, timestamp: ts });
          });
          if (newTxs.length > 0) {
            updateDb({ ...db, transactions: [...db.transactions, ...newTxs] });
            setModals({ ...modals, transaction: false }); triggerToast(`Entries Posted`);
          } else alert("Enter at least one amount.");
        };
        return (
          <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[95vh] border border-slate-100">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0 rounded-t-2xl">
                <h3 className="text-lg font-bold text-slate-800">New Journal Entry</h3>
                <button type="button" onClick={() => setModals({ ...modals, transaction: false })} className="text-slate-400 hover:text-red-500"><AlertCircle className="w-5 h-5 rotate-45" /></button>
              </div>
              <form onSubmit={onSubmit} className="flex flex-col overflow-hidden">
                <div className="p-6 space-y-5 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Date</label><input type="date" id="n-date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500" /></div>
                    <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Chitty Reference</label><select id="n-chitty" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500"><option value="">No Chitty Link...</option>{db.chitties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Person / Entity</label>
                    <select id="n-person" required className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 bg-slate-50 font-medium">
                      <option value="">Select Account...</option>{db.persons.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                    </select>
                  </div>
                  <div className="border-t border-slate-100 pt-5">
                    <p className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2"><Coins className="w-4 h-4" /> Input Transaction Amounts (₹)</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div><label className="block text-[10px] font-bold text-emerald-600 mb-1 uppercase">Ohari (In)</label><input type="number" id="n-ohari" step="0.01" min="0" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 bg-emerald-50/30"/></div>
                      <div><label className="block text-[10px] font-bold text-rose-600 mb-1 uppercase">Loan Disburse (Out)</label><input type="number" id="n-ldisb" step="0.01" min="0" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-rose-500 bg-rose-50/30"/></div>
                      <div><label className="block text-[10px] font-bold text-emerald-600 mb-1 uppercase">Loan Repay (In)</label><input type="number" id="n-lrep" step="0.01" min="0" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 bg-emerald-50/30"/></div>
                      <div><label className="block text-[10px] font-bold text-emerald-600 mb-1 uppercase">Interest Recv (In)</label><input type="number" id="n-int" step="0.01" min="0" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 bg-emerald-50/30"/></div>
                      <div><label className="block text-[10px] font-bold text-emerald-600 mb-1 uppercase">Penalty Recv (In)</label><input type="number" id="n-pen" step="0.01" min="0" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 bg-emerald-50/30"/></div>
                      <div><label className="block text-[10px] font-bold text-rose-600 mb-1 uppercase">Expense (Out)</label><input type="number" id="n-exp" step="0.01" min="0" placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-rose-500 bg-rose-50/30"/></div>
                    </div>
                  </div>
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Notes</label><input type="text" id="n-notes" placeholder="Optional remarks" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500"/></div>
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50 rounded-b-2xl">
                  <button type="button" onClick={() => setModals({ ...modals, transaction: false })} className="px-5 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-500/30 transition-all">Post Batch Entries</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* 2. Add Person Form Modal */}
      {modals.person && (
         <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-4">
            <form onSubmit={e => { e.preventDefault();
               updateDb({ ...db, persons: [...db.persons, { id: generateID(), name: document.getElementById('ap-name').value, mobile: document.getElementById('ap-mobile').value, type: document.getElementById('ap-type').value, ohari: document.getElementById('ap-ohari').value || 0 }] });
               setModals({ ...modals, person: false }); triggerToast("Person Added");
            }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="text-lg font-bold text-slate-800">Add Member</h3><button type="button" onClick={() => setModals({ ...modals, person: false })} className="text-slate-400 hover:text-red-500"><AlertCircle className="w-5 h-5 rotate-45" /></button></div>
               <div className="p-6 space-y-4">
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Full Name</label><input type="text" id="ap-name" required className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Mobile</label><input type="tel" id="ap-mobile" required className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Type</label><select id="ap-type" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"><option value="INTERNAL">Internal Member</option><option value="EXTERNAL">External Borrower</option></select></div>
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Fixed Ohari Rate (₹)</label><input type="number" id="ap-ohari" defaultValue="0" min="0" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500" /></div>
               </div>
               <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                  <button type="button" onClick={() => setModals({ ...modals, person: false })} className="px-4 py-2 text-slate-600 bg-white border rounded-lg text-sm font-semibold hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-500/30">Save Member</button>
               </div>
            </form>
         </div>
      )}

      {/* 3. Edit Person Modal */}
      {modals.editPerson && (
         <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-4">
            <form onSubmit={e => { e.preventDefault();
               updateDb({ ...db, persons: db.persons.map(p => p.id === modals.editPerson.id ? { ...p, name: document.getElementById('ep-name').value, mobile: document.getElementById('ep-mobile').value, type: document.getElementById('ep-type').value, ohari: document.getElementById('ep-ohari').value } : p) });
               setModals({ ...modals, editPerson: null }); triggerToast("Profile Updated");
            }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="text-lg font-bold text-slate-800">Edit Member</h3><button type="button" onClick={() => setModals({ ...modals, editPerson: null })} className="text-slate-400 hover:text-red-500"><AlertCircle className="w-5 h-5 rotate-45" /></button></div>
               <div className="p-6 space-y-4">
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Full Name</label><input type="text" id="ep-name" defaultValue={modals.editPerson.name} required className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Mobile</label><input type="tel" id="ep-mobile" defaultValue={modals.editPerson.mobile} required className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Type</label><select id="ep-type" defaultValue={modals.editPerson.type} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"><option value="INTERNAL">Internal Member</option><option value="EXTERNAL">External Borrower</option></select></div>
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Fixed Ohari Rate (₹)</label><input type="number" id="ep-ohari" defaultValue={modals.editPerson.ohari} min="0" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500" /></div>
               </div>
               <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                  <button type="button" onClick={() => setModals({ ...modals, editPerson: null })} className="px-4 py-2 text-slate-600 bg-white border rounded-lg text-sm font-semibold hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-500/30">Save Changes</button>
               </div>
            </form>
         </div>
      )}

      {/* 4. Add Chitty Form Modal */}
      {modals.chitty && (
         <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-4">
            <form onSubmit={e => { e.preventDefault();
               updateDb({ ...db, chitties: [...db.chitties, { id: generateID(), name: document.getElementById('ac-name').value, startDate: document.getElementById('ac-start').value }] });
               setModals({ ...modals, chitty: false }); triggerToast("Chitty Master Created");
            }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="text-lg font-bold text-slate-800">New Chitty Master</h3><button type="button" onClick={() => setModals({ ...modals, chitty: false })} className="text-slate-400 hover:text-red-500"><AlertCircle className="w-5 h-5 rotate-45" /></button></div>
               <div className="p-6 space-y-4">
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Chitty Name</label><input type="text" id="ac-name" required placeholder="e.g. Onam Special 2026" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Start Date</label><input type="date" id="ac-start" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                  <div className="bg-blue-50/50 p-3 rounded-lg text-xs font-medium text-blue-800 border border-blue-100">System automatically binds 26 cycles tracking exactly 14 days apart.</div>
               </div>
               <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                  <button type="button" onClick={() => setModals({ ...modals, chitty: false })} className="px-4 py-2 text-slate-600 bg-white border rounded-lg text-sm font-semibold hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-500/30">Save Chitty</button>
               </div>
            </form>
         </div>
      )}

      {/* 5. Edit Transaction Modal */}
      {modals.editTx && (
         <div className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-4">
            <form onSubmit={e => { e.preventDefault();
               updateDb({ ...db, transactions: db.transactions.map(t => t.id === modals.editTx.id ? { ...t, date: document.getElementById('et-date').value, type: document.getElementById('et-type').value, amount: document.getElementById('et-amount').value, notes: document.getElementById('et-notes').value } : t) });
               setModals({ ...modals, editTx: null }); triggerToast("Transaction Edited");
            }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="text-lg font-bold text-slate-800">Edit Entry</h3><button type="button" onClick={() => setModals({ ...modals, editTx: null })} className="text-slate-400 hover:text-red-500"><AlertCircle className="w-5 h-5 rotate-45" /></button></div>
               <div className="p-6 space-y-4">
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Date</label><input type="date" id="et-date" defaultValue={modals.editTx.date} required className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Type</label>
                     <select id="et-type" defaultValue={modals.editTx.type} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500">
                        <option value="OHARI_COLLECTION">Ohari Collection</option><option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
                        <option value="LOAN_REPAYMENT">Loan Repayment</option><option value="INTEREST_RECEIVED">Interest Received</option>
                        <option value="PENALTY">Penalty</option><option value="EXPENSE">Expense</option>
                     </select>
                  </div>
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Amount (₹)</label><input type="number" id="et-amount" step="0.01" defaultValue={modals.editTx.amount} required className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Notes</label><input type="text" id="et-notes" defaultValue={modals.editTx.notes} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500" /></div>
               </div>
               <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                  <button type="button" onClick={() => setModals({ ...modals, editTx: null })} className="px-4 py-2 text-slate-600 bg-white border rounded-lg text-sm font-semibold hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-500/30">Overwrite Entry</button>
               </div>
            </form>
         </div>
      )}

      {/* 6. Person Details Profile Modal */}
      {modals.personProfile && (
        <PersonProfileModal profile={modals.personProfile} db={db} loanMetrics={loanMetrics} onClose={() => setModals({ ...modals, personProfile: null })} />
      )}

      {/* CONFIRMATION OVERLAY */}
      {confirmModal.show && (
         <div className="fixed inset-0 z-[200] modal-overlay flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-red-100 p-6 text-center">
               <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-slate-800 mb-2">Attention Required</h3>
               <p className="text-sm text-slate-600 mb-6 leading-relaxed">{confirmModal.msg}</p>
               <div className="flex justify-center gap-3">
                  <button onClick={() => setConfirmModal({ show: false, msg: '', action: null })} className="px-5 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors w-1/2">Cancel</button>
                  <button onClick={() => { confirmModal.action(); setConfirmModal({ show: false, msg: '', action: null }); }} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-md shadow-red-500/30 transition-all w-1/2">Confirm Action</button>
               </div>
            </div>
         </div>
      )}

      {/* TOAST OVERLAY */}
      <div className={`fixed bottom-8 right-8 bg-slate-800 text-white px-5 py-3.5 rounded-xl shadow-2xl transform transition-all duration-300 z-[300] flex items-center gap-3 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <CheckCircle2 className="w-5 h-5 text-emerald-400" /> <span className="text-sm font-semibold">{toast.msg}</span>
      </div>

    </div>
  );
}
