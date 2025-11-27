import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BimesterPlanningResponse, QuestionType, LessonPlan, AssessmentConfig, GeneratedAssessment, MethodologyStrategy, CurriculumStandard } from '../types';
import { generateEducationalText, generateQuestionBank, generateSlideDeck, generateAssessment, generateRubric, regenerateLessonPlan } from '../services/geminiService';
import { Target, BrainCircuit, ChevronUp, ChevronDown, ClipboardList, BookOpenText, ListChecks, Loader2, CheckSquare, Eye, EyeOff, Puzzle, AlertCircle, Projector, X, SkipBack, SkipForward, FileCheck, Printer, Download, Book, Video, FileText, Quote, Maximize, Minimize, MonitorPlay, ChevronRight, ChevronLeft, Image as ImageIcon, HeartHandshake, Network, Table, Lightbulb } from 'lucide-react';

interface PedagogicalContentProps {
  planning: BimesterPlanningResponse;
  metadata?: { grade?: string; subject?: string; bimester?: string; curriculum?: CurriculumStandard };
  onUpdatePlan?: (updatedPlanning: BimesterPlanningResponse) => void;
}

// Slide Themes for visual variety
const SLIDE_THEMES: Record<string, { name: string, bg: string, accent: string, decoration: string }> = {
  'Indigo': { name: 'Indigo', bg: 'bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900', accent: 'text-indigo-300', decoration: 'bg-indigo-500' },
  'Emerald': { name: 'Emerald', bg: 'bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900', accent: 'text-emerald-300', decoration: 'bg-emerald-500' },
  'Violet': { name: 'Violet', bg: 'bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900', accent: 'text-violet-300', decoration: 'bg-violet-500' },
  'Amber': { name: 'Amber', bg: 'bg-gradient-to-br from-amber-900 via-orange-900 to-slate-900', accent: 'text-amber-300', decoration: 'bg-amber-500' },
  'Rose': { name: 'Rose', bg: 'bg-gradient-to-br from-rose-900 via-pink-900 to-slate-900', accent: 'text-rose-300', decoration: 'bg-rose-500' },
};

const FALLBACK_THEMES = Object.values(SLIDE_THEMES);

