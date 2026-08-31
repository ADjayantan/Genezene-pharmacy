'use client';
import { useState } from 'react';
import { SidebarNav } from './SidebarNav';

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button 
        onClick={() => setOpen(true)}
        className="p-2 -ml-2 text-ink hover:text-green transition-colors"
        aria-label="Open menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-paper shadow-lg transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={() => setOpen(false)}
            className="p-2 text-ink-soft hover:text-out bg-paper rounded-full border border-paper-edge shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="h-full w-full relative" onClick={() => setOpen(false)}>
          {/* Clicking links inside will also close it, because we wrap the onClick here (hacky but works for next/link inside) */}
          <SidebarNav />
        </div>
      </div>
    </div>
  );
}
