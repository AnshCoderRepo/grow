'use client';

import React from 'react';
import { 
  TrendingUp, 
  ChevronDown, 
  LayoutDashboard, 
  Megaphone, 
  Briefcase, 
  MessageSquare, 
  UserCheck, 
  Globe, 
  Grid, 
  RefreshCw, 
  Layers, 
  Terminal, 
  Settings 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

export default function Sidebar({ activeMenu, setActiveMenu }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 min-h-screen">
      {/* Sidebar Header */}
      <div className="h-16 border-b border-slate-100 flex items-center px-6 gap-3">
        <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-slate-900 leading-none text-base">GrowEasy</h1>
          <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">CRM PANEL</span>
        </div>
      </div>

      {/* Profile Card */}
      <div className="mx-4 my-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center text-white text-xs font-bold font-mono">
            TC
          </div>
          <div>
            <span className="font-bold text-xs text-slate-800 block">Test Corp</span>
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Owner</span>
          </div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </div>

      {/* Navigation Menu Links */}
      <div className="flex-1 px-3 space-y-6 overflow-y-auto">
        {/* MAIN CATEGORY */}
        <div>
          <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Main</span>
          <motion.nav 
            className="space-y-1"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
          >
            {[
              { name: 'Dashboard', icon: LayoutDashboard },
              { name: 'Manage Leads', icon: Briefcase },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeMenu === item.name;
              return (
                <motion.button
                  key={item.name}
                  onClick={() => setActiveMenu(item.name)}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0 }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-[#EBF7F5] text-emerald-700' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {item.name}
                </motion.button>
              );
            })}
          </motion.nav>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
          <Settings className="h-4 w-4 text-slate-400" />
          Business Center
        </div>
      </div>
    </aside>
  );
}
