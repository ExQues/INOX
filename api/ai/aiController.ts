import { Request, Response } from 'express';
import { generateGameCode } from '../services/aiService';
import { createProject, getProject, updateProject, createAiConversation, updateAiConversation } from '../services/supabaseService';
import { uploadAssetToStorage } from '../services/assetService';
import { deployGame } from '../services/deployService';

export const createAiProject = async (req: Request, res: Response) => {
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
  } catch (error: {
    message: string;
  }) {
    res.status(500).json({ error: error.message });
  }
};

export const generateCode = async (req: Request, res: Response) => {
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
      code_structure: generated.code,
    });

    const conversation = await getAiConversation(projectId);
    if (conversation) {
      await updateAiConversation(conversation.id, {
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const modifyCode = async (req: Request, res: Response) => {
  try {
    const { projectId, currentCode, modificationRequest, filePath } = req.body;

    const project = await getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const modified = await generateGameCode({
      prompt: `Modify the following code: ${modificationRequest}`,
      currentCode,
      context: currentCode,
      operation: 'modify',
    });

    const changes = Object.keys(modified.code).map(file => ({
      file,
      type: modified.code[file] ? 'modify' : 'add',
      description: `Updated ${file} based on modification request`,
    }));

    await updateProject(projectId, {
      codeStructure: modified.code,
    });

    res.json({
      modifiedCode: modified.code,
      changes,
      explanation: modified.explanation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const chatWithAi = async (req: Request, res: Response) => {
  try {
    const { projectId, message, conversationHistory } = req.body;

    const project = await getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const response = await generateGameCode({
      prompt: message,
      context: project.codeStructure,
      conversationHistory,
      operation: 'chat',
    });

    res.json({
      response: response.explanation,
      codeSnippets: response.codeSnippets || [],
      suggestedActions: response.suggestedActions || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadAiAsset = async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deployAiGame = async (req: Request, res: Response) => {
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
      codeStructure: project.codeStructure,
    });

    res.json({
      buildId: deploy.id,
      status: deploy.status,
      estimatedTime: deploy.estimatedTime || 120,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAiBuildStatus = async (req: Request, res: Response) => {
  try {
    const { buildId } = req.params;

    const status = await getBuildStatus(buildId);

    res.json({
      buildId: status.id,
      status: status.status,
      progress: status.progress,
      logs: status.logs || [],
      deployUrl: status.buildUrl,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createGameFromPrompt = async (req: Request, res: Response) => {
  try {
    const { description, name, platform, genre, features } = req.body;

    const project = await createProject({
      userId: req.user?.id || 'ai-agent',
      name: name || 'AI Generated Game',
      description,
      platform: platform || 'web',
      status: 'active',
      codeStructure: {},
    });

    const generated = await generateGameCode({
      prompt: description,
      platform,
      genre,
      features,
      operation: 'create',
    });

    await updateProject(project.id, {
      codeStructure: generated.code,
    });

    res.json({
      projectId: project.id,
      name: project.name,
      code: generated.code,
      assets: generated.assets,
      explanation: generated.explanation,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

import { invokeUnrealBridge } from '../services/unrealService';

export const generateUnrealMap = async (req: Request, res: Response) => {
  try {
    const { prompt, density, time_of_day, assets } = req.body;
    
    // Config JSON that maps constraints to what the Python bridge expects
    const config = {
      name: `GeneratedMap_${Date.now()}`,
      biome: prompt || "Unknown",
      density: density || "high",
      time_of_day: time_of_day || "day",
      assets: assets || [],
      create_new_map: true
    };

    console.log('[UnrealMapController] Sending config to Unreal Engine...', config);
    
    // Invoke the Unreal Engine interface (Python headless script/RemoteControl)
    const result = await invokeUnrealBridge(config);

    res.json({
      success: true,
      mapData: config,
      unrealOutput: result.output,
      message: 'Ambiente realista instanciado na Unreal Engine.'
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
