'use client';

import React, { useState } from 'react';
import { 
  ChevronRight,
  Upload
} from 'lucide-react';
import { CRMLead, ImportSummary } from './types';
import Sidebar from '../components/Sidebar';
import DashboardStats from '../components/DashboardStats';
import LeadsTable from '../components/LeadsTable';
import ImportModal from '../components/ImportModal';

// Initial leads data matching the user's dashboard screenshot
const INITIAL_LEADS: CRMLead[] = [
  {
    id: 'lead_1',
    name: 'punnnf g',
    email: 'custom_lead_1@groweasy.com',
    phone: '+917994561177',
    dateCreated: 'Jun 23, 2026, 2:37 PM',
    company: '—',
    status: 'Sale Done',
    quality: '—',
    leadOwner: 'P',
    source: 'Manual'
  },
  {
    id: 'lead_2',
    name: 'kjkvkth',
    email: 'jkhbkbn@hjf.hfv',
    phone: '+911212121415',
    dateCreated: 'Jun 23, 2026, 12:23 PM',
    company: 'thtf',
    status: 'Not Dialed',
    quality: '—',
    leadOwner: 'A',
    source: 'Facebook Ads'
  },
  {
    id: 'lead_3',
    name: 'hugkthh',
    email: 'hjghjg@hgdh.hjc',
    phone: '+911212121217',
    dateCreated: 'Jun 23, 2026, 12:17 PM',
    company: 'thtf',
    status: 'Not Dialed',
    quality: '—',
    leadOwner: 'P',
    source: 'Google Search'
  },
  {
    id: 'lead_4',
    name: 'hjvjv',
    email: 'jgf@fgd.com',
    phone: '+911515151515',
    dateCreated: 'Jun 23, 2026, 12:10 PM',
    company: 'thtf',
    status: 'Good Lead',
    quality: '—',
    leadOwner: 'A',
    source: 'Organic'
  },
  {
    id: 'lead_5',
    name: 'Abhraneel Dhar',
    email: 'abhraneeldhar7@groweasy.com',
    phone: '+919051589728',
    dateCreated: 'Jun 23, 2026, 1:01 AM',
    company: 'groweasy',
    status: 'Good Lead',
    quality: '—',
    leadOwner: 'A',
    source: 'CSV Importer'
  },
  {
    id: 'lead_6',
    name: 'fhjf ghf',
    email: 'tjrf.h@gfgj.com',
    phone: '+911414141414',
    dateCreated: 'Jun 22, 2026, 4:49 PM',
    company: 'thr rh',
    status: 'Not Dialed',
    quality: '—',
    leadOwner: '7',
    source: 'Referral'
  },
  {
    id: 'lead_7',
    name: 'fhf',
    email: 'gnhfg@fgf.com',
    phone: '+911313131313',
    dateCreated: 'Jun 22, 2026, 4:49 PM',
    company: 'thtf',
    status: 'Not Dialed',
    quality: '—',
    leadOwner: 'A',
    source: 'Google Ads'
  },
  {
    id: 'lead_8',
    name: 'Abc l',
    email: 'abcl@eryf.com',
    phone: '+911212121212',
    dateCreated: 'Jun 22, 2026, 4:44 PM',
    company: '—',
    status: 'Not Dialed',
    quality: '—',
    leadOwner: 'A',
    source: 'Landing Page'
  }
];

export default function Home() {
  const [activeMenu, setActiveMenu] = useState('Manage Leads');
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Dashboard database state
  const [leads, setLeads] = useState<CRMLead[]>(INITIAL_LEADS);
  const [searchQuery, setSearchQuery] = useState('');
  const [newlyImportedIds, setNewlyImportedIds] = useState<Set<string>>(new Set());

  // Callback when import completes successfully
  const handleImportComplete = (newRecords: CRMLead[], summary: ImportSummary) => {
    if (newRecords.length > 0) {
      // Prepend records
      setLeads(prev => [...newRecords, ...prev]);

      // Highlight new records
      const newIds = new Set(newRecords.map(r => r.id));
      setNewlyImportedIds(newIds);

      // Clear glow after 6 seconds
      setTimeout(() => {
        setNewlyImportedIds(new Set());
      }, 6000);
    }
  };

  const resetLeadsDatabase = () => {
    setLeads(INITIAL_LEADS);
    setSearchQuery('');
  };

  const handleLoadMoreLeads = () => {
    setLeads(prev => [...prev, ...INITIAL_LEADS.map(l => ({ ...l, id: `lead_${Math.random()}` }))]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-sans antialiased overflow-x-hidden selection:bg-teal-500 selection:text-white">
      
      {/* Sidebar Navigation */}
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      {/* Main Panel Area */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Workspace</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="text-xs font-bold text-slate-700">{activeMenu}</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-[#F2994A] hover:bg-[#e0893a] text-white font-bold text-xs rounded-lg shadow-sm shadow-[#F2994A]/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              Import CSV
            </button>
          </div>
        </header>

        {/* Dashboard Panels */}
        <div className="p-8 flex-1 flex flex-col gap-6 max-w-7xl w-full mx-auto">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manage Your Leads</h2>
            <p className="text-xs font-medium text-slate-400 mt-1">
              Monitor lead status, assign tasks, and close deals faster.
            </p>
          </div>

          {/* Quick Statistics Banner */}
          <DashboardStats totalLeads={leads.length} />

          {/* Leads Database Table Panel */}
          <LeadsTable 
            leads={leads}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            newlyImportedIds={newlyImportedIds}
            onReset={resetLeadsDatabase}
            onLoadMore={handleLoadMoreLeads}
          />
        </div>
      </main>

      {/* CSV Import Wizard Modal */}
      <ImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />
      
    </div>
  );
}
