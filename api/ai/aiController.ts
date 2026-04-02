import { Request, Response } from 'express';
import { generateGameCode, request3DModelGeneration, check3DModelStatus } from '../services/aiService';
import { createProject, getProject, updateProject, createAiConversation, updateAiConversation, getAiConversation } from '../services/supabaseService';
import { uploadAsset } from '../services/assetService';
import { deployGame, getBuildStatus } from '../services/deployService';
import { invokeUnrealBridge } from '../services/unrealService';

// Add type for req.user and req.file
interface CustomRequest extends Request {
  user?: { id: string };
  file?: any;
}

export const createAiProject = async (req: CustomRequest, res: Response) => {
  try {
    const { name, description, platform, aiPrompt, templateId, genre, features } = req.body;
    const userId = req.user?.id || 'ai-agent';

    const project = await createProject({
      user_id: userId,
      name,
      description,
      platform,
      status: 'active',
      code_structure: {},
    });

    if (aiPrompt) {
      await createAiConversation({
        project_id: project.id,
        user_id: userId,
        model: 'gpt-4',
        messages: [{ role: 'user', content: aiPrompt }],
      });
    }

    res.json({
      projectId: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      codeStructure: project.code_structure,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const generateCode = async (req: CustomRequest, res: Response) => {
  try {
    const { projectId, prompt, model, templateId } = req.body;

    const project = await getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const generated = await generateGameCode({
      prompt,
      platform: project.platform,
      templateId,
      model,
      context: project.code_structure,
    });

    await updateProject(projectId, {
      id: projectId,
      code_structure: generated.code,
    });

    const conversation = await getAiConversation(projectId);
    if (conversation) {
      await updateAiConversation(conversation.id, {
        id: conversation.id,
        messages: [
          ...conversation.messages,
          { role: 'user', content: prompt },
          { role: 'assistant', content: generated.explanation },
        ],
      });
    }

    res.json({
      code: generated.code,
      assets: generated.assets,
      explanation: generated.explanation,
      tokensUsed: generated.tokensUsed,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const modifyCode = async (req: CustomRequest, res: Response) => {
  try {
    const { projectId, currentCode, modificationRequest, filePath } = req.body;

    const project = await getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const modified = await generateGameCode({
      prompt: `Modify the following code: ${modificationRequest}`,
      platform: project.platform,
      context: currentCode,
      operation: 'modify',
    });

    const changes = Object.keys(modified.code).map(file => ({
      file,
      type: modified.code[file] ? 'modify' : 'add',
      description: `Updated ${file} based on modification request`,
    }));

    await updateProject(projectId, {
      id: projectId,
      code_structure: modified.code,
    });

    res.json({
      modifiedCode: modified.code,
      changes,
      explanation: modified.explanation,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const chatWithAi = async (req: CustomRequest, res: Response) => {
  try {
    const { projectId, message, conversationHistory } = req.body;

    const project = await getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const response = await generateGameCode({
      prompt: message,
      platform: project.platform,
      context: project.code_structure,
      conversationHistory,
      operation: 'chat',
    });

    res.json({
      response: response.explanation,
      codeSnippets: response.codeSnippets || [],
      suggestedActions: response.suggestedActions || [],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadAiAsset = async (req: CustomRequest, res: Response) => {
  try {
    const { projectId, type, tags } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const asset = await uploadAsset({
      projectId,
      userId: req.user?.id || 'ai-agent',
      file,
      type,
      tags: tags || [],
    });

    res.json({
      assetId: asset.id,
      url: asset.url,
      thumbnailUrl: asset.thumbnailUrl,
      size: asset.size,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deployAiGame = async (req: CustomRequest, res: Response) => {
  try {
    const { projectId, platform, buildConfig, environment } = req.body;

    const project = await getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const deploy = await deployGame({
      projectId,
      userId: req.user?.id || 'ai-agent',
      platform,
      buildConfig: buildConfig || {},
      environment: environment || 'production',
      codeStructure: project.code_structure,
    });

    res.json({
      buildId: deploy.id,
      status: deploy.status,
      estimatedTime: 120, // hardcoded since deploy.estimatedTime doesn't exist
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAiBuildStatus = async (req: CustomRequest, res: Response) => {
  try {
    const { buildId } = req.params;

    const status = await getBuildStatus(buildId);
    if (!status) {
      return res.status(404).json({ error: 'Build not found' });
    }

    res.json({
      buildId: status.id,
      status: status.status,
      progress: status.progress,
      logs: status.logs || [],
      deployUrl: status.buildUrl,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createGameFromPrompt = async (req: CustomRequest, res: Response) => {
  try {
    const { description, name, platform, genre, features } = req.body;

    const project = await createProject({
      user_id: req.user?.id || 'ai-agent',
      name: name || 'AI Generated Game',
      description,
      platform: platform || 'web',
      status: 'active',
      code_structure: {},
    });

    const generated = await generateGameCode({
      prompt: description,
      platform: platform || 'web',
      genre,
      features,
      operation: 'create',
    });

    await updateProject(project.id, {
      id: project.id,
      code_structure: generated.code,
    });

    res.json({
      projectId: project.id,
      name: project.name,
      code: generated.code,
      assets: generated.assets,
      explanation: generated.explanation,
    });
  } catch (error: any) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const generateUnrealMap = async (req: CustomRequest, res: Response) => {
  try {
    const { prompt, density, time_of_day, assets } = req.body;
    
    const config = {
      name: `GeneratedMap_${Date.now()}`,
      biome: prompt || "Unknown",
      density: density || "high",
      time_of_day: time_of_day || "day",
      assets: assets || [],
      create_new_map: true
    };

    console.log('[UnrealMapController] Sending config to Unreal Engine...', config);
    
    const result = await invokeUnrealBridge(config);

    res.json({
      success: true,
      mapData: config,
      unrealOutput: result.output,
      message: 'Ambiente realista instanciado na Unreal Engine.'
    });
  } catch (error: any) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const generate3DModel = async (req: CustomRequest, res: Response) => {
  try {
    const { prompt, style } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const task = await request3DModelGeneration({ prompt, style });
    
    res.json({
      success: true,
      taskId: task.taskId,
      status: task.status,
      message: '3D model generation started'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const get3DModelStatus = async (req: CustomRequest, res: Response) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    const status = await check3DModelStatus(taskId);

    res.json({
      success: true,
      taskId: status.taskId,
      status: status.status,
      modelUrl: status.modelUrl,
      thumbnailUrl: status.thumbnailUrl
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
