import React, { useEffect, useState } from 'react';
import { LibraryItem, BimesterPlanningResponse } from '../types';
import { getLibraryItems, deleteLibraryItem } from '../services/storageService';
import { PedagogicalContent } from './PedagogicalContent';
import { Folder, Calendar, Trash2, ExternalLink, X, BookOpen } from 'lucide-react';

export const Library: React.FC = () => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  useEffect(() => {
    setItems(getLibraryItems());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este item?")) {
      deleteLibraryItem(id);
      setItems(getLibraryItems());
      if (selectedItem?.id === id) setSelectedItem(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {!selectedItem ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
             <div>
               <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                 <Folder className="text-indigo-600" />
                 Minha Biblioteca
               </h2>
               <p className="text-slate-600 text-sm">Gerencie seus planejamentos pedagógicos salvos.</p>
             </div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Folder className="h-16 w-16 text-slate-200 mx-auto mb-4" />
              <p className="text-lg text-slate-500 font-medium">Sua biblioteca está vazia</p>
              <p className="text-slate-400 text-sm">Salve planejamentos gerados para vê-los aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
               {items.map((item) => (
                 <div 
                    key={item.id} 
                    onClick={() => setSelectedItem(item)}
                    className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                 >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                         <BookOpen className="h-5 w-5" />
                      </div>
                      <button 
                        onClick={(e) => handleDelete(item.id, e)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 mb-2 line-clamp-2 min-h-[3rem]">{item.title}</h3>
                    
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(item.createdAt)}
                      </div>
                      {item.metadata && (
                        <div className="flex flex-wrap gap-1 mt-2">
                           <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{item.metadata.subject}</span>
                           <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{item.metadata.grade?.split(' ')[0]}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-indigo-600 text-sm font-semibold group-hover:gap-2 transition-all">
                       Visualizar <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </div>
                 </div>
               ))}
            </div>
          )}
        </>
      ) : (
        <div className="animate-fade-in">
          <button 
            onClick={() => setSelectedItem(null)}
            className="mb-6 flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors font-medium"
          >
            <X className="h-4 w-4" /> Fechar Visualização
          </button>
          
           <PedagogicalContent 
             planning={selectedItem.content as BimesterPlanningResponse}
             metadata={selectedItem.metadata}
           />
        </div>
      )}
    </div>
  );
};