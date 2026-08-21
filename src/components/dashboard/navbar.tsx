'use client';

import React, { useState } from 'react';
import { UserProfile } from './types';
import { ThemeToggle } from './theme-toggle';

interface NavbarProps {
  user: UserProfile;
  onSearch?: (query: string) => void;
}

function KatalystLogo() {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-black text-sm shadow-sm">
        ⚡
      </div>
      <span className="text-xl font-bold text-primary tracking-tight">
        Katalyst
      </span>
    </div>
  );
}

export function Navbar({ user, onSearch }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <>
      {/* Desktop Navbar */}
      <header className="w-full top-0 sticky bg-background/90 backdrop-blur-sm z-50 transition-colors hidden md:block border-b border-outline-variant px-4 lg:px-8">
        <div className="max-w-[1280px] mx-auto h-16 flex items-center justify-between gap-4">
          <KatalystLogo />

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4 min-w-[160px]">
            <div className="relative flex items-center w-full h-10 rounded-full bg-surface-container border border-outline-variant overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
              <span className="material-symbols-outlined text-on-surface-variant ml-3 text-[20px]">
                search
              </span>
              <input
                className="w-full bg-transparent border-none focus:ring-0 text-sm text-on-background placeholder:text-on-surface-variant/70 pl-2 outline-none"
                placeholder="Search courses, tasks, projects..."
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    onSearch?.('');
                  }}
                  className="mr-3 text-on-surface-variant hover:text-on-background"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Status / Indicators */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-full border border-outline-variant shadow-sm hover:shadow-md transition-shadow cursor-default text-xs lg:text-sm">
              <div className="flex items-center gap-1 border-r border-outline-variant pr-2.5" title={`${user.streak} day streak`}>
                <span className="text-streak-orange text-sm">🔥</span>
                <span className="font-bold text-on-background">{user.streak}</span>
              </div>
              <div className="flex items-center gap-1 pl-0.5" title={`${user.xp.toLocaleString()} total XP`}>
                <span className="text-xp-gold text-sm">⭐</span>
                <span className="font-bold text-on-background">
                  {user.xp.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Notifications Button */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors active:scale-95 duration-200 relative focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant/50">
                    <h4 className="text-sm font-bold text-on-background">Notifications</h4>
                    <span className="text-[10px] bg-primary-container text-on-primary-container font-bold px-1.5 py-0.5 rounded">
                      2 New
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 mt-2 text-xs">
                    <div className="p-2 rounded bg-surface-container-low border border-outline-variant/30">
                      <p className="font-semibold text-on-background">Data Structures Assignment</p>
                      <p className="text-on-surface-variant">Due today at 11:59 PM</p>
                    </div>
                    <div className="p-2 rounded bg-surface-container-low border border-outline-variant/30">
                      <p className="font-semibold text-on-background">🔥 Streak Shield Active</p>
                      <p className="text-on-surface-variant">2 freeze shields remaining</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar */}
            <div
              className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high shrink-0 border border-outline-variant hover:border-primary transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-primary/50"
              title={`${user.name} (${user.email})`}
            >
              <div className="w-full h-full flex items-center justify-center bg-primary text-on-primary font-bold text-xs uppercase">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navbar */}
      <header className="w-full top-0 sticky bg-background/90 backdrop-blur-sm z-50 transition-colors flex md:hidden justify-between items-center px-4 h-16 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <KatalystLogo />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Toggle mobile search"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface active:bg-surface-container rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>

          <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-1 rounded-full border border-outline-variant shadow-sm active:shadow-none transition-shadow">
            <div className="flex items-center gap-1 border-r border-outline-variant pr-1.5">
              <span className="text-streak-orange text-xs">🔥</span>
              <span className="text-xs font-bold text-on-background">{user.streak}</span>
            </div>
            <div className="flex items-center gap-1 pl-0.5">
              <span className="text-xp-gold text-xs">⭐</span>
              <span className="text-xs font-bold text-on-background">
                {user.xp >= 1000 ? `${(user.xp / 1000).toFixed(1)}k` : user.xp}
              </span>
            </div>
          </div>

          <ThemeToggle />

          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors active:scale-95 duration-200 relative focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border border-background"></span>
          </button>
        </div>
      </header>

      {/* Mobile Search Overlay Bar */}
      {showMobileSearch && (
        <div className="px-4 py-2 bg-surface-container border-b border-outline-variant md:hidden animate-in fade-in">
          <div className="relative flex items-center w-full h-9 rounded-full bg-surface-container-lowest border border-outline-variant px-3">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px] mr-2">
              search
            </span>
            <input
              autoFocus
              className="w-full bg-transparent border-none text-xs text-on-background outline-none placeholder:text-on-surface-variant/70"
              placeholder="Search courses, tasks, projects..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button
              type="button"
              onClick={() => setShowMobileSearch(false)}
              className="text-on-surface-variant text-xs font-bold ml-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
