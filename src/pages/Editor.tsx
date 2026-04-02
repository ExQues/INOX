import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  ArrowLeft, Play, Save, Settings, Layers, 
  Code, Box, Image as ImageIcon, FileText, 
  MessageSquare, Terminal, Send, Loader2, Sparkles
} from 'lucide-react';
import Viewport3D from '../components/editor/Viewport3D';

export default function Editor() {
  const navigate = useNavigate();
  const { currentProject, user, setActiveModelUrl } = useStore();
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  
  // AI Assistant State
  const [chatMessage, setChatMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: `Olá, ${user?.full_name?.split(' ')[0] || 'Desenvolvedor'}! Como posso ajudar a criar seu jogo hoje? Posso gerar códigos, cenários e até mesmo modelos 3D ultra-realistas para você.` 
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Chat Submission
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isGenerating) return;

    const userMessage = chatMessage;
    setChatMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsGenerating(true);

    // Mock AI Response generation (To be connected to backend)
    setTimeout(() => {
      let aiResponse = "Entendi! Vou começar a trabalhar nisso para o seu projeto.";
      
      // Simple keyword detection for demo
      if (userMessage.toLowerCase().includes('dragão') || userMessage.toLowerCase().includes('3d') || userMessage.toLowerCase().includes('personagem')) {
        aiResponse = "Iniciando o pipeline de geração 3D ultra-realista... 🚀\n\nEstou conectando à engine de geração para esculpir o modelo e gerar as texturas PBR. Assim que o arquivo .glb estiver pronto, ele será importado automaticamente para sua cena e para os assets da Unreal Engine.";
        
        // Simular o tempo de geração de um modelo da Meshy ou Tripo e carregar no Viewport
        setTimeout(() => {
          // Usando um modelo GLB público de exemplo para demonstração
          setActiveModelUrl('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF/FlightHelmet.gltf');
          setMessages(prev => [...prev, { role: 'assistant', content: "✅ O modelo 3D foi gerado e importado com sucesso! Você já pode visualizá-lo e rotacioná-lo no Viewport." }]);
        }, 3000);
      } else if (userMessage.toLowerCase().includes('script') || userMessage.toLowerCase().includes('código')) {
        aiResponse = "Gerando o script de comportamento... \n\nVou adicionar a lógica no seu painel de código para que possamos testar no Viewport.";
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setIsGenerating(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
          <div className="flex-1 p-4 flex items-center justify-center pt-16">
            {activeTab === 'preview' ? (
              <div className="w-full h-full rounded-xl border border-slate-700/50 bg-slate-950 flex items-center justify-center overflow-hidden relative shadow-2xl">
                <Viewport3D />
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
        <aside className="w-80 lg:w-96 border-l border-slate-700/50 bg-slate-800/30 flex flex-col shrink-0 hidden lg:flex relative">
          <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Assistente Rockstar</h3>
              <p className="text-xs text-slate-400">IA Geradora de Assets e Lógica</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-md whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-tr-sm' 
                      : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {msg.role === 'user' ? 'Você' : 'Assistente IA'}
                </span>
              </div>
            ))}
            
            {isGenerating && (
              <div className="flex items-center gap-2 text-slate-400 p-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-xs">Processando e gerando arquivos...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
            <div className="relative flex items-end gap-2 bg-slate-900 border border-slate-700 rounded-xl p-2 focus-within:ring-1 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all">
              <textarea 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ex: Crie um dragão ultra-realista 3D..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 resize-none outline-none max-h-32 min-h-[40px] custom-scrollbar"
                rows={1}
                disabled={isGenerating}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!chatMessage.trim() || isGenerating}
                className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors shrink-0 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 text-[10px] text-center text-slate-500">
              O assistente pode gerar Modelos 3D, Texturas PBR e Scripts C++/JS.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
