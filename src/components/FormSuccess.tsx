import React, { useState } from "react";
import { CheckCircle, Clipboard, ClipboardCheck, ArrowLeft, ShieldAlert } from "lucide-react";

interface FormSuccessProps {
  trackingCode: string;
  feedbackId: string;
  type: string;
  onBack: () => void;
}

export default function FormSuccess({ trackingCode, feedbackId, type, onBack }: FormSuccessProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(feedbackId);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div id="form-success-container" className="bg-white rounded-sm shadow-md border border-slate-200 overflow-hidden max-w-2xl mx-auto my-8">
      {/* Blue Header portion matching Geometric Balance */}
      <div className="bg-[#003366] text-white p-8 text-center relative border-b-4 border-[#D4AF37]">
        <div className="absolute right-4 top-4 text-[9px] uppercase tracking-widest text-[#D4AF37] font-mono font-bold">
          COMPLIANCE SECURE
        </div>
        <div className="inline-flex items-center justify-center bg-white/10 text-white p-3.5 rounded-sm mb-4 border border-white/15">
          <CheckCircle className="h-8 w-8 text-[#D4AF37]" />
        </div>
        <h2 className="text-2xl font-display font-black tracking-tight uppercase">
          Envio Concluido!
        </h2>
        <div className="h-1 w-16 bg-[#D4AF37] mx-auto my-3"></div>
        <p className="text-xs text-slate-300 uppercase tracking-widest font-semibold">
          Sua {type} foi enviada com sucesso ao Canal de Integridade
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-5 mb-6">
          <div className="flex gap-3">
            <ShieldAlert className="h-6 w-6 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-xs sm:text-sm uppercase tracking-wider">Aviso Crítico de Rastreabilidade</h3>
              <p className="text-xs text-amber-800 mt-1.5 leading-relaxed">
                Nós levamos sua privacidade a sério. Não registramos IPs, dispositivos ou dados pessoais. Para acompanhar a resposta corporativa, você <strong>DEVE guardar o ID Secreto abaixo</strong>. Ele é o único registro gerado e não pode ser recuperado em hipótese alguma!
              </p>
            </div>
          </div>
        </div>

        {/* Access Token Box */}
        <div className="bg-slate-50 rounded-sm p-6 border border-slate-200 text-center mb-6">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2">
            ID Secreto para Consulta
          </span>
          <div className="flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-sm py-3.5 px-4 shadow-sm max-w-md mx-auto">
            <code className="text-base sm:text-lg font-mono font-bold text-[#003366] select-all tracking-wider break-all">
              {feedbackId}
            </code>
            <button
              id="copy-tracking-id-btn"
              onClick={copyToClipboard}
              className="text-slate-500 hover:text-[#003366] p-2 hover:bg-slate-50 rounded-sm transition shrink-0 cursor-pointer"
              title="Copiar Código"
            >
              {copied ? (
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              ) : (
                <Clipboard className="h-5 w-5" />
              )}
            </button>
          </div>
          {copied && (
            <span className="text-xs text-emerald-600 font-bold block mt-2 animate-pulse">
              Código copiado com sucesso!
            </span>
          )}
          
          <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between text-[11px] text-slate-500 font-mono">
            <span>Protocolo Nominal: <strong>{trackingCode}</strong></span>
            <span>Wafort Integrity Protocol</span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Próximos passos recomendados:</h4>
          <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5 leading-relaxed">
            <li>Guarde ou anote este ID Secreto de 20 caracteres em um local seguro.</li>
            <li>Acesse a aba <strong>Acompanhar</strong> no menu superior e cole o código para consultar respostas.</li>
            <li>A diretoria da Wafort responderá sua postagem respeitando estritamente o sigilo e anonimato garantidos.</li>
          </ol>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
          <button
            id="back-to-home-btn"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#003366] hover:bg-slate-800 text-white font-bold uppercase text-xs tracking-widest rounded-sm transition cursor-pointer border border-transparent shadow"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Painel Principal
          </button>
        </div>
      </div>
    </div>
  );
}
