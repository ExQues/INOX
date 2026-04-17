import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface GenerateCodeOptions {
  prompt: string;
  platform: string;
  templateId?: string;
  model?: string;
  context?: Record<string, any>;
  operation?: 'create' | 'modify' | 'chat';
  genre?: string;
  features?: string[];
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface GeneratedCode {
  code: Record<string, any>;
  assets: Array<{ name: string; type: string; url: string }>;
  explanation: string;
  tokensUsed: number;
  codeSnippets?: Array<{ language: string; code: string; description: string }>;
  suggestedActions?: string[];
}

let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

export function initializeAiClients() {
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
}

async function generateWithOpenAI(
  prompt: string,
  systemPrompt: string,
  model: string = 'gpt-4'
): Promise<string> {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized');
  }

  const response = await openaiClient.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  return response.choices[0].message.content || '';
}

async function generateWithAnthropic(
  prompt: string,
  systemPrompt: string,
  model: string = 'claude-3-sonnet-20240229'
): Promise<string> {
  if (!anthropicClient) {
    throw new Error('Anthropic client not initialized');
  }

  const response = await anthropicClient.messages.create({
    model,
    max_tokens: 4000,
    system: systemPrompt,
    messages: [
      { role: 'user', content: prompt },
    ],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  return textBlock && 'text' in textBlock ? textBlock.text : '';
}

function createGameGenerationSystemPrompt(
  platform: string,
  genre?: string,
  features?: string[]
): string {
  const platformSpecs = {
    web: 'HTML5, WebGL, Three.js, React',
    desktop: 'Electron, Unity, Unreal Engine',
    mobile: 'React Native, Unity, Godot',
  };

  return `You are INOX, an expert AI game developer, architect, and engine programmer. Your goal is to generate modular, performant, and production-ready game code and logic.

Platform: ${platform} (${platformSpecs[platform as keyof typeof platformSpecs]})
${genre ? `Genre: ${genre}` : ''}
${features ? `Features: ${features.join(', ')}` : ''}

CRITICAL INSTRUCTIONS:
- You must ONLY return a valid JSON object matching the exact structure requested.
- DO NOT include markdown code blocks (like \`\`\`json) in your response. Just the raw JSON object.
- NO explanatory text before or after the JSON.
- If the user asks for "Unreal", "Blueprint", "Lógica AAA", or "Converter lógica JS em Blueprint", you MUST generate a JSON schema representing an Unreal Engine Blueprint (nodes, connections, variables). 
  - The JSON MUST have a root key "blueprint_name" and a "nodes" array.
  - Node types can include: "EventTick", "EventBeginPlay", "InputAction", "AddActorLocalOffset", "SetActorLocation", "Branch", etc.
  - Put this schema as a stringified JSON inside the "main.json" key of the files object.
- If the user asks for Web Sandbox logic or mechanics, you MUST generate functional JavaScript for a Three.js and Cannon-es environment.
  - VERY IMPORTANT: DO NOT create primitive shapes (like BoxGeometry, SphereGeometry, CylinderGeometry) to represent the player or characters. 
  - ALWAYS use the injected \`model\` variable as the player character (it is a high-quality GLTF model loaded externally).
  - You have access to these injected variables: \`model\`, \`sceneObjects\`, \`physicsBodies\`, \`mixers\`, \`keys\`, \`camera\`, \`world\`, \`dt\`, \`THREE\`, \`CANNON\`.
  - To move the main model, modify \`model.position\` or if it has a physics body, modify \`physicsBodies['preview_model'].velocity\`.
  - For keyboard input, check \`if (keys['w']) { ... }\`.
  - Do NOT wrap the generated code in a function declaration. Just provide the raw loop/setup code that will run inside an existing \`function(engine) { ... }\`.

Output format:
{
  "files": {
    "game.js": "complete game logic OR...",
    "main.json": "{... blueprint schema if unreal ...}"
  },
  "assets": [
    {"name": "player.png", "type": "sprite", "url": "placeholder"}
  ],
  "explanation": "step-by-step explanation"
}`;
}

export async function generateGameCode(
  options: GenerateCodeOptions
): Promise<GeneratedCode> {
  const {
    prompt,
    platform,
    model = 'gpt-4',
    context,
    operation = 'create',
    genre,
    features,
    conversationHistory,
  } = options;

  const systemPrompt = createGameGenerationSystemPrompt(platform, genre, features);

  let enhancedPrompt = '';

  if (operation === 'create') {
    enhancedPrompt = `Create a complete game based on this description: ${prompt}`;
  } else if (operation === 'modify') {
    enhancedPrompt = `Modify this code based on the request: ${prompt}\n\nCurrent code context: ${JSON.stringify(context)}`;
  } else if (operation === 'chat') {
    enhancedPrompt = `Answer this game development question: ${prompt}\n\nProject context: ${JSON.stringify(context)}`;
  } else {
    enhancedPrompt = prompt;
  }

  let responseText = '';

  try {
    if (model.includes('gpt')) {
      responseText = await generateWithOpenAI(enhancedPrompt, systemPrompt, model);
    } else if (model.includes('claude')) {
      responseText = await generateWithAnthropic(enhancedPrompt, systemPrompt, model);
    } else {
      responseText = await generateWithOpenAI(enhancedPrompt, systemPrompt, 'gpt-4');
    }
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error('Failed to generate code with AI');
  }

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const response = JSON.parse(jsonMatch[0]);

    if (operation === 'chat') {
      return {
        code: {},
        assets: [],
        explanation: responseText,
        tokensUsed: 0,
        codeSnippets: response.codeSnippets || [],
        suggestedActions: response.suggestedActions || [],
      };
    }

    return {
      code: response.files || {},
      assets: response.assets || [],
      explanation: response.explanation || 'Game generated successfully',
      tokensUsed: 0,
    };
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    
    return {
      code: {
        'index.html': generateFallbackHTML(prompt, platform),
        'game.js': generateFallbackJS(prompt),
        'styles.css': generateFallbackCSS(),
      },
      assets: [],
      explanation: 'Generated fallback code due to parsing error',
      tokensUsed: 0,
    };
  }
}

function generateFallbackHTML(prompt: string, platform: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Generated Game</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="game-container">
        <canvas id="game-canvas"></canvas>
        <div id="ui-overlay">
            <div id="score">Score: 0</div>
            <div id="instructions">${prompt.substring(0, 100)}...</div>
        </div>
    </div>
    <script src="game.js"></script>
</body>
</html>`;
}

function generateFallbackJS(prompt: string): string {
  return `class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.player = { x: 100, y: 100, width: 30, height: 30, speed: 5 };
        this.init();
    }

    init() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.bindEvents();
        this.gameLoop();
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') this.player.y -= this.player.speed;
            if (e.key === 'ArrowDown') this.player.y += this.player.speed;
            if (e.key === 'ArrowLeft') this.player.x -= this.player.speed;
            if (e.key === 'ArrowRight') this.player.x += this.player.speed;
        });
    }

    update() {
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, this.player.y));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#8b5cf6';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

