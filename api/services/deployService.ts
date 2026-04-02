interface Build {
  id: string;
  projectId: string;
  userId: string;
  platform: string;
  status: 'queued' | 'building' | 'succeeded' | 'failed';
  buildUrl?: string;
  progress: number;
  logs: string[];
  createdAt: Date;
  completedAt?: Date;
}

const builds: Map<string, Build> = new Map();

export async function deployGame(data: {
  projectId: string;
  userId: string;
  platform: string;
  buildConfig: Record<string, any>;
  environment: string;
  codeStructure: Record<string, any>;
}): Promise<Build> {
  const buildId = `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const build: Build = {
    id: buildId,
    projectId: data.projectId,
    userId: data.userId,
    platform: data.platform,
    status: 'queued',
    progress: 0,
    logs: ['Build queued...'],
    createdAt: new Date(),
  };

  builds.set(buildId, build);

  setTimeout(() => startBuild(buildId, data), 100);

  return build;
}

export async function getBuildStatus(buildId: string): Promise<Build | null> {
  return builds.get(buildId) || null;
}

async function startBuild(
  buildId: string,
  data: {
    projectId: string;
    userId: string;
    platform: string;
    buildConfig: Record<string, any>;
    environment: string;
    codeStructure: Record<string, any>;
  }
): Promise<void> {
  const build = builds.get(buildId);
  if (!build) return;

  build.status = 'building';
  build.progress = 10;
  build.logs.push('Starting build process...');

  await sleep(500);
  build.progress = 20;
  build.logs.push('Installing dependencies...');
  await sleep(1000);

  build.progress = 40;
  build.logs.push('Building assets...');
  await sleep(1500);

  build.progress = 70;
  build.logs.push('Compiling code...');
  await sleep(1000);

  build.progress = 90;
  build.logs.push('Optimizing build...');
  await sleep(800);

  build.progress = 100;
  build.status = 'succeeded';
  build.logs.push('Build completed successfully!');
  build.buildUrl = `https://deploy.inoxgamecreator.com/games/${data.projectId}`;
  build.completedAt = new Date();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
