import React from 'react';
import { GraduationCap, LogOut, User } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  activeTab: 'pedagogical' | 'library';
  setActiveTab: (tab: 'pedagogical' | 'library') => void;
  user: UserType;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, user, onLogout }) => {
  return (
    <header className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 shrink-0">
            <GraduationCap className="h-8 w-8" />
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">
              Escola 360 <span className="text-blue-200 text-sm font-normal ml-1">| Cognizi Soluções e Tecnologias para Educação</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab('pedagogical')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'pedagogical'
                    ? 'bg-blue-950 text-white shadow-inner'
                    : 'text-blue-100 hover:bg-blue-800'
                }`}
              >
                Planejador Pedagógico
              </button>

              <button
                onClick={() => setActiveTab('library')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'library'
                    ? 'bg-blue-950 text-white shadow-inner'
                    : 'text-blue-100 hover:bg-blue-800'
                }`}
              >
                Minha Biblioteca
              </button>
            </nav>

            <div className="flex items-center gap-3 pl-4 border-l border-blue-700 ml-2">
              <div className="flex items-center gap-2 text-sm">
                 <div className="h-8 w-8 bg-blue-700 rounded-full flex items-center justify-center border border-blue-600">
                    <User className="h-4 w-4" />
                 </div>
                 <span className="hidden lg:inline">{user.name}</span>
              </div>
              <button 
                onClick={onLogout}
                className="text-blue-200 hover:text-white p-2"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};