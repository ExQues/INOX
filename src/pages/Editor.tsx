import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  ArrowLeft, Play, Save, Settings, Layers, 
  Code, Box, Image as ImageIcon, FileText, 
  MessageSquare, Terminal 
} from 'lucide-react';

export default function Editor() {
  const navigate = useNavigate();
  const { currentProject, user } = useStore();
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  // If no project is selected, we could redirect back to dashboard
  if (!currentProject) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">Nenhum projeto selecionado</h2>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-900 text-slate-300 flex flex-col overflow-hidden">
      {/* Editor Header */}
      <header className="h-14 border-b border-slate-700/50 bg-slate-800/80 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="Voltar ao Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-px bg-slate-700"></div>
          
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              {currentProject.name}
              <span className="px-2 py-0.5 rounded-full bg-slate-700 text-[10px] text-slate-300">
                {currentProject.status}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700 rounded-md transition text-sm font-medium">
            <Save className="w-4 h-4" />
            Salvar
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition text-sm font-medium shadow-lg shadow-green-900/20">
            <Play className="w-4 h-4 fill-current" />
            Play
          </button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-14 sm:w-64 border-r border-slate-700/50 bg-slate-800/30 flex flex-col shrink-0 transition-all duration-300">
          <div className="p-3 border-b border-slate-700/50 flex items-center gap-3 hidden sm:flex">
            <Layers className="w-5 h-5 text-purple-400" />
            <span className="font-semibold text-white">Assets</span>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2">
            <div className="px-2 space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition group">
                <Box className="w-4 h-4 group-hover:text-purple-400" />
                <span className="text-sm hidden sm:block">Modelos 3D</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition group">
                <ImageIcon className="w-4 h-4 group-hover:text-blue-400" />
                <span className="text-sm hidden sm:block">Texturas</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition group">
                <FileText className="w-4 h-4 group-hover:text-green-400" />
                <span className="text-sm hidden sm:block">Scripts</span>
              </button>
            </div>
          </div>
          
          <div className="p-2 border-t border-slate-700/50">
            <button className="w-full flex items-center justify-center sm:justify-start gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition">
              <Settings className="w-4 h-4" />
              <span className="text-sm hidden sm:block">Configurações</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative">
          {/* View Toggle */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center bg-slate-800 rounded-lg p-1 shadow-xl border border-slate-700 z-10">
            <button 
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === 'preview' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-4 h-4" />
              Preview
            </button>
            <button 
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === 'code' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              Código
            </button>
          </div>

          {/* Workspace Area */}
          <div className="flex-1 p-4 flex items-center justify-center">
            {activeTab === 'preview' ? (
              <div className="w-full h-full rounded-xl border border-slate-700/50 bg-slate-950 flex items-center justify-center overflow-hidden relative group">
                <div className="text-center">
                  <Play className="w-16 h-16 text-slate-700 mx-auto mb-4 group-hover:text-slate-500 transition-colors" />
                  <p className="text-slate-500">A visualização 3D do seu jogo aparecerá aqui.</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full rounded-xl border border-slate-700/50 bg-slate-950 flex flex-col overflow-hidden">
                <div className="h-10 bg-slate-800/80 border-b border-slate-700/50 flex items-center px-4">
                  <span className="text-sm font-mono text-slate-400">main.js</span>
                </div>
                <div className="flex-1 p-4 font-mono text-sm text-slate-300 overflow-auto">
                  <p><span className="text-purple-400">import</span> {'{ Engine }'} <span className="text-purple-400">from</span> <span className="text-green-400">'@inox/core'</span>;</p>
                  <br/>
                  <p><span className="text-blue-400">const</span> game = <span className="text-purple-400">new</span> Engine({'{'}</p>
                  <p className="pl-4">canvas: document.getElementById(<span className="text-green-400">'game-canvas'</span>),</p>
                  <p className="pl-4">physics: <span className="text-orange-400">true</span></p>
                  <p>{'});'}</p>
                  <br/>
                  <p>game.start();</p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* AI Assistant Sidebar (Right) */}
        <aside className="w-80 border-l border-slate-700/50 bg-slate-800/30 flex flex-col shrink-0 hidden lg:flex">
          <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Assistente INOX</h3>
              <p className="text-xs text-slate-400">IA de Desenvolvimento</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-slate-700/50 rounded-xl p-3 text-sm text-slate-300 border border-slate-600/50">
              Olá, {user?.full_name?.split(' ')[0] || 'Desenvolvedor'}! Como posso ajudar a melhorar o jogo hoje?
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-700/50">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Peça para gerar um script, asset..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 text-white placeholder-slate-500"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded-md transition">
                <Terminal className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
