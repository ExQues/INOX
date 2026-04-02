interface Asset {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  type: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  tags: string[];
  createdAt: Date;
}

const assets: Map<string, Asset> = new Map();

export async function uploadAsset(data: {
  projectId: string;
  userId: string;
  file: File | Blob;
  type: string;
  tags: string[];
}): Promise<Asset> {
  const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const url = await uploadToStorage(data.file, assetId);
  const thumbnailUrl = await generateThumbnail(data.file, assetId);
  
  const asset: Asset = {
    id: assetId,
    projectId: data.projectId,
    userId: data.userId,
    name: (data.file as File).name || 'unnamed',
    type: data.type,
    url,
    thumbnailUrl,
    size: (data.file as File).size || 0,
    tags: data.tags,
    createdAt: new Date(),
  };

  assets.set(assetId, asset);
  return asset;
}

export async function getAsset(assetId: string): Promise<Asset | null> {
  return assets.get(assetId) || null;
}

export async function getAssetsByProject(projectId: string): Promise<Asset[]> {
  return Array.from(assets.values()).filter(a => a.projectId === projectId);
}

export async function deleteAsset(assetId: string): Promise<boolean> {
  return assets.delete(assetId);
}

async function uploadToStorage(file: File | Blob, assetId: string): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(`https://storage.inoxgamecreator.com/assets/${assetId}`);
    };
    reader.readAsDataURL(file);
  });
}

async function generateThumbnail(file: File | Blob, assetId: string): Promise<string> {
  return `https://storage.inoxgamecreator.com/thumbnails/${assetId}`;
}
