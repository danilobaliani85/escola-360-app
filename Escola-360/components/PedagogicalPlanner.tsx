import React, { useState, useMemo, useEffect } from 'react';
import { GradeLevel, Subject, Bimester, BimesterPlanningResponse, LibraryItemType, CurriculumStandard, MethodologyStrategy } from '../types';
import { generateBimesterPlanning } from '../services/geminiService';
import { saveToLibrary } from '../services/storageService';
import { PedagogicalContent } from './PedagogicalContent';
import { BookOpen, Loader2, Sparkles, Save, X, FileText } from 'lucide-react';

export const PedagogicalPlanner: React.FC = () => {
  const [grade, setGrade] = useState<GradeLevel>(GradeLevel.EF_1);
  const [subject, setSubject] = useState<Subject>(Subject.PORTUGUESE);
  const [bimester, setBimester] = useState<Bimester>(Bimester.FIRST);
  const [curriculum, setCurriculum] = useState<CurriculumStandard>(CurriculumStandard.BNCC);
  const [customContext, setCustomContext] = useState<string>('');
  const [showContextInput, setShowContextInput] = useState(false);

  const [planning, setPlanning] = useState<BimesterPlanningResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Save Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Filter available subjects based on Grade Level
  const availableSubjects = useMemo(() => {
    const isHighSchool = grade.includes("Ensino Médio");
    
    // Common subjects available to everyone
    const commonSubjects = [
      Subject.PORTUGUESE,
      Subject.MATH,
      Subject.HISTORY,
      Subject.GEOGRAPHY,
      Subject.ARTS,
      Subject.PHYSICAL_ED,
      Subject.ENGLISH,
    ];

    if (isHighSchool) {
      // High School specific
      return [
        ...commonSubjects,
        Subject.PHYSICS,
        Subject.CHEMISTRY,
        Subject.BIOLOGY,
        Subject.SOCIOLOGY,
        Subject.PHILOSOPHY,
        Subject.FORMATIVE_ITINERARIES
      ];
    } else {
      // Elementary School specific (Fundamental)
      return [
        ...commonSubjects,
        Subject.SCIENCE, // Instead of Physics/Chem/Bio
        Subject.RELIGION
      ];
    }
  }, [grade]);

  // Effect to reset subject if the current selection is invalid for the new grade
  useEffect(() => {
    if (!availableSubjects.includes(subject)) {
      setSubject(availableSubjects[0]);
    }
  }, [grade, availableSubjects, subject]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPlanning(null);
    setSaveSuccess(null);

    try {
      const result = await generateBimesterPlanning(grade, subject, bimester, curriculum, customContext);
      setPlanning(result);
    } catch (err) {
      setError("Ocorreu um erro ao gerar o planejamento. O conteúdo pode ser muito extenso, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const openSaveModal = () => {
    setSaveTitle(`Planejamento ${grade} - ${subject} - ${bimester}`);
    setShowSaveModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planning) return;

    saveToLibrary(
      LibraryItemType.PLANNING,
      saveTitle,
      planning,
      { grade, subject, bimester, curriculum }
    );
    setShowSaveModal(false);
    setSaveSuccess("Planejamento salvo na sua biblioteca com sucesso!");
    setTimeout(() => setSaveSuccess(null), 5000);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="text-indigo-600" />
          Planejador Curricular Bimestral
        </h2>
        <p className="text-slate-600 mb-6">
          Selecione a série e o bimestre para que a IA mapeie <strong>todos os temas</strong> previstos. 
          Você poderá selecionar a estratégia metodológica (PBL, Gamificação, etc.) individualmente para cada unidade.
        </p>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Referencial Curricular / Estado</label>
            <select
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value as CurriculumStandard)}
              className="w-full rounded-lg border-slate-300 border p-2.5 bg-indigo-50 text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value={CurriculumStandard.BNCC}>{CurriculumStandard.BNCC}</option>
              <optgroup label="Unidades Federativas (UFs)">
                {Object.values(CurriculumStandard)
                   .filter(c => c !== CurriculumStandard.BNCC)
                   .sort((a, b) => a.localeCompare(b))
                   .map((c) => (
                    <option key={c} value={c}>{c}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="md:col-span-2">
             <label className="block text-sm font-medium text-slate-700 mb-1">Bimestre</label>
             <select
               value={bimester}
               onChange={(e) => setBimester(e.target.value as Bimester)}
               className="w-full rounded-lg border-slate-300 border p-2.5 bg-slate-100 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
             >
               {Object.values(Bimester).map((b) => (
                 <option key={b} value={b}>{b}</option>
               ))}
             </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Série / Ano</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as GradeLevel)}
              className="w-full rounded-lg border-slate-300 border p-2.5 bg-slate-100 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {Object.values(GradeLevel).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Componente Curricular</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as Subject)}
              className="w-full rounded-lg border-slate-300 border p-2.5 bg-slate-100 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {availableSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-4 mt-2">
            <button
               type="button"
               onClick={() => setShowContextInput(!showContextInput)}
               className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 mb-2"
            >
               {showContextInput ? <X className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
               {showContextInput ? "Remover Contexto Extra" : "Adicionar Contexto Extra ou Diretrizes Específicas"}
            </button>
            
            {showContextInput && (
              <textarea
                 value={customContext}
                 onChange={(e) => setCustomContext(e.target.value)}
                 placeholder="Cole aqui diretrizes específicas da sua escola, trechos do PPP ou observações que a IA deve considerar..."
                 className="w-full h-24 p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
              />
            )}
          </div>

          <div className="md:col-span-2 lg:col-span-4 flex justify-end mt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Mapeando Currículo ({curriculum.includes('BNCC') ? 'BNCC' : 'Regional'})...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Gerar Planejamento
                </>
              )}
            </button>
          </div>
        </form>
        {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>}
      </div>

      {saveSuccess && (
         <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg animate-fade-in">
            {saveSuccess}
         </div>
      )}

      {planning && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button 
              onClick={openSaveModal}
              className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors"
            >
              <Save className="h-4 w-4" />
              Salvar na Biblioteca
            </button>
          </div>

          <PedagogicalContent 
            planning={planning} 
            metadata={{ grade, subject, bimester, curriculum }} 
            onUpdatePlan={setPlanning}
          />
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Salvar na Biblioteca</h3>
                <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Arquivo</label>
                  <input 
                    type="text" 
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    required
                    className="w-full rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">Sugerimos um nome descritivo para facilitar a busca.</p>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowSaveModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium"
                  >
                    Salvar Planejamento
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};