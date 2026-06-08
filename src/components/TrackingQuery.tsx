import React, { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Feedback, STATUS_LABELS, TYPE_LABELS, URGENCY_LABELS } from "../types";
import { Search, Loader2, ArrowLeft, ShieldCheck, Lock, Calendar, MessageSquare, AlertCircle } from "lucide-react";

interface TrackingQueryProps {
  onBack: () => void;
}

export default function TrackingQuery({ onBack }: TrackingQueryProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFeedback(null);

    const targetId = tokenInput.trim();
    if (!targetId) {
      setErrorMsg("Por favor, digite o seu ID Secreto de 20 caracteres.");
      return;
    }

    if (targetId.length < 15) {
      setErrorMsg("O ID de acompanhamento parece inválido. Certifique-se de que inseriu o código correto gerado na finalização.");
      return;
    }

    setLoading(true);

    try {
      const docRef = doc(db, "feedbacks", targetId);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        setFeedback({
          id: snapshot.id,
          ...data,
        } as Feedback);
      } else {
        setErrorMsg("Nenhuma ocorrência encontrada com o ID fornecido. Verifique e tente novamente.");
      }
    } catch (err) {
      console.error("Error retrieving feedback:", err);
      setErrorMsg("Erro de comunicação com o banco: Acesso negado ou id desformatado.");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div id="tracking-query-wrapper" className="max-w-4xl mx-auto space-y-8">
      {/* Search Header Card with Geometric Balance styles */}
      <div className="bg-white rounded-sm shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-[#003366] p-8 text-white text-center border-b-4 border-[#D4AF37]">
          <div className="w-12 h-12 bg-white rounded-sm flex items-center justify-center mx-auto mb-3">
            <Lock className="h-6 w-6 text-[#003366]" />
          </div>
          <h2 className="text-2xl font-display font-black uppercase tracking-tight">Portal de Rastreabilidade</h2>
          <div className="h-1 w-16 bg-[#D4AF37] mx-auto my-3"></div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl mx-auto">
            Cole abaixo o seu <strong>ID Secreto</strong> de 20 caracteres para consultar pareceres, atualizações de status e as tratativas da consultoria de compliance Wafort.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <form id="tracking-search-form" onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">
                ID Secreto do Protocolo (Disponibilizado na emissão)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    id="tracking-token-input"
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Ex: O3Rnd8dO29jPq8SlsM39"
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 px-11 text-sm focus:outline-none focus:border-[#003366] font-mono"
                  />
                </div>
                <button
                  id="search-feedback-btn"
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3.5 bg-[#003366] hover:bg-slate-800 text-white rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <>Consultar Protocolo</>
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div id="search-error-box" className="bg-red-50 text-red-800 text-xs py-3 px-4 rounded-sm border border-red-150 flex gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Dynamic Results Display */}
      {feedback && (
        <div id="tracking-result-details" className="bg-white rounded-sm shadow-md overflow-hidden border border-slate-201 animate-fadeIn">
          {/* Result Card Title Header */}
          <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-sm text-[10px] uppercase font-bold text-white tracking-wider ${TYPE_LABELS[feedback.type].bg}`}>
                  {TYPE_LABELS[feedback.type].label}
                </span>
                <span className={`px-2.5 py-0.5 rounded-sm text-[10px] uppercase font-bold border ${STATUS_LABELS[feedback.status].bg} ${STATUS_LABELS[feedback.status].color}`}>
                  Status: {STATUS_LABELS[feedback.status].label}
                </span>
              </div>
              <h3 className="text-xl font-display font-bold text-[#003366] italic">{feedback.subject}</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-1">ID Secreto: <strong className="text-slate-800">{feedback.id}</strong> | Protocolo: <strong className="text-slate-800">{feedback.trackingCode}</strong></p>
            </div>

            <div className="text-left flex flex-col items-start md:items-end p-3 bg-white rounded-sm border border-slate-200 shrink-0">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Urgência Estimada</span>
              <span className={`text-xs font-bold uppercase flex items-center gap-1.5 ${URGENCY_LABELS[feedback.urgency].color}`}>
                <span className="h-2 w-2 rounded-full bg-current"></span>
                {URGENCY_LABELS[feedback.urgency].label}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Subject description details */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                Registrado em {formatTimestamp(feedback.createdAt)}
              </h4>
              <div className="bg-slate-50 rounded-sm p-5 border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
                {feedback.description}
              </div>
            </div>

            {/* Privacy Protection Indicator */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-sm border border-slate-200 text-xs text-slate-600">
              <ShieldCheck className="h-5 w-5 text-[#D4AF37] shrink-0" />
              <span>
                {feedback.isAnonymous ? (
                  <>Para sua total segurança, as diretivas <strong>WA-Shield</strong> ocultaram de forma irrevogável todas as credenciais deste envio.</>
                ) : (
                  <>Enviado de modo identificado por <strong>{feedback.collaboratorName}</strong> ({feedback.collaboratorEmail}). Legislação LGPD assegurada.</>
                )}
              </span>
            </div>

            {/* Official Admin Response Box */}
            <div className="pt-6 border-t border-slate-250">
              <h4 className="text-[10px] font-bold text-[#003366] uppercase tracking-widest mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#D4AF37]" />
                Resposta Oficial de Compliance / Diretoria
              </h4>

              {feedback.adminResponse ? (
                <div id="official-admin-response-box" className="p-5 border-l-4 border-[#D4AF37] bg-slate-50 rounded-r-sm space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-1 flex-wrap gap-2">
                    <span className="font-bold text-[#003366] uppercase tracking-wider">Avaliador de Conformidade Corporativa</span>
                    <span className="font-mono text-[11px]">Respondido em: {formatTimestamp(feedback.adminResponseAt)}</span>
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                    {feedback.adminResponse}
                  </p>
                </div>
              ) : (
                <div id="no-admin-response-block" className="bg-slate-50 text-slate-500 rounded-sm p-6 text-center text-xs space-y-1 border border-slate-200">
                  <p className="font-bold text-[#003366] uppercase tracking-wider text-xs">Análise Interna em Andamento</p>
                  <p className="max-w-md mx-auto text-slate-500 mt-1">
                    Esta ocorrência foi devidamente registrada e encontra-se sob triagem inicial da coordenação ética Wafort. Por favor, guarde este ID e consulte periodicamente para novidades.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="flex justify-center pt-2">
        <button
          id="query-back-to-home"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold uppercase text-xs tracking-wider rounded-sm transition cursor-pointer border border-slate-300"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao Início
        </button>
      </div>
    </div>
  );
}
