import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Plus, Gamepad2, FolderOpen, Zap, Clock, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, projects, setProjects, setCurrentProject, setLoading, setError } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNewProject = () => {
    // Generate a temporary new project or just open editor with null project (it will be created there)
    // For now we'll set a mock "Novo Projeto" to allow Editor to render
    const newProject = {
      id: crypto.randomUUID(),
      name: 'Novo Jogo',
      platform: 'web' as const,
      status: 'draft' as const,
      code_structure: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setCurrentProject(newProject);
    navigate('/editor');
  };

  const handleOpenProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      navigate('/editor');
    }
  };

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === 'active').length,
    recentProjects: projects.slice(0, 5),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">INOX Game Creator</h1>
                <p className="text-sm text-slate-400">Plataforma de desenvolvimento de jogos por IA</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user?.full_name || 'Usuário'}</p>
                  <p className="text-xs text-slate-400">{user?.plan === 'free' ? 'Plano Free' : user?.plan === 'pro' ? 'Plano Pro' : 'Plano Enterprise'}</p>
                </div>
              </div>

              <button
                onClick={handleCreateNewProject}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-purple-500/25"
              >
                <Plus className="w-5 h-5" />
                <span>Novo Projeto</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Bem-vindo de volta! 👋</h2>
          <p className="text-slate-400 mb-6">
            Gerencie seus projetos, crie novos jogos e continue onde parou.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.totalProjects}</p>
                  <p className="text-sm text-slate-400">Projetos Totais</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.activeProjects}</p>
                  <p className="text-sm text-slate-400">Projetos Ativos</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.recentProjects.length}</p>
                  <p className="text-sm text-slate-400">Projetos Recentes</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-pink-600/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{user?.plan === 'free' ? '50' : user?.plan === 'pro' ? '500' : 'Ilimitado'}</p>
                  <p className="text-sm text-slate-400">Projetos/Dia</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Buscar projetos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 backdrop-blur-sm flex items-center justify-center">
                <FolderOpen className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum projeto encontrado</h3>
              <p className="text-slate-400 mb-6">
                {searchQuery
                  ? 'Nenhum projeto corresponde à sua busca.'
                  : 'Você ainda não tem projetos. Crie seu primeiro jogo agora!'}
              </p>
              <button
                onClick={handleCreateNewProject}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-purple-500/25"
              >
                <Plus className="w-5 h-5" />
                <span>Criar Primeiro Projeto</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleOpenProject(project.id)}
                  className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                        <Gamepad2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <p className="text-sm text-slate-400">
                          {project.platform === 'web' ? 'Web' : project.platform === 'desktop' ? 'Desktop' : 'Mobile'}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-700/50 text-slate-400">
                      {project.status === 'active' ? 'Ativo' : project.status === 'draft' ? 'Rascunho' : 'Arquivado'}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {project.genre && (
                        <span className="px-3 py-1 text-xs font-medium rounded-lg bg-purple-600/20 text-purple-400">
                          {project.genre}
                        </span>
                      )}
                      <span className="text-sm text-slate-400">
                        {new Date(project.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <button className="px-4 py-2 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200">
                      Abrir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