export const PedagogicalContent: React.FC<PedagogicalContentProps> = ({ planning, metadata, onUpdatePlan }) => {
  const [expandedIndices, setExpandedIndices] = useState<number[]>([0]);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [visibleAnswers, setVisibleAnswers] = useState<{ [key: string]: boolean }>({});
  
  // Media Viewer States
  const [activeMedia, setActiveMedia] = useState<{ type: 'SLIDE' | 'ASSESSMENT', planIndex: number } | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Assessment Configuration State
  const [showAssessmentModal, setShowAssessmentModal] = useState<number | null>(null);
  const [assessmentConfig, setAssessmentConfig] = useState<AssessmentConfig>({
     schoolName: "Escola 360",
     professorName: "",
     date: new Date().toLocaleDateString('pt-BR'),
     totalValue: 10,
     mcCount: 5,
     mcValue: 1,
     essayCount: 2,
     essayValue: 2.5
  });

  // Activity Type & Quantity Selection State
  const [activeActivityModal, setActiveActivityModal] = useState<number | null>(null);
  const [typeQuantities, setTypeQuantities] = useState<Record<QuestionType, number>>({
    [QuestionType.MULTIPLE_CHOICE]: 0,
    [QuestionType.ESSAY]: 0,
    [QuestionType.RESEARCH]: 0,
    [QuestionType.PLAYFUL]: 0,
  });

  const isLowerElementary = useMemo(() => {
    if (!metadata?.grade) return false;
    const lowerGrades = ['1º Ano', '2º Ano', '3º Ano', '4º Ano'];
    return lowerGrades.some(g => metadata.grade?.startsWith(g)) && metadata.grade.includes("Fundamental");
  }, [metadata?.grade]);

  // Handle Fullscreen toggle
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!slideContainerRef.current) return;
    if (!document.fullscreenElement) {
      slideContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const initializeQuantities = () => {
    if (isLowerElementary) {
      setTypeQuantities({
        [QuestionType.MULTIPLE_CHOICE]: 0, 
        [QuestionType.ESSAY]: 0,
        [QuestionType.RESEARCH]: 0,
        [QuestionType.PLAYFUL]: 2, 
      });
    } else {
      setTypeQuantities({
        [QuestionType.MULTIPLE_CHOICE]: 5,
        [QuestionType.ESSAY]: 0,
        [QuestionType.RESEARCH]: 0,
        [QuestionType.PLAYFUL]: 0,
      });
    }
  };

  const toggleAccordion = (index: number) => {
    setExpandedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleAnswerVisibility = (planIndex: number) => {
    setVisibleAnswers(prev => ({
      ...prev,
      [planIndex]: !prev[planIndex]
    }));
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  // --- Generation Handlers ---

  const handleMethodologyChange = async (index: number, newStrategy: MethodologyStrategy) => {
     if (!metadata?.grade || !metadata?.subject || !metadata?.curriculum) return;
     
     // Optimistic Update: Set strategy immediately so UI reflects choice
     updatePlan(index, { selectedStrategy: newStrategy });
     setGeneratingId(`regen-${index}`);

     try {
       const currentPlan = planning.plans[index];
       const updatedPlan = await regenerateLessonPlan(currentPlan, metadata.grade, metadata.subject, newStrategy, metadata.curriculum);
       updatePlan(index, updatedPlan);
     } catch(e) {
       alert("Erro ao regenerar plano com nova metodologia.");
     } finally {
       setGeneratingId(null);
     }
  };

  const handleGenerateText = async (index: number, topic: string) => {
    if (!metadata?.grade || !metadata?.subject) return;
    setGeneratingId(`text-${index}`);
    
    try {
      const text = await generateEducationalText(metadata.grade, metadata.subject, topic);
      updatePlan(index, { educationalText: text });
    } catch (e) {
      alert("Erro ao gerar texto.");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleGenerateQuestions = async (index: number, topic: string) => {
    if (!metadata?.grade || !metadata?.subject) return;
    const hasSelection = Object.values(typeQuantities).some((qty: number) => qty > 0);
    if (!hasSelection) return;

    setGeneratingId(`questions-${index}`);
    setActiveActivityModal(null);

    try {
      const questions = await generateQuestionBank(metadata.grade, metadata.subject, topic, typeQuantities);
      const currentQuestions = planning.plans[index].questionBank || [];
      updatePlan(index, { questionBank: [...currentQuestions, ...questions] });
    } catch (e) {
      alert("Erro ao gerar questões.");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleGenerateMedia = async (index: number, topic: string, type: 'SLIDE') => {
    if (!metadata?.grade) return;
    setGeneratingId(`${type}-${index}`);
    
    try {
      let result;
      let updateKey = '';

      if (type === 'SLIDE') {
        result = await generateSlideDeck(topic, metadata.grade, metadata.subject || '');
        updateKey = 'slideDeck';
      }

      if (result && updateKey) {
        updatePlan(index, { [updateKey]: result });
        setActiveMedia({ type, planIndex: index });
        if (type === 'SLIDE') setCurrentSlide(0);
      }
    } catch (e) {
      console.error(e);
      alert(`Erro ao gerar ${type}. Tente novamente.`);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleGenerateAssessment = async (index: number, topic: string) => {
     if (!metadata?.grade || !metadata?.subject || !metadata?.bimester) return;
     setShowAssessmentModal(null);
     setGeneratingId(`ASSESSMENT-${index}`);

     try {
        const assessment = await generateAssessment(
           metadata.grade,
           metadata.subject,
           topic,
           metadata.bimester,
           assessmentConfig
        );
        updatePlan(index, { generatedAssessment: assessment });
        setActiveMedia({ type: 'ASSESSMENT', planIndex: index });
     } catch (e) {
        console.error(e);
        alert("Erro ao gerar avaliação.");
     } finally {
        setGeneratingId(null);
     }
  };

  const handleGenerateRubric = async (index: number, topic: string, methodology: string) => {
    if (!metadata?.grade || !metadata?.subject) return;
    setGeneratingId(`RUBRIC-${index}`);
    
    try {
      const rubric = await generateRubric(metadata.grade, metadata.subject, topic, methodology);
      updatePlan(index, { rubric: rubric });
    } catch (e) {
      alert("Erro ao gerar rubrica.");
    } finally {
      setGeneratingId(null);
    }
  };

  const updatePlan = (index: number, updates: Partial<LessonPlan>) => {
    const updatedPlans = [...planning.plans];
    updatedPlans[index] = { ...updatedPlans[index], ...updates };
    if (onUpdatePlan) {
      onUpdatePlan({ ...planning, plans: updatedPlans });
    }
  };

  const handleAssessmentChange = (planIndex: number, qIdx: number, field: 'statement' | 'option', value: string, optIdx?: number) => {
      const updatedPlans = [...planning.plans];
      const assessment = updatedPlans[planIndex].generatedAssessment;
      if (!assessment) return;

      const updatedQuestions = [...assessment.questions];
      
      if (field === 'statement') {
          updatedQuestions[qIdx] = { ...updatedQuestions[qIdx], statement: value };
      } else if (field === 'option' && optIdx !== undefined) {
          const newOptions = [...(updatedQuestions[qIdx].options || [])];
          newOptions[optIdx] = value;
          updatedQuestions[qIdx] = { ...updatedQuestions[qIdx], options: newOptions };
      }

      updatedPlans[planIndex].generatedAssessment = { ...assessment, questions: updatedQuestions };
      
      if (onUpdatePlan) {
          onUpdatePlan({ ...planning, plans: updatedPlans });
      }
  };

  const updateQuantity = (type: QuestionType, value: number) => {
    const qty = Math.max(0, Math.min(20, value));
    setTypeQuantities(prev => ({ ...prev, [type]: qty }));
  };

  const openActivityModal = (index: number) => {
    if (activeActivityModal === index) {
      setActiveActivityModal(null);
    } else {
      initializeQuantities();
      setActiveActivityModal(index);
    }
  };

  const printAssessment = () => {
    window.print();
  };

  const getActiveMediaContent = () => {
    if (!activeMedia) return null;
    const plan = planning.plans[activeMedia.planIndex];
    
    if (activeMedia.type === 'SLIDE' && plan.slideDeck) {
      const slide = plan.slideDeck.slides[currentSlide];
      const themeName = plan.slideDeck.theme || 'Indigo';
      const theme = SLIDE_THEMES[themeName] || FALLBACK_THEMES[activeMedia.planIndex % FALLBACK_THEMES.length];
      const isCover = currentSlide === 0;

      return (
        <div ref={slideContainerRef} className="bg-black flex flex-col h-full w-full relative overflow-hidden select-none">
          <div className={`flex-grow relative ${theme.bg} text-white flex flex-col transition-all duration-500 ease-in-out`}>
            <div className={`absolute top-0 right-0 w-1/3 h-full ${theme.decoration} opacity-10 rounded-l-full blur-3xl transform translate-x-20`}></div>
            <div className={`absolute bottom-0 left-0 w-96 h-96 ${theme.decoration} opacity-10 rounded-full blur-3xl transform -translate-x-20 translate-y-20`}></div>

            <div className="flex-grow flex flex-col p-12 md:p-16 lg:p-20 relative z-10 h-full justify-center">
              {!isCover && (
                <div className="absolute top-8 left-12 right-12 flex justify-between items-center opacity-60">
                   <div className="text-sm uppercase tracking-widest font-bold">{metadata?.subject}</div>
                   <div className="text-sm font-mono">{new Date().toLocaleDateString()}</div>
                </div>
              )}

              {isCover ? (
                <div className="text-center">
                  <div className="inline-block mb-6 px-4 py-1 rounded-full border border-white/30 text-sm font-medium backdrop-blur-sm uppercase tracking-wide">
                     Aula de {metadata?.subject}
                  </div>
                  <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight drop-shadow-lg">
                     <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                       {slide.title}
                     </span>
                  </h2>
                  {metadata && (
                     <p className="mt-8 text-xl md:text-2xl text-slate-300 font-light max-w-2xl mx-auto">
                        {metadata.grade} • {metadata.bimester}
                     </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 h-full items-center">
                    <div className="lg:col-span-3 flex flex-col justify-center">
                        <h2 className="text-4xl md:text-5xl font-bold leading-tight drop-shadow-lg text-white mb-6">
                           {slide.title}
                        </h2>
                        <div className={`h-1.5 w-24 ${theme.decoration} mb-8 rounded-full`}></div>
                        
                        <div className="text-3xl md:text-4xl font-light text-slate-100 leading-normal shadow-black drop-shadow-md text-left">
                           {slide.content.split('\n').map((paragraph, i) => (
                               <p key={i} className="mb-6">{paragraph}</p>
                           ))}
                        </div>
                    </div>

                    <div className="hidden lg:flex lg:col-span-2 h-full max-h-[60vh] border-2 border-dashed border-white/20 rounded-2xl flex-col items-center justify-center bg-white/5 backdrop-blur-sm text-white/40">
                         <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                         <span className="text-lg font-medium uppercase tracking-widest">Espaço para Imagem</span>
                         <span className="text-xs opacity-60 mt-2">Cole sua mídia aqui</span>
                    </div>
                </div>
              )}
            </div>

            <div className="h-1.5 w-full bg-black/20 absolute bottom-0">
               <div 
                 className={`h-full ${theme.decoration} transition-all duration-500`} 
                 style={{ width: `${((currentSlide + 1) / plan.slideDeck.slides.length) * 100}%` }}
               ></div>
            </div>
          </div>
          
          <div className={`absolute bottom-0 left-0 right-0 p-6 z-50 flex justify-center transition-opacity duration-300 ${isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
             <div className="bg-slate-900/80 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-6 border border-white/10 shadow-2xl">
                <button 
                  onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                  disabled={currentSlide === 0}
                  className="p-2 rounded-full hover:bg-white/20 disabled:opacity-30 text-white transition-colors"
                  title="Anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                
                <span className="text-white font-mono text-sm">
                   {currentSlide + 1} / {plan.slideDeck.slides.length}
                </span>

                <button 
                  onClick={() => setCurrentSlide(prev => Math.min(plan.slideDeck!.slides.length - 1, prev + 1))}
                  disabled={currentSlide === plan.slideDeck.slides.length - 1}
                  className="p-2 rounded-full hover:bg-white/20 disabled:opacity-30 text-white transition-colors"
                  title="Próximo"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                <div className="w-px h-6 bg-white/20 mx-2"></div>

                <button onClick={toggleFullscreen} className="text-white/80 hover:text-white transition-colors" title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}>
                   {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </button>
                {!isFullscreen && (
                   <button onClick={() => setActiveMedia(null)} className="text-white/80 hover:text-white transition-colors" title="Fechar">
                      <X className="h-5 w-5" />
                   </button>
                )}
             </div>
          </div>
        </div>
      );
    }

    if (activeMedia.type === 'ASSESSMENT' && plan.generatedAssessment) {
       const assessment = plan.generatedAssessment;
       return (
          <div className="bg-white rounded-xl shadow-2xl h-[85vh] flex flex-col overflow-hidden relative">
             <div className="bg-slate-800 p-4 flex justify-between items-center print:hidden shrink-0">
                <h3 className="text-white font-bold flex items-center gap-2">
                   <FileCheck className="h-5 w-5" /> Visualização da Avaliação
                </h3>
                <div className="flex items-center gap-3">
                   <button onClick={printAssessment} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                      <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
                   </button>
                   <button onClick={() => setActiveMedia(null)} className="text-slate-400 hover:text-white">
                      <X className="h-6 w-6" />
                   </button>
                </div>
             </div>

             <div className="overflow-y-auto flex-grow bg-slate-100 p-8 print:p-0 print:bg-white print:overflow-visible">
                <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] p-[20mm] shadow-lg print:shadow-none print:w-full print:max-w-none print:mx-0 print:h-auto">
                   
                   <div className="border-2 border-slate-800 p-4 mb-8">
                      <div className="text-center font-bold text-xl uppercase mb-4 border-b border-slate-300 pb-2">
                         {assessment.header.schoolName}
                      </div>
                      <div className="grid grid-cols-1 gap-3 text-sm font-medium">
                         <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                            <span>Aluno(a): __________________________________________________________________</span>
                            <span>Nº: ______</span>
                         </div>
                         <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                            <span>Professor(a): {assessment.header.professorName}</span>
                            <span>Data: {assessment.header.date}</span>
                         </div>
                         <div className="flex justify-between">
                            <span>Componente: {assessment.subject}</span>
                            <span>Série: {assessment.grade}</span>
                            <span>Bimestre: {assessment.bimester}</span>
                            <span>Valor: {assessment.header.totalValue.toFixed(1)}</span>
                         </div>
                      </div>
                   </div>

                   <h1 className="text-center font-bold text-lg mb-8 uppercase">Avaliação de Aprendizagem - {assessment.topic}</h1>

                   <div className="space-y-8">
                      {assessment.questions.map((q, idx) => (
                         <div key={idx} className="break-inside-avoid">
                            <div className="flex items-start gap-1 mb-2">
                               <span className="font-bold pt-1">{idx + 1}.</span>
                               <div className="flex-grow">
                                  <textarea
                                      value={q.statement}
                                      onChange={(e) => handleAssessmentChange(activeMedia.planIndex, idx, 'statement', e.target.value)}
                                      className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 rounded px-2 py-1 resize-none overflow-hidden outline-none text-justify font-sans text-slate-900"
                                      rows={Math.max(2, Math.ceil(q.statement.length / 90))}
                                  />
                                  <div className="text-xs text-slate-400 mb-2 italic print:hidden ml-2">Habilidade: {q.bnccAlignment}</div>
                                </div>
                               <span className="text-sm font-bold text-slate-500 whitespace-nowrap ml-2 pt-1">
                                  ({q.type === QuestionType.MULTIPLE_CHOICE ? assessment.header.mcValue : assessment.header.essayValue} pts)
                               </span>
                            </div>

                            {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                               <div className="ml-6 space-y-1">
                                  {q.options.map((opt, oIdx) => (
                                     <div key={oIdx} className="flex items-start group">
                                        <span className="text-sm font-bold pt-1.5 w-8 shrink-0">({String.fromCharCode(65 + oIdx)})</span>
                                        <textarea
                                            value={opt.replace(/^([a-zA-Z0-9]+[).:-]|\([a-zA-Z0-9]+\))\s*/, '')} 
                                            onChange={(e) => handleAssessmentChange(activeMedia.planIndex, idx, 'option', e.target.value, oIdx)}
                                            className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 rounded px-2 py-1 resize-none overflow-hidden outline-none text-slate-900 text-sm"
                                            rows={Math.max(1, Math.ceil(opt.length / 80))}
                                        />
                                     </div>
                                  ))}
                               </div>
                            )}

                            {q.type === QuestionType.ESSAY && (
                               <div className="ml-6 mt-4 space-y-4">
                                  <div className="border-b border-slate-300 h-6"></div>
                                  <div className="border-b border-slate-300 h-6"></div>
                                  <div className="border-b border-slate-300 h-6"></div>
                                  <div className="border-b border-slate-300 h-6"></div>
                                  <div className="border-b border-slate-300 h-6"></div>
                               </div>
                            )}
                         </div>
                      ))}
                   </div>

                </div>
             </div>
          </div>
       );
    }

    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in print:p-0">
      {/* Overview Card */}
      <div className="bg-gradient-to-br from-indigo-800 to-indigo-900 rounded-xl shadow-lg p-8 text-white print:hidden">
        <h3 className="text-2xl font-bold mb-4">Visão Geral do Bimestre</h3>
        <p className="text-indigo-100 leading-relaxed text-lg opacity-90">{planning.overview}</p>
        {metadata && (
          <div className="mt-6 flex gap-4 text-base font-medium text-indigo-300 uppercase tracking-wider">
            <span>{metadata.grade}</span> • <span>{metadata.subject}</span> • <span>{metadata.bimester}</span>
          </div>
        )}
      </div>

      {/* Plans List */}
      <div className="space-y-6 print:hidden">
        <h3 className="text-2xl font-bold text-slate-800 px-2">Unidades Temáticas ({planning.plans.length})</h3>
        
        {planning.plans.map((plan, index) => {
          const isExpanded = expandedIndices.includes(index);
          const areAnswersVisible = visibleAnswers[index] || false;
          const isRegenerating = generatingId === `regen-${index}`;

          return (
            <div key={index} className={`bg-white rounded-xl shadow-md border transition-all duration-300 ${isExpanded ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-slate-200'} ${isRegenerating ? 'opacity-70 pointer-events-none' : ''}`}>
              
              {/* Accordion Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-transparent">
                  <button 
                    onClick={() => toggleAccordion(index)}
                    className="flex-grow flex items-center gap-4 text-left focus:outline-none"
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xl transition-colors ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold transition-colors ${isExpanded ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {plan.topic}
                      </h4>
                      <span className="text-base text-slate-500 block md:inline">
                        {plan.bncc_skills.length} Habilidades BNCC mapeadas
                      </span>
                    </div>
                  </button>

                  {/* Methodology Selector (Per Unit) */}
                  {isExpanded && (
                      <div className="mt-4 md:mt-0 md:ml-4 flex items-center gap-2 relative z-10">
                         <div className="relative">
                           <Lightbulb className="absolute left-3 top-2.5 h-4 w-4 text-amber-500" />
                           <select
                              value={plan.selectedStrategy || "Selecione"}
                              onChange={(e) => handleMethodologyChange(index, e.target.value as MethodologyStrategy)}
                              disabled={isRegenerating}
                              className="appearance-none bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-lg pl-10 pr-8 py-2 font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer hover:bg-amber-100 transition-colors shadow-sm"
                           >
                              <option disabled value="Selecione">Mudar Estratégia...</option>
                              {Object.values(MethodologyStrategy).map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                           </select>
                           <ChevronDown className="absolute right-3 top-3 h-3 w-3 text-amber-700 pointer-events-none" />
                         </div>
                         {isRegenerating && <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />}
                      </div>
                  )}

                  <button onClick={() => toggleAccordion(index)} className="ml-4 hidden md:block">
                     {isExpanded ? <ChevronUp className="text-indigo-500" /> : <ChevronDown className="text-slate-400" />}
                  </button>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="px-6 pb-8 border-t border-slate-100 animate-fade-in">
                  
                  {isRegenerating && (
                    <div className="py-8 text-center text-indigo-600 bg-indigo-50 rounded-lg mb-6 border border-indigo-100 animate-pulse">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="font-bold">A IA está reformulando esta aula com a metodologia: {plan.selectedStrategy}...</p>
                    </div>
                  )}

                  {/* Objectives & Skills */}
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                      <h5 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
                        <Target className="h-5 w-5 text-emerald-600" />
                        Objetivos de Aprendizagem
                      </h5>
                      <ul className="space-y-3">
                        {plan.objectives.map((obj, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-700 text-base">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                      <h5 className="text-lg font-semibold text-indigo-900 flex items-center gap-2 mb-4">
                        <BrainCircuit className="h-5 w-5 text-indigo-600" />
                        Habilidades BNCC
                      </h5>
                      <div className="space-y-3">
                        {plan.bncc_skills.map((skill, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                            <span className="inline-block bg-indigo-100 text-indigo-800 text-sm px-2 py-1 rounded font-bold mb-1">
                              {skill.code}
                            </span>
                            <p className="text-sm text-slate-700 leading-relaxed">{skill.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Inclusion & Neurodiversity - NEW */}
                  {plan.inclusion && (
                    <div className="mt-6 bg-pink-50 p-6 rounded-xl border border-pink-100">
                      <h5 className="text-lg font-semibold text-pink-900 flex items-center gap-2 mb-4">
                        <HeartHandshake className="h-5 w-5 text-pink-600" />
                        Inclusão & Neurodiversidade (DUA)
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-pink-100">
                           <strong className="text-pink-700 block mb-1 text-sm">Geral</strong>
                           <p className="text-slate-600 text-sm">{plan.inclusion.general}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-pink-100">
                           <strong className="text-pink-700 block mb-1 text-sm">TDAH</strong>
                           <p className="text-slate-600 text-sm">{plan.inclusion.adhd}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-pink-100">
                           <strong className="text-pink-700 block mb-1 text-sm">Autismo (TEA)</strong>
                           <p className="text-slate-600 text-sm">{plan.inclusion.autism}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-pink-100">
                           <strong className="text-pink-700 block mb-1 text-sm">Altas Habilidades</strong>
                           <p className="text-slate-600 text-sm">{plan.inclusion.high_abilities}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interdisciplinary - NEW */}
                  {plan.interdisciplinary && plan.interdisciplinary.length > 0 && (
                     <div className="mt-6 bg-teal-50 p-6 rounded-xl border border-teal-100">
                        <h5 className="text-lg font-semibold text-teal-900 flex items-center gap-2 mb-4">
                           <Network className="h-5 w-5 text-teal-600" />
                           Conexões Interdisciplinares (STEAM)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           {plan.interdisciplinary.map((conn, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-lg border border-teal-100">
                                 <strong className="text-teal-700 block mb-1 text-sm">{conn.subject}</strong>
                                 <p className="text-slate-600 text-sm">{conn.description}</p>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Content & Methodology */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-lg font-semibold text-slate-800 mb-2">Resumo do Conteúdo</h5>
                      <p className="text-slate-600 text-base leading-relaxed bg-white p-5 rounded-lg border border-slate-200">
                        {plan.content_summary}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-lg font-semibold text-slate-800 mb-2">Estratégia Metodológica</h5>
                      <p className="text-slate-600 text-base leading-relaxed bg-white p-5 rounded-lg border border-slate-200">
                        {plan.methodology}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Resources Section */}
                  <div className="mt-8 border-t border-slate-100 pt-6">
                     <h5 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        <BrainCircuit className="h-6 w-6" />
                        Recursos Didáticos & Atividades
                     </h5>
                     
                     {/* Toolbar */}
                     <div className="flex flex-wrap gap-3 mb-6 items-start">
                        {/* Text Generation */}
                        {!plan.educationalText ? (
                           <button 
                              onClick={() => handleGenerateText(index, plan.topic)}
                              disabled={!!generatingId}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-base font-medium disabled:opacity-50"
                           >
                              {generatingId === `text-${index}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpenText className="h-4 w-4" />}
                              Gerar Texto Didático
                           </button>
                        ) : (
                           <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-base font-medium">
                              <CheckSquare className="h-5 w-5" /> Texto Gerado
                           </div>
                        )}

                        {/* Questions Generation */}
                        <div className="relative">
                           <button 
                              onClick={() => openActivityModal(index)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-medium"
                           >
                              <ListChecks className="h-4 w-4" />
                              Criar Atividades
                           </button>

                           {/* Type & Quantity Selector Modal */}
                           {activeActivityModal === index && (
                              <div className="absolute top-full mt-2 left-0 z-10 bg-white p-4 rounded-lg shadow-xl border border-slate-200 w-80 animate-fade-in">
                                 <h6 className="text-sm font-bold text-slate-500 uppercase mb-3">Selecione tipos e quantidades:</h6>
                                 <div className="space-y-3 mb-4">
                                    {isLowerElementary ? (
                                        <div className="flex items-center justify-between">
                                          <label className="flex items-center gap-2 text-base text-slate-700">
                                             <Puzzle className="h-4 w-4 text-orange-500" /> Atividade Lúdica
                                          </label>
                                          <input type="number" min="0" max="20" value={typeQuantities[QuestionType.PLAYFUL]} onChange={(e) => updateQuantity(QuestionType.PLAYFUL, parseInt(e.target.value) || 0)} className="w-16 border border-slate-300 bg-slate-100 rounded p-1 text-center text-base font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                           <label className="flex items-center gap-2 text-base text-slate-700">Múltipla Escolha</label>
                                           <input type="number" min="0" max="20" value={typeQuantities[QuestionType.MULTIPLE_CHOICE]} onChange={(e) => updateQuantity(QuestionType.MULTIPLE_CHOICE, parseInt(e.target.value) || 0)} className="w-16 border border-slate-300 bg-slate-100 rounded p-1 text-center text-base font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                       <label className="flex items-center gap-2 text-base text-slate-700">Dissertativa</label>
                                       <input type="number" min="0" max="20" value={typeQuantities[QuestionType.ESSAY]} onChange={(e) => updateQuantity(QuestionType.ESSAY, parseInt(e.target.value) || 0)} className="w-16 border border-slate-300 bg-slate-100 rounded p-1 text-center text-base font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                       <label className="flex items-center gap-2 text-base text-slate-700">Pesquisa</label>
                                       <input type="number" min="0" max="20" value={typeQuantities[QuestionType.RESEARCH]} onChange={(e) => updateQuantity(QuestionType.RESEARCH, parseInt(e.target.value) || 0)} className="w-16 border border-slate-300 bg-slate-100 rounded p-1 text-center text-base font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                    </div>
                                 </div>
                                 <button onClick={() => handleGenerateQuestions(index, plan.topic)} disabled={generatingId === `questions-${index}` || !Object.values(typeQuantities).some((q: number) => q > 0)} className="w-full py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                                    {generatingId === `questions-${index}` ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Gerar Agora"}
                                 </button>
                              </div>
                           )}
                        </div>

                        {/* Assessment Generation Button */}
                        <div className="relative">
                           <button 
                             onClick={() => plan.generatedAssessment ? setActiveMedia({ type: 'ASSESSMENT', planIndex: index }) : setShowAssessmentModal(index)}
                             className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-base font-medium ${plan.generatedAssessment ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                           >
                             <FileCheck className="h-4 w-4" />
                             {plan.generatedAssessment ? 'Ver Avaliação' : 'Gerar Avaliação'}
                           </button>

                           {/* Assessment Config Modal */}
                           {showAssessmentModal === index && !plan.generatedAssessment && (
                             <div className="absolute top-full mt-2 left-0 z-20 bg-white p-5 rounded-lg shadow-xl border border-slate-200 w-96 animate-fade-in">
                               <div className="flex justify-between items-center mb-4">
                                  <h6 className="text-sm font-bold text-slate-700 uppercase">Configurar Avaliação</h6>
                                  <button onClick={() => setShowAssessmentModal(null)}><X className="h-4 w-4 text-slate-400" /></button>
                               </div>
                               
                               <div className="space-y-3 mb-4">
                                  <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nome do Colégio</label>
                                    <input 
                                      type="text" 
                                      value={assessmentConfig.schoolName} 
                                      onChange={e => setAssessmentConfig({...assessmentConfig, schoolName: e.target.value})} 
                                      className="w-full border border-slate-300 rounded p-1.5 text-sm bg-slate-100 font-bold text-slate-900" 
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1">Nome Professor</label>
                                      <input 
                                        type="text" 
                                        value={assessmentConfig.professorName} 
                                        onChange={e => setAssessmentConfig({...assessmentConfig, professorName: e.target.value})} 
                                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-slate-100 font-bold text-slate-900" 
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1">Data</label>
                                      <input 
                                        type="text" 
                                        value={assessmentConfig.date} 
                                        onChange={e => setAssessmentConfig({...assessmentConfig, date: e.target.value})} 
                                        className="w-full border border-slate-300 rounded p-1.5 text-sm bg-slate-100 font-bold text-slate-900" 
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Valor Total</label>
                                    <input 
                                      type="number" 
                                      value={assessmentConfig.totalValue} 
                                      onChange={e => setAssessmentConfig({...assessmentConfig, totalValue: Number(e.target.value)})} 
                                      className="w-full border border-slate-300 rounded p-1.5 text-sm bg-slate-100 font-bold text-slate-900" 
                                    />
                                  </div>
                                  
                                  <div className="bg-slate-50 p-2 rounded border border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs font-bold text-slate-700">Qtd. Múltipla Escolha</label>
                                      <input 
                                        type="number" 
                                        value={assessmentConfig.mcCount} 
                                        onChange={e => setAssessmentConfig({...assessmentConfig, mcCount: Number(e.target.value)})} 
                                        className="w-12 border border-slate-300 rounded p-1 text-center text-sm bg-slate-100 font-bold text-slate-900" 
                                      />
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs text-slate-500">Valor cada (pts)</label>
                                      <input 
                                        type="number" 
                                        step="0.1" 
                                        value={assessmentConfig.mcValue} 
                                        onChange={e => setAssessmentConfig({...assessmentConfig, mcValue: Number(e.target.value)})} 
                                        className="w-12 border border-slate-300 rounded p-1 text-center text-xs bg-slate-100 font-bold text-slate-900" 
                                      />
                                    </div>
                                  </div>

                                  <div className="bg-slate-50 p-2 rounded border border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs font-bold text-slate-700">Qtd. Dissertativas</label>
                                      <input 
                                        type="number" 
                                        value={assessmentConfig.essayCount} 
                                        onChange={e => setAssessmentConfig({...assessmentConfig, essayCount: Number(e.target.value)})} 
                                        className="w-12 border border-slate-300 rounded p-1 text-center text-sm bg-slate-100 font-bold text-slate-900" 
                                      />
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs text-slate-500">Valor cada (pts)</label>
                                      <input 
                                        type="number" 
                                        step="0.1" 
                                        value={assessmentConfig.essayValue} 
                                        onChange={e => setAssessmentConfig({...assessmentConfig, essayValue: Number(e.target.value)})} 
                                        className="w-12 border border-slate-300 rounded p-1 text-center text-xs bg-slate-100 font-bold text-slate-900" 
                                      />
                                    </div>
                                  </div>
                               </div>

                               <button 
                                 onClick={() => handleGenerateAssessment(index, plan.topic)} 
                                 disabled={generatingId === `ASSESSMENT-${index}`}
                                 className="w-full py-2 bg-purple-600 text-white rounded text-sm font-bold hover:bg-purple-700 disabled:opacity-50"
                               >
                                  {generatingId === `ASSESSMENT-${index}` ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Gerar Prova Agora"}
                               </button>
                             </div>
                           )}
                        </div>

                        {/* Rubric Generator - NEW */}
                        <button 
                           onClick={() => handleGenerateRubric(index, plan.topic, plan.methodology)}
                           disabled={!!generatingId}
                           className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-base font-medium disabled:opacity-50 border ${plan.rubric ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                        >
                           {generatingId === `RUBRIC-${index}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Table className="h-4 w-4" />}
                           {plan.rubric ? 'Ver Rúbrica' : 'Gerar Rúbrica'}
                        </button>

                        {/* === New Media Buttons (SLIDES ONLY) === */}
                        <div className="h-8 w-px bg-slate-300 mx-2 hidden md:block"></div>

                        <button 
                          onClick={() => plan.slideDeck ? setActiveMedia({type: 'SLIDE', planIndex: index}) : handleGenerateMedia(index, plan.topic, 'SLIDE')}
                          disabled={!!generatingId && generatingId !== `SLIDE-${index}`}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-base font-medium disabled:opacity-50 border ${plan.slideDeck ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                        >
                           {generatingId === `SLIDE-${index}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Projector className="h-4 w-4" />}
                           {plan.slideDeck ? 'Ver Slides' : 'Gerar Slides'}
                        </button>
                     </div>

                     {/* Display Generated Rubric - NEW */}
                     {plan.rubric && (
                       <div className="bg-white rounded-xl shadow-sm border border-cyan-200 overflow-hidden mb-8 animate-fade-in">
                          <div className="bg-cyan-50 p-4 border-b border-cyan-100">
                             <h4 className="font-bold text-cyan-900 flex items-center gap-2">
                                <Table className="h-5 w-5" />
                                Rúbrica de Avaliação: {plan.rubric.title}
                             </h4>
                          </div>
                          <div className="p-4 overflow-x-auto">
                             <table className="w-full text-sm border-collapse">
                                <thead>
                                   <tr>
                                      <th className="p-3 text-left bg-slate-50 border border-slate-200 font-bold text-slate-700">Critério</th>
                                      {plan.rubric.criteria[0]?.levels.map((lvl, i) => (
                                         <th key={i} className="p-3 text-left bg-slate-50 border border-slate-200 font-bold text-slate-700">{lvl.levelName}</th>
                                      ))}
                                   </tr>
                                </thead>
                                <tbody>
                                   {plan.rubric.criteria.map((crit, idx) => (
                                      <tr key={idx}>
                                         <td className="p-3 border border-slate-200 font-bold text-slate-800 bg-slate-50/50">{crit.name}</td>
                                         {crit.levels.map((lvl, lvlIdx) => (
                                            <td key={lvlIdx} className="p-3 border border-slate-200 text-slate-600 align-top">
                                               {lvl.description}
                                            </td>
                                         ))}
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                       </div>
                     )}

                     {/* Display Generated Text (TEXTBOOK FORMAT) */}
                     {plan.educationalText && (
                        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-8 animate-fade-in max-w-4xl mx-auto relative">
                           {/* Book Spine Effect */}
                           <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600"></div>
                           
                           <div className="p-8 md:p-12">
                             {/* Header */}
                             <div className="border-b-2 border-indigo-100 pb-6 mb-8">
                                <h4 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4 tracking-tight">
                                   {plan.educationalText.title}
                                </h4>
                                <div className="text-lg text-slate-600 font-serif leading-relaxed italic">
                                   {renderFormattedText(plan.educationalText.introduction)}
                                </div>
                             </div>

                             <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* Main Content Column */}
                                <div className="lg:col-span-8 space-y-10">
                                   {plan.educationalText.sections?.map((section, idx) => (
                                     <div key={idx}>
                                        <h3 className="text-xl font-bold text-indigo-900 mb-3 font-serif flex items-center gap-3">
                                           <span className="text-indigo-300 text-sm">0{idx + 1}</span>
                                           {section.subtitle}
                                        </h3>
                                        <div className="prose prose-slate prose-lg text-justify text-slate-700 leading-8">
                                           {renderFormattedText(section.content)}
                                        </div>
                                     </div>
                                   ))}

                                   {/* Recommendations Section */}
                                   {plan.educationalText.recommendations && (
                                     <div className="mt-12 pt-8 border-t border-slate-100">
                                        <h5 className="flex items-center gap-2 font-bold text-indigo-900 mb-6 uppercase tracking-wider text-sm">
                                           <BookOpenText className="h-4 w-4" /> Saiba Mais
                                        </h5>
                                        <div className="grid grid-cols-1 gap-4">
                                           {plan.educationalText.recommendations.map((rec, i) => (
                                              <div key={i} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                                                 <div className="mt-1 text-indigo-500 shrink-0">
                                                    {rec.type === 'VIDEO' ? <Video className="h-5 w-5" /> : 
                                                     rec.type === 'BOOK' ? <Book className="h-5 w-5" /> : 
                                                     <FileText className="h-5 w-5" />}
                                                 </div>
                                                 <div>
                                                    <h6 className="font-bold text-slate-900">{rec.title}</h6>
                                                    <p className="text-sm text-slate-500 italic mb-1">{rec.authorOrSource}</p>
                                                    <p className="text-sm text-slate-600">{rec.description}</p>
                                                 </div>
                                              </div>
                                           ))}
                                        </div>
                                     </div>
                                   )}
                                </div>

                                {/* Sidebar Column (Glossary) */}
                                <div className="lg:col-span-4 space-y-8">
                                   {plan.educationalText.glossary && plan.educationalText.glossary.length > 0 && (
                                      <div className="bg-amber-50 rounded-lg p-6 border-l-4 border-amber-300 sticky top-6">
                                         <h5 className="font-serif font-bold text-amber-900 text-lg mb-4 flex items-center gap-2">
                                            <Quote className="h-4 w-4" /> Glossário
                                         </h5>
                                         <dl className="space-y-4">
                                            {plan.educationalText.glossary.map((item, i) => (
                                               <div key={i}>
                                                  <dt className="font-bold text-amber-900 text-sm">{item.term}</dt>
                                                  <dd className="text-sm text-amber-800/80 leading-snug mt-1">{item.definition}</dd>
                                               </div>
                                            ))}
                                         </dl>
                                      </div>
                                   )}
                                </div>
                             </div>

                             {/* Footer References */}
                             {plan.educationalText.references && (
                               <div className="mt-16 pt-8 border-t border-slate-200">
                                  <h6 className="text-xs font-bold text-slate-400 uppercase mb-2">Referências Bibliográficas</h6>
                                  <ul className="space-y-1">
                                     {plan.educationalText.references.map((ref, i) => (
                                        <li key={i} className="text-xs text-slate-500 font-mono">{ref}</li>
                                     ))}
                                  </ul>
                               </div>
                             )}
                           </div>
                        </div>
                     )}

                     {/* Display Generated Questions */}
                     {plan.questionBank && plan.questionBank.length > 0 && (
                        <div className="space-y-4 animate-fade-in mb-6">
                           <div className="flex justify-between items-center">
                             <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ListChecks className="h-6 w-6 text-blue-600" />
                                Banco de Questões ({plan.questionBank.length})
                             </h4>
                             <button
                               onClick={() => toggleAnswerVisibility(index)}
                               className="flex items-center gap-2 text-base text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                             >
                               {areAnswersVisible ? <><EyeOff className="h-5 w-5" /> Ocultar Gabarito</> : <><Eye className="h-5 w-5" /> Ver Gabarito</>}
                             </button>
                           </div>

                           <div className="grid grid-cols-1 gap-6">
                              {plan.questionBank.map((q, qIdx) => (
                                 <div key={qIdx} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                       <span className={`text-sm font-bold px-2 py-1 rounded uppercase flex items-center gap-1 ${q.type === QuestionType.PLAYFUL ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                                          {q.type === QuestionType.PLAYFUL && <Puzzle className="h-4 w-4" />}
                                          {q.type}
                                       </span>
                                       <span className="text-sm text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">BNCC: {q.bnccAlignment}</span>
                                    </div>
                                    <p className="text-lg font-medium text-slate-800 mb-4 whitespace-pre-wrap">{qIdx + 1}. {q.statement}</p>
                                    
                                    {q.type === QuestionType.MULTIPLE_CHOICE && q.options && (
                                       <div className="space-y-2 ml-2 mb-4">
                                          {q.options.map((opt, oIdx) => (
                                             <div key={oIdx} className="flex items-start gap-2 text-base text-slate-600">
                                                <span className="font-mono text-slate-400 font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                                                <span>{opt.replace(/^([a-zA-Z0-9]+[).:-]|\([a-zA-Z0-9]+\))\s*/, '')}</span>
                                             </div>
                                          ))}
                                       </div>
                                    )}

                                    {areAnswersVisible && (
                                        <div className="space-y-3 mt-4 animate-fade-in border-t border-slate-100 pt-3">
                                          <div className="bg-yellow-50 p-4 rounded text-base text-yellow-800 border border-yellow-200">
                                              <strong className="block mb-2 text-yellow-900">{q.type === QuestionType.PLAYFUL ? "Diretrizes / Objetivo:" : "Gabarito:"}</strong> 
                                              {q.correctAnswer || q.answerKey}
                                          </div>
                                          {q.type === QuestionType.MULTIPLE_CHOICE && q.justification && (
                                            <div className="bg-blue-50 p-4 rounded text-base text-blue-800 border border-blue-200 flex items-start gap-3">
                                               <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                               <div><strong className="block mb-2 text-blue-900">Justificativa:</strong>{q.justification}</div>
                                            </div>
                                          )}
                                        </div>
                                    )}
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Assessments Section */}
                  <div className="mt-8 bg-slate-800 text-slate-100 rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-slate-700 flex items-center gap-2">
                      <ClipboardList className="h-6 w-6 text-indigo-400" />
                      <h5 className="font-bold text-base">Avaliação</h5>
                    </div>
                    <div className="p-5 grid grid-cols-1 gap-5">
                      {plan.assessments.map((assess, idx) => (
                        <div key={idx} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                          <h6 className="font-bold text-indigo-300 text-base mb-2">{assess.title}</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <span className="text-xs uppercase tracking-wide text-slate-400 font-bold">Metodologia</span>
                              <p className="text-slate-300 text-sm mt-1">{assess.methodology}</p>
                            </div>
                            <div>
                              <span className="text-xs uppercase tracking-wide text-slate-400 font-bold">Critérios</span>
                              <p className="text-slate-300 text-sm mt-1">{assess.criteria}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Media Overlay Modal - For Slides and Assessments */}
      {activeMedia && (
         <div className={`fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm animate-fade-in ${activeMedia.type === 'ASSESSMENT' ? 'bg-white/100 md:bg-black/80' : ''} ${isFullscreen ? 'p-0 bg-black' : ''}`}>
             <div className={`relative w-full ${activeMedia.type === 'SLIDE' ? (isFullscreen ? 'h-full w-full max-w-none' : 'max-w-6xl aspect-video') : 'max-w-4xl max-h-[100vh] md:max-h-[90vh]'}`}>
                {activeMedia.type === 'SLIDE' && !isFullscreen && (
                  <button 
                    onClick={() => setActiveMedia(null)}
                    className="absolute -top-10 right-0 text-white hover:text-slate-300 flex items-center gap-2 font-medium z-50"
                  >
                    Fechar <X className="h-6 w-6" />
                  </button>
                )}
                {getActiveMediaContent()}
             </div>
         </div>
      )}
    </div>
  );
};