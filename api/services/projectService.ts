interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  platform: string;
  status: 'draft' | 'active' | 'archived';
  codeStructure: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const projects: Map<string, Project> = new Map();

export async function createProject(data: Partial<Project>): Promise<Project> {
  const project: Project = {
    id: generateId(),
    userId: data.userId || 'ai-agent',
    name: data.name || 'Untitled Project',
    description: data.description,
    platform: data.platform || 'web',
    status: data.status || 'draft',
    codeStructure: data.codeStructure || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  projects.set(project.id, project);
  return project;
}

export async function getProject(projectId: string): Promise<Project | null> {
  return projects.get(projectId) || null;
}

export async function getProjectsByUser(userId: string): Promise<Project[]> {
  return Array.from(projects.values()).filter(p => p.userId === userId);
}

export async function updateProject(
  projectId: string,
  updates: Partial<Project>
): Promise<Project | null> {
  const project = projects.get(projectId);
  if (!project) {
    return null;
  }

  const updatedProject = {
    ...project,
    ...updates,
    id: project.id,
    updatedAt: new Date(),
  };

  projects.set(projectId, updatedProject);
  return updatedProject;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  return projects.delete(projectId);
}

function generateId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
