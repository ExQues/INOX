import { create } from 'zustand';

interface Project {
  id: string;
  name: string;
  description?: string;
  platform: 'web' | 'desktop' | 'mobile' | 'all';
  genre?: string;
  status: 'draft' | 'active' | 'archived';
  code_structure: Record<string, any>;
  scene_graph?: any;
  commits?: any;
  created_at: string;
  updated_at: string;
}

interface Asset {
  id: string;
  project_id: string;
  name: string;
  type: 'sprite' | 'model' | 'sound' | 'music' | 'font' | 'other';
  file_url: string;
  thumbnail_url?: string;
  size: number;
  tags: string[];
  created_at: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  genre?: string;
  platform: string;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  code_structure: Record<string, any>;
  screenshot_url?: string;
  downloads: number;
  rating: number;
  created_by: string;
  created_at: string;
}

export interface LogMessage {
  id: string;
  type: 'log' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

export interface Commit {
  id: string;
  message: string;
  timestamp: number;
  snapshot: {
    code: string | null;
    sceneObjects: SceneObject[];
    blueprint: any | null;
  };
}

export interface SceneObject {
  id: string;
  assetId: string;
  name: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

interface Store {
  user: {
    id?: string;
    email?: string;
    full_name?: string;
    avatar_url?: string;
    plan?: string;
  } | null;
  projects: Project[];
  currentProject: Project | null;
  assets: Asset[];
  currentTemplate: Template | null;
  activeModelUrl: string | null; // URL of the 3D model to preview (deprecated, use sceneObjects)
  sceneObjects: SceneObject[]; // Array of objects in the 3D scene
  activeCode: string | null; // Code currently loaded in the editor
  activeBlueprint: any | null; // JSON schema of the generated Blueprint
  consoleLogs: LogMessage[]; // Console logs from the editor sandbox
  commits: Commit[]; // Version control history
  isPlaying: boolean; // Global simulation state
  isLoading: boolean;
  error: string | null;
  setUser: (user: Store['user']) => void;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  setAssets: (assets: Asset[]) => void;
  setCurrentTemplate: (template: Template | null) => void;
  setActiveModelUrl: (url: string | null) => void;
  addSceneObject: (obj: SceneObject) => void;
  updateSceneObject: (id: string, updates: Partial<SceneObject>) => void;
  removeSceneObject: (id: string) => void;
  clearScene: () => void;
  setActiveCode: (code: string | null) => void;
  setActiveBlueprint: (blueprint: any | null) => void;
  addLog: (log: Omit<LogMessage, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  setCommits: (commits: Commit[]) => void;
  addCommit: (message: string) => void;
  checkoutCommit: (commitId: string) => void;
  setIsPlaying: (playing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useStore = create<Store>((set) => ({
  user: null,
  projects: [],
  currentProject: null,
  assets: [],
  currentTemplate: null,
  activeModelUrl: null,
  sceneObjects: [],
  activeCode: null,
  activeBlueprint: null,
  consoleLogs: [],
  commits: [],
  isPlaying: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),

  setProjects: (projects) => set({ projects }),

  setCurrentProject: (project) => set({ currentProject: project }),

  addProject: (project) => set((state) => ({
    projects: [project, ...state.projects],
  })),

  updateProject: (projectId, updates) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === projectId ? { ...p, ...updates } : p
    ),
    currentProject:
      state.currentProject?.id === projectId
        ? { ...state.currentProject, ...updates }
        : state.currentProject,
  })),

  deleteProject: (projectId) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== projectId),
    currentProject:
      state.currentProject?.id === projectId ? null : state.currentProject,
  })),

  setAssets: (assets) => set({ assets }),

  setCurrentTemplate: (template) => set({ currentTemplate: template }),

  setActiveModelUrl: (url) => set({ activeModelUrl: url }),

  addSceneObject: (obj) => set((state) => ({ 
    sceneObjects: [...state.sceneObjects, obj],
    activeModelUrl: null // clear single model when using scene
  })),

  updateSceneObject: (id, updates) => set((state) => ({
    sceneObjects: state.sceneObjects.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    )
  })),

  removeSceneObject: (id) => set((state) => ({ 
    sceneObjects: state.sceneObjects.filter(obj => obj.id !== id) 
  })),

  clearScene: () => set({ sceneObjects: [], activeModelUrl: null }),

  setCommits: (commits) => set({ commits }),

  setActiveCode: (code) => set({ activeCode: code }),

  setActiveBlueprint: (blueprint) => set({ activeBlueprint: blueprint }),

  addLog: (log) => set((state) => ({ 
    consoleLogs: [...state.consoleLogs, { ...log, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() }] 
  })),

  clearLogs: () => set({ consoleLogs: [] }),

  addCommit: (message) => set((state) => {
    const newCommit: Commit = {
      id: Math.random().toString(36).substr(2, 9),
      message,
      timestamp: Date.now(),
      snapshot: {
        code: state.activeCode,
        sceneObjects: JSON.parse(JSON.stringify(state.sceneObjects)), // deep copy
        blueprint: state.activeBlueprint ? JSON.parse(JSON.stringify(state.activeBlueprint)) : null
      }
    };
    return { commits: [newCommit, ...state.commits] };
  }),

  checkoutCommit: (commitId) => set((state) => {
    const commit = state.commits.find(c => c.id === commitId);
    if (!commit) return state;
    
    return {
      activeCode: commit.snapshot.code,
      sceneObjects: JSON.parse(JSON.stringify(commit.snapshot.sceneObjects)),
      activeBlueprint: commit.snapshot.blueprint ? JSON.parse(JSON.stringify(commit.snapshot.blueprint)) : null,
      activeModelUrl: null // clear active model when checking out
    };
  }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));
