'use client';

import React from 'react';
import { 
  TrendingUp, 
  Users, 
  BarChart3, 
  Settings, 
  HelpCircle,
  Database
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

export default function Sidebar({ activeMenu, setActiveMenu }: SidebarProps) {
  const menuItems = [
    { name: 'Dashboard', icon: BarChart3 },
    { name: 'Manage Leads', icon: Users },
    { name: 'Analytics', icon: Database },
    { name: 'Settings', icon: Settings },
    { name: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="w-64 bg-surface border-r border-border-color flex flex-col transition-colors duration-300 relative z-10 shadow-xl shadow-black/5">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-border-color transition-colors duration-300">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-accent-lime rounded-lg flex items-center justify-center">
            <Users className="h-5 w-5 text-background" />
          </div>
          <span className="font-black text-xl tracking-tight text-foreground">GrowEasy</span>
        </div>
      </div>

      {/* Navigation Menu Links */}
      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-1 relative">
          {menuItems.map((item, index) => {
            const isActive = activeMenu === item.name;
            const Icon = item.icon;
            
            return (
              <motion.li 
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => setActiveMenu(item.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-accent-lime/10 text-accent-lime' 
                      : 'text-text-muted hover:bg-background hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-accent-lime' : 'opacity-70'}`} />
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 w-1 h-6 bg-accent-lime rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border-color transition-colors duration-300">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-accent-lime/20 flex items-center justify-center text-accent-lime font-bold text-sm shrink-0">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">John Doe</span>
            <span className="text-xs text-text-muted font-medium">john.doe@groweasy.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
