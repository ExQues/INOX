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

  return `You are an expert game developer AI that generates complete, playable game code.

Platform: ${platform} (${platformSpecs[platform as keyof typeof platformSpecs]})
${genre ? `Genre: ${genre}` : ''}
${features ? `Features: ${features.join(', ')}` : ''}

Rules:
1. Generate COMPLETE, working code - no placeholders
2. Include all necessary imports and setup
3. Add comments explaining key systems
4. Create modular, reusable components
5. Implement basic gameplay mechanics (movement, collision, scoring)
6. Include visual feedback (animations, particles)
7. Make code production-ready (error handling, performance optimization)
8. Return code in valid JSON format with file structure

Output format:
{
  "files": {
    "index.html": "complete HTML",
    "game.js": "complete game logic",
    "styles.css": "complete styles",
    "package.json": "dependencies"
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

Return as complete, modular code.`;

  return generateGameCode({
    prompt: mechanicsPrompt,
    platform,
    operation: 'create',
  });
}

initializeAiClients();
