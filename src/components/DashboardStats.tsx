'use client';

import React from 'react';
import { Users, TrendingUp, Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
  totalLeads: number;
}

export default function DashboardStats({ totalLeads }: DashboardStatsProps) {
  const stats = [
    { label: 'Total Leads Tracked', val: totalLeads, change: '+12.4% vs last week', icon: Users, colorClass: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Sale Conversion Rate', val: '12.5%', change: 'High Conversion Quality', icon: TrendingUp, colorClass: 'text-blue-500 bg-blue-500/10' },
    { label: 'Active Channels Connected', val: '4 Channels', change: 'Facebook, Google, Manual', icon: Globe, colorClass: 'text-indigo-500 bg-indigo-500/10' },
    { label: 'AI Mapping Engine', val: 'Active', change: '100% field auto-detection', icon: Sparkles, colorClass: 'text-amber-500 bg-amber-500/10' }
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
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1 }
            }}
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-surface border-border-color border rounded-2xl p-6 shadow-sm shadow-black/10 transition-all duration-300 relative overflow-hidden group cursor-pointer"
          >
            {/* subtle glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-lime/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300 ${stat.colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">{stat.label}</span>
                <span className="text-2xl font-black text-foreground block mt-1">{stat.val}</span>
                <span className="text-[10px] font-bold text-text-muted mt-0.5 block">{stat.change}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
