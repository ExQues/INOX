import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  ArrowLeft, Play, Square, Save, Settings, Layers,
  Code, Box, Image as ImageIcon, FileText,
  MessageSquare, Terminal, Send, Loader2, Sparkles, Check, Monitor, Trash2, AlertCircle, Info, Workflow, GitCommit, Package, Zap
} from 'lucide-react';
import Viewport3D from '../components/editor/Viewport3D';
import BlueprintGraph from '../components/editor/BlueprintGraph';
import EditorCode from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createInoxAiSdk } from '../lib/ai-sdk/inoxAiSdk';

// Inicializar SDK
const aiSdk = createInoxAiSdk({
  apiKey: import.meta.env.VITE_AI_API_KEY || 'mock-key',
  baseUrl: 'http://localhost:3001'
});

export default function Editor() {
  const navigate = useNavigate();
  const { currentProject, user, setActiveModelUrl, activeCode, setActiveCode, addSceneObject, isPlaying, setIsPlaying, consoleLogs, clearLogs, activeBlueprint, setActiveBlueprint, commits, addCommit, checkoutCommit } = useStore();
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'blueprint' | 'history'>('preview');
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  
  // AI Assistant State
  const [chatMessage, setChatMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectAssets, setProjectAssets] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
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

  // Auto-scroll console
  useEffect(() => {
    if (isConsoleOpen) {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs, isConsoleOpen]);

  // Handle Save Scene
  const handleSaveScene = async () => {
    if (!currentProject?.id) return;
    
    setIsSaving(true);
    try {
      const response = await aiSdk.saveProjectScene({
        projectId: currentProject.id,
        sceneObjects: useStore.getState().sceneObjects,
        activeCode: useStore.getState().activeCode,
        commits: useStore.getState().commits
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

  const handleBuildProject = async (platform: 'web' | 'desktop' | 'mobile') => {
    if (!currentProject?.id) return;
    
    setIsBuilding(true);
    setShowBuildModal(false);
    try {
      setMessages(prev => [...prev, { role: 'assistant', content: `📦 Iniciando empacotamento para a plataforma **${platform.toUpperCase()}**...\n\nCompilando shaders e lógicas...` }]);
      
      // Simulate build process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setMessages(prev => [...prev, { role: 'assistant', content: `✅ Build para **${platform.toUpperCase()}** concluída com sucesso!\n\nVocê pode baixar os binários no Dashboard.` }]);
    } catch (error) {
      console.error('Failed to build:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "❌ Erro ao tentar empacotar o projeto." }]);
    } finally {
      setIsBuilding(false);
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

      if (currentProject.commits && Array.isArray(currentProject.commits)) {
        useStore.setState({ commits: currentProject.commits });
      } else {
        useStore.setState({ commits: [] }); // Reset if no commits
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
      if (userMessage.toLowerCase().includes('dragão') || userMessage.toLowerCase().includes('3d') || userMessage.toLowerCase().includes('personagem') || userMessage.toLowerCase().includes('rocha') || userMessage.toLowerCase().includes('floresta') || userMessage.toLowerCase().includes('mapa') || userMessage.toLowerCase().includes('terreno') || userMessage.toLowerCase().includes('andando')) {
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
          message: userMessage,
          currentCode: activeCode,
          consoleErrors: consoleLogs.filter(l => l.type === 'error').map(l => l.message).slice(-5) // Send up to 5 most recent errors
        });

        if (chatResponse.activeCode) {
          if (chatResponse.activeCode.includes('"nodes":') || chatResponse.activeCode.includes('"blueprint_name":')) {
            try {
              const bpJson = JSON.parse(chatResponse.activeCode);
              setActiveBlueprint(bpJson);
              setActiveTab('blueprint');
              setMessages(prev => [...prev, { role: 'assistant', content: "✅ Lógica AAA (Blueprint) gerada com sucesso! Você pode visualizar o grafo na aba Blueprint." }]);
            } catch (e) {
              setActiveCode(chatResponse.activeCode);
              setActiveTab('code');
            }
          } else {
            setActiveCode(chatResponse.activeCode);
            setActiveTab('code');
            setMessages(prev => [...prev, { role: 'assistant', content: "✅ Script gerado e injetado na aba de Código com sucesso!" }]);
          }
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
            disabled={isSyncing || isBuilding}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md transition text-sm font-medium shadow-lg shadow-blue-900/20"
            title="Sincronizar com Unreal Engine"
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Monitor className="w-4 h-4" />}
            Sync UE5
          </button>
          <button 
            onClick={() => setShowBuildModal(true)}
            disabled={isBuilding || isSyncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-md transition text-sm font-medium shadow-lg shadow-orange-900/20"
            title="Empacotar e Exportar Jogo"
          >
            {isBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
            Exportar
          </button>
          <button 
            onClick={handleSaveScene}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700 disabled:opacity-50 rounded-md transition text-sm font-medium"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-4 py-1.5 text-white rounded-md transition text-sm font-medium shadow-lg ${
              isPlaying 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' 
                : 'bg-green-600 hover:bg-green-700 shadow-green-900/20'
            }`}
          >
            {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isPlaying ? 'Stop' : 'Play'}
          </button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-14 sm:w-64 border-r border-slate-700/50 bg-slate-800/30 flex flex-col shrink-0 transition-all duration-300">
          <div className="p-3 border-b border-slate-700/50 flex items-center gap-3 hidden sm:flex bg-slate-800/80">
            <Layers className="w-5 h-5 text-orange-400" />
            <span className="font-semibold text-white">Quixel / MetaHumans</span>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            <div className="px-2 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 px-3 tracking-wider hidden sm:block">Biblioteca AAA</div>
              {projectAssets.filter(a => a.type === 'model').length > 0 ? (
                projectAssets.filter(a => a.type === 'model').map((asset) => (
                  <button 
                    key={asset.id}
                    onClick={() => {
                      addSceneObject({
                        id: `instance_${Date.now()}`,
                        assetId: asset.id,
                        name: asset.name,
                        url: asset.url,
                        position: [0, 5, 0], // Drop from slightly above to trigger physics
                        rotation: [0, 0, 0],
                        scale: [1, 1, 1]
                      });
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-700/50 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition group shadow-sm mb-2"
                    title={`Adicionar ${asset.name} à cena`}
                  >
                    <Box className="w-5 h-5 shrink-0 text-orange-500 group-hover:text-orange-400" />
                    <div className="flex flex-col items-start hidden sm:flex">
                      <span className="text-sm font-medium truncate">{asset.name}</span>
                      <span className="text-[10px] text-slate-500 truncate">{asset.id.split('_')[0]} Asset</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-xs text-slate-500 italic hidden sm:block text-center bg-slate-800/50 rounded-lg border border-slate-700/50">
                  Nenhum asset AAA gerado pela IA ainda. Peça no chat para gerar modelos 3D.
                </div>
              )}
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
            <button 
              onClick={() => setActiveTab('blueprint')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === 'blueprint' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Workflow className="w-4 h-4" />
              Blueprint
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === 'history' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitCommit className="w-4 h-4" />
              Histórico
            </button>
          </div>

          {/* Workspace Area */}
          <div className="flex-1 p-4 flex items-center justify-center pt-16">
            {activeTab === 'preview' ? (
              <div className="w-full h-full rounded-xl border border-slate-700/50 bg-slate-950 flex items-center justify-center overflow-hidden relative shadow-2xl">
                <Viewport3D />
              </div>
            ) : activeTab === 'blueprint' ? (
              <div className="w-full h-full rounded-xl border border-slate-700/50 bg-[#1d1f21] flex flex-col overflow-hidden shadow-2xl relative">
                <BlueprintGraph blueprint={activeBlueprint} />
              </div>
            ) : activeTab === 'history' ? (
              <div className="w-full h-full rounded-xl border border-slate-700/50 bg-[#1d1f21] flex flex-col overflow-hidden shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <GitCommit className="w-6 h-6 text-purple-400" />
                    Histórico de Versões
                  </h2>
                  <button 
                    onClick={() => {
                      const msg = prompt('Digite a mensagem da versão:');
                      if (msg) {
                        addCommit(msg);
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium shadow-lg shadow-purple-900/20"
                  >
                    Salvar Snapshot
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                  {commits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                      <GitCommit className="w-12 h-12 opacity-20" />
                      <p>Nenhuma versão salva ainda. Salve o estado atual para criar um histórico.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                      {commits.map((commit) => (
                        <div key={commit.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-800 text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <GitCommit className="w-5 h-5" />
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md transition">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                              <h3 className="font-bold text-slate-200 text-sm">{commit.message}</h3>
                              <span className="text-xs text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded">
                                {new Date(commit.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex gap-4 text-xs text-slate-400 mb-4">
                              <span className="flex items-center gap-1"><Box className="w-3 h-3" /> {commit.snapshot.sceneObjects.length} objetos</span>
                              <span className="flex items-center gap-1"><Code className="w-3 h-3" /> {commit.snapshot.code ? 'Com Lógica' : 'Sem Lógica'}</span>
                              {commit.snapshot.blueprint && <span className="flex items-center gap-1"><Workflow className="w-3 h-3" /> Com Blueprint</span>}
                            </div>
                            <button 
                              onClick={() => {
                                if(confirm('Restaurar esta versão irá substituir o estado atual não salvo. Deseja continuar?')) {
                                  checkoutCommit(commit.id);
                                  setActiveTab('preview');
                                }
                              }}
                              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition w-full sm:w-auto"
                            >
                              Restaurar Versão
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                <div className="flex-1 overflow-auto custom-scrollbar relative pb-[200px]">
                  <EditorCode
                    value={activeCode || `// Escreva ou peça para IA gerar um script\n// Exemplo de rotação:\nfunction update(dt, model, THREE, CANNON, world, sceneObjects) {\n  if (model) {\n    model.rotation.y += 1 * dt;\n    console.log("Rotacionando o modelo:", model.rotation.y);\n  }\n}`}
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

                {/* Console Panel */}
                <div 
                  className={`absolute bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-slate-700/50 flex flex-col transition-all duration-300 ease-in-out ${
                    isConsoleOpen ? 'h-48' : 'h-10'
                  }`}
                >
                  <div 
                    className="h-10 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                  >
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-300">Console</span>
                      {consoleLogs.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
                          {consoleLogs.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); clearLogs(); }}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                        title="Limpar Console"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {isConsoleOpen && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 font-mono text-[13px]">
                      {consoleLogs.length === 0 ? (
                        <div className="text-slate-500 italic px-2 py-1">Nenhum log gerado.</div>
                      ) : (
                        <div className="space-y-1">
                          {consoleLogs.map((log) => (
                            <div 
                              key={log.id} 
                              className={`px-2 py-1 rounded flex items-start gap-2 border-l-2 ${
                                log.type === 'error' ? 'bg-red-900/10 text-red-400 border-red-500' :
                                log.type === 'warn' ? 'bg-yellow-900/10 text-yellow-400 border-yellow-500' :
                                'text-slate-300 border-blue-500/50 hover:bg-slate-800/50'
                              }`}
                            >
                              <span className="text-slate-500 shrink-0 select-none">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                              <span className="shrink-0 mt-0.5">
                                {log.type === 'error' ? <AlertCircle className="w-3.5 h-3.5" /> : 
                                 log.type === 'warn' ? <AlertCircle className="w-3.5 h-3.5" /> : 
                                 <Info className="w-3.5 h-3.5 text-blue-400" />}
                              </span>
                              <span className="break-all whitespace-pre-wrap">{log.message}</span>
                            </div>
                          ))}
                          <div ref={consoleEndRef} />
                        </div>
                      )}
                    </div>
                  )}
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
                  className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-md overflow-hidden ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white rounded-tr-sm whitespace-pre-wrap' 
                      : 'bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-tl-sm markdown-body'
                  }`}
                >
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
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

          {/* Quick Suggestions / Context Actions */}
          {!isGenerating && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
              <button 
                onClick={() => setChatMessage('Corrija os erros de console no meu script')}
                className="text-[11px] px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-600 transition-colors flex items-center gap-1.5"
              >
                <AlertCircle className="w-3 h-3 text-yellow-400" />
                Corrigir Erros
              </button>
              <button 
                onClick={() => setChatMessage('Otimize meu script para melhor performance')}
                className="text-[11px] px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-600 transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3 h-3 text-blue-400" />
                Otimizar
              </button>
              <button 
                onClick={() => setChatMessage('Converta esta lógica JS em Blueprint Unreal')}
                className="text-[11px] px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-600 transition-colors flex items-center gap-1.5"
              >
                <Workflow className="w-3 h-3 text-purple-400" />
                Gerar Blueprint
              </button>
            </div>
          )}
          
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
      {/* Build Modal */}
      {showBuildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 w-[90%] max-w-md relative">
            <button 
                onClick={() => setShowBuildModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <div className="w-5 h-5 flex items-center justify-center text-lg leading-none">&times;</div>
              </button>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Empacotar Projeto
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Selecione a plataforma alvo para exportar seu projeto. O INOX irá compilar a cena, as lógicas Blueprint e os assets associados.
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleBuildProject('web')}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-slate-600 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-200">Web (HTML5)</div>
                    <div className="text-xs text-slate-500">Roda diretamente no navegador (WebGL/WebGPU)</div>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => handleBuildProject('desktop')}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-slate-600 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition">
                    <Box className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-200">Desktop (Windows/Mac)</div>
                    <div className="text-xs text-slate-500">Binário nativo em C++ compilado via Unreal</div>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end">
              <button 
                onClick={() => setShowBuildModal(false)}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
