'use client';

import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
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
  onLoadMore
}: LeadsTableProps) {
  // Filter leads based on query
  const filteredLeads = leads.filter(lead => {
    const q = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.phone.toLowerCase().includes(q) ||
      lead.company.toLowerCase().includes(q)
    );
  });

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
              onChange={(e) => setSearchQuery(e.target.value)}
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
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                  No leads found in this view. Use "Import CSV" at the top right to load data.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const isNew = newlyImportedIds.has(lead.id);
                return (
                  <tr 
                    key={lead.id} 
                    className={`hover:bg-slate-50/50 transition-all duration-500 ${
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
                    <td className="py-3.5 px-6 text-slate-500 font-medium">{lead.email}</td>
                    <td className="py-3.5 px-6 text-slate-500 font-mono font-medium">{lead.phone}</td>
                    <td className="py-3.5 px-6 text-slate-400 font-medium">{lead.dateCreated}</td>
                    <td className="py-3.5 px-6 text-slate-500 font-medium">{lead.company}</td>
                    <td className="py-3.5 px-6">
                      {lead.status === 'Sale Done' && (
                        <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-[#EBF3FC] text-blue-600 rounded-full">
                          Sale Done
                        </span>
                      )}
                      {lead.status === 'Not Dialed' && (
                        <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                          Not Dialed
                        </span>
                      )}
                      {lead.status === 'Good Lead' && (
                        <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-[#E6F4EA] text-emerald-600 rounded-full">
                          Good Lead
                        </span>
                      )}
                      {lead.status !== 'Sale Done' && lead.status !== 'Not Dialed' && lead.status !== 'Good Lead' && (
                        <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                          {lead.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-center text-slate-400">—</td>
                    <td className="py-3.5 px-6 text-center">
                      <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 border border-slate-200/50 flex items-center justify-center mx-auto text-[10px] font-bold">
                        {lead.leadOwner}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
                        More &gt;
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/50">
        <button 
          onClick={onLoadMore}
          className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          Load more
        </button>
      </div>
    </div>
  );
}
