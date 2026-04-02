export interface GameConfig {
  name: string;
  description?: string;
  platform: 'web' | 'desktop' | 'mobile' | 'all';
  genre?: string;
  features?: string[];
  aiPrompt?: string;
  templateId?: string;
  model?: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet';
}

export interface ProjectResponse {
  projectId: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  codeStructure: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CodeGenerationRequest {
  projectId: string;
  prompt: string;
  model?: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet';
  templateId?: string;
}

export interface CodeGenerationResponse {
  code: Record<string, any>;
  assets: Array<{
    name: string;
    type: string;
    url: string;
  }>;
  explanation: string;
  tokensUsed: number;
}

export interface ModifyCodeRequest {
  projectId: string;
  currentCode: Record<string, any>;
  modificationRequest: string;
  filePath?: string;
}

export interface ModifyCodeResponse {
  modifiedCode: Record<string, any>;
  changes: Array<{
    file: string;
    type: 'add' | 'modify' | 'delete';
    description: string;
  }>;
  explanation: string;
}

export interface ChatRequest {
  projectId: string;
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ChatResponse {
  response: string;
  codeSnippets?: Array<{
    language: string;
    code: string;
    description: string;
  }>;
  suggestedActions?: string[];
}

export interface AssetUploadRequest {
  projectId: string;
  file: File | Blob;
  type: 'sprite' | 'model' | 'sound' | 'music' | 'font' | 'other';
  tags?: string[];
}

export interface AssetUploadResponse {
  assetId: string;
  url: string;
  thumbnailUrl: string;
  size: number;
}

export interface DeployRequest {
  projectId: string;
  platform: 'web' | 'desktop' | 'mobile';
  buildConfig?: Record<string, any>;
  environment?: 'development' | 'production';
}

export interface DeployResponse {
  buildId: string;
  status: 'queued' | 'building' | 'succeeded' | 'failed';
  estimatedTime: number;
}

export interface BuildStatusResponse {
  buildId: string;
  status: 'queued' | 'building' | 'succeeded' | 'failed';
  progress: number;
  logs: string[];
  deployUrl?: string;
}

export interface InoxAiSdkOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export class InoxAiSdk {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(options: InoxAiSdkOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://api.inoxgamecreator.com';
    this.timeout = options.timeout || 30000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async createProject(config: GameConfig): Promise<ProjectResponse> {
    return this.request<ProjectResponse>('/api/ai/create-project', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    return this.request<CodeGenerationResponse>('/api/ai/generate-code', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async modifyCode(request: ModifyCodeRequest): Promise<ModifyCodeResponse> {
    return this.request<ModifyCodeResponse>('/api/ai/modify-code', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async uploadAsset(request: AssetUploadRequest): Promise<AssetUploadResponse> {
    const formData = new FormData();
    formData.append('project_id', request.projectId);
    formData.append('file', request.file);
    formData.append('type', request.type);
    if (request.tags) {
      formData.append('tags', JSON.stringify(request.tags));
    }

    const response = await fetch(`${this.baseUrl}/api/assets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  async deploy(request: DeployRequest): Promise<DeployResponse> {
    return this.request<DeployResponse>('/api/deploy', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getBuildStatus(buildId: string): Promise<BuildStatusResponse> {
    return this.request<BuildStatusResponse>(`/api/deploy/${buildId}`, {
      method: 'GET',
    });
  }

  async getProject(projectId: string): Promise<ProjectResponse> {
    return this.request<ProjectResponse>(`/api/projects/${projectId}`, {
      method: 'GET',
    });
  }

  async deleteProject(projectId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/projects/${projectId}`,
      {
        method: 'DELETE',
      }
    );
  }

  async waitForBuild(
    buildId: string,
    pollInterval: number = 2000,
    maxAttempts: number = 60
  ): Promise<BuildStatusResponse> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await this.getBuildStatus(buildId);

      if (status.status === 'succeeded' || status.status === 'failed') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    }

    throw new Error('Build timeout');
  }

  async createGameFromDescription(
    description: string,
    options: Partial<GameConfig> = {}
  ): Promise<{ project: ProjectResponse; code: CodeGenerationResponse }> {
    const project = await this.createProject({
      name: options.name || 'AI Generated Game',
      description: description,
      platform: options.platform || 'web',
      aiPrompt: description,
      ...options,
    });

    const code = await this.generateCode({
      projectId: project.projectId,
      prompt: description,
      model: options.model,
    });

    return { project, code };
  }
}

export function createInoxAiSdk(options: InoxAiSdkOptions): InoxAiSdk {
  return new InoxAiSdk(options);
}
