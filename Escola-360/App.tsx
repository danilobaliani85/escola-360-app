import React, { useState } from 'react';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { PedagogicalPlanner } from './components/PedagogicalPlanner';
import { Library } from './components/Library';
import { User } from './types';
import { Construction, Clock, MessageSquarePlus } from 'lucide-react';

// --- CONFIGURAÇÃO ---
// COLE O LINK DO SEU GOOGLE FORMS AQUI ABAIXO:
const FEEDBACK_FORM_URL = "https://forms.google.com";

// --- CONTROLE DE ACESSO (CHAVE GERAL) ---
// Mude para 'true' para FECHAR o app (Encerrar Testes)
// Mude para 'false' para ABRIR o app (Produção)
const MAINTENANCE_MODE = true;

const App: React.FC = () => {
  // TELA DE BLOQUEIO / MANUTENÇÃO
  if (MAINTENANCE_MODE) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in border-4 border-indigo-500">
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 bg-indigo-50 rounded-full flex items-center justify-center">
              <Construction className="h-12 w-12 text-indigo-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Período de Testes Finalizado
          </h1>
          
          <p className="text-slate-600 mb-8 leading-relaxed">
            Agradecemos imensamente sua participação na etapa de validação do <strong>Escola 360</strong>. Seus feedbacks são essenciais para nossa evolução.
          </p>

          <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 mb-8">
            <div className="flex items-center justify-center gap-2 text-indigo-900 font-bold mb-2">
              <Clock className="h-5 w-5" />
              Em Breve
            </div>
            <p className="text-sm text-indigo-700">
              Estamos analisando os dados para lançar a versão oficial da plataforma.
            </p>
          </div>

          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">
            Cognizi Soluções e Tecnologias para Educação
          </p>
        </div>
      </div>
    );
  }

  // --- APLICAÇÃO NORMAL (Só roda se MAINTENANCE_MODE = false) ---
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'pedagogical' | 'library'>('pedagogical');

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        onLogout={() => setUser(null)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {activeTab === 'pedagogical' ? (
          <PedagogicalPlanner />
        ) : (
          <Library />
        )}
      </main>

      {/* Botão Flutuante de Feedback */}
      <a 
        href={FEEDBACK_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold py-3 px-4 rounded-full shadow-lg border border-yellow-400 flex items-center gap-2 transition-transform hover:scale-105 z-50 group"
        title="Enviar Feedback ou Reportar Erro"
      >
        <MessageSquarePlus className="h-6 w-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">
          Avaliar Aplicação
        </span>
      </a>
    </div>
  );
};

export default App;
