'use client';

import React, { useState } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CRMLead } from '../app/types';

interface LeadsTableProps {
  leads: CRMLead[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  newlyImportedIds: Set<string>;
  onReset: () => void;
  onDeleteLead?: (id: string) => void;
  onLoadMore?: () => void;
}

export default function LeadsTable({
  leads,
  searchQuery,
  setSearchQuery,
  newlyImportedIds,
  onReset,
  onDeleteLead,
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
  // Helper to determine gradient based on lead owner initials
  const getAvatarGradient = (name: string) => {
    const char = name.charAt(0).toUpperCase();
    if (char < 'H') return 'from-blue-500 to-indigo-600';
    if (char < 'P') return 'from-teal-500 to-emerald-600';
    if (char < 'W') return 'from-orange-500 to-rose-600';
    return 'from-purple-500 to-pink-600';
  };

  return (
    <div className="bg-surface border border-border-color rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden transition-colors duration-300">
      {/* Table Control Panel */}
      <div className="p-4 border-b border-border-color flex flex-col sm:flex-row items-center justify-between gap-4 bg-background/50 transition-colors">
        <span className="font-bold text-xs text-foreground">Your Leads</span>

        {/* Search bar and options */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to page 1 on new search
              }}
              placeholder="Enter email or phone number..."
              className="w-full pl-9 pr-4 py-2 border border-border-color rounded-lg text-xs bg-surface text-foreground placeholder-text-muted focus:outline-none focus:border-accent-lime transition-colors"
            />
          </div>
          <button 
            onClick={onReset}
            title="Reset Leads Database"
            className="p-2 border border-border-color rounded-lg bg-surface hover:bg-background text-text-muted transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Table wrapper */}
      <div className="flex-1 overflow-auto min-h-[300px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-background border-b border-border-color text-text-muted font-bold uppercase tracking-wider sticky top-0 z-10 transition-colors">
            <tr>
              <th className="py-3 px-6 font-bold">Lead Name</th>
              <th className="py-3 px-6 font-bold">Email</th>
              <th className="py-3 px-6 font-bold">Contact</th>
              <th className="py-3 px-6 font-bold">Date Created</th>
              <th className="py-3 px-6 font-bold">Company</th>
              <th className="py-3 px-6 font-bold">Status</th>
              <th className="py-3 px-6 font-bold text-center">Quality</th>
              <th className="py-3 px-6 font-bold text-center">Lead Owner</th>
              <th className="py-3 px-6 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color">
            <AnimatePresence mode="popLayout">
              {paginatedLeads.length === 0 ? (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={9} className="py-12 text-center text-text-muted font-medium">
                    No leads found in this view. Use "Import CSV" at the top right to load data.
                  </td>
                </motion.tr>
              ) : (
                paginatedLeads.map((lead, i) => {
                  const isNew = newlyImportedIds.has(lead.id);
                  return (
                    <motion.tr 
                      key={lead.id} 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}
                      className={`hover:bg-black/5 dark:hover:bg-white/5 border-l-2 transition-colors ${
                        isNew ? 'bg-accent-lime/10 border-l-accent-lime' : 'border-l-transparent hover:border-l-accent-lime'
                      }`}
                    >
                      <td className="py-3.5 px-6 font-bold text-foreground flex items-center gap-2">
                        {isNew && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-accent-lime/20 text-accent-lime font-bold animate-pulse">
                            Just Mapped
                          </span>
                        )}
                        {lead.name}
                      </td>
                      <td className="py-3.5 px-6 text-text-muted font-medium">{lead.email || '—'}</td>
                      <td className="py-3.5 px-6 text-text-muted font-mono font-medium">{lead.country_code} {lead.mobile_without_country_code}</td>
                      <td className="py-3.5 px-6 text-text-muted font-medium">{formatDate(lead.created_at)}</td>
                      <td className="py-3.5 px-6 text-text-muted font-medium">{lead.company || '—'}</td>
                      <td className="py-3.5 px-6">
                        {lead.crm_status === 'SALE_DONE' && (
                          <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-[#1E2F45] text-[#5EA6FF] shadow-[0_0_8px_rgba(94,166,255,0.2)] rounded-full transition-all hover:scale-105 cursor-default">
                            Sale Done
                          </span>
                        )}
                        {lead.crm_status === 'DID_NOT_CONNECT' && (
                          <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-[#3A3F4D] text-[#9BA1B0] rounded-full transition-all hover:scale-105 cursor-default">
                            Not Dialed
                          </span>
                        )}
                        {lead.crm_status === 'GOOD_LEAD_FOLLOW_UP' && (
                          <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-[#1F3A2E] text-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.2)] rounded-full transition-all hover:scale-105 cursor-default">
                            Good Lead
                          </span>
                        )}
                        {lead.crm_status === 'BAD_LEAD' && (
                          <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-[#421A1A] text-[#F87171] shadow-[0_0_8px_rgba(248,113,113,0.2)] rounded-full transition-all hover:scale-105 cursor-default">
                            Bad Lead
                          </span>
                        )}
                        {!['SALE_DONE', 'DID_NOT_CONNECT', 'GOOD_LEAD_FOLLOW_UP', 'BAD_LEAD'].includes(lead.crm_status) && (
                          <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-[#2A2640] text-[#A78BFA] shadow-[0_0_8px_rgba(167,139,250,0.2)] rounded-full transition-all hover:scale-105 cursor-default">
                            {lead.crm_status || 'Unknown'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-center text-text-muted">—</td>
                      <td className="py-3.5 px-6 text-center">
                        <span className={`h-6 w-6 rounded-full bg-gradient-to-br ${getAvatarGradient(lead.lead_owner)} text-white flex items-center justify-center mx-auto text-[10px] font-bold shadow-sm`}>
                          {lead.lead_owner.charAt(0).toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <motion.button 
                            whileHover={{ x: 3, color: 'var(--foreground)' }}
                            whileTap={{ scale: 0.95 }}
                            className="text-[11px] font-bold text-text-muted transition-colors cursor-pointer"
                          >
                            More &gt;
                          </motion.button>
                          
                          {onDeleteLead && (
                            <button
                              onClick={() => onDeleteLead(lead.id)}
                              className="text-text-muted hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-500/10 cursor-pointer"
                              title="Delete lead"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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
        <div className="p-4 border-t border-border-color flex items-center justify-between bg-background/50 transition-colors">
          <span className="text-xs text-text-muted font-medium">
            Showing <span className="font-bold text-foreground">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-bold text-foreground">{Math.min(currentPage * pageSize, filteredLeads.length)}</span> of <span className="font-bold text-foreground">{filteredLeads.length}</span> leads
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-border-color bg-surface hover:bg-background text-foreground rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-text-muted px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-border-color bg-surface hover:bg-background text-foreground rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
