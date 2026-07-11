'use client';

import React, { useState } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CRMLead } from '../app/types';

interface LeadsTableProps {
  leads: CRMLead[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  newlyImportedIds: Set<string>;
  onReset: () => void;
  onLoadMore: () => void;
}

export default function LeadsTable({
  leads,
  searchQuery,
  setSearchQuery,
  newlyImportedIds,
  onReset,
}: LeadsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter leads based on query
  const filteredLeads = leads.filter(lead => {
    const q = searchQuery.toLowerCase();
    const phoneFull = (lead.country_code + lead.mobile_without_country_code).toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      phoneFull.includes(q) ||
      lead.company.toLowerCase().includes(q)
    );
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  
  // Ensure current page is valid when filtering changes total pages
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
      {/* Table Control Panel */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
        <span className="font-bold text-xs text-slate-700">Your Leads</span>

        {/* Search bar and options */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to page 1 on new search
              }}
              placeholder="Enter email or phone number..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          <button 
            onClick={onReset}
            title="Reset Leads Database"
            className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Table wrapper */}
      <div className="flex-1 overflow-auto min-h-[300px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#FAFBFD] border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="py-3 px-6 text-slate-500 font-bold">Lead Name</th>
              <th className="py-3 px-6 text-slate-500 font-bold">Email</th>
              <th className="py-3 px-6 text-slate-500 font-bold">Contact</th>
              <th className="py-3 px-6 text-slate-500 font-bold">Date Created</th>
              <th className="py-3 px-6 text-slate-500 font-bold">Company</th>
              <th className="py-3 px-6 text-slate-500 font-bold">Status</th>
              <th className="py-3 px-6 text-slate-500 font-bold text-center">Quality</th>
              <th className="py-3 px-6 text-slate-500 font-bold text-center">Lead Owner</th>
              <th className="py-3 px-6 text-slate-500 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <AnimatePresence mode="popLayout">
              {paginatedLeads.length === 0 ? (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No leads found in this view. Use "Import CSV" at the top right to load data.
                  </td>
                </motion.tr>
              ) : (
                paginatedLeads.map((lead, i) => {
                  const isNew = newlyImportedIds.has(lead.id);
                  return (
                    <motion.tr 
                      key={lead.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isNew ? 'bg-emerald-500/5 border-l-4 border-l-emerald-500' : ''
                      }`}
                    >
                      <td className="py-3.5 px-6 font-bold text-slate-800 flex items-center gap-2">
                        {isNew && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-600 font-bold animate-pulse">
                            Just Mapped
                          </span>
                        )}
                        {lead.name}
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 font-medium">{lead.email || '—'}</td>
                      <td className="py-3.5 px-6 text-slate-500 font-mono font-medium">{lead.country_code} {lead.mobile_without_country_code}</td>
                      <td className="py-3.5 px-6 text-slate-400 font-medium">{formatDate(lead.created_at)}</td>
                      <td className="py-3.5 px-6 text-slate-500 font-medium">{lead.company || '—'}</td>
                      <td className="py-3.5 px-6">
                        {lead.crm_status === 'SALE_DONE' && (
                          <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-[#EBF3FC] text-blue-600 rounded-full">
                            Sale Done
                          </span>
                        )}
                        {lead.crm_status === 'DID_NOT_CONNECT' && (
                          <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                            Not Dialed
                          </span>
                        )}
                        {lead.crm_status === 'GOOD_LEAD_FOLLOW_UP' && (
                          <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-[#E6F4EA] text-emerald-600 rounded-full">
                            Good Lead
                          </span>
                        )}
                        {lead.crm_status === 'BAD_LEAD' && (
                          <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-red-50 text-red-600 rounded-full">
                            Bad Lead
                          </span>
                        )}
                        {!['SALE_DONE', 'DID_NOT_CONNECT', 'GOOD_LEAD_FOLLOW_UP', 'BAD_LEAD'].includes(lead.crm_status) && (
                          <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                            {lead.crm_status || 'Unknown'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-center text-slate-400">—</td>
                      <td className="py-3.5 px-6 text-center">
                        <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 border border-slate-200/50 flex items-center justify-center mx-auto text-[10px] font-bold">
                          {lead.lead_owner.charAt(0).toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          More &gt;
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * pageSize, filteredLeads.length)}</span> of <span className="font-bold text-slate-700">{filteredLeads.length}</span> leads
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-slate-600 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
