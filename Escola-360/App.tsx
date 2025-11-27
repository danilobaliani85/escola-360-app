import React, { useState } from 'react';
import { Header } from './components/Header';
import { PedagogicalPlanner } from './components/PedagogicalPlanner';
import { Library } from './components/Library';
import { Login } from './components/Login';
import { User } from './types';
import { MessageSquarePlus } from 'lucide-react';

// --- CONFIGURAÇÃO ---
// COLE O LINK DO SEU GOOGLE FORMS AQUI ABAIXO:
const FEEDBACK_FORM_URL = "https://forms.google.com"; 

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'pedagogical' | 'library'>('pedagogical');

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('pedagogical');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'pedagogical' && (
          <div className="animate-fade-in">
             <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Plataforma Curricular</h2>
              <p className="text-lg text-slate-600 mt-2">
                Planejamento dinâmico alinhado à BNCC e Currículos Estaduais com IA.
              </p>
            </div>
            <PedagogicalPlanner />
          </div>
        )}

        {activeTab === 'library' && (
          <div className="animate-fade-in">
             <Library />
          </div>
        )}
      </main>

      {/* Feedback Floating Button for Beta Testing */}
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

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Escola 360. Desenvolvido com Google Gemini.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;