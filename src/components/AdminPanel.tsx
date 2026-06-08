import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, loginWithGoogle, logout, auth } from "../firebase";
import { Feedback, FeedbackStatus, FeedbackType, UrgencyLevel, STATUS_LABELS, TYPE_LABELS, URGENCY_LABELS } from "../types";
import { 
  ShieldAlert, LogIn, LogOut, CheckCircle, Clock, Eye, AlertCircle, 
  Search, Filter, BookOpen, Trash2, CheckCircle2, ChevronRight, 
  CornerDownRight, AlertTriangle, Bell, FileSpreadsheet, UserCheck,
  ArrowLeft
} from "lucide-react";

export default function AdminPanel() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedItem, setSelectedItem] = useState<Feedback | null>(null);

  // Real-time Toast Notification State
  interface AdminToast {
    id: string;
    trackingCode: string;
    subject: string;
    type: FeedbackType;
    item: Feedback;
  }
  const [toasts, setToasts] = useState<AdminToast[]>([]);

  // Synthesize a clean, professional, high-fidelity double alert tone using Web Audio API
  const playAlertSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.4);
      
      setTimeout(() => {
        try {
          if (audioCtx.state === "closed") return;
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(698.46, audioCtx.currentTime); // F5
          gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
          
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.5);
        } catch (err) {
          console.warn("Feedback chime error:", err);
        }
      }, 150);
    } catch (e) {
      console.warn("Web Audio alert sound not allowed or blocked by browser:", e);
    }
  };

  const addToastNotification = (item: Feedback) => {
    const newToast: AdminToast = {
      id: `${item.id}-${Date.now()}`,
      trackingCode: item.trackingCode,
      subject: item.subject,
      type: item.type,
      item
    };
    setToasts(prev => [newToast, ...prev].slice(0, 5)); // Cap at 5 concurrent toasts

    // Auto-remove toast after 6.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 6500);
  };

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterUrgency, setFilterUrgency] = useState<string>("all");

  // Admin response states for selected item
  const [noteInput, setNoteInput] = useState("");
  const [responseInput, setResponseInput] = useState("");
  const [statusSelector, setStatusSelector] = useState<FeedbackStatus>(FeedbackStatus.PENDENTE);
  const [updatingItem, setUpdatingItem] = useState(false);
  const [adminActionMsg, setAdminActionMsg] = useState<string | null>(null);

  const [authError, setAuthError] = useState<string | null>(null);

  // Logged-in admin email check from environment and instructions
  const ALLOWED_ADMIN_EMAIL = "brisasofc@gmail.com";
  const ALLOWED_CORP_EMAILS = ["wafort@wafort.com", "rh@wafort.com.br", "wendellatanazio@wafort.com.br"];
  const ALLOWED_GMAIL_EMAILS = ["wafortrh@gmail.com"];

  // Track Firebase Auth state with Zero-Trust protection
  useEffect(() => {
    let active = true;
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (!active) return;
      if (user) {
        // Enforce verified status matching the firestore.rules checks:
        // (request.auth.token.email == "brisasofc@gmail.com" && request.auth.token.email_verified == true)
        const isVerifiedAdmin = user.email === ALLOWED_ADMIN_EMAIL && user.emailVerified === true;
        const isGmailAdmin = ALLOWED_GMAIL_EMAILS.includes(user.email) && user.emailVerified === true;
        const isCorpAdmin = ALLOWED_CORP_EMAILS.includes(user.email);
        
        if (!isVerifiedAdmin && !isGmailAdmin && !isCorpAdmin) {
          try {
            console.warn(`[Wafort Security] Tentativa de login negada para: ${user.email}. Desconectando sessão imediatamente.`);
            await logout();
            if (active) {
              setCurrentUser(null);
              setAuthError(`Acesso Negado: O e-mail (${user.email}) não está autorizado nas regras do Firebase de governança da Wafort.`);
            }
          } catch (err: any) {
            console.error("Erro ao desconectar usuário não autorizado:", err);
          }
        } else {
          if (active) {
            setCurrentUser(user);
            setAuthError(null);
          }
        }
      } else {
        if (active) {
          setCurrentUser(null);
        }
      }
      if (active) {
        setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubAuth();
    };
  }, []);

  // Sync current feedbacks list in real-time when admin is logged in and fully authorized (Google + Credentials)
  useEffect(() => {
    const isFullyAuthorized = currentUser && (
      (currentUser.email === ALLOWED_ADMIN_EMAIL && currentUser.emailVerified === true) ||
      (ALLOWED_GMAIL_EMAILS.includes(currentUser.email) && currentUser.emailVerified === true) ||
      ALLOWED_CORP_EMAILS.includes(currentUser.email)
    );
    if (!isFullyAuthorized) {
      setFeedbacks([]);
      return;
    }

    let isInitial = true;
    const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
    const unsubSnap = onSnapshot(
      q,
      (snapshot) => {
        const items: Feedback[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as Feedback);
        });

        // Trigger dynamic sound and pop-up notifications for newly arrived feedback items
        if (!isInitial) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const newFeed = { id: change.doc.id, ...change.doc.data() } as Feedback;
              playAlertSound();
              addToastNotification(newFeed);
            }
          });
        }

        setFeedbacks(items);
        isInitial = false;
      },
      (error) => {
        console.error("Rules or subscription error:", error);
      }
    );

    return () => unsubSnap();
  }, [currentUser]);

  // Handle auto-selecting item or refreshing its state if feedbacks list changes
  useEffect(() => {
    if (selectedItem) {
      const refreshedItem = feedbacks.find((f) => f.id === selectedItem.id);
      if (refreshedItem) {
        setSelectedItem(refreshedItem);
        setNoteInput(refreshedItem.adminNotes || "");
        setResponseInput(refreshedItem.adminResponse || "");
        setStatusSelector(refreshedItem.status);
      }
    }
  }, [feedbacks]);

  // Auth operations
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      alert("Falha ao iniciar sessão com o Google.");
    }
  };

  const handleLogout = async () => {
    await logout();
    setSelectedItem(null);
    setAuthError(null);
  };

  const handleSelectFeedback = async (item: Feedback) => {
    setSelectedItem(item);
    setNoteInput(item.adminNotes || "");
    setResponseInput(item.adminResponse || "");
    setStatusSelector(item.status);
    setAdminActionMsg(null);

    // If item is unread, automatically mark it as read in background to clear notification badge
    if (!item.isRead) {
      try {
        const itemRef = doc(db, "feedbacks", item.id);
        await updateDoc(itemRef, { isRead: true });
      } catch (err) {
        console.error("Error setting feedback read:", err);
      }
    }
  };

  // Submit Updates to Feedback from Admin Console
  const handleUpdateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setUpdatingItem(true);
    setAdminActionMsg(null);

    try {
      const itemRef = doc(db, "feedbacks", selectedItem.id);
      const isResponseChanged = selectedItem.adminResponse !== responseInput.trim();

      const updatePayload: any = {
        adminNotes: noteInput.trim() || null,
        adminResponse: responseInput.trim() || null,
        status: statusSelector,
      };

      if (isResponseChanged) {
        updatePayload.adminResponseAt = serverTimestamp();
      }

      await updateDoc(itemRef, updatePayload);
      setAdminActionMsg("Atualizações gravadas com sucesso.");
    } catch (err) {
      console.error(err);
      setAdminActionMsg("Erro ao atualizar o registro: Permissão negada ou conexão perdida.");
    } finally {
      setUpdatingItem(false);
    }
  };

  // Delete Action (Admin Only)
  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente esta ocorrência da base? Esta ação é irreversível.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "feedbacks", id));
      setSelectedItem(null);
    } catch (err) {
      alert("Falha ao excluir o documento.");
    }
  };

  // Computed visual properties
  const isFullyAuthorized = currentUser && (
    (currentUser.email === ALLOWED_ADMIN_EMAIL && currentUser.emailVerified === true) ||
    (ALLOWED_GMAIL_EMAILS.includes(currentUser.email) && currentUser.emailVerified === true) ||
    ALLOWED_CORP_EMAILS.includes(currentUser.email)
  );

  // Counters Analytics
  const stats = {
    total: feedbacks.length,
    unread: feedbacks.filter((f) => !f.isRead).length,
    pending: feedbacks.filter((f) => f.status === FeedbackStatus.PENDENTE).length,
    inAnalysis: feedbacks.filter((f) => f.status === FeedbackStatus.EM_ANALISE).length,
    resolved: feedbacks.filter((f) => f.status === FeedbackStatus.RESOLVIDO).length,
    suggestions: feedbacks.filter((f) => f.type === FeedbackType.SUGESTAO).length,
    criticisms: feedbacks.filter((f) => f.type === FeedbackType.CRITICA).length,
    complaints: feedbacks.filter((f) => f.type === FeedbackType.DENUNCIA).length,
    criticalUrgency: feedbacks.filter((f) => f.urgency === UrgencyLevel.CRITICA || f.urgency === UrgencyLevel.ALTA).length,
  };

  // Filtered List computations
  const filteredFeedbacks = feedbacks.filter((item) => {
    const matchesSearch = 
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.collaboratorName && item.collaboratorName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === "all" || item.type === filterType;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesUrgency = filterUrgency === "all" || item.urgency === filterUrgency;

    return matchesSearch && matchesType && matchesStatus && matchesUrgency;
  });

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading indicator for firebase auth checks
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <svg className="animate-spin h-8 w-8 text-[#003366] mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Verificando credenciais de diretoria...</span>
      </div>
    );
  }

  // LOGIN SCREEN WITH GOOGLE AUTH (Security enforced by Firebase Rules)
  if (!isFullyAuthorized) {
    return (
      <div id="admin-login-screen" className="max-w-md mx-auto my-12 bg-white rounded-sm shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-[#003366] text-white p-8 text-center border-b-4 border-[#D4AF37]">
          <ShieldAlert className="h-10 w-10 text-[#D4AF37] mx-auto mb-3" />
          <h2 className="text-xl font-display font-black tracking-tight uppercase">Mesa de Governança Wafort</h2>
          <div className="h-0.5 w-12 bg-[#D4AF37] mx-auto my-2"></div>
          <p className="text-xs text-[#D5E1ED] uppercase tracking-wider font-semibold">
            Acesso restrito à diretoria e compliance
          </p>
        </div>

        <div className="p-8 space-y-6">
          {!currentUser ? (
            /* GOOGLE LOGIN (única etapa) */
            <div className="space-y-5 text-center">
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed text-left">
                Acesse com sua conta Google corporativa homologada pela diretoria Wafort.
                A segurança é garantida pelas regras de acesso do Firebase.
              </p>
              
              {authError && (
                <div className="bg-red-50 text-red-800 text-xs p-5 rounded-sm border border-red-100 space-y-3 text-left animate-fadeIn">
                  <p className="font-bold flex items-center gap-2 text-danger">
                    <AlertCircle className="h-4 w-4 text-red-650 shrink-0" />
                    Controle de Acesso de Ouvidoria
                  </p>
                  <p className="leading-relaxed text-slate-650 text-[11px]">
                    {authError}
                  </p>
                </div>
              )}

              <button
                id="admin-google-login-btn"
                type="button"
                onClick={handleLogin}
                className="w-full inline-flex items-center justify-center gap-3 px-5 py-3.5 bg-[#003366] hover:bg-slate-850 text-white text-xs font-bold uppercase tracking-widest rounded-sm border border-slate-250 transition cursor-pointer shadow-sm hover:border-[#D4AF37]"
              >
                <LogIn className="h-4 w-4 text-[#D4AF37]" />
                Logon corporativo Google
              </button>
            </div>
          ) : (
            /* ACESSO NEGADO - Email não autorizado */
            <div className="bg-red-50 text-red-800 text-xs p-5 rounded-sm border border-red-100 space-y-3 text-left animate-fadeIn">
              <p className="font-bold flex items-center gap-2 text-red-750">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Acesso Negado para {currentUser.email}
              </p>
              <p className="leading-relaxed text-slate-600 text-[11px]">
                Este e-mail do Google não pertence à diretoria ou governança administrativa autorizada. Por favor, conecte-se com uma credencial homologada.
              </p>
              <button
                id="unauthorized-logout-btn"
                type="button"
                onClick={handleLogout}
                className="text-[#003366] font-bold uppercase tracking-wider text-[11px] hover:underline pt-2 inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Tentar outro e-mail
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 text-[9px] text-slate-400 font-mono flex items-center justify-center gap-1 uppercase tracking-widest text-center">
            <span>Sessão Admin Segura SSL</span>
            <span>•</span>
            <span>Governança Wafort Compliance</span>
          </div>
        </div>
      </div>
    );
  }

  // FULL AUTHORIZED ADMIN PANEL SCREEN WITH GEOMETRIC BALANCE THEME
  return (
    <div id="admin-admin-panel" className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Banner Control Area */}
      <div className="bg-[#003366] text-white p-6 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border-b-4 border-[#D4AF37] relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-5 flex items-center pr-10">
          <BookOpen className="h-48 w-48 text-[#D4AF37]" />
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 rounded-sm border-2 border-[#D4AF37] bg-white/10 flex items-center justify-center text-[#D4AF37]">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-display font-black tracking-tight uppercase flex items-center gap-1">
                Diretoria de Governança & <span className="text-[#D4AF37] italic">Compliance</span>
              </h2>
              <span className="text-[9px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                Rastreamento Ativado
              </span>
            </div>
            <p className="text-xs text-slate-350">Operador credenciado: <strong className="text-white font-medium">{currentUser.email}</strong></p>
          </div>
        </div>

        <button
          id="admin-logout-btn"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-[#D4AF37] border border-white/10 transition rounded-sm text-xs font-bold uppercase tracking-widest cursor-pointer relative z-10 shrink-0"
        >
          <LogOut className="h-4 w-4" /> Desconectar Painel
        </button>
      </div>

      {/* Grid Analytics Statistics Cards */}
      <div id="stats-dashboard-grid" className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total stats feedback */}
        <div className="bg-white rounded-sm p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-slate-50 text-[#003366] border border-slate-200 rounded-sm">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold font-mono">Total Registros</span>
            <span className="text-xl font-display font-black text-slate-800">{stats.total}</span>
          </div>
        </div>

        {/* Real-time Notifications counter */}
        <div className="bg-white rounded-sm p-4 border border-slate-200 shadow-sm flex items-center gap-3 relative overflow-hidden">
          {stats.unread > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
          <div className={`p-3 rounded-sm border ${stats.unread > 0 ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' : 'bg-slate-50 text-slate-500'}`}>
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold font-mono">Não Lidos</span>
            <span className="text-xl font-display font-black text-slate-800">{stats.unread}</span>
          </div>
        </div>

        {/* Pending Items */}
        <div className="bg-white rounded-sm p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-sm">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold font-mono">Pendentes</span>
            <span className="text-xl font-display font-black text-slate-800">{stats.pending}</span>
          </div>
        </div>

        {/* Em Análise */}
        <div className="bg-white rounded-sm p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-sm">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold font-mono">Em Análise</span>
            <span className="text-xl font-display font-black text-slate-800">{stats.inAnalysis}</span>
          </div>
        </div>

        {/* Criticas/Denuncias Urgentes */}
        <div className="bg-white rounded-sm p-4 border border-slate-200 shadow-sm flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-sm">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold font-mono">Urgência Crítica</span>
            <span className="text-xl font-display font-black text-slate-800">{stats.criticalUrgency}</span>
          </div>
        </div>
      </div>

      {/* Main Core Area: List (Left) & Selected Item details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LIST & FILTER BLOCK LIST (7 columns/12) */}
        <div id="admin-feedbacks-list-column" className={`lg:col-span-7 bg-white rounded-sm border border-slate-200 p-6 shadow-sm space-y-4 ${selectedItem ? "hidden lg:block" : "block"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-display font-black text-[#003366] uppercase">Manifestações Recebidas</h3>
              <p className="text-xs text-slate-400 font-mono">Selecione para responder • {filteredFeedbacks.length} ocorrentes</p>
            </div>

            {/* Keyword Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
              <input
                id="admin-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar protocolo ou título"
                className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 px-9 text-xs focus:outline-none focus:border-[#003366]"
              />
            </div>
          </div>

          {/* Filtering controls bar */}
          <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-2.5 rounded-sm border border-slate-200">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0 select-none hidden sm:block" />
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border border-slate-200 rounded-sm py-1 px-2 text-[11px] text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="all">Tipo (Todos)</option>
              <option value={FeedbackType.SUGESTAO}>Sugestões</option>
              <option value={FeedbackType.CRITICA}>Críticas</option>
              <option value={FeedbackType.DENUNCIA}>Denúncias</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-sm py-1 px-2 text-[11px] text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="all">Status (Todos)</option>
              <option value="pendente">Pendente</option>
              <option value="em_analise">Em Análise</option>
              <option value="resolvido">Resolvido</option>
              <option value="arquivado">Arquivado</option>
            </select>

            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="bg-white border border-slate-200 rounded-sm py-1 px-2 text-[11px] text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="all">Urgência (Todas)</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
            
            {(filterType !== "all" || filterStatus !== "all" || filterUrgency !== "all" || searchTerm !== "") && (
              <button
                onClick={() => {
                  setFilterType("all");
                  setFilterStatus("all");
                  setFilterUrgency("all");
                  setSearchTerm("");
                }}
                className="ml-auto text-[10px] uppercase font-bold text-[#003366] hover:underline"
              >
                Limpar Filtros
              </button>
            )}
          </div>

          {/* Table display items list */}
          <div className="space-y-2 max-h-[350px] lg:max-h-[550px] overflow-y-auto pr-1">
            {filteredFeedbacks.length > 0 ? (
              filteredFeedbacks.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const dateText = formatTimestamp(item.createdAt);
                
                return (
                  <button
                    key={item.id}
                    id={`feedback-list-item-${item.id}`}
                    onClick={() => handleSelectFeedback(item)}
                    className={`w-full text-left p-4 rounded-sm border transition flex items-start gap-4 cursor-pointer relative ${
                      isSelected
                        ? "bg-slate-50 border-l-4 border-l-[#D4AF37] border-y border-r border-[#003366]/25 shadow-sm"
                        : "bg-white border-slate-200 hover:bg-slate-50/70"
                    }`}
                  >
                    {!item.isRead && (
                      <span className="absolute top-4 left-2.5 h-2 w-2 rounded-full bg-red-650" title="Mensagem Nova"></span>
                    )}

                    <div className="space-y-1.5 flex-grow">
                      <div className="flex justify-between items-center pr-1 flex-wrap gap-1">
                        <span className="text-[9px] text-[#003366] font-mono font-bold uppercase tracking-wider">{item.trackingCode}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{dateText}</span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">{item.subject}</h4>
                      
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${TYPE_LABELS[item.type].bg} ${TYPE_LABELS[item.type].color}`}>
                          {TYPE_LABELS[item.type].label}
                        </span>

                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${STATUS_LABELS[item.status].bg} ${STATUS_LABELS[item.status].color}`}>
                          {STATUS_LABELS[item.status].label}
                        </span>

                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${URGENCY_LABELS[item.urgency].bg} ${URGENCY_LABELS[item.urgency].color}`}>
                          {URGENCY_LABELS[item.urgency].label}
                        </span>

                        <span className="text-[10px] font-mono text-slate-400">
                          {item.isAnonymous ? "Anônimo" : "Identificado"}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className={`h-5 w-5 text-slate-450 transition shrink-0 ${isSelected ? 'translate-x-1 text-[#D4AF37]' : ''}`} />
                  </button>
                );
              })
            ) : (
              <div id="no-feedbacks-alert-box" className="p-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-300 rounded-sm bg-slate-50">
                <p className="font-bold text-[#003366] uppercase text-xs">Sem ocorrências registradas</p>
                <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-500">
                  Não há novas manifestações com os filtros assinalados.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SELECTED ITEM READ-MODIFY-RESPOND PANEL (5 columns/12) */}
        <div id="admin-detail-column" className={`lg:col-span-5 ${selectedItem ? "block" : "hidden lg:block"}`}>
          {selectedItem ? (
            <div id="admin-detail-active-card" className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden sticky top-4">
              
              <div className="bg-slate-50 p-6 border-b border-slate-200 space-y-3">
                {/* Back button only on mobile to return to list */}
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="lg:hidden inline-flex items-center gap-1.5 text-xs font-black text-[#003366] hover:text-[#D4AF37] transition cursor-pointer mb-2 pb-2 border-b border-slate-200/50 w-full"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar para a lista de ocorrências
                </button>
                
                <div className="flex justify-between items-start gap-4 flex-wrap text-left">
                  <div>
                    <span className="text-[9px] text-[#003366] font-mono font-bold tracking-widest block uppercase">Visualizar Protocolo corporativo</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{selectedItem.trackingCode}</span>
                  </div>
                  <button
                    id="admin-delete-confirm-btn"
                    onClick={() => handleDeleteFeedback(selectedItem.id)}
                    className="p-2 text-slate-400 hover:text-red-700 hover:bg-slate-100 rounded-sm transition"
                    title="Excluir Ocorrência permanentemente"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>

                <h3 className="text-base font-display font-bold text-[#003366] italic leading-snug">{selectedItem.subject}</h3>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${TYPE_LABELS[selectedItem.type].bg} ${TYPE_LABELS[selectedItem.type].color}`}>
                    {TYPE_LABELS[selectedItem.type].label}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${URGENCY_LABELS[selectedItem.urgency].bg} ${URGENCY_LABELS[selectedItem.urgency].color}`}>
                    {URGENCY_LABELS[selectedItem.urgency].label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Registrado: {formatTimestamp(selectedItem.createdAt)}</span>
                </div>
              </div>

              {/* Feed Content body */}
              <div className="p-6 space-y-6 max-h-[300px] lg:max-h-[480px] overflow-y-auto">
                
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Relato Completo</h4>
                  <div className="bg-slate-50 rounded-sm p-4 border border-slate-201 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
                    {selectedItem.description}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-sm p-4 border border-slate-200">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Identidade Cadastrada</h4>
                  {selectedItem.isAnonymous ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-800">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                      <span><strong>Anonimato Preservado.</strong> Nenhuma credencial pessoal vinculada.</span>
                    </div>
                  ) : (
                    <div className="text-xs space-y-1 text-slate-700">
                      <p><strong>Nome:</strong> <span className="text-slate-900 font-bold">{selectedItem.collaboratorName}</span></p>
                      <p><strong>E-mail ou Contato:</strong> <span className="text-slate-900 font-mono font-medium">{selectedItem.collaboratorEmail}</span></p>
                    </div>
                  )}
                </div>

                {/* Form to responder */}
                <form id="admin-action-form" onSubmit={handleUpdateFeedback} className="space-y-4 pt-4 border-t border-slate-200">
                  
                  {adminActionMsg && (
                    <div className="bg-[#003366]/5 text-[#003366] text-xs py-2 px-3 border border-[#003366]/10 rounded-sm flex items-center gap-1.5 font-bold">
                      <CheckCircle className="h-4 w-4 text-[#D4AF37] shrink-0" />
                      <span>{adminActionMsg}</span>
                    </div>
                  )}

                  {/* Status update selector options */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Alterar status operacional</label>
                    <div className="grid grid-cols-4 gap-1 bg-slate-50 p-1 rounded-sm border border-slate-200">
                      {(Object.keys(STATUS_LABELS) as Array<FeedbackStatus>).map((st) => {
                        const isChosen = statusSelector === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setStatusSelector(st)}
                            className={`py-2 rounded-sm text-[9px] font-bold uppercase text-center cursor-pointer transition ${
                              isChosen
                                ? "bg-[#003366] text-white font-bold"
                                : "text-slate-500 hover:bg-slate-100"
                            }`}
                          >
                            {STATUS_LABELS[st].label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Internal private notes */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                      <span>Notas de Governança (Diretoria / Privado)</span>
                      <span className="text-[9px] bg-red-100 text-red-700 font-bold py-0.5 px-1.5 rounded-sm">Confidencial</span>
                    </label>
                    <textarea
                      rows={3}
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Anote aqui diligências executadas, andamentos e providências de estoque. Usuários normais NÃO têm acesso."
                      className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-[#003366] leading-relaxed"
                    ></textarea>
                  </div>

                  {/* Response visible to citizen with secrete ID */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                      <span>Resposta Oficial ao Manifestante (Canal Aberto)</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold py-0.5 px-1.5 rounded-sm">Visível ao Colaborador</span>
                    </label>
                    <textarea
                      rows={4}
                      value={responseInput}
                      onChange={(e) => setResponseInput(e.target.value)}
                      placeholder="Fica visível imediatamente quando consultado no campo de rastreamento com ID Secreto."
                      className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-[#003366] leading-relaxed"
                    ></textarea>
                  </div>

                  <button
                    id="admin-save-action-btn"
                    type="submit"
                    disabled={updatingItem}
                    className="w-full py-3 bg-[#003366] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest rounded-sm transition shadow-sm cursor-pointer"
                  >
                    {updatingItem ? "Atualizando Registro..." : "Salvar Alterações e Resposta"}
                  </button>

                </form>
              </div>

            </div>
          ) : (
            <div id="no-item-selected-card" className="bg-slate-50 text-slate-400 text-center rounded-sm p-12 border border-dashed border-slate-300 h-full flex flex-col justify-center items-center min-h-[350px]">
              <CornerDownRight className="h-8 w-8 text-slate-350 mb-3 animate-bounce" />
              <p className="font-bold text-slate-600 uppercase text-xs">Ocorrência Não Selecionada</p>
              <p className="text-xs max-w-xs mx-auto leading-relaxed mt-1 text-slate-500">
                Selecione qualquer manifestação na lista ao lado para inspecionar, deferir e atualizar.
              </p>
            </div>
          )}
        </div>
        
      </div>

      {/* Real-time Floating Toast Notifications Overlay */}
        <div 
          id="admin-toasts-container" 
          className="fixed bottom-6 right-2 left-2 sm:right-6 sm:left-auto z-55 flex flex-col gap-3 max-w-sm w-full font-sans pointer-events-none"
        >
        {toasts.map((toast) => {
          const typeLabel = TYPE_LABELS[toast.type];
          return (
            <div
              key={toast.id}
              className="bg-white border-l-4 border-l-[#D4AF37] border border-slate-200 p-4 rounded-sm shadow-xl flex gap-3 pointer-events-auto transform translate-y-0 transition-all duration-300 animate-fadeIn"
              style={{ boxShadow: "0 10px 25px -5px rgba(0, 51, 102, 0.15), 0 8px 10px -6px rgba(0, 51, 102, 0.15)" }}
            >
              <div className="bg-amber-50 text-[#003366] h-8 w-8 rounded-sm border border-amber-100 flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4 text-[#D3A20B]" />
              </div>

              <div className="flex-grow space-y-1 text-left">
                <div className="flex justify-between items-center pr-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#003366]">{toast.trackingCode}</span>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide bg-[#D4AF37]/10 text-[#003366]">
                    NOVO RELATO
                  </span>
                </div>
                
                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{toast.subject}</h4>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Uma ocorrência de <span className="font-bold text-[#003366]">{typeLabel.label}</span> foi registrada no sistema.
                </p>

                <div className="pt-2 flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      handleSelectFeedback(toast.item);
                      setToasts(prev => prev.filter(t => t.id !== toast.id));
                    }}
                    className="text-[10px] font-black uppercase text-white bg-[#003366] hover:bg-[#D4AF37] hover:text-[#003366] px-2.5 py-1.5 rounded-sm transition cursor-pointer"
                  >
                    Visualizar
                  </button>
                  <button
                    onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-sm cursor-pointer"
                  >
                    Dispensar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
