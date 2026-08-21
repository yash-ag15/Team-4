'use client';

import React, { useState } from 'react';

export type MobileTab = 'dashboard' | 'learn' | 'missions' | 'plan';

interface MobileNavProps {
  activeTab?: MobileTab;
  onTabChange?: (tab: MobileTab) => void;
}

export function MobileNav({ activeTab = 'dashboard', onTabChange }: MobileNavProps) {
  const [currentTab, setCurrentTab] = useState<MobileTab>(activeTab);

  const handleTabClick = (tab: MobileTab) => {
    setCurrentTab(tab);
    onTabChange?.(tab);
  };

  return (
    <nav className="fixed bottom-0 w-full flex justify-around items-center h-20 px-2 pb-safe bg-surface-container-lowest shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.05)] md:hidden z-50 border-t border-outline-variant">
      {/* Dashboard */}
      <button
        type="button"
        onClick={() => handleTabClick('dashboard')}
        className={`flex flex-col items-center justify-center rounded-full px-4 py-1 active:scale-95 transition-all duration-150 group focus:outline-none focus:ring-2 focus:ring-secondary/50 ${
          currentTab === 'dashboard' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-background'
        }`}
      >
        <span
          className={`material-symbols-outlined mb-1 ${
            currentTab === 'dashboard' ? 'fill-icon' : 'group-hover:fill-icon'
          }`}
        >
          dashboard
        </span>
        <span className="text-xs font-bold">Dashboard</span>
      </button>

      {/* Learn */}
      <button
        type="button"
        onClick={() => handleTabClick('learn')}
        className={`flex flex-col items-center justify-center rounded-full px-4 py-1 active:scale-95 transition-all duration-150 group focus:outline-none focus:ring-2 focus:ring-secondary/50 ${
          currentTab === 'learn' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-background'
        }`}
      >
        <span
          className={`material-symbols-outlined mb-1 ${
            currentTab === 'learn' ? 'fill-icon' : 'group-hover:fill-icon'
          }`}
        >
          school
        </span>
        <span className="text-xs font-medium">Learn</span>
      </button>

      {/* Missions */}
      <button
        type="button"
        onClick={() => handleTabClick('missions')}
        className={`flex flex-col items-center justify-center rounded-full px-4 py-1 active:scale-95 transition-all duration-150 group relative focus:outline-none focus:ring-2 focus:ring-secondary/50 ${
          currentTab === 'missions' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-background'
        }`}
      >
        <span
          className={`material-symbols-outlined mb-1 ${
            currentTab === 'missions' ? 'fill-icon' : 'group-hover:fill-icon'
          }`}
        >
          assignment
        </span>
        <span className="text-xs font-medium">Missions</span>
        <span className="absolute top-1 right-2 w-2 h-2 bg-error rounded-full border border-surface-container-lowest" />
      </button>

      {/* Plan */}
      <button
        type="button"
        onClick={() => handleTabClick('plan')}
        className={`flex flex-col items-center justify-center rounded-full px-4 py-1 active:scale-95 transition-all duration-150 group focus:outline-none focus:ring-2 focus:ring-secondary/50 ${
          currentTab === 'plan' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-background'
        }`}
      >
        <span
          className={`material-symbols-outlined mb-1 ${
            currentTab === 'plan' ? 'fill-icon' : 'group-hover:fill-icon'
          }`}
        >
          calendar_today
        </span>
        <span className="text-xs font-medium">Plan</span>
      </button>
    </nav>
  );
}
