import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  ArrowLeft, Play, Save, Settings, Layers,
  Code, Box, Image as ImageIcon, FileText,
  MessageSquare, Terminal, Send, Loader2, Sparkles, Check, Monitor
} from 'lucide-react';
import Viewport3D from '../components/editor/Viewport3D';
import EditorCode from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';
import { createInoxAiSdk } from '../lib/ai-sdk/inoxAiSdk';

// Inicializar SDK
const aiSdk = createInoxAiSdk({
  apiKey: import.meta.env.VITE_AI_API_KEY || 'mock-key',
  baseUrl: 'http://localhost:3001'
});

export default function Editor() {
  const navigate = useNavigate();
  const { currentProject, user, setActiveModelUrl, activeCode, setActiveCode, addSceneObject } = useStore();
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  
  // AI Assistant State
  const [chatMessage, setChatMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectAssets, setProjectAssets] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
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

  // Handle Save Scene
  const handleSaveScene = async () => {
    if (!currentProject?.id) return;
    
    setIsSaving(true);
    try {
      const response = await aiSdk.saveProjectScene({
        projectId: currentProject.id,
        sceneObjects: useStore.getState().sceneObjects,
        activeCode: useStore.getState().activeCode
      });
      
      if (response.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: "✅ Cena e lógica salvas na nuvem com sucesso!" }]);
      }
    } catch (error) {
      console.error('Failed to save scene:', error);
      alert('Erro ao salvar cena na nuvem.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncUnreal = async () => {
    if (!currentProject?.id) return;
    
    setIsSyncing(true);
    try {
      setMessages(prev => [...prev, { role: 'assistant', content: "🔄 Iniciando sincronização com Unreal Engine..." }]);
      const response = await aiSdk.syncProjectToUnreal(currentProject.id);
      
      if (response.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: `✅ Sincronização concluída!\n\n${response.message}` }]);
      }
    } catch (error) {
      console.error('Failed to sync to Unreal:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "❌ Erro ao tentar sincronizar com a Unreal Engine." }]);
    } finally {
      setIsSyncing(false);
    }
  };
  const loadAssets = async () => {
    if (currentProject?.id) {
      try {
        const response = await aiSdk.getProjectAssets(currentProject.id);
        if (response.success) {
          setProjectAssets(response.assets);
        }
      } catch (error) {
        console.error('Failed to load assets:', error);
      }
    }
  };

  useEffect(() => {
    if (currentProject) {
      loadAssets();
      
      // Load saved scene graph and code if they exist
      if (currentProject.scene_graph && Array.isArray(currentProject.scene_graph)) {
        useStore.setState({ sceneObjects: currentProject.scene_graph });
      }
      
      if (currentProject.code_structure && typeof currentProject.code_structure === 'string') {
        setActiveCode(currentProject.code_structure);
      }
    }
  }, [currentProject?.id]);

  // Handle Chat Submission
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isGenerating) return;

    const userMessage = chatMessage;
    setChatMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsGenerating(true);

    // Simulate AI Response generation
    try {
      let aiResponse = "Entendi! Vou começar a trabalhar nisso para o seu projeto.";
      
      // Keyword detection for demo
      if (userMessage.toLowerCase().includes('dragão') || userMessage.toLowerCase().includes('3d') || userMessage.toLowerCase().includes('personagem') || userMessage.toLowerCase().includes('rocha') || userMessage.toLowerCase().includes('floresta')) {
        aiResponse = "Analisando a biblioteca de Assets AAA (Quixel Megascans/MetaHumans)... 🚀\n\nVou buscar os modelos perfeitos e adicionar as versões 'Proxy' (low-poly) no seu Blockout web.";
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

        // 1. Inicia a requisição de busca/orquestração
        const generationRequest = await aiSdk.generate3DModel({
          prompt: userMessage,
          projectId: currentProject?.id || 'temp-project',
          style: 'realistic'
        });

        if (generationRequest.success && generationRequest.taskId) {
          // 2. Aguarda a conclusão e Salva (Polling via SDK)
          const result = await aiSdk.waitFor3DModel(
            generationRequest.taskId,
            currentProject?.id || 'temp-project',
            userMessage
          );
          
          if (result.status === 'completed' && result.modelUrl) {
            setActiveModelUrl(result.modelUrl);
            setMessages(prev => [...prev, { role: 'assistant', content: "✅ O Proxy do asset AAA foi adicionado ao seu Blockout! A versão 8K real será injetada quando você sincronizar com a Unreal Engine 5." }]);
            loadAssets(); // Refresh assets list
          } else {
            setMessages(prev => [...prev, { role: 'assistant', content: "❌ Ocorreu um erro ao buscar o asset AAA." }]);
          }
        }
      } else if (userMessage.toLowerCase().includes('script') || userMessage.toLowerCase().includes('código') || userMessage.toLowerCase().includes('lógica')) {
        aiResponse = "Gerando o script de comportamento... \n\nVou adicionar a lógica no seu painel de código para que possamos testar.";
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

        // 1. Inicia requisição de chat real para gerar código
        const chatResponse = await aiSdk.chat({
          projectId: currentProject?.id || 'temp',
          message: userMessage
        });

        if (chatResponse.activeCode) {
          setActiveCode(chatResponse.activeCode);
          setActiveTab('code');
          setMessages(prev => [...prev, { role: 'assistant', content: "✅ Script gerado e injetado na aba de Código com sucesso!" }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: chatResponse.response }]);
        }

      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      }
    } catch (error) {
      console.error('Erro na IA:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "❌ Ocorreu um erro de conexão com o servidor de IA." }]);
    } finally {
      setIsGenerating(false);
    }
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
          <button 
            onClick={handleSyncUnreal}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md transition text-sm font-medium shadow-lg shadow-blue-900/20"
            title="Sincronizar com Unreal Engine"
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Monitor className="w-4 h-4" />}
            Sync UE5
          </button>
          <button 
            onClick={handleSaveScene}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700 disabled:opacity-50 rounded-md transition text-sm font-medium"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
            <span className="font-semibold text-white">Assets do Projeto</span>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            <div className="px-2 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 px-3 tracking-wider hidden sm:block">Modelos 3D</div>
              {projectAssets.filter(a => a.type === 'model').length > 0 ? (
                projectAssets.filter(a => a.type === 'model').map((asset) => (
                  <button 
                    key={asset.id}
                    onClick={() => {
                      // Instead of replacing the active model, we add it to the scene
                      addSceneObject({
                        id: `instance_${Date.now()}`,
                        assetId: asset.id,
                        name: asset.name,
                        url: asset.url,
                        position: [(Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4], // Random spawn position
                        rotation: [0, 0, 0],
                        scale: [1, 1, 1]
                      });
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition group"
                    title={asset.name}
                  >
                    <Box className="w-4 h-4 shrink-0 group-hover:text-purple-400" />
                    <span className="text-sm truncate hidden sm:block">{asset.name}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-slate-500 italic hidden sm:block">Nenhum modelo gerado.</div>
              )}
              
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 mt-4 px-3 tracking-wider hidden sm:block">Texturas</div>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition group">
                <ImageIcon className="w-4 h-4 group-hover:text-blue-400" />
                <span className="text-sm hidden sm:block">Texturas Base</span>
              </button>
              
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 mt-4 px-3 tracking-wider hidden sm:block">Scripts</div>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition group">
                <FileText className="w-4 h-4 group-hover:text-green-400" />
                <span className="text-sm hidden sm:block">Lógica (main.js)</span>
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
              <div className="w-full h-full rounded-xl border border-slate-700/50 bg-[#1d1f21] flex flex-col overflow-hidden shadow-2xl">
                <div className="h-10 bg-slate-800 border-b border-slate-700/50 flex items-center justify-between px-4">
                  <span className="text-sm font-mono text-slate-300">main.js</span>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] text-green-400 font-mono">Sincronizado</span>
                  </div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar relative">
                  <EditorCode
                    value={activeCode || `// Escreva ou peça para IA gerar um script\n// Exemplo de rotação:\nfunction update(dt, model) {\n  model.rotation.y += 1 * dt;\n}`}
                    onValueChange={code => setActiveCode(code)}
                    highlight={code => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
                    padding={20}
                    className="font-mono text-sm h-full"
                    style={{
                      fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                      fontSize: 14,
                      backgroundColor: '#1d1f21',
                      color: '#c5c8c6',
                      minHeight: '100%'
                    }}
                  />
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