new Game();`;
}

function generateFallbackCSS(): string {
  return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: 'Inter', sans-serif;
}

#game-container {
    position: relative;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    overflow: hidden;
}

#game-canvas {
    display: block;
    border-radius: 12px;
}

#ui-overlay {
    position: absolute;
    top: 20px;
    left: 20px;
    color: white;
    font-size: 16px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

#score {
    background: rgba(139, 92, 246, 0.9);
    padding: 12px 24px;
    border-radius: 8px;
    margin-bottom: 10px;
    font-weight: 600;
}

#instructions {
    background: rgba(0, 0, 0, 0.7);
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    max-width: 300px;
}`;
}

export async function generateMapFromDescription(
  description: string,
  platform: string
): Promise<GeneratedCode> {
  const mapPrompt = `Generate a complete game map/level system based on this description: ${description}

Platform: ${platform}

Requirements:
1. Procedural generation using Perlin noise or similar
2. Tile-based or mesh-based terrain
3. Include collision detection
4. Add interactive elements (collectibles, enemies, obstacles)
5. Include camera/viewport system
6. Generate spawn points
7. Add visual variety (different terrain types)

Return as complete, working code with map data structure.`;

  return generateGameCode({
    prompt: mapPrompt,
    platform,
    operation: 'create',
  });
}

