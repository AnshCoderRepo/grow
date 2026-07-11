'use client';

import React from 'react';
import { Users, TrendingUp, Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
  totalLeads: number;
}

export default function DashboardStats({ totalLeads }: DashboardStatsProps) {
  const stats = [
    { label: 'Total Leads Tracked', val: totalLeads, change: '+12.4% vs last week', icon: Users, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Sale Conversion Rate', val: '12.5%', change: 'High Conversion Quality', icon: TrendingUp, color: 'text-blue-500 bg-blue-50' },
    { label: 'Active Channels Connected', val: '4 Channels', change: 'Facebook, Google, Manual', icon: Globe, color: 'text-indigo-500 bg-indigo-50' },
    { label: 'AI Mapping Engine', val: 'Active', change: '100% field auto-detection', icon: Sparkles, color: 'text-amber-500 bg-amber-50' }
  ];

  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } }
      }}
    >
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div 
            key={idx} 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ 
              scale: 1.03, 
              rotateX: 2, 
              rotateY: 2,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" 
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-white border border-slate-200/80 rounded-xl p-5 flex items-center justify-between shadow-sm cursor-pointer"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{stat.label}</span>
              <span className="text-2xl font-black text-slate-900 block mt-1">{stat.val}</span>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">{stat.change}</span>
            </div>
            <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${stat.color}`}>
              <Icon className="h-5 w-5" />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
