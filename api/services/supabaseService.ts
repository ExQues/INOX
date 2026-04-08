import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://hxfqlaxissvaewusjawq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: string;
        };
        Update: {
          id: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          platform: 'web' | 'desktop' | 'mobile' | 'all';
          genre: string | null;
          status: 'draft' | 'active' | 'archived';
          code_structure: any; // Used to store activeCode
          scene_graph: any; // Used to store sceneObjects array
          commits: any; // Used to store version history
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          platform: 'web' | 'desktop' | 'mobile' | 'all';
          genre?: string | null;
          status?: 'draft' | 'active' | 'archived';
          code_structure?: any;
          scene_graph?: any;
          commits?: any;
        };
        Update: {
          id: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          platform?: 'web' | 'desktop' | 'mobile' | 'all';
          genre?: string | null;
          status?: 'draft' | 'active' | 'archived';
          code_structure?: any;
          scene_graph?: any;
          commits?: any;
        };
      };
      assets: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          name: string;
          type: 'sprite' | 'model' | 'sound' | 'music' | 'font' | 'other';
          file_url: string;
          thumbnail_url: string | null;
          size: number;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          name: string;
          type: 'sprite' | 'model' | 'sound' | 'music' | 'font' | 'other';
          file_url: string;
          thumbnail_url?: string | null;
          size: number;
          tags?: string[];
        };
      };
      templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          genre: string | null;
          platform: string;
          complexity: 'beginner' | 'intermediate' | 'advanced' | null;
          code_structure: any;
          screenshot_url: string | null;
          downloads: number;
          rating: number;
          created_by: string;
          created_at: string;
        };
      };
      builds: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          platform: 'web' | 'desktop' | 'mobile';
          environment: 'development' | 'production';
          status: 'queued' | 'building' | 'succeeded' | 'failed';
          progress: number;
          build_url: string | null;
          logs: string[];
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          platform: 'web' | 'desktop' | 'mobile';
          environment?: 'development' | 'production';
          status?: 'queued' | 'building' | 'succeeded' | 'failed';
          progress?: number;
          build_url?: string | null;
          logs?: string[];
          error_message?: string | null;
        };
      };
      collaborators: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          permission_level: 'viewer' | 'editor' | 'admin';
          invited_at: string;
          accepted_at: string | null;
        };
      };
      ai_conversations: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          model: string;
          messages: any[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          model: string;
          messages?: any[];
        };
        Update: {
          id: string;
          project_id?: string;
          user_id?: string;
          model?: string;
          messages?: any[];
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          scopes: string[];
          last_used_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_hash: string;
          scopes?: string[];
          is_active?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

export async function getCurrentUser(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (error) throw error;
  return data;
}

export async function createProfile(profile: Database['public']['Tables']['profiles']['Insert']) {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createProject(project: Database['public']['Tables']['projects']['Insert']) {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProject(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data;
}

export async function getProjectsByUser(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateProject(projectId: string, updates: Database['public']['Tables']['projects']['Update']) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(projectId: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
  return !error;
}

export async function createAsset(asset: Database['public']['Tables']['assets']['Insert']) {
  const { data, error } = await supabase
    .from('assets')
    .insert(asset)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAssetsByProject(projectId: string) {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteAsset(assetId: string) {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId);

  if (error) throw error;
  return !error;
}

export async function createBuild(build: Database['public']['Tables']['builds']['Insert']) {
  const { data, error } = await supabase
    .from('builds')
    .insert(build)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getBuild(buildId: string) {
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .eq('id', buildId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateBuild(buildId: string, updates: Partial<Database['public']['Tables']['builds']['Row']>) {
  const { data, error } = await supabase
    .from('builds')
    .update(updates)
    .eq('id', buildId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getBuildsByProject(projectId: string) {
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTemplates(category?: string, genre?: string) {
  let query = supabase
    .from('templates')
    .select('*')
    .order('rating', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  if (genre) {
    query = query.eq('genre', genre);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function incrementTemplateDownloads(templateId: string) {
  const { data, error } = await supabase.rpc('increment_downloads', {
    arg_template_id: templateId,
  });

  if (error) throw error;
  return data;
}

export async function createApiKey(apiKey: Database['public']['Tables']['api_keys']['Insert']) {
  const { data, error } = await supabase
    .from('api_keys')
    .insert(apiKey)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getActiveApiKeys(userId: string) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function validateApiKey(keyHash: string) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data;
}

export async function updateApiKeyUsage(keyHash: string) {
  const { error } = await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash);

  if (error) throw error;
}

export async function createAiConversation(conversation: Database['public']['Tables']['ai_conversations']['Insert']) {
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert(conversation)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAiConversation(conversationId: string) {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateAiConversation(conversationId: string, updates: Database['public']['Tables']['ai_conversations']['Update']) {
  const { data, error } = await supabase
    .from('ai_conversations')
    .update(updates)
    .eq('id', conversationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAiConversationsByProject(projectId: string) {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
