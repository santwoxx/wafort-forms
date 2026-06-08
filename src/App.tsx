import React, { useState, useEffect, useRef } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "./firebase";
import Navbar, { AppView } from "./components/Navbar";
import CollaboratorForm from "./components/CollaboratorForm";
import TrackingQuery from "./components/TrackingQuery";
import AdminPanel from "./components/AdminPanel";
import FormSuccess from "./components/FormSuccess";
import ModalPolicies from "./components/ModalPolicies";
import { Info, Star, ShieldCheck } from "lucide-react";

function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();

    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    gain1.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.35);

    setTimeout(() => {
      try {
        if (audioCtx.state === "closed") return;
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(698.46, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.45);
      } catch { /* ignore */ }
    }, 180);
  } catch { /* ignore */ }
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.FORM);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const prevUnread = useRef(0);

  // Policies and terms modal state
  const [policiesModalOpen, setPoliciesModalOpen] = useState(false);
  const [policiesTab, setPoliciesTab] = useState<"terms" | "privacy" | "compliance">("terms");
  
  // Post-submission success state
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    trackingCode: string;
    feedbackId: string;
    typeLabel: string;
  } | null>(null);

  // Live monitor of unread submissions for the header badge notification
  // Only active when admin is authenticated (Firestore Rules enforce authorization)
  useEffect(() => {
    let unsub: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsub) unsub();

      if (!user) {
        setUnreadCount(0);
        prevUnread.current = 0;
        return;
      }

      const q = query(collection(db, "feedbacks"), where("isRead", "==", false));
      unsub = onSnapshot(q,
        (snapshot) => {
          const count = snapshot.size;
          if (count > prevUnread.current) {
            playNotificationSound();
          }
          prevUnread.current = count;
          setUnreadCount(count);
        },
        () => {
          setUnreadCount(0);
          prevUnread.current = 0;
        }
      );
    });

    return () => {
      if (unsub) unsub();
      unsubAuth();
    };
  }, []);

  const handleFormSuccess = (trackingCode: string, feedbackId: string, typeLabel: string) => {
    setSubmissionSuccess({ trackingCode, feedbackId, typeLabel });
  };

  const handleClearSuccessScreen = () => {
    setSubmissionSuccess(null);
    setCurrentView(AppView.FORM);
  };

  const handleSetView = (view: AppView) => {
    // If navigating, clear success screen to prevent sticky state
    setSubmissionSuccess(null);
    setCurrentView(view);
  };

  return (
    <div id="wafort-app-wrapper" className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Primary Brand Header using Geometric Balance style */}
      <Navbar 
        currentView={currentView} 
        onViewChange={handleSetView} 
        unreadCount={unreadCount} 
      />

      {/* Main Dynamic Workspace Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {submissionSuccess ? (
          <FormSuccess 
            trackingCode={submissionSuccess.trackingCode}
            feedbackId={submissionSuccess.feedbackId}
            type={submissionSuccess.typeLabel}
            onBack={handleClearSuccessScreen}
          />
        ) : (
          <div className="animate-fadeIn">
            {currentView === AppView.FORM && (
              <div className="space-y-8">
                
                {/* Introduction Banner with strict Geometric Balance outline and details */}
                <div className="bg-white rounded-sm p-6 border-l-4 border-[#D4AF37] border-y border-r border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex gap-4">
                    <div className="text-[#003366] shrink-0 mt-1">
                      <Info className="h-6 w-6 text-[#D4AF37]" />
                    </div>
                    <div>
                      <h1 className="text-xl font-display font-black tracking-tight text-[#003366] uppercase">
                        Canal Integrado de Ouvidoria & <span className="text-[#D4AF37] italic">Integridade</span>
                      </h1>
                      <div className="h-0.5 w-16 bg-[#D4AF37] my-2"></div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Este é o canal exclusivo e seguro da Wafort para comunicação aberta de críticas de processo, ideias de melhoria construtivas, ou reporte confidencial de transgressões éticas. Seu relato auxilia diretamente no fortalecimento de nossa governança e conformidade legal.
                      </p>
                    </div>
                  </div>
                  
                  {/* Subtle dynamic compliance seal */}
                  <div className="p-4 bg-slate-50 w-full md:w-auto shrink-0 flex items-center gap-3 rounded-sm border border-slate-200">
                    <div className="w-6 h-6 border border-[#003366] rotate-45 flex items-center justify-center bg-white">
                      <Star className="h-3.5 w-3.5 text-[#D4AF37] fill-[#D4AF37] -rotate-45" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">CONFORMIDADE</span>
                      <span className="text-xs font-display font-bold text-[#003366] uppercase whitespace-nowrap">Ambiente Criptografado</span>
                    </div>
                  </div>
                </div>

                <CollaboratorForm onSuccess={handleFormSuccess} />
              </div>
            )}

            {currentView === AppView.TRACK && (
              <TrackingQuery onBack={() => setCurrentView(AppView.FORM)} />
            )}

            {currentView === AppView.ADMIN && (
              <AdminPanel />
            )}
          </div>
        )}

      </main>

      {/* Corporate compliant Wafort footer matching Geometric Balance */}
      <footer id="wafort-footer" className="bg-[#003366] border-t-4 border-[#D4AF37] text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-md p-1 flex items-center justify-center shadow">
                <img 
                  src="https://i.ibb.co/zT614RJF/logo.webp" 
                  alt="logo" 
                  referrerPolicy="no-referrer"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <div>
                <span className="font-display font-extrabold tracking-wider text-white text-base uppercase">WAFORT INTEGRIDADE</span>
                <span className="text-[9px] bg-white/10 text-[#D4AF37] px-2 py-0.5 rounded-sm font-mono ml-2 border border-[#D4AF37]/30">
                  v1.0.0 Stable
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-widest text-slate-300 font-bold">
              <button 
                type="button"
                onClick={() => { setPoliciesTab("terms"); setPoliciesModalOpen(true); }}
                className="cursor-pointer hover:text-[#D4AF37] transition"
              >
                Termos de Uso
              </button>
              <button 
                type="button"
                onClick={() => { setPoliciesTab("compliance"); setPoliciesModalOpen(true); }}
                className="cursor-pointer hover:text-[#D4AF37] transition"
              >
                Compliance e Normas
              </button>
              <button 
                type="button"
                onClick={() => { setPoliciesTab("privacy"); setPoliciesModalOpen(true); }}
                className="text-[#D4AF37] font-extrabold underline cursor-pointer hover:text-white transition"
              >
                Privacidade & LGPD
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-slate-350">
            <p className="max-w-2xl leading-relaxed">
              Plataforma de Governança corporativa interna. Atendemos integralmente às normativas da LGPD (Lei Geral de Proteção de Dados), garantindo o sigilo absoluto dos relatórios cadastrados como anônimos.
            </p>
            <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
              © 2026 WAFORT LOGÍSTICA & TRANSPORTES
            </div>
          </div>
        </div>
      </footer>

      <ModalPolicies 
        isOpen={policiesModalOpen} 
        onClose={() => setPoliciesModalOpen(false)} 
        initialTab={policiesTab} 
      />

    </div>
  );
}
