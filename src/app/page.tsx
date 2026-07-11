'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CRMLead, ImportSummary } from './types';
import Sidebar from '../components/Sidebar';
import DashboardStats from '../components/DashboardStats';
import LeadsTable from '../components/LeadsTable';
import ImportModal from '../components/ImportModal';

const INITIAL_LEADS: CRMLead[] = [];

export default function Home() {
  const [activeMenu, setActiveMenu] = useState('Manage Leads');
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Dashboard database state
  const [leads, setLeads] = useState<CRMLead[]>(INITIAL_LEADS);
  const [searchQuery, setSearchQuery] = useState('');
  const [newlyImportedIds, setNewlyImportedIds] = useState<Set<string>>(new Set());

  // Hydrate leads from localStorage on mount (client-side only to prevent Next.js hydration issues)
  useEffect(() => {
    const stored = localStorage.getItem('grow_leads');
    if (stored) {
      try {
        setLeads(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to parse leads from localStorage:', err);
      }
    }
  }, []);

  // Callback when import completes successfully
  const handleImportComplete = (newRecords: CRMLead[], summary: ImportSummary) => {
    if (newRecords.length > 0) {
      // Prepend records
      setLeads(prev => {
        const updated = [...newRecords, ...prev];
        localStorage.setItem('grow_leads', JSON.stringify(updated));
        return updated;
      });

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
    localStorage.removeItem('grow_leads');
    setSearchQuery('');
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
        <div className="p-8 flex-1 flex flex-col gap-6 max-w-7xl w-full mx-auto overflow-hidden">
          <AnimatePresence mode="wait">
            {activeMenu === 'Manage Leads' ? (
              <motion.div 
                key="manage-leads"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6 flex-1 h-full"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manage Your Leads</h2>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    Search, filter, and track your imported leads across all channels.
                  </p>
                </div>

                {/* Leads Database Table Panel */}
                <LeadsTable 
                  leads={leads}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  newlyImportedIds={newlyImportedIds}
                  onReset={resetLeadsDatabase}
                />
              </motion.div>
            ) : activeMenu === 'Dashboard' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6 flex-1 h-full"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Executive Dashboard</h2>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    High-level metrics and performance overview of your CRM data.
                  </p>
                </div>

                {/* Quick Statistics Banner */}
                <DashboardStats totalLeads={leads.length} />
                
                {/* Empty State for charts */}
                <div className="flex-1 min-h-[300px] border border-slate-200/80 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <p className="font-bold mb-1">Visual Analytics Area</p>
                    <p className="text-xs">Charts will be populated here when conversion data syncs.</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="other"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-32 text-slate-400 flex-1 h-full"
              >
                <h2 className="text-2xl font-bold text-slate-300 mb-2">Welcome to {activeMenu}</h2>
                <p className="text-sm">This page is currently under construction. Please use the Dashboard or Manage Leads tab.</p>
              </motion.div>
            )}
          </AnimatePresence>
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
