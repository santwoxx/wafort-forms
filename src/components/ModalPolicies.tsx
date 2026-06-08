import React, { useState } from "react";
import { Shield, Lock, FileText, Scale, X, Clock, AlertTriangle } from "lucide-react";

interface ModalPoliciesProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "terms" | "privacy" | "compliance";
}

export default function ModalPolicies({ isOpen, onClose, initialTab = "terms" }: ModalPoliciesProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "compliance">(initialTab);

  if (!isOpen) return null;

  return (
    <div id="policies-modal-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="policies-modal-content" 
        className="bg-white rounded-sm border border-slate-200 w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn"
      >
        {/* Header with Wafort Branding */}
        <div className="bg-[#003366] text-white px-6 py-4 flex items-center justify-between border-b-4 border-[#D4AF37]">
          <div className="flex items-center gap-3">
            <Scale className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <h3 className="font-display font-black text-sm uppercase tracking-wider">Wafort Compliance</h3>
              <p className="text-[10px] text-slate-300 font-mono uppercase tracking-widest leading-none">Políticas e Diretrizes Legais</p>
            </div>
          </div>
          <button 
            id="close-policies-modal-btn"
            onClick={onClose} 
            className="text-white/80 hover:text-white transition p-1 hover:bg-white/10 rounded cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div id="policies-tabs" className="border-b border-slate-200 bg-slate-50 flex">
          <button
            id="tab-terms-btn"
            onClick={() => setActiveTab("terms")}
            className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "terms"
                ? "border-[#003366] text-[#003366] bg-white font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <FileText className="h-4 w-4" />
            Termos de Uso
          </button>
          <button
            id="tab-privacy-btn"
            onClick={() => setActiveTab("privacy")}
            className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "privacy"
                ? "border-[#003366] text-[#003366] bg-white font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <Lock className="h-4 w-4" />
            Privacidade e LGPD
          </button>
          <button
            id="tab-compliance-btn"
            onClick={() => setActiveTab("compliance")}
            className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "compliance"
                ? "border-[#003366] text-[#003366] bg-white font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            <Shield className="h-4 w-4" />
            Compliance Wafort
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-grow p-6 overflow-y-auto text-sm text-slate-700 space-y-4 leading-relaxed font-sans scrollbar-thin scrollbar-thumb-slate-200">
          
          {activeTab === "terms" && (
            <div id="terms-content" className="space-y-4">
              <div className="flex items-center gap-2 text-[#003366] font-display font-black uppercase text-xs tracking-wider mb-2">
                <Clock className="h-4 w-4 text-[#D4AF37]" />
                Última atualização: Junho de 2026
              </div>
              <h4 className="text-[#003366] font-bold text-base border-b border-slate-100 pb-1">1. Termos de Aceite e Uso Responsável</h4>
              <p>
                Ao utilizar o Canal Integrado de Integridade e Ouvidoria Wafort, o relator está ciente e concorda expressamente em guiar-se pelos princípios da boa-fé, da ética corporativa e do compromisso com a verdade factual.
              </p>
              
              <h4 className="text-[#003366] font-bold text-base border-b border-slate-100 pb-1">2. Idoneidade dos Relatos</h4>
              <p>
                Este canal destina-se estritamente ao aprimoramento de processos, envio de sugestões legítimas e denúncia de desvios de conduta moral, ética, legal, ou desvios de integridade patrimonial na Wafort Logística e Transportes.
              </p>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm flex gap-3 text-amber-900 text-xs my-3">
                <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0" />
                <span>
                  <strong>IMPORTANTE:</strong> O registro voluntário e proposital de denúncias falsas, mentirosas ou com o fito de caluniar outrem configura infração disciplinar gravíssima e está sujeito às sanções civis e criminais cabíveis de acordo com o Código Penal Brasileiro (ex: art. 339 - Denunciação Caluniosa).
                </span>
              </div>

              <h4 className="text-[#003366] font-bold text-base border-b border-slate-100 pb-1">3. Código de Rastreabilidade e Sigilo</h4>
              <p>
                Após a submissão, um código de rastreabilidade alfanumérico intransferível (ex: <code>WF-XXXXXX</code>) será gerado. Este código é a única via para acompanhamento do progresso das providências. A Wafort não possui meios de recuperar este código no caso de denúncias estritamente anônimas, visando a segurança absoluta do relator.
              </p>
            </div>
          )}

          {activeTab === "privacy" && (
            <div id="privacy-content" className="space-y-4">
              <div className="flex items-center gap-2 text-[#003366] font-display font-black uppercase text-xs tracking-wider mb-2">
                <Lock className="h-4 w-4 text-[#D4AF37]" />
                Conformidade LGPD (Lei nº 13.709/2018)
              </div>
              <h4 className="text-[#003366] font-bold text-base border-b border-slate-100 pb-1">1. Política de Anonimato Estrito</h4>
              <p>
                Para relatos efetuados de forma anônima, nosso sistema de banco de dados <strong>impede a captura</strong> do endereço IP do dispositivo originador, localização precisa, metadados persistentes de computadores ou dados de e-mail. A única informação de autoria registrada é o próprio texto enviado livremente no formulário.
              </p>

              <h4 className="text-[#003366] font-bold text-base border-b border-slate-100 pb-1">2. Consentimento e Tratamento de Dados</h4>
              <p>
                Para relatos identificados, o relator consente livre e expressamente com o tratamento dos dados pessoais inseridos (Nome Completo, E-mail) pela equipe de conformidade de canais internos da Wafort. Os dados serão guardados temporariamente enquanto durar o processo investigativo ou a análise processual de governança.
              </p>

              <h4 className="text-[#003366] font-bold text-base border-b border-slate-100 pb-1">3. Direitos de Titularidade</h4>
              <p>
                Nos termos da Lei Geral de Proteção de Dados (LGPD), o relator que se identificou tem pleno direito de solicitar a retificação, limitação ou exclusão de seus dados de identificação do canal de ouvidoria, mediante requisição direta à mesa de compliance, sem prejuízo fiscal ou de imagem corporativa.
              </p>
            </div>
          )}

          {activeTab === "compliance" && (
            <div id="compliance-content" className="space-y-4">
              <h4 className="text-[#003366] font-bold text-base border-b border-slate-100 pb-1">1. Comitê de Auditoria e Ética da Wafort</h4>
              <p>
                Todos os relatórios submetidos são catalogados sob o protocolo criptográfico <strong>WA-Shield</strong>. O acesso administrativo é restrito ao comitê executivo de integridade, controlado de forma rigorosa sob mecanismos de autenticação de duplo fator.
              </p>

              <h4 className="text-[#003366] font-bold text-base border-b border-slate-100 pb-1">2. Política de Não Retaliação</h4>
              <p>
                A Wafort assegura proteção integral a relatos éticos efetuados sob boa-fé. É expressamente vedada por nossa governança qualquer conduta retaliatória direta ou indireta contra colaboradores, auditores ou terceirizados decorrente do uso regular deste canal.
              </p>

              <h4 className="text-[#003366] font-bold text-base border-b border-slate-100 pb-1">3. Prazos Regimentais de Resposta</h4>
              <p>
                O comitê envidará os melhores esforços para triagem inicial em até 05 (cinco) dias úteis. Feedbacks conclusivos ou posicionamento institucional sobre os relatos serão disponibilizados no painel de acompanhamento em até 15 (quinze) dias corridos, prorrogáveis em função da complexidade investigativa.
              </p>
            </div>
          )}

        </div>

        {/* Footer actions of the modal */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 rounded-b-sm">
          <button
            id="policies-confirm-btn"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#003366] hover:bg-slate-800 text-[#D4AF37] font-bold uppercase tracking-wider text-xs rounded-sm transition cursor-pointer"
          >
            Entendido e De Acordo
          </button>
        </div>
      </div>
    </div>
  );
}