export async function generateGameMechanics(
  description: string,
  platform: string
): Promise<GeneratedCode> {
  const mechanicsPrompt = `Generate complete game mechanics based on this description: ${description}

Platform: ${platform}

Include:
1. Player controller (movement, actions)
2. Physics system (gravity, collision)
3. Game state management (menu, playing, paused, game over)
4. Scoring system
5. Enemy AI (if applicable)
6. Power-up/upgrade system
7. Particle effects for feedback

Use Three.js and cannon-es for 3D mechanics. You have access to:
- model (the main GLTF object if any)
- sceneObjects (dictionary of loaded objects)
- physicsBodies (dictionary of cannon-es bodies)
- keys (dictionary of currently pressed keys, e.g., keys['w'])
- mixers (dictionary of THREE.AnimationMixer)
- camera (the THREE.PerspectiveCamera)
- updateThirdPersonCamera(targetPosition, offset) (helper to make camera follow a player)
- THREE, CANNON, world, dt

Return as complete, modular code.`;

  return generateGameCode({
    prompt: mechanicsPrompt,
    platform,
    operation: 'create',
  });
}

// --- 3D Generation Services (Pivot para Orquestração Quixel/AAA) ---

export interface Generate3DOptions {
  prompt: string;
  style?: 'realistic' | 'stylized' | 'low-poly';
}

export interface Generated3DModel {
  modelUrl: string;
  thumbnailUrl?: string;
  status: 'processing' | 'completed' | 'failed';
  taskId: string;
  isAAAAsset?: boolean;
  assetId?: string;
}

// Simulating the AI deciding to search Megascans/MetaHumans instead of generating bad geometry
export async function request3DModelGeneration(options: Generate3DOptions): Promise<Generated3DModel> {
  console.log(`[AI Orchestrator] Analyzing prompt for AAA Asset: "${options.prompt}"`);
  
  // In a real scenario, the LLM would translate the prompt into Megascans tags and query the Quixel API
  // e.g., if prompt has "floresta", search for "rock", "tree", "fern" in Quixel DB.
  
  // Returning a mock task ID for the orchestration task
  return {
    taskId: `orchestration_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    status: 'processing',
    modelUrl: '',
  };
}

// Simulating polling the task status and returning a high-quality pre-existing asset proxy
export async function check3DModelStatus(taskId: string, prompt?: string): Promise<Generated3DModel> {
  console.log(`[AI Orchestrator] Retrieving AAA Asset Proxy for task: ${taskId}`);
  
  // Simulate network delay for DB search
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Use a mix of Khronos sample models based on the prompt
  let proxyUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF/FlightHelmet.gltf';
  let assetId = 'Megascans_Prop_v1';

  const p = prompt ? prompt.toLowerCase() : '';
  if (p.includes('personagem') || p.includes('humano') || p.includes('soldado') || p.includes('herói') || p.includes('andando')) {
    proxyUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF/CesiumMan.gltf';
    assetId = 'MetaHuman_Soldier_v1';
  } else if (p.includes('carro') || p.includes('veículo')) {
    proxyUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf'; // Fallback
    assetId = 'Megascans_Vehicle_v1';
  } else if (p.includes('mapa') || p.includes('terreno') || p.includes('plano')) {
    proxyUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/EnvironmentTest/glTF/EnvironmentTest.gltf'; // Fallback for map
    assetId = 'Megascans_Terrain_v1';
  }

  return {
    taskId,
    status: 'completed',
    isAAAAsset: true,
    assetId: assetId, // Identifier for Unreal Engine to download the real 8K asset
    modelUrl: proxyUrl,
  };
}

initializeAiClients();
