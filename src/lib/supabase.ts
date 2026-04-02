import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hxfqlaxissvaewusjawq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZnFsYXhpc3N2YWV3dXNqYXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjM0ODMsImV4cCI6MjA4MjkzOTQ4M30.7qHZk525vRAavXZo71VxnT8Q-OlbK8s335bb-ALD6m';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      id: session.user.id,
      email: session.user.email,
      full_name: profile?.full_name,
      avatar_url: profile?.avatar_url,
      plan: profile?.plan || 'free',
    };
  }
  return null;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProjects() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createProject(project: {
  name: string;
  description?: string;
  platform: 'web' | 'desktop' | 'mobile' | 'all';
  genre?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: project.name,
      description: project.description,
      platform: project.platform,
      genre: project.genre,
      status: 'draft',
      code_structure: {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProjectById(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProjectCode(projectId: string, codeStructure: Record<string, any>) {
  const { data, error } = await supabase
    .from('projects')
    .update({ code_structure: codeStructure })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProjectById(projectId: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
  return !error;
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

export async function uploadAsset(file: File, projectId: string, type: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${user.id}/${projectId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('assets')
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = await supabase.storage
    .from('assets')
    .getPublicUrl(filePath);

  const { data: asset } = await supabase
    .from('assets')
    .insert({
      project_id: projectId,
      user_id: user.id,
      name: file.name,
      type: type as any,
      file_url: publicUrl,
      thumbnail_url: publicUrl,
      size: file.size,
      tags: [],
    })
    .select()
    .single();

  if (error) throw error;
  return asset;
}

export async function getTemplates() {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('rating', { ascending: false });

  if (error) throw error;
  return data || [];
}
