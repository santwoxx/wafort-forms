import React from "react";
import { MessageSquare, Search, ShieldAlert } from "lucide-react";

export enum AppView {
  FORM = "form",
  TRACK = "track",
  ADMIN = "admin"
}

interface NavbarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  unreadCount: number;
}

export default function Navbar({ currentView, onViewChange, unreadCount }: NavbarProps) {
  return (
    <header id="wafort-header" className="min-h-20 bg-[#003366] text-white flex flex-col sm:flex-row items-center justify-between px-4 sm:px-10 py-3 sm:py-0 border-b-4 border-[#D4AF37] sticky top-0 z-50 shadow-md gap-3 sm:gap-0">
      {/* Dynamic Geometric Logo with the provided logo webp */}
      <div 
        className="flex items-center gap-3 cursor-pointer shrink-0 transition-transform hover:scale-[1.02] active:scale-95"
        onClick={() => onViewChange(AppView.FORM)}
      >
        <div className="w-12 h-12 bg-white rounded-md p-1 flex items-center justify-center shadow">
          <img 
            src="https://i.ibb.co/zT614RJF/logo.webp" 
            alt="logo" 
            referrerPolicy="no-referrer"
            className="h-10 w-auto object-contain"
          />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-black tracking-tight uppercase leading-none">
            Wafort <span className="text-[#D4AF37] font-light">Integridade</span>
          </h1>
          <p className="text-[8px] sm:text-[9px] text-slate-300 font-mono tracking-wider opacity-90 uppercase mt-0.5">Canal de Transparência & Ética</p>
        </div>
      </div>

      {/* Navigation Buttons conforming with Geometric Balance design & highly mobile responsive */}
      <nav className="flex items-center gap-1.5 bg-white/5 p-1 rounded-sm border border-white/10 w-full sm:w-auto justify-around sm:justify-start">
        
        {/* Nova Manifestação button */}
        <button
          id="nav-to-form-btn"
          onClick={() => onViewChange(AppView.FORM)}
          className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 rounded-sm text-[11px] sm:text-xs font-display font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 min-h-[44px] ${
            currentView === AppView.FORM
              ? "bg-[#D4AF37] text-[#003366] font-extrabold shadow"
              : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden xs:inline sm:hidden md:inline">Relatar</span>
          <span className="hidden sm:inline md:hidden lg:inline">Manifestação</span>
        </button>

        {/* Tracking button */}
        <button
          id="nav-to-tracking-btn"
          onClick={() => onViewChange(AppView.TRACK)}
          className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 rounded-sm text-[11px] sm:text-xs font-display font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 min-h-[44px] ${
            currentView === AppView.TRACK
              ? "bg-[#D4AF37] text-[#003366] font-extrabold shadow"
              : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
        >
          <Search className="h-4 w-4" />
          <span className="hidden xs:inline sm:hidden md:inline">Acompanhar</span>
          <span className="hidden sm:inline md:hidden">Consultar</span>
        </button>

        {/* Administration button */}
        <button
          id="nav-to-admin-btn"
          onClick={() => onViewChange(AppView.ADMIN)}
          className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 rounded-sm text-[11px] sm:text-xs font-display font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 relative min-h-[44px] ${
            currentView === AppView.ADMIN
              ? "bg-[#D4AF37] text-[#003366] font-extrabold shadow"
              : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span className="hidden xs:inline sm:hidden md:inline">Painel Admin</span>
          <span className="hidden sm:inline md:hidden">Painel</span>
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-650 rounded-full text-[10px] font-black text-white flex items-center justify-center border border-white shadow animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </nav>
    </header>
  );
}
