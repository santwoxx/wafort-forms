import React, { useState, useMemo } from "react";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { FeedbackType, UrgencyLevel, CATEGORIES, TYPE_LABELS } from "../types";
import { Shield, ShieldAlert, User, Mail, Send, CheckCircle2, AlertTriangle, MessageSquare } from "lucide-react";
import ModalPolicies from "./ModalPolicies";

interface CollaboratorFormProps {
  onSuccess: (trackingCode: string, feedbackId: string, typeLabel: string) => void;
}

export default function CollaboratorForm({ onSuccess }: CollaboratorFormProps) {
  const [type, setType] = useState<FeedbackType>(FeedbackType.SUGESTAO);
  const [category, setCategory] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [urgency, setUrgency] = useState<UrgencyLevel>(UrgencyLevel.MEDIA);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  
  // Policies Modal state
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [policiesTab, setPoliciesTab] = useState<"terms" | "privacy" | "compliance">("terms");
  
  // Custom identified collaborator info (only shown if isAnonymous === false)
  const [collaboratorName, setCollaboratorName] = useState<string>("");
  const [collaboratorEmail, setCollaboratorEmail] = useState<string>("");

  // Compliance terms check
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Filter categories according to the selected feedback type
  const filteredCategories = useMemo(() => {
    return CATEGORIES.filter((cat) => cat.type.includes(type));
  }, [type]);

  // Handle switching types
  const handleTypeChange = (newType: FeedbackType) => {
    setType(newType);
    setCategory("");
    if (newType === FeedbackType.DENUNCIA) {
      setIsAnonymous(true); // Complaints are anonymous by default
    }
  };

  const generateTrackingCode = () => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "WF-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate inputs
    if (!category) {
      setValidationError("Por favor, selecione uma categoria relacionada ao assunto.");
      return;
    }
    if (!subject.trim()) {
      setValidationError("Por favor, adicione um título ou assunto curto.");
      return;
    }
    if (!description.trim() || description.length < 10) {
      setValidationError("Por favor, descreva em detalhes a situação (mínimo de 10 caracteres).");
      return;
    }
    if (!isAnonymous) {
      if (!collaboratorName.trim()) {
        setValidationError("Como optou por se identificar, por favor preencha seu nome.");
        return;
      }
      if (!collaboratorEmail.trim() || !collaboratorEmail.includes("@")) {
        setValidationError("Por favor, informe um e-mail de contato válido.");
        return;
      }
    }
    if (!agreedToTerms) {
      setValidationError("Você precisa aceitar os termos de confiabilidade e compromisso com a verdade para enviar.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Generate unique 20-character unguessable Firestore doc ID
      const feedbackCollectionRef = collection(db, "feedbacks");
      const customDocRef = doc(feedbackCollectionRef);
      const trackingCode = generateTrackingCode();

      // 2. Format database payload
      const payload = {
        trackingCode,
        type,
        category,
        subject: subject.trim(),
        description: description.trim(),
        isAnonymous,
        collaboratorName: isAnonymous ? null : collaboratorName.trim(),
        collaboratorEmail: isAnonymous ? null : collaboratorEmail.trim(),
        status: "pendente",
        urgency,
        createdAt: serverTimestamp(),
        adminNotes: null,
        adminResponse: null,
        adminResponseAt: null,
        isRead: false,
      };

      // 3. Write securely to Firestore
      await setDoc(customDocRef, payload);

      // 4. Trigger success screen
      onSuccess(trackingCode, customDocRef.id, TYPE_LABELS[type].label);
    } catch (err) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.CREATE, "feedbacks");
      } catch (formattedErr: any) {
        setValidationError("Erro ao registrar no banco de dados. " + formattedErr.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="collaborator-form-root" className="bg-white rounded-sm border border-slate-205 shadow-md overflow-hidden max-w-4xl mx-auto flex flex-col md:flex-row">
      
      {/* Sidebar navigation portion integrated cleanly */}
      <aside className="w-full md:w-72 bg-slate-50 border-r border-slate-200 p-6 flex flex-col justify-between gap-6 shrink-0">
        <div className="space-y-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-3 font-black">Tipo de Manifestação</p>
            <nav id="type-tabs" className="flex flex-col sm:flex-row md:flex-col gap-2">
              {(Object.keys(TYPE_LABELS) as FeedbackType[]).map((tabType) => {
                const isSelected = type === tabType;
                const tabConfig = TYPE_LABELS[tabType];
                return (
                  <button
                    key={tabType}
                    id={`tab-${tabType}`}
                    type="button"
                    onClick={() => handleTypeChange(tabType)}
                    className={`flex-1 sm:flex-initial flex items-center justify-center md:justify-start gap-3 p-3 text-left text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer rounded-sm border sm:border md:border-0 ${
                      isSelected
                        ? "bg-blue-50 text-[#003366] border-[#D4AF37] md:border-l-4 md:border-[#D4AF37] shadow-sm font-extrabold"
                        : "bg-white sm:bg-white md:bg-transparent text-slate-500 border-slate-200 hover:text-[#003366] hover:bg-slate-100"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? "bg-[#D4AF37]" : "bg-slate-300"}`}></div>
                    <span>{tabConfig.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-black">Informações de Apoio</p>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "{TYPE_LABELS[type].desc}"
            </p>
          </div>
        </div>

        <div className="p-4 bg-[#003366]/5 rounded-sm border border-[#003366]/10 text-slate-700">
          <p className="text-xs leading-relaxed">
            Suas informações estão rigorosamente sob proteção do protocolo de integridade <strong className="text-[#003366]">WA-Shield</strong>.
          </p>
        </div>
      </aside>

      {/* Main Form Fields Container */}
      <section className="flex-1 p-6 sm:p-10 bg-white">
        
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-black text-[#003366] mb-2 italic">
            Registrar {TYPE_LABELS[type].label}
          </h2>
          <div className="h-1 w-20 bg-[#D4AF37]"></div>
          <p className="text-slate-500 mt-3 text-xs sm:text-sm">
            Preencha os dados abaixo de forma objetiva de acordo com nossa matriz de conformidade.
          </p>
        </div>

        <form id="submission-form" onSubmit={handleSubmit} className="space-y-6">
          
          {/* Validation Error Alert box */}
          {validationError && (
            <div id="form-error-alert" className="bg-red-50 border border-red-200 text-red-800 rounded-sm p-4 flex gap-3 text-sm animate-shake">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider text-xs">Erro de Validação</p>
                <p className="text-xs opacity-90 mt-0.5">{validationError}</p>
              </div>
            </div>
          )}

          {/* Privacy Choice (Identified vs Anonymous) block styled elegant geometric */}
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-sm ${isAnonymous ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' : 'bg-blue-50 text-[#003366] border border-blue-150'}`}>
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#003366] text-sm font-display uppercase tracking-wider">Identidade do Relator</h3>
                  <p className="text-[11px] text-slate-500">Escolha se deseja atuar de forma 100% anônima ou identificada.</p>
                </div>
              </div>
              
              {/* Split Toggle segmented button design aligned with theme geometry */}
              <div className="flex items-center bg-slate-200/50 p-1 rounded border border-slate-300/60 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAnonymous(true)}
                  className={`flex-1 sm:flex-initial px-4 py-2 text-center rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer min-h-[38px] ${
                    isAnonymous 
                      ? "bg-emerald-600 text-white shadow-sm font-black"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  Anônimo
                </button>
                <button
                  type="button"
                  disabled={type === FeedbackType.DENUNCIA}
                  onClick={() => setIsAnonymous(false)}
                  className={`flex-1 sm:flex-initial px-4 py-2 text-center rounded-sm text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer min-h-[38px] ${
                    !isAnonymous 
                      ? "bg-[#003366] text-white shadow-sm font-black"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  } ${type === FeedbackType.DENUNCIA ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  Identificado
                </button>
              </div>
            </div>

            {type === FeedbackType.DENUNCIA && (
              <div className="bg-amber-50 text-amber-900 text-[11px] sm:text-xs rounded-sm p-4 flex gap-3 border border-amber-200">
                <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Aviso Legado de Compliance:</strong> Sugestões e denúncias contra integridade empresarial, conduta de estoque ou logística são mantidas como estritamente anônimas para salvaguarda integral do colaborador.
                </span>
              </div>
            )}

            {/* If user decides to reveal identity */}
            {!isAnonymous && (
              <div id="identified-fields" className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Seu Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={collaboratorName}
                      onChange={(e) => setCollaboratorName(e.target.value)}
                      placeholder="Ex: Carlos Mendes"
                      className="w-full bg-white border border-slate-200 rounded-sm py-2.5 px-10 text-sm focus:outline-none focus:border-[#003366] transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">E-mail para Contato</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={collaboratorEmail}
                      onChange={(e) => setCollaboratorEmail(e.target.value)}
                      placeholder="Ex: carlos@wafort.com.br"
                      className="w-full bg-white border border-slate-200 rounded-sm py-2.5 px-10 text-sm focus:outline-none focus:border-[#003366] transition"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grid fields for Category & Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Categoria Temática</label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-[#003366] cursor-pointer"
              >
                <option value="">Selecione uma categoria...</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Nível de Urgência Estimado</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.keys(UrgencyLevel) as Array<keyof typeof UrgencyLevel>).map((levelKey) => {
                  const lvl = UrgencyLevel[levelKey];
                  const isSelected = urgency === lvl;
                  return (
                    <button
                      key={lvl}
                      id={`urgency-${lvl}`}
                      type="button"
                      onClick={() => setUrgency(lvl)}
                      className={`py-2.5 px-1 rounded-sm text-xs font-bold uppercase text-center border cursor-pointer block transition duration-150 ${
                        isSelected
                          ? "bg-[#003366] text-white border-[#003366] font-bold shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Subject / Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Assunto / Resumo Curto</label>
            <input
              id="subject-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Descreva em poucas palavras o assunto geral"
              maxLength={150}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-[#003366]"
            />
          </div>

          {/* Core Description Textarea */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Descrição Detalhada do Fato</label>
            <textarea
              id="description-textarea"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva com o máximo de detalhes possível, incluindo referências cronológicas se houver, locais ou setores implicados."
              maxLength={5000}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-[#003366] resize-none font-sans leading-relaxed"
            ></textarea>
            <div className="flex justify-between mt-1.5 text-[10px] text-slate-400 font-mono">
              <span>Importante: Seus dados estão criptografados</span>
              <span>{description.length}/5000 caract.</span>
            </div>
          </div>

          {/* Compliance Statement Checkbox */}
          <div className="bg-slate-50 rounded-sm p-4 border border-slate-200 text-slate-700">
            <div className="flex items-start gap-3">
              <input
                id="agreed-terms-chk"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 border-slate-300 rounded text-[#003366] focus:ring-[#003366] cursor-pointer animate-pulse"
              />
              <div className="text-xs text-slate-650 leading-relaxed select-none">
                <span>Declaro sob compromisso ético de legalidade que este relatório descreve fatos verdadeiros de conhecimento próprio. Estou de acordo com os </span>
                <button 
                  type="button" 
                  onClick={() => { setPoliciesTab("terms"); setPoliciesOpen(true); }}
                  className="text-[#003366] font-bold underline hover:text-[#D4AF37] cursor-pointer align-baseline"
                >
                  Termos de Uso
                </button>
                <span> e a </span>
                <button 
                  type="button" 
                  onClick={() => { setPoliciesTab("privacy"); setPoliciesOpen(true); }}
                  className="text-[#003366] font-bold underline hover:text-[#D4AF37] cursor-pointer align-baseline"
                >
                  Política de Privacidade
                </button>
                <span> da Wafort.</span>
              </div>
            </div>
          </div>

          {/* Submission and loading indicator control panel */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-slate-400">
              <CheckCircle2 className="h-4.5 w-4.5 text-[#D4AF37]" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Normativa Wafort-Shield v1.0</span>
            </div>

            <button
              id="submit-form-btn"
              type="submit"
              disabled={submitting}
              className={`bg-[#003366] text-white py-3.5 px-8 rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition shadow cursor-pointer flex items-center gap-2 ${
                submitting ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Transmitindo...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar à Administração</span>
                </>
              )}
            </button>
          </div>

        </form>
      </section>

      <ModalPolicies 
        isOpen={policiesOpen} 
        onClose={() => setPoliciesOpen(false)} 
        initialTab={policiesTab} 
      />
    </div>
  );
}
