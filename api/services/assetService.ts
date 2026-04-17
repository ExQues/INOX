import { supabase } from './supabaseService.js';

export interface Asset {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  tags: string[];
  createdAt: Date;
}

export async function uploadAsset(data: {
  projectId: string;
  userId: string;
  file: File | Blob | Buffer;
  filename: string;
  type: string;
  tags: string[];
}): Promise<Asset> {
  const fileExt = data.filename.split('.').pop() || 'glb';
  const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const filePath = `${data.projectId}/${assetId}.${fileExt}`;
  
  // 1. Upload to Supabase Storage
  const { data: storageData, error: storageError } = await supabase
    .storage
    .from('game-assets')
    .upload(filePath, data.file, {
      contentType: 'model/gltf-binary',
      upsert: true
    });

  if (storageError) {
    console.error('Storage Error:', storageError);
    throw new Error(`Failed to upload asset to storage: ${storageError.message}`);
  }

  // 2. Get Public URL
  const { data: publicUrlData } = supabase
    .storage
    .from('game-assets')
    .getPublicUrl(filePath);

  const url = publicUrlData.publicUrl;
  const size = data.file instanceof Buffer ? data.file.length : (data.file as File).size || 0;

  // 3. Save metadata to Supabase DB
  const { data: dbAsset, error: dbError } = await supabase
    .from('assets')
    .insert({
      project_id: data.projectId,
      user_id: data.userId,
      name: data.filename,
      type: data.type as any,
      file_url: url,
      size: size,
      tags: data.tags,
    })
    .select()
    .single();

  if (dbError) {
    console.error('DB Error:', dbError);
    // Cleanup storage if DB insert fails
    await supabase.storage.from('game-assets').remove([filePath]);
    throw new Error(`Failed to save asset metadata: ${dbError.message}`);
  }

  return {
    id: dbAsset.id,
    projectId: dbAsset.project_id,
    userId: dbAsset.user_id,
    name: dbAsset.name,
    type: dbAsset.type,
    url: dbAsset.file_url,
    thumbnailUrl: dbAsset.thumbnail_url || undefined,
    size: dbAsset.size,
    tags: dbAsset.tags,
    createdAt: new Date(dbAsset.created_at),
  };
}

export async function getAssetsByProject(projectId: string): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(dbAsset => ({
    id: dbAsset.id,
    projectId: dbAsset.project_id,
    userId: dbAsset.user_id,
    name: dbAsset.name,
    type: dbAsset.type,
    url: dbAsset.file_url,
    thumbnailUrl: dbAsset.thumbnail_url || undefined,
    size: dbAsset.size,
    tags: dbAsset.tags,
    createdAt: new Date(dbAsset.created_at),
  }));
}

export async function deleteAsset(assetId: string): Promise<boolean> {
  // Get asset to find storage path
  const { data: asset, error: getError } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .single();
    
  if (getError || !asset) return false;

  // Delete from storage
  const urlParts = asset.file_url.split('/game-assets/');
  if (urlParts.length > 1) {
    const filePath = urlParts[1];
    await supabase.storage.from('game-assets').remove([filePath]);
  }

  // Delete from DB
  const { error: dbError } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId);

  return !dbError;
}

export async function downloadAndSaveGeneratedModel(
  modelUrl: string, 
  projectId: string, 
  userId: string,
  prompt: string
): Promise<Asset> {
  try {
    // 1. Fetch the generated model from the temporary URL
    const response = await fetch(modelUrl);
    if (!response.ok) throw new Error(`Failed to fetch generated model: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Generate a reasonable name based on prompt
    const shortName = prompt.split(' ').slice(0, 3).join('_').replace(/[^a-zA-Z0-9_]/g, '');
    const filename = `${shortName}_${Date.now()}.glb`;

    // 2. Upload to our permanent Supabase storage
    const asset = await uploadAsset({
      projectId,
      userId,
      file: buffer,
      filename,
      type: 'model',
      tags: ['ai-generated', '3d-model']
    });

    return asset;
  } catch (error: any) {
    console.error('Error saving generated model:', error);
    throw new Error(`Failed to save generated model: ${error.message}`);
  }
}
